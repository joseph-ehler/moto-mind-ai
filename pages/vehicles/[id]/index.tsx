import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { NavigationCard } from '@/components/vehicle/NavigationCard'
import { DashboardCaptureModal } from '@/components/vision/DashboardCaptureModal'
import { DocumentScannerModal } from '@/components/vision/DocumentScannerModal'
import { OverflowMenu } from '@/components/vehicle/OverflowMenu'
import { EditVehicleModal } from '@/components/vehicle/EditVehicleModal'
import { useVehicleEvents, useVehicleStats } from '@/hooks/useVehicleEvents'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'
import { 
  Car, 
  Calendar, 
  Clock, 
  DollarSign,
  MoreHorizontal,
  AlertTriangle,
  Plus,
  ArrowLeft,
  Camera,
  FileText,
  Activity,
  Image,
  Info,
  Wrench,
  FolderOpen,
  Shield,
  TrendingUp,
  ChevronRight,
  Building2,
  Copy,
  Check
} from 'lucide-react'

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
  license_plate?: string
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

export default function VehicleDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDashboardModal, setShowDashboardModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showOverflowMenu, setShowOverflowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [vinCopied, setVinCopied] = useState(false)
  const [licensePlateCopied, setLicensePlateCopied] = useState(false)

  // Enable scroll restoration for this route (only when id is available)
  useScrollRestoration(id ? `/vehicles/${id}` : 'disabled', !!id)

  // Use new paginated events hook (only when id is available)
  const { 
    events: paginatedEvents, 
    isLoading: eventsLoading, 
    hasMore,
    loadMore,
    refresh: refreshEvents 
  } = useVehicleEvents({
    vehicleId: (id as string) || '',
    limit: 30
  })

  // Use stats hook for overview cards (only when id is available)
  const { stats, isLoading: statsLoading, refresh: refreshStats } = useVehicleStats((id as string) || '')
  
  // Debug: Log stats whenever they change
  React.useEffect(() => {
    if (stats) {
      console.log('🔄 Stats updated in component:', {
        activityCount: stats.activity?.length,
        firstActivity: stats.activity?.[0],
        currentMiles: stats.service?.current_miles
      })
    }
  }, [stats])

  // Auto-refresh events when page becomes visible (e.g., navigating back from photos page)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && id) {
        console.log('👁️ Page visible - refreshing events')
        refreshEvents()
        refreshStats()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [id, refreshEvents, refreshStats])

  // Transform database events to timeline format
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

  // Transform paginated events
  const events = paginatedEvents.map(transformDatabaseEvent)

  // Helper function to handle document saving from DocumentScannerModal
  const handleDocumentSave = async (event: any) => {
    try {
      setShowDocumentModal(false)

      // Import normalizer dynamically to avoid circular deps
      const { normalizeDocumentData } = await import('@/lib/domain/document-normalizer')
      
      // Normalize vision data to canonical schema
      const normalizedPayload = normalizeDocumentData(event)
      
      // Extract odometer for top-level (chronological queries only)
      let odometerMiles: number | undefined
      let eventDate: string = new Date().toISOString().split('T')[0]
      
      if (normalizedPayload.type === 'dashboard_snapshot') {
        odometerMiles = (normalizedPayload.data as any).odometer_miles
      } else if (normalizedPayload.type === 'service_invoice') {
        odometerMiles = (normalizedPayload.data as any).odometer_reading || undefined
        eventDate = (normalizedPayload.data as any).date || eventDate
      } else if (normalizedPayload.type === 'fuel_receipt') {
        eventDate = (normalizedPayload.data as any).date || eventDate
      }

      // Build database payload with canonical structure
      const payload = {
        type: normalizedPayload.type,
        date: eventDate,
        miles: odometerMiles, // Only for chronological validation
        payload: normalizedPayload // Canonical schema in payload.data
      }

      // Save the event to the database
      const response = await fetch(`/api/vehicles/${id}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error:', errorData)
        throw new Error(errorData.error?.message || 'Failed to save event')
      }

      const savedEvent = await response.json()
      console.log('💾 Document saved to database:', savedEvent)

      // Refresh data
      await new Promise(resolve => setTimeout(resolve, 500))
      await refreshEvents()
      await refreshStats()
    } catch (error) {
      console.error('Error saving document:', error)
      alert('Failed to save document. Please try again.')
    }
  }

  // Helper function to handle event saving from DashboardCaptureModal
  const handleEventSave = async (eventData: any) => {
    try {
      // Close the modal first for better UX
      setShowDashboardModal(false)
      setShowDocumentModal(false)

      // Extract miles from key_facts if available
      const miles = eventData.data.key_facts?.odometer_miles

      // Build payload - only include miles if it exists
      const payload: any = {
        type: eventData.data.type || 'dashboard_snapshot',
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        image_id: eventData.data.image_id || null, // Link to vehicle_images table
        payload: eventData.data
      }

      // Only add miles if it's a valid number
      if (miles !== undefined && miles !== null && !isNaN(miles)) {
        payload.miles = miles
      }

      // Save the event to the database
      const response = await fetch(`/api/vehicles/${id}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error:', errorData)
        throw new Error(errorData.error?.message || 'Failed to save event')
      }

      const savedEvent = await response.json()
      console.log('💾 Event saved to database:', savedEvent)

      // Verify data is actually in database
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const verifyResponse = await fetch(`/api/vehicles/${id}/stats?_=${Date.now()}`)
      const verifyData = await verifyResponse.json()
      console.log('🔍 DIRECT API CALL - What database actually has:', {
        activityCount: verifyData.activity?.length,
        firstActivity: verifyData.activity?.[0],
        allActivityIds: verifyData.activity?.map((a: any) => a.id)
      })

      // Force complete cache invalidation and refetch
      console.log('🔄 Starting refresh...')
      await refreshEvents()
      await refreshStats()

      // Show success message
      console.log('Event saved successfully:', eventData)
      console.log('✅ Timeline and stats refreshed')
    } catch (error) {
      console.error('Error saving event:', error)
      // Show error message (you can add a toast notification here)
      alert('Failed to save event. Please try again.')
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
        console.log('🚗 Vehicle data loaded:', vehicleData.vehicle)
        console.log('🏠 Garage data:', vehicleData.vehicle.garage)
        console.log('🏠 Garage ID:', vehicleData.vehicle.garage_id)
        setVehicle(vehicleData.vehicle)
        
      } catch (error) {
        console.error('Error fetching vehicle data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicleData()
  }, [id])

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
    // Get photo events from timeline
    const photoEvents = events.filter(e => e.image !== null && e.image !== undefined)
    return photoEvents
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
  
  const displayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  
  const copyVin = async () => {
    if (vehicle.vin) {
      await navigator.clipboard.writeText(vehicle.vin)
      setVinCopied(true)
      setTimeout(() => setVinCopied(false), 2000) // Reset after 2 seconds
    }
  }

  const copyLicensePlate = async () => {
    if (vehicle.license_plate) {
      await navigator.clipboard.writeText(vehicle.license_plate)
      setLicensePlateCopied(true)
      setTimeout(() => setLicensePlateCopied(false), 2000) // Reset after 2 seconds
    }
  }

  // Overflow menu handlers
  const handleEditVehicle = () => {
    setShowOverflowMenu(false) // Close overflow menu
    setShowEditModal(true) // Open edit modal
  }

  const handleVehicleUpdated = (updatedVehicle: any) => {
    console.log('🔄 Vehicle updated:', updatedVehicle)
    console.log('🏠 Updated vehicle garage:', updatedVehicle.garage)
    console.log('🏠 Updated vehicle garage_id:', updatedVehicle.garage_id)
    setVehicle(updatedVehicle) // Update local state
    setShowEditModal(false) // Close modal
    // Refresh events and stats to reflect any changes
    refreshEvents()
    refreshStats()
  }

  const handleManualEntry = () => {
    // TODO: Open manual entry modal
    alert('Manual Entry feature coming soon!')
  }

  const handleExportData = () => {
    // Simple CSV export of vehicle data
    const csvData = [
      ['Vehicle Information'],
      ['Year', vehicle.year],
      ['Make', vehicle.make],
      ['Model', vehicle.model],
      ['Trim', vehicle.trim || 'N/A'],
      ['Nickname', vehicle.nickname || 'N/A'],
      ['VIN', vehicle.vin || 'N/A'],
      ['Current Mileage', lastOdometer.miles],
      ['Garage', vehicle.garage?.name || 'N/A'],
      [],
      ['Recent Events'],
      ['Date', 'Type', 'Summary', 'Miles']
    ]
    
    // Add recent events
    events.slice(0, 10).forEach((event: any) => {
      csvData.push([
        new Date(event.captured_at).toLocaleDateString(),
        event.type,
        event.summary || 'No summary',
        event.miles?.toString() || 'N/A'
      ])
    })
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${displayName.replace(/\s+/g, '_')}_export.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleDeleteVehicle = () => {
    const confirmed = confirm(`Are you sure you want to delete ${displayName}? This action cannot be undone.`)
    if (confirmed) {
      // TODO: Implement actual deletion
      alert('Delete functionality will be implemented soon!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Back Navigation */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-black/5 sticky top-0 z-10">
        <div className="px-6 py-4">
          <button 
            onClick={() => router.push("/vehicles")}
            className="flex items-center gap-3 text-black/70 hover:text-black transition-colors"
          >
            <div className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-all duration-200">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="font-medium">Fleet</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl text-white shadow-sm min-h-[200px] relative">
          {/* Overflow Menu - Positioned Absolutely */}
          <div className="absolute top-10 right-10 z-10">
            <button 
              onClick={() => setShowOverflowMenu(true)}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full transition-all duration-200"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            
            <OverflowMenu
              isOpen={showOverflowMenu}
              onClose={() => setShowOverflowMenu(false)}
              onEditVehicle={handleEditVehicle}
              onManualEntry={handleManualEntry}
              onExportData={handleExportData}
              onDeleteVehicle={handleDeleteVehicle}
            />
          </div>

          {/* Main Content */}
          <div className="p-10 pr-20">
            {/* Primary: Year Make Model Trim */}
            <h1 className="text-3xl font-semibold tracking-tight leading-tight">
              {vehicle.year} {vehicle.make} {vehicle.model}
              {vehicle.trim && <span className="text-white/90"> {vehicle.trim}</span>}
            </h1>
            
            {/* Secondary: Nickname */}
            {vehicle.nickname && (
              <p className="text-xl text-white/80 mt-2 font-medium">
                "{vehicle.nickname}"
              </p>
            )}
            
            {/* Tertiary: Key Info Chips */}
            <div className="mt-6 overflow-hidden">
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-sm font-medium whitespace-nowrap">
                  {stats?.service?.current_miles?.toLocaleString() || lastOdometer.miles.toLocaleString()} mi
                </span>
                {vehicle.garage ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-sm font-medium whitespace-nowrap">
                    <Building2 className="h-4 w-4" />
                    {vehicle.garage.name}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm font-medium whitespace-nowrap opacity-60">
                    <Building2 className="h-4 w-4" />
                    Unassigned
                  </span>
                )}
                {vehicle.license_plate && (
                  <button
                    onClick={copyLicensePlate}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-sm font-medium hover:bg-white/30 transition-all duration-200 whitespace-nowrap"
                    title="Click to copy license plate"
                  >
                    <span className="font-mono">{vehicle.license_plate}</span>
                    {licensePlateCopied ? (
                      <Check className="h-4 w-4 text-green-300" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
                {vehicle.vin && (
                  <button
                    onClick={copyVin}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-sm font-medium hover:bg-white/30 transition-all duration-200 whitespace-nowrap"
                    title="Click to copy full VIN"
                  >
                    <span className="font-mono">VIN: •••{vehicle.vin.slice(-5)}</span>
                    {vinCopied ? (
                      <Check className="h-4 w-4 text-green-300" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Button Cards - Full Width */}
          <div className="px-10 pb-10 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-2 min-w-max">
                <button
                  onClick={() => setShowDashboardModal(true)}
                  className="flex flex-col items-start gap-4 px-5 py-5 bg-white/20 hover:bg-white/30 rounded-2xl transition-all duration-200 backdrop-blur-sm min-w-[140px]"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm leading-tight">Capture Dashboard</div>
                    <div className="text-xs text-white/80 mt-1 leading-tight">Record odometer, fuel level & warning lights</div>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowDocumentModal(true)}
                  className="flex flex-col items-start gap-4 px-5 py-5 bg-white/20 hover:bg-white/30 rounded-2xl transition-all duration-200 backdrop-blur-sm min-w-[140px]"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm leading-tight">Scan Document</div>
                    <div className="text-xs text-white/80 mt-1 leading-tight">Upload receipts, invoices & service records</div>
                  </div>
                </button>
                
                <button
                  className="flex flex-col items-start gap-4 px-5 py-5 bg-white/20 hover:bg-white/30 rounded-2xl transition-all duration-200 backdrop-blur-sm min-w-[140px]"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm leading-tight">Log Issue</div>
                    <div className="text-xs text-white/80 mt-1 leading-tight">Report problems or maintenance needs</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Vehicle Photos - Horizontal Gallery */}
        <div className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-black mb-6">Photos</h2>
          
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
            {/* Add Photo Button - Always first */}
            <button
              onClick={() => alert('Photo upload coming soon!')}
              className="flex-shrink-0 w-32 h-32 rounded-2xl border-2 border-dashed border-black/20 
                         hover:border-black/40 hover:bg-black/5 transition-all duration-200
                         flex items-center justify-center group"
            >
              <Plus className="w-8 h-8 text-black/40 group-hover:text-black/60 transition-colors" />
            </button>
            
            {/* Hero image if exists */}
            {vehicle.hero_image_url && (
              <div className="flex-shrink-0 w-32 h-32 rounded-2xl bg-black/5 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                <img 
                  src={vehicle.hero_image_url} 
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation Menu */}
        {!statsLoading && stats && (
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
            {/* Recent Activity */}
            <button
              onClick={() => router.push(`/vehicles/${vehicle.id}/timeline`)}
              className="w-full flex items-center justify-between gap-6 px-8 py-6 hover:bg-black/5 transition-colors border-b border-black/5"
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-6 h-6 text-black/70" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-black">Recent Activity</h3>
                    {stats.activity && stats.activity.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {stats.activity.length}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-black/60 truncate">
                    {stats.activity && stats.activity.length > 0 
                      ? `${stats.activity.length} events • Last: ${stats.activity[0].summary || 'Dashboard snapshot'}`
                      : 'No activity yet'
                    }
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0 text-black/40" />
            </button>

            {/* Photos */}
            <button
              onClick={() => router.push(`/vehicles/${vehicle.id}/photos`)}
              className="w-full flex items-center justify-between gap-6 px-8 py-6 hover:bg-black/5 transition-colors border-b border-black/5"
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center flex-shrink-0">
                  <Image className="w-6 h-6 text-black/70" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-black">Photos</h3>
                    {recentPhotos.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {recentPhotos.length}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-black/60 truncate">
                    {recentPhotos.length > 0 
                      ? `${recentPhotos.length} photo${recentPhotos.length !== 1 ? 's' : ''} • Latest: ${recentPhotos[0].notes || 'Vehicle photo'}`
                      : 'No photos yet • Add photos to showcase your vehicle'
                    }
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0 text-black/40" />
            </button>

            {/* Specifications */}
            <button
              onClick={() => router.push(`/vehicles/${vehicle.id}/specifications`)}
              className="w-full flex items-center justify-between gap-6 px-8 py-6 hover:bg-black/5 transition-colors border-b border-black/5"
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center flex-shrink-0">
                  <Info className="w-6 h-6 text-black/70" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-black mb-1">Specifications</h3>
                  <p className="text-sm text-black/60 truncate">
                    {vehicle.year} • {vehicle.make} {vehicle.model}{vehicle.trim ? ` ${vehicle.trim}` : ''}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0 text-black/40" />
            </button>

            {/* Service Schedule - Placeholder */}
            <button
              disabled
              className="w-full flex items-center justify-between gap-6 px-8 py-6 opacity-50 cursor-not-allowed border-b border-black/5"
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-6 h-6 text-black/70" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-black">Service Schedule</h3>
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-sm text-black/60 truncate">
                    Oil changes, tire rotations, and maintenance intervals
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0 text-black/20" />
            </button>

            {/* Documents - Placeholder */}
            <button
              disabled
              className="w-full flex items-center justify-between gap-6 px-8 py-6 opacity-50 cursor-not-allowed border-b border-black/5"
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-6 h-6 text-black/70" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-black">Documents</h3>
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-sm text-black/60 truncate">
                    Receipts, invoices, and service records
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0 text-black/20" />
            </button>

            {/* Costs & Spending - Placeholder */}
            <button
              disabled
              className="w-full flex items-center justify-between gap-6 px-8 py-6 opacity-50 cursor-not-allowed border-b border-black/5"
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-black/70" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-black">Costs & Spending</h3>
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-sm text-black/60 truncate">
                    Track fuel, maintenance, and repair expenses
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0 text-black/20" />
            </button>

            {/* Recalls - Placeholder */}
            <button
              disabled
              className="w-full flex items-center justify-between gap-6 px-8 py-6 opacity-50 cursor-not-allowed"
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-black/70" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-black">Recalls</h3>
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-sm text-black/60 truncate">
                    Check for manufacturer recalls and safety notices
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0 text-black/20" />
            </button>
          </div>
        )}
        
        {/* Loading state for stats */}
        {statsLoading && (
          <div className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
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

      <DocumentScannerModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSave={handleDocumentSave}
        vehicleId={id as string}
        vehicleName={vehicle?.nickname || `${vehicle?.year} ${vehicle?.make} ${vehicle?.model}`}
      />

      {vehicle && (
        <EditVehicleModal
          vehicle={vehicle}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleVehicleUpdated}
        />
      )}
    </div>
  )
}
