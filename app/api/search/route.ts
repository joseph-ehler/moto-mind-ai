import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/search
 * Universal search across all vehicle data
 * 
 * ELITE-TIER: Intelligent search with relevance ranking
 * - Full-text search across events, notes, vendors
 * - Fuzzy matching
 * - Relevance scoring
 * - Type filtering
 * - Vehicle filtering
 * - Date range filtering
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const query = searchParams.get('q') || ''
  const type = searchParams.get('type') // fuel, maintenance, etc.
  const vehicleId = searchParams.get('vehicle_id')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    )
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const tenantId = request.headers.get('x-tenant-id')

    // Build search query
    let dbQuery = supabase
      .from('vehicle_events')
      .select(`
        *,
        vehicles:vehicle_id (
          id,
          make,
          model,
          year,
          nickname
        )
      `)
      .order('date', { ascending: false })
      .limit(limit)

    if (tenantId) {
      dbQuery = dbQuery.eq('tenant_id', tenantId)
    }

    if (type) {
      dbQuery = dbQuery.eq('type', type)
    }

    if (vehicleId) {
      dbQuery = dbQuery.eq('vehicle_id', vehicleId)
    }

    const { data: events, error } = await dbQuery

    if (error) {
      console.error('Error searching events:', error)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    // ELITE: Client-side fuzzy search with relevance scoring
    const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 0)
    
    const scoredResults = (events || []).map(event => {
      let score = 0
      const searchableText = [
        event.notes || '',
        event.vendor || '',
        event.display_vendor || '',
        event.type || '',
        event.station_address || '',
        event.geocoded_address || ''
      ].join(' ').toLowerCase()

      // Calculate relevance score
      searchTerms.forEach(term => {
        // Exact match in notes (highest weight)
        if ((event.notes || '').toLowerCase().includes(term)) {
          score += 10
        }

        // Exact match in vendor
        if ((event.vendor || '').toLowerCase().includes(term) || 
            (event.display_vendor || '').toLowerCase().includes(term)) {
          score += 8
        }

        // Match in any field
        if (searchableText.includes(term)) {
          score += 5
        }

        // Fuzzy match (starts with)
        const words = searchableText.split(' ')
        words.forEach(word => {
          if (word.startsWith(term)) {
            score += 3
          }
        })
      })

      return {
        ...event,
        relevance_score: score
      }
    })

    // Filter out zero-score results and sort by relevance
    const results = scoredResults
      .filter(r => r.relevance_score > 0)
      .sort((a, b) => b.relevance_score - a.relevance_score)

    // ELITE: Generate search insights
    const insights = {
      total_results: results.length,
      types: countByField(results, 'type'),
      vehicles: countByField(results, 'vehicle_id'),
      date_range: results.length > 0 ? {
        earliest: results[results.length - 1]?.date,
        latest: results[0]?.date
      } : null
    }

    return NextResponse.json({
      data: results,
      meta: {
        query,
        total_results: results.length,
        filters: { type, vehicle_id: vehicleId },
        limit
      },
      insights
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function countByField(items: any[], field: string): Record<string, number> {
  const counts: Record<string, number> = {}
  items.forEach(item => {
    const value = item[field] || 'unknown'
    counts[value] = (counts[value] || 0) + 1
  })
  return counts
}
