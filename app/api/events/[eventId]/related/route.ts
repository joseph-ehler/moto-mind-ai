import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/events/[eventId]/related
 * Get related events (previous/next fuel fill-ups with context)
 * 
 * Action sub-resource - provides context for current event
 * Includes MPG calculations and timeline context
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get current event
    const { data: currentEvent, error: currentError } = await supabase
      .from('vehicle_events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (currentError || !currentEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Get previous fuel fill-up (same vehicle, earlier date)
    const { data: previous } = await supabase
      .from('vehicle_events')
      .select('id, date, vendor, display_vendor, total_amount, gallons, miles')
      .eq('vehicle_id', currentEvent.vehicle_id)
      .eq('type', 'fuel')
      .lt('date', currentEvent.date)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    // Get the fill-up before previous (to calculate previous MPG)
    const { data: previousBeforePrevious } = await supabase
      .from('vehicle_events')
      .select('miles, gallons')
      .eq('vehicle_id', currentEvent.vehicle_id)
      .eq('type', 'fuel')
      .lt('date', previous?.date || currentEvent.date)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    // Calculate previous MPG
    let previousMPG = null
    if (previous && previousBeforePrevious && previous.miles && previousBeforePrevious.miles) {
      const prevMilesDriven = previous.miles - previousBeforePrevious.miles
      previousMPG = prevMilesDriven / previous.gallons
    }

    // Get next fuel fill-up (same vehicle, later date)
    const { data: next } = await supabase
      .from('vehicle_events')
      .select('id, date, vendor, display_vendor, total_amount, gallons, miles')
      .eq('vehicle_id', currentEvent.vehicle_id)
      .eq('type', 'fuel')
      .gt('date', currentEvent.date)
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle()

    // Calculate days since previous
    let daysSincePrevious = null
    if (previous) {
      const prevDate = new Date(previous.date)
      const currDate = new Date(currentEvent.date)
      daysSincePrevious = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Calculate average MPG for this vehicle
    const { data: allFillups } = await supabase
      .from('vehicle_events')
      .select('miles, gallons')
      .eq('vehicle_id', currentEvent.vehicle_id)
      .eq('type', 'fuel')
      .not('miles', 'is', null)
      .not('gallons', 'is', null)
      .order('date', { ascending: true })

    let averageMPG = null
    if (allFillups && allFillups.length > 1) {
      const mpgs = []
      for (let i = 1; i < allFillups.length; i++) {
        const milesDriven = allFillups[i].miles - allFillups[i - 1].miles
        const mpg = milesDriven / allFillups[i].gallons
        if (mpg > 0 && mpg < 100) { // Sanity check
          mpgs.push(mpg)
        }
      }
      if (mpgs.length > 0) {
        averageMPG = mpgs.reduce((a, b) => a + b, 0) / mpgs.length
      }
    }

    return NextResponse.json({
      success: true,
      previous: previous ? {
        id: previous.id,
        date: previous.date,
        station_name: previous.display_vendor || previous.vendor,
        total_amount: previous.total_amount,
        gallons: previous.gallons,
        miles: previous.miles
      } : null,
      next: next ? {
        id: next.id,
        date: next.date,
        station_name: next.display_vendor || next.vendor,
        total_amount: next.total_amount,
        gallons: next.gallons,
        miles: next.miles
      } : null,
      context: {
        days_since_previous: daysSincePrevious,
        average_mpg: averageMPG ? parseFloat(averageMPG.toFixed(2)) : null,
        previous_mpg: previousMPG ? parseFloat(previousMPG.toFixed(2)) : null
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
