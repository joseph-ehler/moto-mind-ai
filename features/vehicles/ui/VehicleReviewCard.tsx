import React, { useState } from 'react'
import { Car, AlertTriangle, CheckCircle, Edit3, MapPin, Fuel, Wrench, Shield } from 'lucide-react'

interface VehicleSpecs {
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  body_class: string
  engine: {
    model?: string
    cylinders?: number
    horsepower?: number
    fuel_type: string
  }
  drivetrain: string
  transmission: string
  manufactured: {
    country: string
    state?: string
  }
  recalls: any[]
  epa_mpg?: {
    city?: number
    highway?: number
    combined?: number
  }
  decoded_at: string
  source: 'nhtsa'
}

interface SmartDefaults {
  service_intervals: {
    oil_change_miles: number
    tire_rotation_miles: number
    brake_inspection_miles: number
  }
  baseline_mpg: number | null
  maintenance_schedule: Array<{
    type: string
    due_miles: number
    priority: 'high' | 'medium' | 'low'
  }>
}

interface Garage {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  timezone: string
}

interface VehicleReviewCardProps {
  specs: VehicleSpecs
  smartDefaults: SmartDefaults
  selectedGarage: Garage | null
  onSave: (vehicleData: {
    vin: string
    nickname: string
    garage_id: string | null
    baseline_mpg: number | null
    service_intervals: any
    specs: VehicleSpecs
    smart_defaults: SmartDefaults
  }) => void
  onEdit: () => void
  isLoading?: boolean
}

