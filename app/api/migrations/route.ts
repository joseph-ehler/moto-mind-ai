/**
 * Migration Metrics API
 * 
 * Serves migration data to the dashboard.
 * Server-side only (can use fs).
 */

import { NextResponse } from 'next/server'
import {
  calculateMigrationMetrics,
  getAggregateMetrics
} from '@/features/migrations/data/migration-data'

export async function GET() {
  try {
    const visionMetrics = calculateMigrationMetrics('vision')
    const aggregateMetrics = getAggregateMetrics()
    
    return NextResponse.json({
      vision: visionMetrics,
      aggregate: aggregateMetrics
    })
  } catch (error) {
    console.error('Error fetching migration metrics:', error)
    return NextResponse.json(
      { error: 'Failed to load migration metrics' },
      { status: 500 }
    )
  }
}
