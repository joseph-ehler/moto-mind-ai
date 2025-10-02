import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { VehicleTimeline } from '@/components/timeline/VehicleTimeline'
import { ArrowLeft, Car } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  nickname?: string
}

export default function VehicleTimelinePage() {
  const router = useRouter()
  const { id } = router.query
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [timelineFilter, setTimelineFilter] = useState<string>('all')

  // Fetch events from real API
  const { data: eventsData, error: eventsError, mutate: mutateEvents } = useSWR(
    id ? `/api/vehicles/${id}/events` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Transform database events to timeline format (same as dashboard)
  const transformDatabaseEvent = (dbEvent: any) => {
    const baseEvent = {
      id: dbEvent.id,
      type: dbEvent.type,
      created_at: dbEvent.created_at, // Keep as created_at for timeline
      date: dbEvent.date,
      miles: dbEvent.miles,
      notes: dbEvent.notes, // Include notes for photo descriptions
      image: dbEvent.image, // Include linked photo data
      confidence: dbEvent.payload?.confidence || dbEvent.payload?.extraction_confidence,
      payload: dbEvent.payload,
      summary: dbEvent.payload?.summary,
      key_facts: dbEvent.payload?.key_facts,
      validation: dbEvent.payload?.validation,
      processing_metadata: dbEvent.payload?.processing_metadata,
      quality_signals: dbEvent.payload?.quality_signals
    }

    switch (dbEvent.type) {
      case 'fuel':
        return {
          ...baseEvent,
          total_amount: dbEvent.payload?.total_amount,
          gallons: dbEvent.payload?.gallons,
          station: dbEvent.payload?.station,
          price_per_gallon: dbEvent.payload?.price_per_gallon
        }
      case 'maintenance':
        return {
          ...baseEvent,
          type: 'service',
          kind: dbEvent.payload?.service_type || dbEvent.payload?.kind || 'Service',
          total_amount: dbEvent.payload?.total_amount,
          vendor: dbEvent.payload?.vendor || dbEvent.payload?.shop_name
        }
      case 'document':
        return {
          ...baseEvent,
          doc_type: dbEvent.payload?.doc_type || 'document'
        }
      case 'odometer':
      default:
        return baseEvent
    }
  }

  const events = eventsData?.events ? eventsData.events.map(transformDatabaseEvent) : []

  useEffect(() => {
    if (!id) return

    const fetchVehicleData = async () => {
      try {
        const vehicleResponse = await fetch(`/api/vehicles/${id}`)
        if (!vehicleResponse.ok) {
          console.error('Vehicle not found:', vehicleResponse.status)
          return
        }
        
        const vehicleData = await vehicleResponse.json()
        setVehicle(vehicleData.vehicle)
        
      } catch (error) {
        console.error('Error fetching vehicle data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicleData()
  }, [id])

  // Filter events based on timeline filter
  const filteredEvents = events.filter((event: any) => {
    if (timelineFilter === 'all') return true
    return event.type === timelineFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="animate-pulse space-y-6 p-4">
          <div className="h-16 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md">
          <Car className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vehicle Not Found</h2>
          <p className="text-slate-500 mb-6">The vehicle you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.push("/vehicles")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Fleet
          </button>
        </div>
      </div>
    )
  }

  const displayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Recent Activity</h1>
            <p className="text-sm text-slate-600">{displayName}</p>
          </div>
        </div>
      </header>

      {/* Timeline Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <VehicleTimeline
          vehicleId={vehicle.id}
          events={filteredEvents}
          onEventDeleted={mutateEvents}
          timelineFilter={timelineFilter}
          onFilterChange={setTimelineFilter}
          onEventClick={(eventId) => router.push(`/vehicles/${vehicle.id}/timeline/${eventId}`)}
        />
      </main>
    </div>
  )
}