export function VehicleReviewCard({ 
  specs, 
  smartDefaults, 
  selectedGarage, 
  onSave, 
  onEdit,
  isLoading = false 
}: VehicleReviewCardProps) {
  const [nickname, setNickname] = useState(
    `${specs.year} ${specs.make} ${specs.model}${specs.trim ? ` ${specs.trim}` : ''}`
  )
  const [baselineMPG, setBaselineMPG] = useState<number | null>(smartDefaults.baseline_mpg)
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [isEditingMPG, setIsEditingMPG] = useState(false)

  const handleSave = () => {
    onSave({
      vin: specs.vin,
      nickname,
      garage_id: selectedGarage?.id || null,
      baseline_mpg: baselineMPG,
      service_intervals: smartDefaults.service_intervals,
      specs,
      smart_defaults: smartDefaults
    })
  }

  const getDataCompletenessScore = () => {
    let score = 0
    const checks = [
      specs.make !== 'Unknown',
      specs.model !== 'Unknown',
      specs.year > 0,
      specs.engine.fuel_type !== 'Unknown',
      specs.drivetrain !== 'Unknown',
      !!specs.engine.cylinders,
      !!specs.epa_mpg,
      specs.recalls.length >= 0, // Always true, but shows we checked
      !!selectedGarage,
      !!baselineMPG
    ]
    
    score = (checks.filter(Boolean).length / checks.length) * 100
    return Math.round(score)
  }

  const completenessScore = getDataCompletenessScore()
  const completenessColor = completenessScore >= 80 ? 'green' : completenessScore >= 60 ? 'yellow' : 'red'

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Car size={32} className="text-blue-100 mt-1" />
            <div>
              {isEditingNickname ? (
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onBlur={() => setIsEditingNickname(false)}
                  onKeyPress={(e) => e.key === 'Enter' && setIsEditingNickname(false)}
                  className="bg-blue-500 text-white placeholder-blue-200 border-blue-400 rounded px-2 py-1 text-xl font-bold"
                  autoFocus
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold">{nickname}</h2>
                  <button
                    onClick={() => setIsEditingNickname(true)}
                    className="text-blue-200 hover:text-white"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              )}
              <p className="text-blue-100 text-sm">VIN: {specs.vin}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              completenessColor === 'green' ? 'bg-green-500 text-white' :
              completenessColor === 'yellow' ? 'bg-yellow-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {completenessScore}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="p-6 space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Year • Make • Model</h3>
              <p className="text-lg font-semibold text-gray-900">
                {specs.year} {specs.make} {specs.model}
              </p>
              {specs.trim && (
                <p className="text-sm text-gray-600">{specs.trim}</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Body Type</h3>
              <p className="text-gray-900">{specs.body_class || 'Unknown'}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Engine</h3>
              <p className="text-gray-900">
                {specs.engine.cylinders ? `${specs.engine.cylinders}-cyl` : ''} {specs.engine.fuel_type}
                {specs.engine.horsepower ? ` • ${specs.engine.horsepower}hp` : ''}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Drivetrain</h3>
              <p className="text-gray-900">{specs.drivetrain} • {specs.transmission}</p>
            </div>
          </div>
        </div>

        {/* Performance & Efficiency */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Fuel size={20} className="text-blue-600" />
            <h3 className="font-medium text-gray-900">Fuel Efficiency</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              {specs.epa_mpg ? (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">EPA Rating</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {specs.epa_mpg.combined || 'N/A'} MPG combined
                  </p>
                  {specs.epa_mpg.city && specs.epa_mpg.highway && (
                    <p className="text-xs text-gray-500">
                      {specs.epa_mpg.city} city • {specs.epa_mpg.highway} highway
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">EPA Rating</p>
                  <p className="text-gray-500">Not available</p>
                </div>
              )}
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Baseline Target</p>
              {isEditingMPG ? (
                <input
                  type="number"
                  value={baselineMPG || ''}
                  onChange={(e) => setBaselineMPG(e.target.value ? parseFloat(e.target.value) : null)}
                  onBlur={() => setIsEditingMPG(false)}
                  onKeyPress={(e) => e.key === 'Enter' && setIsEditingMPG(false)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-lg font-semibold"
                  placeholder="25"
                  autoFocus
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <p className="text-lg font-semibold text-gray-900">
                    {baselineMPG || 'Not set'} {baselineMPG ? 'MPG' : ''}
                  </p>
                  <button
                    onClick={() => setIsEditingMPG(true)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Garage Location */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin size={20} className="text-blue-600" />
              <h3 className="font-medium text-gray-900">Garage Location</h3>
            </div>
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Change
            </button>
          </div>
          
          {selectedGarage ? (
            <div className="mt-2">
              <p className="font-medium text-gray-900">{selectedGarage.name}</p>
              <p className="text-sm text-gray-600">{selectedGarage.address}</p>
            </div>
          ) : (
            <p className="text-gray-500 mt-2">No garage selected</p>
          )}
        </div>

        {/* Maintenance Schedule */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Wrench size={20} className="text-blue-600" />
            <h3 className="font-medium text-gray-900">Service Intervals</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Oil Change</p>
              <p className="font-medium">{smartDefaults.service_intervals.oil_change_miles.toLocaleString()} mi</p>
            </div>
            <div>
              <p className="text-gray-600">Tire Rotation</p>
              <p className="font-medium">{smartDefaults.service_intervals.tire_rotation_miles.toLocaleString()} mi</p>
            </div>
            <div>
              <p className="text-gray-600">Brake Check</p>
              <p className="font-medium">{smartDefaults.service_intervals.brake_inspection_miles.toLocaleString()} mi</p>
            </div>
          </div>
        </div>

        {/* Recalls */}
        {specs.recalls.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Shield size={20} className="text-red-600" />
              <h3 className="font-medium text-red-900">Active Recalls</h3>
            </div>
            
            <div className="space-y-2">
              {specs.recalls.slice(0, 3).map((recall, index) => (
                <div key={index} className="text-sm">
                  <p className="font-medium text-red-900">{recall.Component}</p>
                  <p className="text-red-700">{recall.Summary}</p>
                </div>
              ))}
              {specs.recalls.length > 3 && (
                <p className="text-xs text-red-600">
                  +{specs.recalls.length - 3} more recalls
                </p>
              )}
            </div>
          </div>
        )}

        {/* Data Quality Indicators */}
        {completenessScore < 80 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle size={20} className="text-yellow-600" />
              <h3 className="font-medium text-yellow-900">Missing Information</h3>
            </div>
            
            <div className="space-y-1 text-sm">
              {!selectedGarage && (
                <p className="text-yellow-800">• Select a garage location</p>
              )}
              {!baselineMPG && (
                <p className="text-yellow-800">• Set baseline MPG target</p>
              )}
              {!specs.epa_mpg && (
                <p className="text-yellow-800">• EPA fuel economy data unavailable</p>
              )}
              {!specs.engine.cylinders && (
                <p className="text-yellow-800">• Engine specifications incomplete</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="flex items-center justify-between">
          <button
            onClick={onEdit}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Edit Details
          </button>
          
          <button
            onClick={handleSave}
            disabled={isLoading || !selectedGarage}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>Add Vehicle</span>
              </>
            )}
          </button>
        </div>
        
        {!selectedGarage && (
          <p className="text-xs text-red-600 mt-2 text-right">
            Please select a garage location to continue
          </p>
        )}
      </div>
    </div>
  )
}
