import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Navigation } from '@/components/layout/Navigation'
import { Button } from '@/components/ui/button'
import { SimplePhotoModal } from '@/components/capture/SimplePhotoModal'
import { 
  Car, 
  Wrench, 
  Gauge, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Camera,
  Mic,
  MapPin
} from 'lucide-react'

interface Vehicle {
  id: string
  display_name: string
  make: string
  model: string
  currentMileage?: number
  lastOilChange?: {
    mileage: number
    date: string
  }
  lastInspection?: {
    date: string
    expiresDate: string
  }
  serviceInterval?: {
    oil: number // miles between oil changes
    inspection: number // months between inspections
  }
}

interface ServiceStatus {
  type: 'oil' | 'inspection' | 'service'
  status: 'overdue' | 'due_soon' | 'good'
  description: string
  dueIn: string
  urgency: number // 0-100, higher = more urgent
}

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)
  const [captureType, setCaptureType] = useState<'receipt' | 'odometer' | 'general'>('receipt')
  const [processingPhoto, setProcessingPhoto] = useState(false)
  const [lastProcessedResult, setLastProcessedResult] = useState<any>(null)
  const [showDocumentConfirmation, setShowDocumentConfirmation] = useState(false)
  const [documentData, setDocumentData] = useState<any>(null)

  useEffect(() => {
    // Fetch real vehicle data and add mock service data for now
    fetch('/api/vehicles')
      .then(res => res.json())
      .then(data => {
        const vehiclesWithServiceData = (data.data || []).map((vehicle: any) => ({
          ...vehicle,
          currentMileage: vehicle.currentMileage || Math.floor(Math.random() * 50000 + 20000),
          lastOilChange: {
            mileage: Math.floor(Math.random() * 45000 + 15000),
            date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
          },
          lastInspection: {
            date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            expiresDate: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
          },
          serviceInterval: {
            oil: 5000, // miles
            inspection: 12 // months
          }
        }))
        setVehicles(vehiclesWithServiceData)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Calculate service status for each vehicle
  const calculateServiceStatus = (vehicle: Vehicle): ServiceStatus[] => {
    const statuses: ServiceStatus[] = []
    
    if (vehicle.lastOilChange && vehicle.currentMileage && vehicle.serviceInterval) {
      const milesSinceOil = vehicle.currentMileage - vehicle.lastOilChange.mileage
      const milesUntilOil = vehicle.serviceInterval.oil - milesSinceOil
      
      if (milesUntilOil <= 0) {
        statuses.push({
          type: 'oil',
          status: 'overdue',
          description: `Oil change overdue by ${Math.abs(milesUntilOil)} miles`,
          dueIn: `${Math.abs(milesUntilOil)} miles overdue`,
          urgency: 90
        })
      } else if (milesUntilOil <= 500) {
        statuses.push({
          type: 'oil',
          status: 'due_soon',
          description: `Oil change due in ${milesUntilOil} miles`,
          dueIn: `${milesUntilOil} miles`,
          urgency: 70
        })
      } else {
        statuses.push({
          type: 'oil',
          status: 'good',
          description: `Oil change not due for ${milesUntilOil} miles`,
          dueIn: `${milesUntilOil} miles`,
          urgency: 10
        })
      }
    }

    if (vehicle.lastInspection) {
      const expiresDate = new Date(vehicle.lastInspection.expiresDate)
      const today = new Date()
      const daysUntilExpires = Math.ceil((expiresDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExpires <= 0) {
        statuses.push({
          type: 'inspection',
          status: 'overdue',
          description: `Inspection expired ${Math.abs(daysUntilExpires)} days ago`,
          dueIn: `${Math.abs(daysUntilExpires)} days overdue`,
          urgency: 95
        })
      } else if (daysUntilExpires <= 30) {
        statuses.push({
          type: 'inspection',
          status: 'due_soon',
          description: `Inspection expires in ${daysUntilExpires} days`,
          dueIn: `${daysUntilExpires} days`,
          urgency: 80
        })
      }
    }

    return statuses.sort((a, b) => b.urgency - a.urgency)
  }

  // Get vehicles with their service statuses
  const vehiclesWithStatus = vehicles.map(vehicle => ({
    vehicle,
    serviceStatuses: calculateServiceStatus(vehicle),
    mostUrgent: calculateServiceStatus(vehicle)[0]
  }))

  // Filter by urgency
  const urgentVehicles = vehiclesWithStatus.filter(v => v.mostUrgent?.status === 'overdue')
  const attentionVehicles = vehiclesWithStatus.filter(v => v.mostUrgent?.status === 'due_soon')
  const goodVehicles = vehiclesWithStatus.filter(v => !v.mostUrgent || v.mostUrgent.status === 'good')

  // Photo capture handlers
  const handlePhotoCapture = async (file: File, type: 'receipt' | 'odometer' | 'general') => {
    console.log('Photo captured:', { file: file.name, type, size: file.size })
    
    // Create FormData for API call
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', type)
    
    try {
      // Show processing state
      setProcessingPhoto(true)
      
      // Test upload first
      console.log('🧪 Testing upload with test endpoint...')
      const testResponse = await fetch('/api/test-upload', {
        method: 'POST',
        body: formData
      })
      
      if (testResponse.ok) {
        const testResult = await testResponse.json()
        console.log('✅ Test upload successful:', testResult)
      } else {
        console.error('❌ Test upload failed:', testResponse.status)
      }
      
      // Send to OpenAI Vision API
      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Show confirmation modal instead of console logging
        setDocumentData(result.data)
        setShowDocumentConfirmation(true)
        setShowPhotoCapture(false)
      } else {
        throw new Error(result.error || 'Processing failed')
      }
      
    } catch (error) {
      console.error('Error processing photo:', error)
      alert('Error processing photo. Please try again.')
    } finally {
      setProcessingPhoto(false)
    }
  }

  // Handle the parsed data from OpenAI Vision
  const handleParsedData = async (data: any, type: string) => {
    console.log('Parsed data:', data)
    
    switch (data.type) {
      case 'fuel':
        // Create fuel log entry
        console.log('Creating fuel log:', {
          station: data.station_name,
          amount: data.total_amount,
          gallons: data.gallons,
          date: data.date
        })
        // TODO: Save to database
        alert(`Fuel receipt processed!\nStation: ${data.station_name}\nAmount: $${data.total_amount}\nGallons: ${data.gallons || 'N/A'}`)
        break
        
      case 'odometer':
        if (data.confidence > 70) {
          console.log('Updating mileage:', data.current_mileage)
          // TODO: Update vehicle mileage
          alert(`Odometer reading: ${data.current_mileage.toLocaleString()} miles\nConfidence: ${data.confidence}%`)
        } else {
          alert(`Could not read odometer clearly (${data.confidence}% confidence). Please try again.`)
        }
        break
        
      case 'service':
        console.log('Creating service record:', {
          type: data.service_type,
          cost: data.cost,
          shop: data.shop_name,
          date: data.date
        })
        // TODO: Save service record
        alert(`Service record processed!\nType: ${data.service_type}\nCost: $${data.cost}\nShop: ${data.shop_name}`)
        break
    }
  }

  const openPhotoCapture = (type: 'receipt' | 'odometer' | 'general' | 'auto') => {
    setCaptureType(type as 'receipt' | 'odometer' | 'general')
    setShowPhotoCapture(true)
  }

  // SIMPLIFIED: Event handler for minimal events
  const handleEventSave = async (event: any) => {
    console.log('💾 SAVING MINIMAL EVENT TO TIMELINE:', event)
    
    // For now, just log the event - later we'll save to timeline
    // This is the "Capture → Log → Done" principle in action
    
    setShowDocumentConfirmation(false)
    
    // Show success feedback
    console.log(`✅ ${event.type.toUpperCase()} EVENT SAVED:`, {
      type: event.type,
      captured_at: event.captured_at,
      data: event
    })
  }

  const handleDocumentRetry = () => {
    setShowDocumentConfirmation(false)
    setDocumentData(null)
    setShowPhotoCapture(true)
  }

  return (
    <>
      <Head>
        <title>MotoMind</title>
        <meta name="description" content="Vehicle management dashboard" />
      </Head>

      <Navigation />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Ro-style Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Hi, Joseph
            </h1>
            <p className="text-gray-600 mb-6">
              Welcome back
            </p>

            {/* REAL status updates - what users want to see */}
            <div className="space-y-3">
              {/* Urgent - Service Overdue */}
              {urgentVehicles.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <h3 className="font-medium text-gray-900">Service overdue</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    <strong>{urgentVehicles[0].vehicle.display_name}:</strong> {urgentVehicles[0].mostUrgent?.description}
                  </p>
                  <div className="flex gap-3">
                    <Button size="sm">Schedule service</Button>
                    <Link href={`/vehicles/${urgentVehicles[0].vehicle.id}`}>
                      <Button size="sm" variant="outline">View details</Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Attention - Service Due Soon */}
              {attentionVehicles.length > 0 && urgentVehicles.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <h3 className="font-medium text-gray-900">Service due soon</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    <strong>{attentionVehicles[0].vehicle.display_name}:</strong> {attentionVehicles[0].mostUrgent?.description}
                  </p>
                  <div className="flex gap-3">
                    <Button size="sm">Schedule service</Button>
                    <Link href={`/vehicles/${attentionVehicles[0].vehicle.id}`}>
                      <Button size="sm" variant="outline">View details</Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* All Good */}
              {urgentVehicles.length === 0 && attentionVehicles.length === 0 && vehicles.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h3 className="font-medium text-gray-900">All vehicles up to date</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    All {vehicles.length} vehicle{vehicles.length !== 1 ? 's are' : ' is'} current on maintenance. 
                    Last updated today at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.
                  </p>
                  <div className="flex gap-3">
                    <Link href="/vehicles">
                      <Button size="sm" variant="outline">View vehicles</Button>
                    </Link>
                    <Button size="sm" variant="outline">Add vehicle</Button>
                  </div>
                </div>
              )}

              {/* No Vehicles */}
              {vehicles.length === 0 && !loading && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h3 className="font-medium text-gray-900">Ready to get started</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Add your first vehicle to start tracking maintenance, service history, and get reminders.
                  </p>
                  <Link href="/vehicles/onboard">
                    <Button size="sm">Add your first vehicle</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Smart Document Capture - AI-powered classification */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Smart document capture</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Smart Photo - Auto-classifies document type */}
              <button 
                className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                onClick={() => setShowDocumentConfirmation(true)}
              >
                <Camera className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Photo</span>
                <span className="text-xs text-gray-600 text-center">Auto-detects document type</span>
              </button>
              
              {/* Voice Note */}
              <button 
                className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                onClick={() => {/* TODO: Start voice recording */}}
              >
                <Mic className="w-8 h-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Voice</span>
                <span className="text-xs text-gray-600 text-center">Quick note</span>
              </button>
              
              {/* Quick Issue */}
              <button 
                className="flex flex-col items-center p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                onClick={() => {/* TODO: Quick issue logging */}}
              >
                <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Issue</span>
                <span className="text-xs text-gray-600 text-center">Problem now</span>
              </button>
            </div>
            
            {/* Processing indicator */}
            {processingPhoto && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="flex-1">
                  <p className="text-sm text-yellow-900">Processing image with AI...</p>
                </div>
              </div>
            )}
            
            {/* Recent result */}
            {lastProcessedResult && !processingPhoto && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm text-green-900">
                    Last processed: {lastProcessedResult.type === 'fuel' ? `$${lastProcessedResult.total_amount} fuel` : 
                                   lastProcessedResult.type === 'odometer' ? `${lastProcessedResult.current_mileage?.toLocaleString()} miles` :
                                   lastProcessedResult.service_type}
                  </p>
                </div>
              </div>
            )}
            
            {/* Context-aware prompt */}
            {!processingPhoto && !lastProcessedResult && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900">Snap any vehicle document - AI will automatically detect and extract data</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions - What users do most */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/vehicles" className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Vehicles</h3>
                  <p className="text-sm text-gray-600">View and manage your fleet</p>
                </div>
              </div>
            </Link>

            <Link href="/maintenance" className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Maintenance</h3>
                  <p className="text-sm text-gray-600">Schedule and track service</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Simple Photo Modal - RADICAL SIMPLIFICATION */}
      <SimplePhotoModal
        isOpen={showDocumentConfirmation}
        onClose={() => setShowDocumentConfirmation(false)}
        onComplete={handleEventSave}
      />
    </>
  )
}
