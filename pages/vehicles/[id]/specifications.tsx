import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { ArrowLeft, Car, ChevronDown, ChevronUp, ExternalLink, Zap, Star, AlertTriangle, CheckCircle, Clock, User, Calendar, Wrench, Fuel, Gauge, Shield, Settings, Info, HelpCircle, Edit } from 'lucide-react'
import Link from 'next/link'
import { StandardCard, StandardCardHeader, StandardCardContent } from '@/components/ui/StandardCard'
import { SpecsQualityBanner } from '@/components/vehicle/SpecsQualityBanner'
import { SourceBadge, SourceLegend } from '@/components/vehicle/SourceBadge'
import { calculateSpecsQuality } from '@/lib/utils/spec-quality'
import { EditSpecCategoryModal } from '@/components/vehicle/EditSpecCategoryModal'
import SetMaintenanceIntervalModal from '@/components/SetMaintenanceIntervalModal'
import { sortSpecCategories, getCategoryFields, getCategoryLabel } from '@/lib/utils/spec-ordering'
const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  trim?: string
  color?: string
  vin?: string
  license_plate?: string
  engine?: string
  transmission?: string
  drivetrain?: string
}

export default function VehicleSpecifications() {
  const router = useRouter()
  const { id } = router.query

  const { data: vehicleData, error } = useSWR(
    id ? `/api/vehicles/${id}` : null,
    fetcher
  )

  const { data: specsData } = useSWR(
    id ? `/api/vehicles/${id}/specs` : null,
    fetcher
  )

  const { data: prefsData, mutate: mutatePrefs } = useSWR(
    id ? `/api/vehicles/${id}/maintenance-preferences` : null,
    fetcher
  )

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    intervalType: string
    intervalLabel: string
    currentValue?: number
  }>({
    isOpen: false,
    intervalType: '',
    intervalLabel: ''
  })

  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    category: string
    categoryLabel: string
    currentData: Record<string, any>
  }>({
    isOpen: false,
    category: '',
    categoryLabel: '',
    currentData: {}
  })

  const vehicle: Vehicle | null = vehicleData?.vehicle || null
  const nhtsaSpecs = specsData?.categories || []
  const userPreferences = prefsData?.preferences || []

  // Helper to get user's custom interval
  const getUserInterval = (intervalType: string) => {
    return userPreferences.find((p: any) => p.interval_type === intervalType)
  }

  // Handler to open modal
  const handleSetCustom = (intervalType: string, intervalLabel: string) => {
    const current = getUserInterval(intervalType)
    setModalState({
      isOpen: true,
      intervalType,
      intervalLabel,
      currentValue: current?.interval_value
    })
  }

  // Handler to save custom interval
  const handleSaveInterval = async (value: number, unit: string, source?: string) => {
    try {
      // TODO: Get actual user_id from auth system
      const userId = '550e8400-e29b-41d4-a716-446655440000' // Temporary hardcoded user ID
      
      const response = await fetch(`/api/vehicles/${id}/maintenance-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          interval_type: modalState.intervalType,
          interval_value: value,
          interval_unit: unit,
          source
        })
      })

      if (!response.ok) throw new Error('Failed to save')

      // Refresh preferences
      await mutatePrefs()
    } catch (error) {
      console.error('Error saving interval:', error)
      throw error
    }
  }

  // Handler to open edit category modal
  const handleEditCategory = (category: string) => {
    setEditModal({
      isOpen: true,
      category,
      categoryLabel: getCategoryLabel(category),
      currentData: getSpecData(category)
    })
  }

  // Handler to save category edits
  const handleSaveCategory = async (data: Record<string, any>) => {
    const response = await fetch(`/api/vehicles/${id}/specs/update-category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: editModal.category,
        data
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || 'Failed to save')
    }

    // Refresh specs data
    await fetch(`/api/vehicles/${id}/specs`).then(res => res.json())
    window.location.reload() // Simple refresh for now
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load vehicle</p>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="animate-pulse space-y-6 p-4">
          <div className="h-16 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Helper function to get spec data
  const getSpecData = (category: string) => {
    return nhtsaSpecs.find((s: any) => s.category === category)?.data || {}
  }

  const engineData = getSpecData('engine')
  const drivetrainData = getSpecData('drivetrain')
  const dimensionsData = getSpecData('dimensions')
  const safetyData = getSpecData('safety')
  const featuresData = getSpecData('features')
  const maintenanceData = getSpecData('maintenance_intervals')
  const fluidsData = getSpecData('fluids_capacities')
  const tiresData = getSpecData('tire_specifications')

  // Calculate specification quality
  const qualityAssessment = calculateSpecsQuality(nhtsaSpecs)

  // Sort categories: filled first, then by importance
  const sortedCategories = sortSpecCategories(nhtsaSpecs)

  // Component to render user's custom schedule
  const UserScheduleColumn = ({ intervalType, intervalLabel }: { intervalType: string, intervalLabel: string }) => {
    const userInterval = getUserInterval(intervalType)
    
    return (
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
        <div className="text-xs font-semibold text-gray-600 mb-1">YOUR SCHEDULE</div>
        {userInterval ? (
          <>
            <div className="text-xl font-bold text-black">{userInterval.interval_value.toLocaleString()}</div>
            <div className="text-xs text-gray-600/70">{userInterval.interval_unit}</div>
            {userInterval.source && (
              <div className="text-xs text-gray-600/70 mt-1 italic">{userInterval.source}</div>
            )}
            <button 
              onClick={() => handleSetCustom(intervalType, intervalLabel)}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              Edit
            </button>
          </>
        ) : (
          <>
            <div className="text-xl font-bold text-gray-400">—</div>
            <div className="text-xs text-gray-600/70">Not set</div>
            <button 
              onClick={() => handleSetCustom(intervalType, intervalLabel)}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              Set custom
            </button>
          </>
        )}
      </div>
    )
  }

  // Format engine string
  const formatEngine = () => {
    const parts = []
    if (engineData.displacement) parts.push(`${engineData.displacement}L`)
    if (engineData.cylinders) parts.push(`${engineData.cylinders}-cylinder`)
    if (engineData.fuel_type) parts.push(engineData.fuel_type)
    return parts.length > 0 ? parts.join(' ') : 'Not specified'
  }

  const basicSpecs = [
    { label: 'Year', value: vehicle.year },
    { label: 'Make', value: vehicle.make },
    { label: 'Model', value: vehicle.model },
    { label: 'Trim', value: vehicle.trim || 'Not specified' },
    { label: 'Color', value: vehicle.color || 'Not specified' },
    { label: 'VIN', value: vehicle.vin || 'Not specified' },
    { label: 'License Plate', value: vehicle.license_plate || 'Not specified' },
    { label: 'Engine', value: formatEngine() },
    { label: 'Transmission', value: drivetrainData.transmission_type || vehicle.transmission || 'Not specified' },
    { label: 'Drivetrain', value: drivetrainData.drive_type || vehicle.drivetrain || 'Not specified' },
  ]

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
            <h1 className="text-xl font-semibold text-slate-900">Specifications</h1>
            <p className="text-sm text-slate-600">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Data Quality Banner */}
        <SpecsQualityBanner
          quality={qualityAssessment.overall}
          completeness={qualityAssessment.completeness}
          year={vehicle.year}
          make={vehicle.make}
          model={vehicle.model}
          foundFields={qualityAssessment.foundFields}
          totalFields={qualityAssessment.totalFields}
        />

        <StandardCard variant="premium">
          {basicSpecs.map((spec: any, index: number) => (
            <div
              key={spec.label}
              className={`
                flex items-center justify-between px-8 py-5
                ${index !== basicSpecs.length - 1 ? 'border-b border-black/5' : ''}
              `}
            >
              <span className="text-sm font-medium text-black/60">{spec.label}</span>
              <span className="text-base font-semibold text-black">{spec.value}</span>
            </div>
          ))}
        </StandardCard>

        {/* Enhanced Specifications */}
        {nhtsaSpecs.length > 0 && (
          <>
            {/* Engine Performance */}
            <StandardCard variant="premium" className="mt-6">
              <div className="px-8 py-4 border-b border-black/5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Engine Performance</h3>
                <button
                  onClick={() => handleEditCategory('engine')}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
              {engineData.horsepower && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Horsepower</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-black">{engineData.horsepower} HP</span>
                    {getSpecData('engine').sources?.includes('openai_web_search') && (
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">AI Enhanced</span>
                    )}
                  </div>
                </div>
              )}
              {engineData.torque && (
                <div className="flex items-center justify-between px-8 py-5">
                  <span className="text-sm font-medium text-black/60">Torque</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-black">{engineData.torque} lb-ft</span>
                    {getSpecData('engine').sources?.includes('openai_web_search') && (
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">AI Enhanced</span>
                    )}
                  </div>
                </div>
              )}
              {!engineData.horsepower && !engineData.torque && (
                <div className="px-8 py-6 text-center">
                  <p className="text-sm text-gray-600">
                    Engine performance data not available for this vehicle.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Consult your owner's manual or manufacturer website for horsepower and torque specs.
                  </p>
                </div>
              )}
            </StandardCard>

            {/* Fuel Economy */}
            <StandardCard variant="premium" className="mt-6">
              <div className="px-8 py-4 border-b border-black/5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Fuel Economy</h3>
                <button
                  onClick={() => handleEditCategory('fuel_economy')}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
              {getSpecData('fuel_economy').data?.city_mpg && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">City</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-black">{getSpecData('fuel_economy').data.city_mpg} MPG</span>
                    {getSpecData('fuel_economy').sources?.includes('openai_web_search') && (
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">AI Enhanced</span>
                    )}
                  </div>
                </div>
              )}
              {getSpecData('fuel_economy').data?.highway_mpg && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Highway</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-black">{getSpecData('fuel_economy').data.highway_mpg} MPG</span>
                    {getSpecData('fuel_economy').sources?.includes('openai_web_search') && (
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">AI Enhanced</span>
                    )}
                  </div>
                </div>
              )}
              {getSpecData('fuel_economy').data?.combined_mpg && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Combined</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-black">{getSpecData('fuel_economy').data.combined_mpg} MPG</span>
                    {getSpecData('fuel_economy').sources?.includes('openai_web_search') && (
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">AI Enhanced</span>
                    )}
                  </div>
                </div>
              )}
              {!getSpecData('fuel_economy').data?.city_mpg && !getSpecData('fuel_economy').data?.highway_mpg && (
                <div className="px-8 py-6 text-center">
                  <p className="text-sm text-gray-600">
                    Fuel economy data not available for this vehicle.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Check the EPA fuel economy sticker on the vehicle or visit fueleconomy.gov.
                  </p>
                </div>
              )}
            </StandardCard>

            {/* Dimensions */}
            <StandardCard variant="premium" className="mt-6">
              <div className="px-8 py-4 border-b border-black/5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Dimensions</h3>
                <button
                  onClick={() => handleEditCategory('dimensions')}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
              {dimensionsData.length && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Length</span>
                  <span className="text-base font-semibold text-black">{dimensionsData.length}"</span>
                </div>
              )}
              {dimensionsData.width && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Width</span>
                  <span className="text-base font-semibold text-black">{dimensionsData.width}"</span>
                </div>
              )}
              {dimensionsData.height && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Height</span>
                  <span className="text-base font-semibold text-black">{dimensionsData.height}"</span>
                </div>
              )}
              {dimensionsData.wheelbase && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Wheelbase</span>
                  <span className="text-base font-semibold text-black">{dimensionsData.wheelbase}"</span>
                </div>
              )}
              {dimensionsData.curb_weight && (
                <div className="flex items-center justify-between px-8 py-5">
                  <span className="text-sm font-medium text-black/60">Curb Weight</span>
                  <span className="text-base font-semibold text-black">{dimensionsData.curb_weight.toLocaleString()} lbs</span>
                </div>
              )}
              {!dimensionsData.length && !dimensionsData.width && !dimensionsData.wheelbase && !dimensionsData.curb_weight && (
                <div className="px-8 py-6 text-center">
                  <p className="text-sm text-gray-600">
                    Dimension data not available for this vehicle.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Consult your owner's manual for exact measurements.
                  </p>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="mt-6 bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <div className="px-8 py-4 border-b border-black/5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Features</h3>
                <button
                  onClick={() => handleEditCategory('features')}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
              {featuresData.seats && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Seating</span>
                  <span className="text-base font-semibold text-black">{featuresData.seats} passengers</span>
                </div>
              )}
              {featuresData.doors && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Doors</span>
                  <span className="text-base font-semibold text-black">{featuresData.doors}</span>
                </div>
              )}
              {featuresData.cargo_volume && (
                <div className="flex items-center justify-between px-8 py-5">
                  <span className="text-sm font-medium text-black/60">Cargo Volume</span>
                  <span className="text-base font-semibold text-black">{featuresData.cargo_volume} cu.ft.</span>
                </div>
              )}
              {!featuresData.seats && !featuresData.doors && !featuresData.cargo_volume && (
                <div className="px-8 py-6 text-center">
                  <p className="text-sm text-gray-600">
                    Feature data not available for this vehicle.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Consult your owner's manual for seating, doors, and cargo capacity.
                  </p>
                </div>
              )}
            </div>

            {/* Safety */}
            <div className="mt-6 bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <div className="px-8 py-4 border-b border-black/5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Safety</h3>
                <button
                  onClick={() => handleEditCategory('safety')}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
              {safetyData.abs && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">ABS Brakes</span>
                  <span className="text-base font-semibold text-black">{safetyData.abs}</span>
                </div>
              )}
              {safetyData.electronic_stability_control && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Electronic Stability Control</span>
                  <span className="text-base font-semibold text-black">{safetyData.electronic_stability_control}</span>
                </div>
              )}
              {safetyData.traction_control && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Traction Control</span>
                  <span className="text-base font-semibold text-black">{safetyData.traction_control}</span>
                </div>
              )}
              {safetyData.airbag_locations && (
                <div className="flex items-center justify-between px-8 py-5">
                  <span className="text-sm font-medium text-black/60">Airbags</span>
                  <span className="text-base font-semibold text-black">{safetyData.airbag_locations}</span>
                </div>
              )}
              {!safetyData.abs && !safetyData.electronic_stability_control && !safetyData.traction_control && !safetyData.airbag_locations && (
                <div className="px-8 py-6 text-center">
                  <p className="text-sm text-gray-600">
                    Safety feature data not available for this vehicle.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Consult your owner's manual for safety system information.
                  </p>
                </div>
              )}
            </div>

            {/* Maintenance Intervals */}
            {Object.keys(maintenanceData).length > 0 && (
              <div className="mt-6 bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                <div className="px-8 py-4 border-b border-black/5">
                  <h3 className="text-lg font-semibold text-black">Maintenance Intervals</h3>
                  <p className="text-xs text-black/50 mt-1">Multiple perspectives on service intervals</p>
                </div>
                
                {/* Educational Header */}
                <div className="px-8 py-4 bg-blue-50/30 border-b border-black/5">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">💡</span>
                    <div className="flex-1">
                      <p className="text-sm text-black/70"><strong>Understanding Service Intervals:</strong> Manufacturers design schedules for warranty compliance. Many mechanics recommend more frequent service for vehicle longevity. We show you both perspectives.</p>
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-xs text-black/70"><strong>⚠️ Disclaimer:</strong> Always consult a qualified mechanic for your specific vehicle and driving conditions. These are general guidelines, not prescriptions.</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* === THREE-TIER COMPARISONS (Alphabetical) === */}
                
                {/* 1. Brake Fluid Flush - SAFETY CRITICAL */}
                <div className="px-8 py-5 border-b border-black/5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm font-semibold text-black">Brake Fluid Flush</span>
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-semibold">SAFETY</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Manufacturer */}
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <div className="text-xs font-semibold text-blue-600 mb-1">MANUFACTURER</div>
                      {maintenanceData.brake_fluid_flush ? (
                        <>
                          <div className="text-xl font-bold text-black">{maintenanceData.brake_fluid_flush.toLocaleString()}</div>
                          <div className="text-xs text-blue-600/70">miles</div>
                        </>
                      ) : (
                        <>
                          <div className="text-xl font-bold text-black">As needed</div>
                          <div className="text-xs text-blue-600/70">Not specified</div>
                        </>
                      )}
                    </div>
                    
                    {/* Conservative */}
                    <div className="bg-green-50 rounded-xl p-3 border-2 border-green-200">
                      <div className="text-xs font-semibold text-green-600 mb-1">CONSERVATIVE</div>
                      <div className="text-xl font-bold text-black">3 years</div>
                      <div className="text-xs text-green-600/70">or 36k miles</div>
                      <a href="https://www.misco.com/when-to-change-your-brake-fluid/" target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline mt-1 block">Source: MISCO ↗</a>
                    </div>
                    
                    {/* Your Schedule */}
                    <UserScheduleColumn intervalType="brake_fluid_flush" intervalLabel="Brake Fluid Flush" />
                  </div>
                  {!maintenanceData.brake_fluid_flush && (
                    <div className="mt-2 p-3 bg-red-50 rounded-lg text-xs text-black/70">
                      <strong>🚨 Safety Critical:</strong> Brake fluid absorbs moisture over time, causing corrosion in brake lines and reduced braking performance. Most mechanics recommend flushing every 3 years regardless of mileage.
                    </div>
                  )}
                </div>

                {/* Coolant Flush */}
                <div className="px-8 py-5 border-b border-black/5">
                  <div className="mb-3">
                    <span className="text-sm font-semibold text-black">Coolant Flush</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Manufacturer */}
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <div className="text-xs font-semibold text-blue-600 mb-1">MANUFACTURER</div>
                      {maintenanceData.coolant_flush ? (
                        <>
                          <div className="text-xl font-bold text-black">{maintenanceData.coolant_flush.toLocaleString()}</div>
                          <div className="text-xs text-blue-600/70">miles</div>
                        </>
                      ) : (
                        <>
                          <div className="text-xl font-bold text-black">Lifetime</div>
                          <div className="text-xs text-blue-600/70">Or 100k+ mi</div>
                        </>
                      )}
                    </div>
                    
                    {/* Conservative */}
                    <div className="bg-green-50 rounded-xl p-3 border-2 border-green-200">
                      <div className="text-xs font-semibold text-green-600 mb-1">CONSERVATIVE</div>
                      <div className="text-xl font-bold text-black">50,000</div>
                      <div className="text-xs text-green-600/70">miles or 5 years</div>
                      <a href="https://www.carparts.com/blog/how-often-to-flush-coolant-and-other-faqs/" target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline mt-1 block">Source: CarParts.com ↗</a>
                    </div>
                    
                    {/* Your Schedule */}
                    <UserScheduleColumn intervalType="coolant_flush" intervalLabel="Coolant Flush" />
                  </div>
                  {!maintenanceData.coolant_flush && (
                    <div className="mt-2 p-3 bg-orange-50 rounded-lg text-xs text-black/70">
                      <strong>⚠️ Expensive Failure:</strong> Old coolant loses protective properties, leading to radiator, water pump, and heater core failures. Prevention ($150) beats replacement ($500-2,000).
                    </div>
                  )}
                </div>

                {/* 3. Differential Service - RWD Specific */}
                {drivetrainData.drive_type?.includes('RWD') && (
                  <div className="px-8 py-5 border-b border-black/5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-sm font-semibold text-black">Differential Service</span>
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full font-semibold">RWD</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Manufacturer */}
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <div className="text-xs font-semibold text-blue-600 mb-1">MANUFACTURER</div>
                        {maintenanceData.differential_service ? (
                          <>
                            <div className="text-xl font-bold text-black">{maintenanceData.differential_service.toLocaleString()}</div>
                            <div className="text-xs text-blue-600/70">miles</div>
                          </>
                        ) : (
                          <>
                            <div className="text-xl font-bold text-black">Not specified</div>
                            <div className="text-xs text-blue-600/70">Lifetime</div>
                          </>
                        )}
                      </div>
                      
                      {/* Conservative */}
                      <div className="bg-green-50 rounded-xl p-3 border-2 border-green-200">
                        <div className="text-xs font-semibold text-green-600 mb-1">CONSERVATIVE</div>
                        <div className="text-xl font-bold text-black">40,000</div>
                        <div className="text-xs text-green-600/70">miles</div>
                        <div className="text-xs text-green-600/70 mt-1">30k if towing</div>
                        <a href="https://www.aa1car.com/library/differential_service.htm" target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline mt-1 block">Source: AA1Car ↗</a>
                      </div>
                      
                      {/* Your Schedule */}
                      <UserScheduleColumn intervalType="differential_service" intervalLabel="Differential Service" />
                    </div>
                    {!maintenanceData.differential_service && (
                      <div className="mt-2 p-3 bg-orange-50 rounded-lg text-xs text-black/70">
                        <strong>⚠️ RWD-Specific:</strong> Your rear-wheel drive vehicle has a differential that requires regular fluid changes. Neglecting this service can lead to expensive differential failure ($1,500-3,000).
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Oil Change */}
                {maintenanceData.oil_change_normal && (
                  <div className="px-8 py-5 border-b border-black/5">
                    <div className="mb-3">
                      <span className="text-sm font-semibold text-black">Oil Change</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Manufacturer */}
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <div className="text-xs font-semibold text-blue-600 mb-1">MANUFACTURER</div>
                        <div className="text-xl font-bold text-black">{maintenanceData.oil_change_normal.toLocaleString()}</div>
                        <div className="text-xs text-blue-600/70">miles (normal)</div>
                        {maintenanceData.oil_change_severe && (
                          <div className="text-xs text-blue-600/70 mt-1">{maintenanceData.oil_change_severe.toLocaleString()} mi (severe)</div>
                        )}
                      </div>
                      
                      {/* Conservative */}
                      <div className="bg-green-50 rounded-xl p-3 border-2 border-green-200">
                        <div className="text-xs font-semibold text-green-600 mb-1">CONSERVATIVE</div>
                        <div className="text-xl font-bold text-black">5,000</div>
                        <div className="text-xs text-green-600/70">miles</div>
                        <div className="text-xs text-green-600/70 mt-1">For longevity</div>
                        <a href="https://armorlubricants.com/blog/oil-change-interval-scam/" target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline mt-1 block">Source: Armor Lubricants ↗</a>
                      </div>
                      
                      {/* Your Schedule */}
                      <UserScheduleColumn intervalType="oil_change" intervalLabel="Oil Change" />
                    </div>
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs text-black/70">
                      <strong>💡 What is "severe" driving?</strong> Most driving is actually severe: short trips under 5 miles, stop-and-go traffic, extreme temperatures, dusty conditions, or towing. If this describes your driving, follow the severe interval.
                    </div>
                  </div>
                )}

                {/* 5. Transmission Service */}
                <div className="px-8 py-5 border-b border-black/5">
                  <div className="mb-3">
                    <span className="text-sm font-semibold text-black">Transmission Service</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Manufacturer */}
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <div className="text-xs font-semibold text-blue-600 mb-1">MANUFACTURER</div>
                      {maintenanceData.transmission_service ? (
                        <>
                          <div className="text-xl font-bold text-black">{maintenanceData.transmission_service.toLocaleString()}</div>
                          <div className="text-xs text-blue-600/70">miles</div>
                        </>
                      ) : (
                        <>
                          <div className="text-xl font-bold text-black">Lifetime</div>
                          <div className="text-xs text-blue-600/70">No service</div>
                        </>
                      )}
                    </div>
                    
                    {/* Conservative */}
                    <div className="bg-green-50 rounded-xl p-3 border-2 border-green-200">
                      <div className="text-xs font-semibold text-green-600 mb-1">CONSERVATIVE</div>
                      <div className="text-xl font-bold text-black">60,000</div>
                      <div className="text-xs text-green-600/70">miles</div>
                      <div className="text-xs text-green-600/70 mt-1">30k if towing</div>
                      <a href="https://www.consumerreports.org/cro/magazine/2012/05/what-that-service-light-means/index.htm" target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline mt-1 block">Source: Consumer Reports ↗</a>
                    </div>
                    
                    {/* Your Schedule */}
                    <UserScheduleColumn intervalType="transmission_service" intervalLabel="Transmission Service" />
                  </div>
                  {!maintenanceData.transmission_service && (
                    <div className="mt-2 p-3 bg-orange-50 rounded-lg text-xs text-black/70">
                      <strong>⚠️ "Lifetime" fluid:</strong> Many manufacturers claim transmission fluid is "lifetime" to reduce perceived ownership costs. Most mechanics recommend service every 60k miles to prevent costly failures.
                    </div>
                  )}
                </div>

                {/* === SINGLE-COLUMN ITEMS (Alphabetical) === */}

                {maintenanceData.air_filter && (
                  <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                    <span className="text-sm font-medium text-black/60">Air Filter</span>
                    <span className="text-base font-semibold text-black">{maintenanceData.air_filter.toLocaleString()} miles</span>
                  </div>
                )}
                {maintenanceData.brake_inspection && (
                  <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                    <span className="text-sm font-medium text-black/60">Brake Inspection</span>
                    <span className="text-base font-semibold text-black">{maintenanceData.brake_inspection.toLocaleString()} miles</span>
                  </div>
                )}
                {maintenanceData.cabin_filter && (
                  <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                    <span className="text-sm font-medium text-black/60">Cabin Filter</span>
                    <span className="text-base font-semibold text-black">{maintenanceData.cabin_filter.toLocaleString()} miles</span>
                  </div>
                )}
                {maintenanceData.serpentine_belt && (
                  <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                    <span className="text-sm font-medium text-black/60">Serpentine Belt</span>
                    <span className="text-base font-semibold text-black">{maintenanceData.serpentine_belt.toLocaleString()} miles</span>
                  </div>
                )}
                {maintenanceData.spark_plugs && (
                  <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                    <span className="text-sm font-medium text-black/60">Spark Plugs</span>
                    <span className="text-base font-semibold text-black">{maintenanceData.spark_plugs.toLocaleString()} miles</span>
                  </div>
                )}
                {maintenanceData.timing_belt && (
                  <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                    <span className="text-sm font-medium text-black/60">Timing Belt</span>
                    <span className="text-base font-semibold text-black">{maintenanceData.timing_belt.toLocaleString()} miles</span>
                  </div>
                )}
                {maintenanceData.tire_rotation && (
                  <div className="flex items-center justify-between px-8 py-5">
                    <span className="text-sm font-medium text-black/60">Tire Rotation</span>
                    <span className="text-base font-semibold text-black">{maintenanceData.tire_rotation.toLocaleString()} miles</span>
                  </div>
                )}
              </div>
            )}

            {/* Fluids & Capacities */}
            <div className="mt-6 bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <div className="px-8 py-4 border-b border-black/5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Fluids & Capacities</h3>
                <button
                  onClick={() => handleEditCategory('fluids_capacities')}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
              {fluidsData.engine_oil_capacity && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Engine Oil</span>
                  <span className="text-base font-semibold text-black">
                    {fluidsData.engine_oil_capacity} quarts {fluidsData.engine_oil_grade && `(${fluidsData.engine_oil_grade})`}
                  </span>
                </div>
              )}
              {fluidsData.coolant_capacity && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Coolant</span>
                  <span className="text-base font-semibold text-black">{fluidsData.coolant_capacity} quarts</span>
                </div>
              )}
              {fluidsData.fuel_tank_capacity && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Fuel Tank</span>
                  <span className="text-base font-semibold text-black">{fluidsData.fuel_tank_capacity} gallons</span>
                </div>
              )}
              {fluidsData.fuel_grade_required && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Fuel Grade</span>
                  <span className="text-base font-semibold text-black">{fluidsData.fuel_grade_required}</span>
                </div>
              )}
              {!fluidsData.engine_oil_capacity && !fluidsData.coolant_capacity && !fluidsData.fuel_tank_capacity && !fluidsData.fuel_grade_required && (
                <div className="px-8 py-6 text-center">
                  <p className="text-sm text-gray-600">
                    Fluid capacity data not available for this vehicle.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Consult your owner's manual or check the fluid reservoir caps for capacities.
                  </p>
                </div>
              )}
            </div>

            {/* Tire Specifications */}
            <div className="mt-6 bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <div className="px-8 py-4 border-b border-black/5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Tire Specifications</h3>
                <button
                  onClick={() => handleEditCategory('tire_specifications')}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
              {tiresData.tire_size_front && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Tire Size (Front)</span>
                  <span className="text-base font-semibold text-black">{tiresData.tire_size_front}</span>
                </div>
              )}
              {tiresData.tire_size_rear && tiresData.tire_size_rear !== tiresData.tire_size_front && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Tire Size (Rear)</span>
                  <span className="text-base font-semibold text-black">{tiresData.tire_size_rear}</span>
                </div>
              )}
              {tiresData.tire_pressure_front && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Tire Pressure (Front)</span>
                  <span className="text-base font-semibold text-black">{tiresData.tire_pressure_front} PSI</span>
                </div>
              )}
              {tiresData.tire_pressure_rear && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Tire Pressure (Rear)</span>
                  <span className="text-base font-semibold text-black">{tiresData.tire_pressure_rear} PSI</span>
                </div>
              )}
              {tiresData.wheel_torque && (
                <div className="flex items-center justify-between px-8 py-5 border-b border-black/5">
                  <span className="text-sm font-medium text-black/60">Wheel Torque</span>
                  <span className="text-base font-semibold text-black">{tiresData.wheel_torque} lb-ft</span>
                </div>
              )}
              {!tiresData.tire_size_front && !tiresData.tire_pressure_front && !tiresData.wheel_torque && (
                <div className="px-8 py-6 text-center">
                  <p className="text-sm text-gray-600">
                    Tire specification data not available for this vehicle.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Check the driver's door jamb sticker or owner's manual for tire size and pressure.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Source Legend */}
        <div className="mt-6 bg-white rounded-xl border border-black/5 shadow-sm p-6">
          <SourceLegend />
        </div>
      </main>

      {/* Modal for setting custom intervals */}
      <SetMaintenanceIntervalModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        intervalType={modalState.intervalType}
        intervalLabel={modalState.intervalLabel}
        vehicleId={id as string}
        currentValue={modalState.currentValue}
        onSave={handleSaveInterval}
      />

      {/* Modal for editing spec categories */}
      <EditSpecCategoryModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ ...editModal, isOpen: false })}
        category={editModal.category}
        categoryLabel={editModal.categoryLabel}
        fields={getCategoryFields(editModal.category)}
        currentData={editModal.currentData}
        onSave={handleSaveCategory}
      />
    </div>
  )
}
