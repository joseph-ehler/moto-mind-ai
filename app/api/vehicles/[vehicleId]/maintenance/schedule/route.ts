import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * GET /api/vehicles/[vehicleId]/maintenance/schedule
 * Get predictive maintenance schedule
 * 
 * ELITE-TIER: Intelligent maintenance predictions
 * - Based on mileage + time
 * - Industry standard intervals
 * - Custom vehicle history
 * - Priority ranking
 * - Cost estimates
 * - Overdue alerts
 */
export async function GET(
  request: NextRequest,
  { params }): { params: { vehicleId: string } }
) {
  const { vehicleId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get vehicle details
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Fetch all events
    const { data: events, error } = await supabase
      .from('vehicle_events')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch maintenance schedule' },
        { status: 500 }
      )
    }

    const allEvents = events || []

    // Get current mileage
    const eventsWithMiles = allEvents.filter(e => e.miles).sort((a, b) => b.miles - a.miles)
    const currentMiles = eventsWithMiles[0]?.miles || 0

    // ELITE: Define maintenance schedule (industry standards)
    const maintenanceItems = [
      {
        id: 'oil_change',
        name: 'Oil Change',
        interval_miles: 5000,
        interval_days: 180,
        priority: 'high',
        estimated_cost: { min: 40, max: 80 },
        keywords: ['oil', 'oil change', 'lube', 'filter'],
        description: 'Regular oil and filter change'
      },
      {
        id: 'tire_rotation',
        name: 'Tire Rotation',
        interval_miles: 7500,
        interval_days: 180,
        priority: 'medium',
        estimated_cost: { min: 20, max: 50 },
        keywords: ['tire', 'rotation', 'tires'],
        description: 'Rotate tires for even wear'
      },
      {
        id: 'air_filter',
        name: 'Air Filter Replacement',
        interval_miles: 15000,
        interval_days: 365,
        priority: 'medium',
        estimated_cost: { min: 20, max: 40 },
        keywords: ['air filter', 'filter'],
        description: 'Replace engine air filter'
      },
      {
        id: 'cabin_filter',
        name: 'Cabin Air Filter',
        interval_miles: 15000,
        interval_days: 365,
        priority: 'low',
        estimated_cost: { min: 15, max: 30 },
        keywords: ['cabin', 'cabin filter', 'ac filter'],
        description: 'Replace cabin air filter'
      },
      {
        id: 'brake_inspection',
        name: 'Brake Inspection',
        interval_miles: 15000,
        interval_days: 365,
        priority: 'high',
        estimated_cost: { min: 0, max: 50 },
        keywords: ['brake', 'brakes', 'brake pad'],
        description: 'Inspect brake pads and rotors'
      },
      {
        id: 'transmission_fluid',
        name: 'Transmission Fluid',
        interval_miles: 30000,
        interval_days: 730,
        priority: 'high',
        estimated_cost: { min: 100, max: 200 },
        keywords: ['transmission', 'trans fluid', 'atf'],
        description: 'Change transmission fluid'
      },
      {
        id: 'coolant_flush',
        name: 'Coolant Flush',
        interval_miles: 30000,
        interval_days: 730,
        priority: 'medium',
        estimated_cost: { min: 80, max: 150 },
        keywords: ['coolant', 'antifreeze', 'flush'],
        description: 'Flush and replace coolant'
      },
      {
        id: 'spark_plugs',
        name: 'Spark Plugs',
        interval_miles: 30000,
        interval_days: 1095,
        priority: 'medium',
        estimated_cost: { min: 100, max: 300 },
        keywords: ['spark', 'plugs', 'spark plugs'],
        description: 'Replace spark plugs'
      },
      {
        id: 'timing_belt',
        name: 'Timing Belt',
        interval_miles: 60000,
        interval_days: 1825,
        priority: 'critical',
        estimated_cost: { min: 500, max: 1000 },
        keywords: ['timing', 'belt', 'timing belt'],
        description: 'Replace timing belt (if equipped)'
      },
      {
        id: 'inspection',
        name: 'State Inspection',
        interval_miles: 12000,
        interval_days: 365,
        priority: 'high',
        estimated_cost: { min: 30, max: 60 },
        keywords: ['inspection', 'state inspection', 'emissions'],
        description: 'Annual state inspection'
      }
    ]

    const now = new Date()
    const schedule: any[] = []

    // ELITE: Calculate status for each maintenance item
    maintenanceItems.forEach(item => {
      // Find most recent occurrence
      const maintenanceEvents = allEvents.filter(e => {
        const notes = (e.notes || '').toLowerCase()
        const type = (e.type || '').toLowerCase()
        return item.keywords.some(keyword => 
          notes.includes(keyword) || type.includes(keyword)
        )
      })

      const lastMaintenance = maintenanceEvents[0] // Most recent

      let status: any = {
        id: item.id,
        name: item.name,
        description: item.description,
        priority: item.priority,
        estimated_cost: item.estimated_cost,
        interval: {
          miles: item.interval_miles,
          days: item.interval_days
        }
      }

      if (lastMaintenance) {
        // Calculate since last service
        const daysSince = Math.floor((now.getTime() - new Date(lastMaintenance.date).getTime()) / (1000 * 60 * 60 * 24))
        const milesSince = currentMiles - (lastMaintenance.miles || 0)

        // Calculate until due
        const daysUntilDue = item.interval_days - daysSince
        const milesUntilDue = item.interval_miles - milesSince

        // Determine status
        const isOverdueByDays = daysUntilDue <= 0
        const isOverdueByMiles = milesUntilDue <= 0
        const isUpcomingByDays = daysUntilDue <= 30 && daysUntilDue > 0
        const isUpcomingByMiles = milesUntilDue <= 500 && milesUntilDue > 0

        let itemStatus = 'ok'
        if (isOverdueByDays || isOverdueByMiles) {
          itemStatus = 'overdue'
        } else if (isUpcomingByDays || isUpcomingByMiles) {
          itemStatus = 'upcoming'
        }

        status = {
          ...status,
          status: itemStatus,
          last_performed: {
            date: lastMaintenance.date,
            miles: lastMaintenance.miles,
            cost: lastMaintenance.total_amount,
            notes: lastMaintenance.notes
          },
          since_last: {
            days: daysSince,
            miles: milesSince
          },
          next_due: {
            date: new Date(new Date(lastMaintenance.date).getTime() + item.interval_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            miles: (lastMaintenance.miles || 0) + item.interval_miles,
            days_remaining: Math.max(0, daysUntilDue),
            miles_remaining: Math.max(0, milesUntilDue)
          }
        }
      } else {
        // Never performed - estimate based on current mileage
        const estimatedDueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        
        status = {
          ...status,
          status: 'unknown',
          last_performed: null,
          next_due: {
            date: estimatedDueDate.toISOString().split('T')[0],
            miles: currentMiles + item.interval_miles,
            days_remaining: 30,
            miles_remaining: item.interval_miles
          },
          recommendation: `No ${item.name.toLowerCase()} record found. Consider scheduling based on your vehicle history.`
        }
      }

      schedule.push(status)
    })

    // Sort by priority and status
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const statusOrder = { overdue: 0, upcoming: 1, unknown: 2, ok: 3 }

    schedule.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
      if (priorityDiff !== 0) return priorityDiff
      
      return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
    })

    // ELITE: Calculate summary
    const summary = {
      overdue: schedule.filter(s => s.status === 'overdue').length,
      upcoming: schedule.filter(s => s.status === 'upcoming').length,
      ok: schedule.filter(s => s.status === 'ok').length,
      unknown: schedule.filter(s => s.status === 'unknown').length,
      total_estimated_cost: schedule
        .filter(s => s.status === 'overdue' || s.status === 'upcoming')
        .reduce((sum, s) => sum + ((s.estimated_cost.min + s.estimated_cost.max) / 2), 0)
    }

    // Generate alerts
    const alerts: string[] = []
    
    if (summary.overdue > 0) {
      alerts.push(`${summary.overdue} maintenance item${summary.overdue > 1 ? 's' : ''} overdue`)
    }
    
    if (summary.upcoming > 0) {
      alerts.push(`${summary.upcoming} maintenance item${summary.upcoming > 1 ? 's' : ''} coming up soon`)
    }

    const criticalOverdue = schedule.filter(s => s.status === 'overdue' && s.priority === 'critical')
    if (criticalOverdue.length > 0) {
      alerts.push(`CRITICAL: ${criticalOverdue.map(s => s.name).join(', ')} overdue`)
    }

    return NextResponse.json({
      data: {
        vehicle: {
          id: vehicle.id,
          name: vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          current_miles: currentMiles
        },
        schedule,
        summary: {
          ...summary,
          total_estimated_cost: Math.round(summary.total_estimated_cost)
        },
        alerts,
        recommendations: generateMaintenanceRecommendations(schedule, currentMiles)
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

function generateMaintenanceRecommendations(schedule: any[], currentMiles: number): string[] {
  const recommendations: string[] = []

  // Priority items overdue
  const overdueHighPriority = schedule.filter(s => 
    s.status === 'overdue' && (s.priority === 'critical' || s.priority === 'high')
  )

  if (overdueHighPriority.length > 0) {
    recommendations.push(`Schedule ${overdueHighPriority[0].name.toLowerCase()} immediately`)
  }

  // Upcoming items
  const upcomingItems = schedule.filter(s => s.status === 'upcoming')
  if (upcomingItems.length >= 2) {
    recommendations.push(`Consider bundling ${upcomingItems.length} upcoming services to save time`)
  }

  // Mileage milestone
  const milestones = [30000, 60000, 90000, 120000]
  const nextMilestone = milestones.find(m => m > currentMiles)
  
  if (nextMilestone && (nextMilestone - currentMiles) < 2000) {
    recommendations.push(`Approaching ${nextMilestone.toLocaleString()} mile service interval`)
  }

  return recommendations
}
