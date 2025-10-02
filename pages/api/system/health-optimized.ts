// Optimized Health Check - Consolidated queries for satellite internet
// Reduces 5+ queries to 1-2 queries, eliminating stale cache issues

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    database: boolean
    migrations: boolean
    data_integrity: boolean
  }
  warnings: string[]
  errors: string[]
  metrics: {
    vehicles_missing_display_name: number
    vehicles_with_unknown_name: number
    reminders_duplicate_dedupe: number
    orphaned_vehicles: number
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<HealthCheck>) {
  const warnings: string[] = []
  const errors: string[] = []
  let dbHealthy = true
  let migrationsHealthy = true
  let dataIntegrityHealthy = true

  try {
    // Test database connection (1 query)
    const { error: dbError } = await supabase.from('vehicles').select('id').limit(1)
    if (dbError) {
      errors.push(`Database connection failed: ${dbError.message}`)
      dbHealthy = false
    }

    // Check migration status (1 query)
    const { data: migrations, error: migrationError } = await supabase
      .from('schema_migrations')
      .select('filename')
      .order('applied_at', { ascending: false })
      .limit(5)

    if (migrationError) {
      errors.push(`Migration check failed: ${migrationError.message}`)
      migrationsHealthy = false
    }

    // OPTIMIZED: Consolidated data integrity check (1 query instead of 5+)
    const { data: integrityData, error: integrityError } = await supabase
      .rpc('consolidated_health_check')

    if (integrityError) {
      // Fallback to individual queries if consolidated function doesn't exist
      console.warn('Consolidated health check function not found, using fallback')
      return await fallbackHealthCheck(req, res, warnings, errors, dbHealthy, migrationsHealthy)
    }

    const metrics = integrityData[0] || {
      vehicles_missing_display_name: 0,
      vehicles_with_unknown_name: 0,
      orphaned_vehicles: 0,
      reminders_duplicate_dedupe: 0
    }

    // Validate results and add warnings/errors
    if (metrics.vehicles_missing_display_name > 0) {
      warnings.push(`${metrics.vehicles_missing_display_name} vehicles missing display_name`)
      dataIntegrityHealthy = false
    }

    if (metrics.vehicles_with_unknown_name > 0) {
      warnings.push(`${metrics.vehicles_with_unknown_name} vehicles have "Unknown Vehicle" name`)
    }

    if (metrics.orphaned_vehicles > 0) {
      errors.push(`${metrics.orphaned_vehicles} vehicles reference deleted garages`)
      dataIntegrityHealthy = false
    }

    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (errors.length > 0) {
      status = 'unhealthy'
    } else if (warnings.length > 0) {
      status = 'degraded'
    }

    const healthCheck: HealthCheck = {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy,
        migrations: migrationsHealthy,
        data_integrity: dataIntegrityHealthy
      },
      warnings,
      errors,
      metrics
    }

    // Set appropriate HTTP status
    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

    // NO CACHING - Always return fresh data for data integrity checks
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    return res.status(httpStatus).json(healthCheck)

  } catch (error) {
    const healthCheck: HealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: false,
        migrations: false,
        data_integrity: false
      },
      warnings: [],
      errors: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      metrics: {
        vehicles_missing_display_name: 0,
        vehicles_with_unknown_name: 0,
        reminders_duplicate_dedupe: 0,
        orphaned_vehicles: 0
      }
    }

    return res.status(503).json(healthCheck)
  }
}

// Fallback to individual queries if consolidated function doesn't exist
async function fallbackHealthCheck(
  req: NextApiRequest, 
  res: NextApiResponse<HealthCheck>,
  warnings: string[],
  errors: string[],
  dbHealthy: boolean,
  migrationsHealthy: boolean
) {
  let dataIntegrityHealthy = true

  // Use the original individual queries but with no caching
  const metrics = {
    vehicles_missing_display_name: 0,
    vehicles_with_unknown_name: 0,
    reminders_duplicate_dedupe: 0,
    orphaned_vehicles: 0
  }

  // Check vehicles missing display_name
  const { count: missingDisplayName } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .is('display_name', null)

  metrics.vehicles_missing_display_name = missingDisplayName || 0

  // Check vehicles with "Unknown Vehicle" name
  const { count: unknownVehicles } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('display_name', 'Unknown Vehicle')

  metrics.vehicles_with_unknown_name = unknownVehicles || 0

  // Check for orphaned vehicles - DIRECT QUERY, NO CACHE
  const { count: orphanedVehicles } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .not('garage_id', 'is', null)
    .not('garage_id', 'in', 
      supabase.from('garages').select('id')
    )

  metrics.orphaned_vehicles = orphanedVehicles || 0

  // Add warnings/errors based on results
  if (metrics.vehicles_missing_display_name > 0) {
    warnings.push(`${metrics.vehicles_missing_display_name} vehicles missing display_name`)
    dataIntegrityHealthy = false
  }

  if (metrics.vehicles_with_unknown_name > 0) {
    warnings.push(`${metrics.vehicles_with_unknown_name} vehicles have "Unknown Vehicle" name`)
  }

  if (metrics.orphaned_vehicles > 0) {
    errors.push(`${metrics.orphaned_vehicles} vehicles reference deleted garages`)
    dataIntegrityHealthy = false
  }

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  if (errors.length > 0) {
    status = 'unhealthy'
  } else if (warnings.length > 0) {
    status = 'degraded'
  }

  const healthCheck: HealthCheck = {
    status,
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealthy,
      migrations: migrationsHealthy,
      data_integrity: dataIntegrityHealthy
    },
    warnings,
    errors,
    metrics
  }

  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

  // NO CACHING
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  return res.status(httpStatus).json(healthCheck)
}
