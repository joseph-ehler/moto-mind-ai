/**
 * Vehicle Context Builder
 * 
 * Builds rich vehicle context for AI conversations by fetching:
 * - Recent maintenance events
 * - Cost summaries
 * - Upcoming maintenance needs
 * - Vehicle specifications
 * - Recent images and condition notes
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface VehicleContextData {
  vehicle: {
    id: string
    year: number
    make: string
    model: string
    trim?: string
    vin?: string
    mileage?: number
  }
  maintenance: {
    recent_events: Array<{
      id: string
      type: string
      date: string
      miles?: number
      cost?: number
      vendor?: string
      summary?: string
      notes?: string
      location?: string // Geocoded address
      coordinates?: { lat: number; lng: number } // For mapping
      gallons?: number // For fuel events
      pricePerGallon?: number // Calculated
      display_vendor?: string // Formatted vendor name
      display_summary?: string // Human-readable summary
      display_amount?: string // Formatted amount
      created_at?: string // When logged
      edited_at?: string // Last edit
      payload?: any // Raw extracted data
      weather?: {
        temperature_f?: number
        condition?: string
        precipitation_mm?: number
        windspeed_mph?: number
        humidity_percent?: number
        pressure_inhg?: number
      }
    }>
    total_events: number
    last_service?: {
      type: string
      date: string
      miles: number
      vendor?: string
    }
    upcoming?: Array<{
      type: string
      due_at_miles?: number
      due_date?: string
      reason: string
    }>
  }
  costs: {
    total_spent_ytd: number
    total_spent_lifetime: number
    avg_cost_per_service: number
    most_expensive_service?: {
      type: string
      cost: number
      date: string
    }
  }
  specs?: {
    maintenance_intervals?: any
    fluids_capacities?: any
    tire_specifications?: any
  }
  condition?: {
    recent_images_count: number
    maintenance_indicators?: string[]
    last_inspection_date?: string
  }
  // Metadata for context_references
  metadata: {
    fetched_at: string
    event_ids: string[]
    date_range: { from: string; to: string }
    query_summary: string
  }
}

interface BuildContextOptions {
  includeRecentEvents?: boolean
  includeSpecs?: boolean
  includeImages?: boolean
  eventLimit?: number
  dateRangeMonths?: number
  includeAllEvents?: boolean // New: Include all events regardless of date
}

export class VehicleContextBuilder {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Build comprehensive vehicle context for AI
   */
  async buildContext(
    vehicleId: string,
    options: BuildContextOptions = {}
  ): Promise<VehicleContextData> {
    const {
      includeRecentEvents = true,
      includeSpecs = true,
      includeImages = false,
      eventLimit = 50, // Increased from 10 to 50
      dateRangeMonths = 12,
      includeAllEvents = true // Default to true - AI should see full history
    } = options

    console.log(`🏗️  Building vehicle context for ${vehicleId}`)

    // Fetch vehicle details
    const { data: vehicle, error: vehicleError } = await this.supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      throw new Error(`Vehicle not found: ${vehicleId}`)
    }

    // Calculate date range for events (unless includeAllEvents is true)
    const dateFrom = new Date()
    if (!includeAllEvents) {
      dateFrom.setMonth(dateFrom.getMonth() - dateRangeMonths)
    } else {
      // Go back 100 years to get all events
      dateFrom.setFullYear(dateFrom.getFullYear() - 100)
    }

    const context: VehicleContextData = {
      vehicle: {
        id: vehicle.id,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        vin: vehicle.vin,
        mileage: undefined // Will be populated from latest event
      },
      maintenance: {
        recent_events: [],
        total_events: 0,
        last_service: undefined,
        upcoming: []
      },
      costs: {
        total_spent_ytd: 0,
        total_spent_lifetime: 0,
        avg_cost_per_service: 0
      },
      metadata: {
        fetched_at: new Date().toISOString(),
        event_ids: [],
        date_range: {
          from: dateFrom.toISOString(),
          to: new Date().toISOString()
        },
        query_summary: includeAllEvents 
          ? `Fetched up to ${eventLimit} events from complete vehicle history`
          : `Fetched ${eventLimit} recent events from last ${dateRangeMonths} months`
      }
    }

    // Fetch recent maintenance events
    if (includeRecentEvents) {
      const { data: events, error: eventsError } = await this.supabase
        .from('vehicle_events')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .is('deleted_at', null)
        .gte('date', dateFrom.toISOString())
        .order('date', { ascending: false })
        .limit(eventLimit)

      if (!eventsError && events) {
        context.maintenance.recent_events = events.map(e => {
          const gallons = e.gallons ? parseFloat(e.gallons) : undefined
          const cost = e.total_amount ? parseFloat(e.total_amount) : undefined
          const pricePerGallon = (gallons && cost) ? cost / gallons : undefined
          
          return {
            id: e.id,
            type: e.type,
            date: e.date,
            miles: e.miles || e.odometer_miles,
            cost,
            vendor: e.vendor,
            summary: e.event_summary,
            notes: e.notes || e.user_notes,
            location: e.geocoded_address,
            coordinates: (e.geocoded_lat && e.geocoded_lng) ? {
              lat: parseFloat(e.geocoded_lat),
              lng: parseFloat(e.geocoded_lng)
            } : undefined,
            gallons,
            pricePerGallon,
            display_vendor: e.display_vendor,
            display_summary: e.display_summary,
            display_amount: e.display_amount,
            created_at: e.created_at,
            edited_at: e.edited_at,
            payload: e.payload,
            weather: (e.weather_temperature_f || e.weather_condition) ? {
              temperature_f: e.weather_temperature_f,
              condition: e.weather_condition,
              precipitation_mm: e.weather_precipitation_mm,
              windspeed_mph: e.weather_windspeed_mph,
              humidity_percent: e.weather_humidity_percent,
              pressure_inhg: e.weather_pressure_inhg
            } : undefined
          }
        })

        context.metadata.event_ids = events.map(e => e.id)

        // Get most recent service event (not dashboard snapshot)
        const lastService = events.find(e => e.type === 'service')
        if (lastService) {
          context.maintenance.last_service = {
            type: lastService.type,
            date: lastService.date,
            miles: lastService.miles || lastService.odometer_miles || 0,
            vendor: lastService.display_vendor || lastService.vendor
          }
        }

        // Get latest mileage from most recent event
        const latestEvent = events[0]
        if (latestEvent) {
          context.vehicle.mileage = latestEvent.miles || latestEvent.odometer_miles
        }
      }

      // Get total event count (all time)
      const { count } = await this.supabase
        .from('vehicle_events')
        .select('*', { count: 'exact', head: true })
        .eq('vehicle_id', vehicleId)
        .is('deleted_at', null)

      context.maintenance.total_events = count || 0
    }

    // Calculate cost summaries
    const { data: costData } = await this.supabase
      .from('vehicle_events')
      .select('total_amount, date, type, display_summary')
      .eq('vehicle_id', vehicleId)
      .is('deleted_at', null)
      .not('total_amount', 'is', null)

    if (costData) {
      // Total spent (lifetime)
      const totalLifetime = costData.reduce((sum, e) => 
        sum + (e.total_amount ? parseFloat(e.total_amount) : 0), 0
      )
      context.costs.total_spent_lifetime = totalLifetime

      // Total spent this year
      const ytdStart = new Date(new Date().getFullYear(), 0, 1)
      const ytdEvents = costData.filter(e => new Date(e.date) >= ytdStart)
      context.costs.total_spent_ytd = ytdEvents.reduce((sum, e) =>
        sum + (e.total_amount ? parseFloat(e.total_amount) : 0), 0
      )

      // Average cost per service
      context.costs.avg_cost_per_service = costData.length > 0 
        ? totalLifetime / costData.length 
        : 0

      // Most expensive service
      if (costData.length > 0) {
        const mostExpensive = costData.reduce((max, e) => {
          const amount = e.total_amount ? parseFloat(e.total_amount) : 0
          const maxAmount = max.total_amount ? parseFloat(max.total_amount) : 0
          return amount > maxAmount ? e : max
        })
        
        context.costs.most_expensive_service = {
          type: mostExpensive.type,
          cost: parseFloat(mostExpensive.total_amount),
          date: mostExpensive.date
        }
      }
    }

    // Fetch vehicle specs if requested
    if (includeSpecs) {
      const { data: specs } = await this.supabase
        .from('vehicle_spec_enhancements')
        .select('category, data')
        .eq('vehicle_id', vehicleId)
        .eq('status', 'completed')
        .in('category', ['maintenance_intervals', 'fluids_capacities', 'tire_specifications'])

      if (specs && specs.length > 0) {
        context.specs = {}
        specs.forEach(s => {
          if (context.specs) {
            (context.specs as any)[s.category] = s.data
          }
        })
      }
    }

    // Fetch recent images/condition data if requested
    if (includeImages) {
      const { data: images } = await this.supabase
        .from('vehicle_images')
        .select('id, ai_description, maintenance_indicators, created_at')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (images) {
        context.condition = {
          recent_images_count: images.length,
          maintenance_indicators: images
            .flatMap(i => i.maintenance_indicators || [])
            .slice(0, 5),
          last_inspection_date: images[0]?.created_at
        }
      }
    }

    // Calculate upcoming maintenance needs
    context.maintenance.upcoming = this.calculateUpcomingMaintenance(context)

    console.log(`✅ Context built: ${context.maintenance.recent_events.length} events, $${context.costs.total_spent_ytd.toFixed(2)} YTD`)

    return context
  }

  /**
   * Calculate upcoming maintenance based on mileage and time
   */
  private calculateUpcomingMaintenance(context: VehicleContextData): Array<{
    type: string
    due_at_miles?: number
    due_date?: string
    reason: string
  }> {
    const upcoming = []
    const currentMileage = context.vehicle.mileage || 0
    const lastService = context.maintenance.last_service

    // Oil change (every 5,000 miles or 6 months)
    if (lastService && lastService.type === 'service') {
      const milesSinceService = currentMileage - lastService.miles
      const daysSinceService = Math.floor(
        (new Date().getTime() - new Date(lastService.date).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (milesSinceService > 4000 || daysSinceService > 150) {
        upcoming.push({
          type: 'oil_change',
          due_at_miles: lastService.miles + 5000,
          reason: milesSinceService > 4000 
            ? `${milesSinceService.toLocaleString()} miles since last service`
            : `${Math.floor(daysSinceService / 30)} months since last service`
        })
      }
    }

    // Tire rotation (every 5,000-7,500 miles)
    const lastTireRotation = context.maintenance.recent_events.find(e => 
      e.summary?.toLowerCase().includes('tire') || e.type === 'tire_rotation'
    )

    if (lastTireRotation && lastTireRotation.miles) {
      const milesSinceTires = currentMileage - lastTireRotation.miles
      if (milesSinceTires > 5000) {
        upcoming.push({
          type: 'tire_rotation',
          due_at_miles: lastTireRotation.miles + 7500,
          reason: `${milesSinceTires.toLocaleString()} miles since last rotation`
        })
      }
    }

    return upcoming.slice(0, 3) // Max 3 upcoming items
  }

  /**
   * Format context for AI prompt
   */
  formatForPrompt(context: VehicleContextData): string {
    const parts = []

    // Vehicle info
    parts.push(`VEHICLE: ${context.vehicle.year} ${context.vehicle.make} ${context.vehicle.model}`)
    if (context.vehicle.trim) parts.push(`Trim: ${context.vehicle.trim}`)
    if (context.vehicle.mileage) parts.push(`Current Mileage: ${context.vehicle.mileage.toLocaleString()} miles`)

    // Data coverage
    parts.push(`\n${context.metadata.query_summary}`)
    parts.push(`Total Events on Record: ${context.maintenance.total_events}`)

    // Recent maintenance (show more events now)
    if (context.maintenance.recent_events.length > 0) {
      parts.push(`\nMAINTENANCE & FUEL HISTORY (${context.maintenance.recent_events.length} most recent):`)
      context.maintenance.recent_events.forEach(e => {
        const dateStr = new Date(e.date).toLocaleDateString()
        const miles = e.miles ? ` @ ${e.miles.toLocaleString()} mi` : ''
        const cost = e.cost ? ` ($${e.cost.toFixed(2)})` : ''
        const gallons = e.gallons ? ` ${e.gallons} gal` : ''
        const vendor = e.vendor ? ` - ${e.vendor}` : ''
        const location = e.location ? ` in ${e.location}` : ''
        const summary = e.summary ? `: ${e.summary}` : ''
        const notes = e.notes ? ` [Note: ${e.notes}]` : ''
        
        // Weather info
        let weather = ''
        if (e.weather) {
          const temp = e.weather.temperature_f ? `${Math.round(e.weather.temperature_f)}°F` : ''
          const cond = e.weather.condition ? e.weather.condition : ''
          const wind = e.weather.windspeed_mph ? `${Math.round(e.weather.windspeed_mph)} mph wind` : ''
          const humid = e.weather.humidity_percent ? `${e.weather.humidity_percent}% humidity` : ''
          
          const weatherParts = [temp, cond, wind, humid].filter(Boolean)
          if (weatherParts.length > 0) {
            weather = ` [Weather: ${weatherParts.join(', ')}]`
          }
        }
        
        parts.push(`  - ${dateStr}${miles}${cost}${gallons}${vendor}${location} - ${e.type}${summary}${notes}${weather}`)
      })
    }

    // Cost summary
    parts.push(`\nCOST SUMMARY:`)
    parts.push(`  - Year-to-Date: $${context.costs.total_spent_ytd.toFixed(2)}`)
    parts.push(`  - Lifetime Total: $${context.costs.total_spent_lifetime.toFixed(2)}`)
    parts.push(`  - Average per Service: $${context.costs.avg_cost_per_service.toFixed(2)}`)

    // Upcoming maintenance
    if (context.maintenance.upcoming && context.maintenance.upcoming.length > 0) {
      parts.push(`\nUPCOMING MAINTENANCE:`)
      context.maintenance.upcoming.forEach(u => {
        const due = u.due_at_miles ? ` (due ~${u.due_at_miles.toLocaleString()} mi)` : ''
        parts.push(`  - ${u.type}${due}: ${u.reason}`)
      })
    }

    // Specs (if available)
    if (context.specs?.maintenance_intervals) {
      parts.push(`\nMAINTENANCE INTERVALS (Manufacturer):`)
      const intervals = context.specs.maintenance_intervals
      if (intervals.oil_change) parts.push(`  - Oil Change: ${intervals.oil_change}`)
      if (intervals.tire_rotation) parts.push(`  - Tire Rotation: ${intervals.tire_rotation}`)
    }

    return parts.join('\n')
  }
}
