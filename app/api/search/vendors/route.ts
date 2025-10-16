import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/search/vendors
 * Search for vendors/stations across events
 * 
 * ELITE-TIER: Vendor discovery with statistics
 * - Fuzzy vendor name matching
 * - Visit counts
 * - Spending statistics
 * - Location information
 * - Rating by frequency
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const query = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '20')

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

    // Fetch all events with vendors
    let dbQuery = supabase
      .from('vehicle_events')
      .select('*')
      .not('vendor', 'is', null)
      .order('date', { ascending: false })

    if (tenantId) {
      dbQuery = dbQuery.eq('tenant_id', tenantId)
    }

    const { data: events, error } = await dbQuery

    if (error) {
      console.error('Error searching vendors:', error)
      return NextResponse.json(
        { error: 'Vendor search failed' },
        { status: 500 }
      )
    }

    // ELITE: Aggregate and search vendors
    const vendorMap = new Map()
    const searchQuery = query.toLowerCase()

    events?.forEach(event => {
      const vendorName = event.display_vendor || event.vendor
      if (!vendorName) return

      // Fuzzy match
      const vendorLower = vendorName.toLowerCase()
      if (!vendorLower.includes(searchQuery)) return

      const vendorKey = vendorName.toLowerCase()

      if (!vendorMap.has(vendorKey)) {
        vendorMap.set(vendorKey, {
          name: vendorName,
          visit_count: 0,
          total_spent: 0,
          events: [],
          locations: new Set(),
          first_visit: event.date,
          last_visit: event.date
        })
      }

      const vendor = vendorMap.get(vendorKey)
      vendor.visit_count++
      vendor.total_spent += event.total_amount || 0
      vendor.events.push(event)
      vendor.last_visit = event.date

      if (event.geocoded_address) {
        vendor.locations.add(event.geocoded_address)
      }
    })

    // Convert to array and enrich with statistics
    const vendors = Array.from(vendorMap.values())
      .map(v => ({
        name: v.name,
        visit_count: v.visit_count,
        total_spent: Math.round(v.total_spent * 100) / 100,
        avg_spent_per_visit: v.visit_count > 0 
          ? Math.round((v.total_spent / v.visit_count) * 100) / 100 
          : 0,
        locations: Array.from(v.locations),
        location_count: v.locations.size,
        first_visit: v.first_visit,
        last_visit: v.last_visit,
        days_since_last_visit: Math.floor(
          (Date.now() - new Date(v.last_visit).getTime()) / (1000 * 60 * 60 * 24)
        ),
        events: v.events.slice(0, 5) // Latest 5 events
      }))
      .sort((a, b) => b.visit_count - a.visit_count)
      .slice(0, limit)

    return NextResponse.json({
      data: vendors,
      meta: {
        query,
        total_results: vendors.length,
        limit
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
