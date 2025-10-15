import React from 'react'
import { TimelineEvent } from '../VehicleTimeline'

export function PhotoBlock({ event }: { event: TimelineEvent }) {
  if (!event.image) return null

  const { image, payload } = event
  
  // Extract all AI analysis data from the vehicle_images record
  const vehicleDetails = payload?.vehicle_details
  const detectedText = (image as any).detected_text || {}
  const partsVisible = (image as any).parts_visible || []
  const vehicleMatch = (image as any).vehicle_match
  const conditionData = (image as any).condition_data
  const maintenanceIndicators = (image as any).maintenance_indicators
  const suggestedActions = (image as any).suggested_actions || []

  return (
    <div className="space-y-4">
      {/* Large Photo Display */}
      <div className="relative rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
        <img
          src={image.public_url}
          alt={image.ai_description || 'Vehicle photo'}
          className="w-full h-auto max-h-[400px] object-contain cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => window.open(image.public_url, '_blank')}
        />
        <div className="absolute top-2 right-2">
          <button
            onClick={() => window.open(image.public_url, '_blank')}
            className="px-3 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white text-xs font-medium rounded-lg transition-all"
          >
            View Full Size
          </button>
        </div>
      </div>

      {/* AI Analysis */}
      {image.ai_description && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">AI Analysis</h4>
            <p className="text-sm text-blue-800 leading-relaxed">{image.ai_description}</p>
          </div>
        </div>
      )}

      {/* Vehicle Details Detected */}
      {vehicleDetails && Object.keys(vehicleDetails).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {vehicleDetails.make && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Make</div>
              <div className="text-sm font-medium text-slate-900">{vehicleDetails.make}</div>
            </div>
          )}
          {vehicleDetails.model && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Model</div>
              <div className="text-sm font-medium text-slate-900">{vehicleDetails.model}</div>
            </div>
          )}
          {vehicleDetails.color && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Color</div>
              <div className="text-sm font-medium text-slate-900 capitalize">{vehicleDetails.color}</div>
            </div>
          )}
          {vehicleDetails.year_range && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Year</div>
              <div className="text-sm font-medium text-slate-900">{vehicleDetails.year_range}</div>
            </div>
          )}
        </div>
      )}

      {/* Vehicle Mismatch Warning */}
      {vehicleMatch && vehicleMatch.matches_expected === false && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-orange-500 text-2xl">⚠️</span>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-orange-900 mb-1">Vehicle Mismatch Detected</h4>
              {vehicleMatch.notes && (
                <p className="text-sm text-orange-800 mb-2">{vehicleMatch.notes}</p>
              )}
              <p className="text-xs text-orange-700">
                Confidence: <span className="font-medium capitalize">{vehicleMatch.confidence || 'unknown'}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detected Text (VIN, Plate, Odometer) */}
      {Object.keys(detectedText).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">Detected Information</h4>
          <div className="space-y-2">
            {detectedText.vin && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-slate-600">VIN:</span>
                <span className="text-sm font-mono font-medium text-slate-900">{detectedText.vin}</span>
              </div>
            )}
            {detectedText.plate && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-600">License Plate:</span>
                <span className="text-sm font-mono font-medium text-slate-900">{detectedText.plate}</span>
              </div>
            )}
            {detectedText.odometer && (
              <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-xs text-slate-600">Odometer:</span>
                <span className="text-sm font-medium text-slate-900">{detectedText.odometer} miles</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Parts Visible */}
      {partsVisible.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">Parts Visible</h4>
          <div className="flex flex-wrap gap-2">
            {partsVisible.map((part: string, idx: number) => (
              <div key={idx} className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md">
                <span className="text-xs font-medium text-slate-700">{part}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Condition Assessment */}
      {conditionData && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">Condition</h4>
          {conditionData.damage_detected && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-red-900 mb-1">Damage Detected</h5>
                  {conditionData.damage_description && (
                    <p className="text-sm text-red-800">{conditionData.damage_description}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-xs text-slate-600">Wear Level:</span>
            <span className="text-sm font-medium text-slate-900 capitalize">{conditionData.wear_level || 'none'}</span>
          </div>
          {conditionData.notes && (
            <p className="text-sm text-slate-600 italic">{conditionData.notes}</p>
          )}
        </div>
      )}

      {/* Maintenance Indicators */}
      {maintenanceIndicators && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">Maintenance Status</h4>
          {maintenanceIndicators.warning_lights && maintenanceIndicators.warning_lights.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-semibold text-yellow-900 mb-2">Warning Lights:</p>
              <p className="text-sm text-yellow-800">{maintenanceIndicators.warning_lights.join(', ')}</p>
            </div>
          )}
          {maintenanceIndicators.fluid_levels && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-600">Fluid Levels:</span>
              <span className="text-sm text-slate-900">{maintenanceIndicators.fluid_levels}</span>
            </div>
          )}
          {maintenanceIndicators.tire_condition && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-600">Tire Condition:</span>
              <span className="text-sm text-slate-900">{maintenanceIndicators.tire_condition}</span>
            </div>
          )}
        </div>
      )}

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">Suggested Actions</h4>
          <ul className="space-y-2">
            {suggestedActions.map((action: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-blue-500 font-bold mt-0.5">→</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Photo Metadata */}
      <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200">
        <span>📁 {image.filename}</span>
        <span>•</span>
        <span>📷 {image.ai_category || 'general'}</span>
        {payload?.source === 'photo_ai' && (
          <>
            <span>•</span>
            <span>🤖 AI Processed</span>
          </>
        )}
      </div>
    </div>
  )
}
