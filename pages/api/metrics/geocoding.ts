/**
 * Geocoding Metrics API
 * Returns geocoding health metrics for monitoring
 * 
 * GET /api/metrics/geocoding
 * 
 * Returns:
 * - Cache hit rate
 * - Success rates by provider
 * - Error rates
 * - Correction patterns
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getGeocodingMetrics } from '@/lib/geocoding-enhanced'
import { getCacheStats } from '@/lib/cache/redis'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get user from session (admin only for now)
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: req.headers.authorization || ''
          }
        }
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get geocoding metrics from cache
    const geocodingMetrics = await getGeocodingMetrics()
    
    // Calculate derived metrics
    const totalRequests = geocodingMetrics.cache_hit + geocodingMetrics.cache_miss
    const cacheHitRate = totalRequests > 0 
      ? (geocodingMetrics.cache_hit / totalRequests) * 100 
      : 0
    
    const totalNominatim = geocodingMetrics.nominatim_success + geocodingMetrics.nominatim_error
    const nominatimSuccessRate = totalNominatim > 0
      ? (geocodingMetrics.nominatim_success / totalNominatim) * 100
      : 0
    
    const totalGoogle = geocodingMetrics.google_success + geocodingMetrics.google_error
    const googleSuccessRate = totalGoogle > 0
      ? (geocodingMetrics.google_success / totalGoogle) * 100
      : 0

    // Get cache stats
    const cacheStats = await getCacheStats()

    // Get correction stats from database
    const { data: correctionStats, error: correctionError } = await supabase
      .from('location_correction_stats')
      .select('*')
    
    const corrections = correctionError ? [] : correctionStats

    // Get recent corrections (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentCorrections } = await supabase
      .from('location_corrections')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    return res.status(200).json({
      cache: {
        available: cacheStats.available,
        type: cacheStats.type,
        size: cacheStats.size,
        hit_rate: Number(cacheHitRate.toFixed(1))
      },
      
      geocoding: {
        total_requests: totalRequests,
        
        nominatim: {
          success: geocodingMetrics.nominatim_success,
          error: geocodingMetrics.nominatim_error,
          success_rate: Number(nominatimSuccessRate.toFixed(1))
        },
        
        google: {
          success: geocodingMetrics.google_success,
          error: geocodingMetrics.google_error,
          success_rate: Number(googleSuccessRate.toFixed(1))
        },
        
        failures: {
          total: geocodingMetrics.total_failure,
          invalid_address: geocodingMetrics.invalid_address
        }
      },
      
      corrections: {
        total: corrections.reduce((sum, stat) => sum + (stat.correction_count || 0), 0),
        recent_7_days: recentCorrections || 0,
        by_method: corrections.map(stat => ({
          extraction_method: stat.extraction_method,
          extraction_confidence: stat.extraction_confidence,
          count: stat.correction_count,
          avg_distance_km: stat.avg_distance_km ? Number(stat.avg_distance_km.toFixed(2)) : 0
        }))
      },
      
      health: {
        status: cacheHitRate > 50 && nominatimSuccessRate > 90 ? 'healthy' : 'degraded',
        issues: [
          cacheHitRate < 50 && 'Low cache hit rate',
          nominatimSuccessRate < 90 && 'High Nominatim failure rate',
          geocodingMetrics.total_failure > 10 && 'High total failure count'
        ].filter(Boolean)
      }
    })

  } catch (error) {
    console.error('Metrics error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
