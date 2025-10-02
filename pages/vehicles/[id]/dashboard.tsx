import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { VehicleHeader } from '@/components/vehicle/VehicleHeader'
import { ActionBar } from '@/components/vehicle/ActionBar'
import { VehicleStatusCard } from '@/components/vehicle/SmartCards/VehicleStatusCard'
import { RecentActivityCard } from '@/components/vehicle/SmartCards/RecentActivityCard'
import { CostsCard } from '@/components/vehicle/SmartCards/CostsCard'
import { PhotosCard } from '@/components/vehicle/SmartCards/PhotosCard'
import { VehicleTimeline } from '@/components/timeline/VehicleTimeline'
import { DashboardCaptureModal } from '@/components/vision/DashboardCaptureModal'
import { SimplePhotoModal } from '@/components/capture/SimplePhotoModal'
import { Car } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  trim?: string
  nickname?: string
  hero_image_url?: string
  vin?: string
  garage_id?: string
  enrichment?: any
  garage?: {
    id: string
    name: string
    address: string
    lat?: number
    lng?: number
    timezone?: string
  }
}

export default function VehicleDashboard() {
  const router = useRouter()
  const { id } = router.query
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDashboardModal, setShowDashboardModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [timelineFilter, setTimelineFilter] = useState<string>('all')
  const [showFullTimeline, setShowFullTimeline] = useState(false)

  // Fetch events from real API
  const { data: eventsData, error: eventsError, mutate: mutateEvents } = useSWR(
    id ? `/api/vehicles/${id}/events` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Transform database events to timeline format
  const transformDatabaseEvent = (dbEvent: any) => {
    const baseEvent = {
      id: dbEvent.id,
      type: dbEvent.type,
      captured_at: dbEvent.created_at, // Use created_at as captured_at
      date: dbEvent.date,
      miles: dbEvent.miles,
      // Include confidence and payload for transparency features
      confidence: dbEvent.payload?.confidence || dbEvent.payload?.extraction_confidence,
      payload: dbEvent.payload,
      // Enhanced fields for production-grade extraction system
      summary: dbEvent.payload?.summary,
      key_facts: dbEvent.payload?.key_facts,
      validation: dbEvent.payload?.validation,
      processing_metadata: dbEvent.payload?.processing_metadata,
      quality_signals: dbEvent.payload?.quality_signals
    }

    // Add type-specific fields from payload
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
          type: 'service', // Map maintenance to service for timeline
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

  // Get events in timeline format
  const events = eventsData?.events?.map(transformDatabaseEvent) || []

  // Event handlers for the simplified capture flow
  const handleEventSave = async (event: any) => {
    console.log('💾 SAVING EVENT TO TIMELINE:', event)
    
    try {
      // Transform minimal event to database format
      const dbEvent = {
        type: event.type === 'service' ? 'maintenance' : event.type,
        date: new Date().toISOString().split('T')[0], // Today's date
        miles: event.miles,
        image_id: event.image_id || null, // Link to vehicle_images table
        payload: {
          ...event,
          source: 'SimplePhotoModal',
          extraction_confidence: event.confidence || 90,
          source_document_url: event.source_document_url || null
        }
      }

      // Save to database
      const response = await fetch(`/api/vehicles/${id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbEvent)
      })

      if (response.ok) {
        // Refresh events from API
        mutateEvents()
        console.log(`✅ ${event.type.toUpperCase()} EVENT SAVED`)
      } else {
        console.error('Failed to save event:', await response.text())
      }
    } catch (error) {
      console.error('Error saving event:', error)
    }
    
    // Close modal - this will be handled by the new modals
  }

  const copyVin = () => {
    if (vehicle?.vin) {
      navigator.clipboard.writeText(vehicle.vin)
      console.log('VIN copied to clipboard')
    }
  }

  const getLastOdometer = () => {
    const odometerEvents = events.filter((e: any) => e.type === 'odometer')
    if (odometerEvents.length > 0) {
      return {
        miles: odometerEvents[0].miles,
        date: new Date(odometerEvents[0].captured_at).toLocaleDateString()
      }
    }
    return { miles: 54120, date: 'Sep 21' } // Fallback
  }

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

  // Helper functions for smart cards
  const getCostData = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentEvents = events.filter((e: any) => 
      new Date(e.captured_at) >= thirtyDaysAgo && e.total_amount
    )
    
    const total = recentEvents.reduce((sum: number, e: any) => sum + (e.total_amount || 0), 0)
    const fuel = recentEvents.filter((e: any) => e.type === 'fuel').reduce((sum: number, e: any) => sum + (e.total_amount || 0), 0)
    const service = recentEvents.filter((e: any) => e.type === 'service').reduce((sum: number, e: any) => sum + (e.total_amount || 0), 0)
    const other = total - fuel - service
    
    return {
      period: '30-day',
      total,
      categories: { fuel, service, other },
      trend: 'stable' as const,
      trendPercentage: 0
    }
  }

  const getRecentPhotos = () => {
    // Mock data for now - would come from actual photo storage
    return []
  }

  const getWarningLights = () => {
    const dashboardEvents = events.filter((e: any) => e.type === 'dashboard_snapshot')
    if (dashboardEvents.length > 0) {
      return dashboardEvents[0].payload?.key_facts?.warning_lights || []
    }
    return []
  }

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

  const lastOdometer = getLastOdometer()
  const costData = getCostData()
  const recentPhotos = getRecentPhotos()
  const warningLights = getWarningLights()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Vehicle Header */}
      <VehicleHeader
        vehicle={vehicle}
        lastOdometer={lastOdometer}
        onBack={() => router.push("/vehicles")}
        onEditVehicle={() => {/* TODO: Implement */}}
        onManualEntry={() => {/* TODO: Implement */}}
        onExportData={() => {/* TODO: Implement */}}
        onDeleteVehicle={() => {/* TODO: Implement */}}
      />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Primary Actions - Vision First */}
        <ActionBar
          onDashboardCapture={() => setShowDashboardModal(true)}
          onScanDocument={() => setShowDocumentModal(true)}
        />

        {/* Smart Cards */}
        <VehicleStatusCard
          currentMileage={lastOdometer.miles}
          nextServiceMiles={lastOdometer.miles + 5000} // Mock calculation
          warningLights={warningLights}
          lastServiceDate="Jun 21, 2024" // Mock data
        />

        <RecentActivityCard
          events={events.slice(0, 4)}
          onViewAll={() => router.push(`/vehicles/${vehicle.id}/timeline`)}
        />

        {costData.total > 0 && (
          <CostsCard
            thirtyDayData={costData}
            onViewTrend={() => router.push(`/vehicles/${vehicle.id}/costs`)}
          />
        )}

        {recentPhotos.length > 0 && (
          <PhotosCard
            recentPhotos={recentPhotos}
            onViewGallery={() => router.push(`/vehicles/${vehicle.id}/photos`)}
          />
        )}
      </main>

      {/* Modals */}
      <DashboardCaptureModal
        isOpen={showDashboardModal}
        onClose={() => setShowDashboardModal(false)}
        onCapture={handleEventSave}
        vehicleId={id as string}
        mode="routine"
      />

      <SimplePhotoModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSaveEvent={handleEventSave}
        captureType="document"
        title="Scan Document"
      />
    </div>
  )
}
