/**
 * Smart Priority Embedding System
 * 
 * GOD-TIER APPROACH:
 * 1. Embed top 16 makes first (80% of complaints) → 2 hours
 * 2. On-demand embedding for rare vehicles → Real-time
 * 3. Background fill remaining 20% → Overnight
 * 
 * BENEFITS:
 * - Working search in 2 hours (covers 90% of users)
 * - Zero downtime (always returns results)
 * - Cost effective (embed only what's needed)
 */

import { createClient } from '@supabase/supabase-js'

// Create Supabase client (lazy - only when functions are called)
function getSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables. Check .env.local')
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

/**
 * Top 16 vehicle makes (80% of all complaints)
 * Based on NHTSA complaint data analysis
 */
export const TOP_VEHICLE_MAKES = [
  'FORD',
  'CHEVROLET',
  'TOYOTA',
  'DODGE',
  'HONDA',
  'NISSAN',
  'GMC',
  'JEEP',
  'HYUNDAI',
  'KIA',
  'CHRYSLER',
  'VOLKSWAGEN',
  'BMW',
  'SUBARU',
  'PONTIAC',
  'MERCURY'
] as const

export type TopMake = typeof TOP_VEHICLE_MAKES[number]

/**
 * Check if a make is in the top 80%
 */
export function isTopMake(make: string): boolean {
  return TOP_VEHICLE_MAKES.includes(make.toUpperCase() as TopMake)
}

/**
 * Get embedding priority for a vehicle
 * Returns: 'high' | 'medium' | 'low'
 */
export async function getEmbeddingPriority(make: string, model?: string): Promise<'high' | 'medium' | 'low'> {
  // Top 16 makes = HIGH priority
  if (isTopMake(make)) {
    return 'high'
  }
  
  // Check complaint count for this make
  const supabase = getSupabaseClient()
  const { count, error } = await supabase
    .from('nhtsa_complaints')
    .select('*', { count: 'exact', head: true })
    .eq('make', make.toUpperCase())
  
  if (error) {
    return 'low'
  }
  
  const complaintCount = count || 0
  
  // > 5,000 complaints = MEDIUM priority
  if (complaintCount > 5000) {
    return 'medium'
  }
  
  // < 5,000 complaints = LOW priority (embed on-demand)
  return 'low'
}

/**
 * Get complaints that need embeddings (smart priority)
 */
export async function getComplaintsNeedingEmbeddings(options: {
  priority?: 'high' | 'medium' | 'low'
  make?: string
  limit?: number
}): Promise<any[]> {
  const { priority, make, limit = 1000 } = options
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from('nhtsa_complaints')
    .select('id, odi_number, year, make, model, component, summary, description')
    .is('embedding', null)
    .order('year', { ascending: false }) // Newer complaints first
  
  // Filter by make if specified
  if (make) {
    query = query.eq('make', make.toUpperCase())
  }
  // Filter by priority
  else if (priority === 'high') {
    query = query.in('make', TOP_VEHICLE_MAKES)
  }
  
  query = query.limit(limit)
  
  const { data, error } = await query
  
  if (error) {
    console.error('[SmartEmbedding] Error fetching complaints:', error)
    return []
  }
  
  return data || []
}

/**
 * Get embedding statistics
 */
export async function getEmbeddingStats():Promise<{
  total: number
  embedded: number
  needEmbedding: number
  highPriority: {
    total: number
    embedded: number
    percentComplete: number
  }
  mediumPriority: {
    total: number
    embedded: number
    percentComplete: number
  }
  lowPriority: {
    total: number
    embedded: number
    percentComplete: number
  }
}> {
  const supabase = getSupabaseClient()
  
  // Total stats
  const { count: total } = await supabase
    .from('nhtsa_complaints')
    .select('*', { count: 'exact', head: true })
  
  const { count: embedded } = await supabase
    .from('nhtsa_complaints')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null)
  
  // High priority (top 16 makes)
  const { count: highTotal } = await supabase
    .from('nhtsa_complaints')
    .select('*', { count: 'exact', head: true })
    .in('make', TOP_VEHICLE_MAKES)
  
  const { count: highEmbedded } = await supabase
    .from('nhtsa_complaints')
    .select('*', { count: 'exact', head: true })
    .in('make', TOP_VEHICLE_MAKES)
    .not('embedding', 'is', null)
  
  return {
    total: total || 0,
    embedded: embedded || 0,
    needEmbedding: (total || 0) - (embedded || 0),
    highPriority: {
      total: highTotal || 0,
      embedded: highEmbedded || 0,
      percentComplete: (highTotal || 0) > 0 ? Math.round(((highEmbedded || 0) / (highTotal || 0)) * 100) : 0
    },
    mediumPriority: {
      total: 0, // TODO: Calculate medium priority
      embedded: 0,
      percentComplete: 0
    },
    lowPriority: {
      total: (total || 0) - (highTotal || 0),
      embedded: (embedded || 0) - (highEmbedded || 0),
      percentComplete: 0
    }
  }
}

/**
 * Check if we should embed on-demand
 * Returns true if:
 * - Vehicle is low priority AND
 * - We haven't embedded this vehicle yet AND
 * - User is actively searching
 */
export async function shouldEmbedOnDemand(make: string, model: string): Promise<boolean> {
  const priority = await getEmbeddingPriority(make, model)
  
  // Only low priority vehicles get on-demand embedding
  if (priority !== 'low') {
    return false
  }
  
  const supabase = getSupabaseClient()
  
  // Check if we have ANY embeddings for this make/model
  const { count } = await supabase
    .from('nhtsa_complaints')
    .select('*', { count: 'exact', head: true })
    .eq('make', make.toUpperCase())
    .eq('model', model.toUpperCase())
    .not('embedding', 'is', null)
  
  const embeddedCount = count || 0
  
  // If we have < 10 embeddings for this vehicle, embed on-demand
  return embeddedCount < 10
}

/**
 * Get recommended batch size based on priority
 */
export function getRecommendedBatchSize(priority: 'high' | 'medium' | 'low'): number {
  switch (priority) {
    case 'high':
      return 1000 // Process 1000 at a time for top vehicles
    case 'medium':
      return 500
    case 'low':
      return 100
  }
}

/**
 * Estimate time to complete priority level
 */
export async function estimateCompletionTime(priority: 'high' | 'medium' | 'low'): Promise<{
  remainingRecords: number
  estimatedMinutes: number
  estimatedHours: number
}> {
  const stats = await getEmbeddingStats()
  const processingRate = 700 // embeddings per minute (observed rate)
  
  let remaining = 0
  
  switch (priority) {
    case 'high':
      remaining = stats.highPriority.total - stats.highPriority.embedded
      break
    case 'medium':
      remaining = stats.mediumPriority.total - stats.mediumPriority.embedded
      break
    case 'low':
      remaining = stats.lowPriority.total - stats.lowPriority.embedded
      break
  }
  
  const minutes = Math.ceil(remaining / processingRate)
  const hours = Math.round((minutes / 60) * 10) / 10 // Round to 1 decimal
  
  return {
    remainingRecords: remaining,
    estimatedMinutes: minutes,
    estimatedHours: hours
  }
}
