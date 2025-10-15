/**
 * AIProposalReview v2
 * Refactored to use unified DataSection component
 * This provides a consistent UX between capture and view flows
 */

'use client'

import { useState } from 'react'
import { Loader2, Camera } from 'lucide-react'
import { Container, Section, Stack } from '@/components/design-system'
import { DataSection } from '@/components/events/DataSection'
import { ReceiptImageViewer } from '@/components/events/ReceiptImageViewer'
import { EventMapView } from '@/components/events/EventMapView'
import { WeatherDisplay } from '@/components/events/WeatherDisplay'
import { ConflictSection } from './ConflictWarning'
import type { DataConflict } from '@/lib/data-conflict-detection'
import { groupFuelFields } from '@/lib/field-grouping'
import type { ExtractedField } from './AIProposalReview'

interface AIProposalReviewV2Props {
  // Core extracted data
  fields: ExtractedField[]
  
  // Image source
  imageUrl?: string
  
  // Location data for map
  location?: {
    lat: number
    lng: number
    address?: string
    stationName?: string
  }
  
  // Weather data
  weather?: {
    temperature_f: number
    condition: 'clear' | 'rain' | 'snow' | 'cloudy' | 'extreme'
    precipitation_mm?: number
    windspeed_mph?: number
    humidity_percent?: number
    pressure_inhg?: number
  }
  
  // Data conflicts that need user decision
  conflicts?: DataConflict[]
  
  // Event type (for future multi-event support)
  eventType: string
  
  // Loading state
  isSaving?: boolean
  
  // Callbacks
  onAccept: (data: Record<string, any>) => void
  onRetake: () => void
  onCancel: () => void
}

export function AIProposalReviewV2({
  fields: initialFields,
  imageUrl,
  location,
  weather,
  conflicts = [],
  eventType,
  isSaving = false,
  onAccept,
  onRetake,
  onCancel,
}: AIProposalReviewV2Props) {
  // Track edited field values
  const [fields, setFields] = useState(initialFields)
  
  // Track resolved conflicts
  const [resolvedConflicts, setResolvedConflicts] = useState<Set<string>>(new Set())
  
  // Group fields into logical sections
  const sections = groupFuelFields(fields)
  
  // Calculate completion score
  const calculateCompletion = () => {
    const totalFields = fields.length
    const filledFields = fields.filter(f => f.value !== null && f.value !== undefined && f.value !== '').length
    const requiredFilled = fields.filter(f => f.required).every(f => f.value !== null && f.value !== undefined && f.value !== '')
    
    // Important optional fields
    const hasOdometer = fields.find(f => f.name === 'odometer')?.value
    const hasNotes = fields.find(f => f.name === 'notes')?.value
    
    // Base score from filled fields
    let score = Math.round((filledFields / totalFields) * 100)
    
    // Bonus for important optionals
    if (hasOdometer) score = Math.min(100, score + 10)
    if (hasNotes) score = Math.min(100, score + 5)
    
    return {
      score,
      requiredFilled,
      hasOdometer: !!hasOdometer,
      hasNotes: !!hasNotes,
      filledFields,
      totalFields
    }
  }
  
  const completion = calculateCompletion()
  
  // Debug weather prop
  console.log('🌤️ AIProposalReviewV2 received weather prop:', weather)
  
  // Handle section-level save
  const handleSectionSave = (sectionTitle: string, updates: Record<string, any>) => {
    setFields((prev) =>
      prev.map((field) =>
        updates.hasOwnProperty(field.name)
          ? { ...field, value: updates[field.name] }
          : field
      )
    )
  }
  
  // Handle conflict resolution
  const handleConflictResolve = (conflict: DataConflict, resolution: 'accept' | 'edit' | 'dismiss') => {
    if (resolution === 'accept') {
      setResolvedConflicts(prev => new Set(prev).add(conflict.type))
    }
  }
  
  // Filter out resolved conflicts
  const activeConflicts = conflicts.filter(c => !resolvedConflicts.has(c.type))
  
  // Check if all required fields are filled and high-severity conflicts resolved
  const isValid = () => {
    const requiredFields = fields.filter((f) => f.required)
    const fieldsValid = requiredFields.every((f) => f.value)
    
    const hasUnresolvedHighConflicts = activeConflicts.some(c => c.severity === 'high')
    
    return fieldsValid && !hasUnresolvedHighConflicts
  }
  
  // Build final data object
  const buildFinalData = (): Record<string, any> => {
    const data: Record<string, any> = {}
    fields.forEach((field) => {
      if (field.value !== null && field.value !== undefined && field.value !== '') {
        data[field.name] = field.value
      }
    })
    return data
  }
  
  return (
    <Container size="md" useCase="articles">
      <Section spacing="lg">
        <Stack spacing="xl">
          
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Review & Confirm</h2>
            <p className="text-gray-600 mt-1">
              Does everything look right?
            </p>
          </div>
          
          {/* Completion Score */}
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            completion.score >= 90 ? 'bg-green-50 border-2 border-green-200' : 'bg-blue-50 border-2 border-blue-200'
          }`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-lg font-bold text-gray-900">
                  {completion.score}% Complete
                </div>
                {completion.score >= 90 && (
                  <span className="text-green-600">✓</span>
                )}
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    completion.score >= 90 ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${completion.score}%` }}
                />
              </div>
              
              {/* Missing fields hint */}
              {completion.score < 100 && (
                <div className="text-xs text-gray-600">
                  {!completion.hasOdometer && !completion.hasNotes && (
                    <>Add odometer & notes for 100% 🎯</>
                  )}
                  {!completion.hasOdometer && completion.hasNotes && (
                    <>Add odometer reading for 100% 🎯</>
                  )}
                  {completion.hasOdometer && !completion.hasNotes && (
                    <>Add notes for 100% 🎯</>
                  )}
                </div>
              )}
              {completion.score >= 100 && (
                <div className="text-xs text-green-700 font-medium">
                  All key details captured! 🎉
                </div>
              )}
            </div>
            
            <div className="text-4xl ml-4">
              {completion.score >= 100 ? '🎉' : completion.score >= 90 ? '⭐' : '📊'}
            </div>
          </div>
          
          {/* Receipt Image */}
          {imageUrl && (
            <ReceiptImageViewer imageUrl={imageUrl} />
          )}
          
          {/* High-severity conflicts that need user decision */}
          {activeConflicts.filter(c => c.severity === 'high').length > 0 && (
            <ConflictSection
              conflicts={activeConflicts.filter(c => c.severity === 'high')}
              onResolve={handleConflictResolve}
            />
          )}
          
          {/* Sections using unified DataSection component */}
          <Stack spacing="md">
            {sections.map((section) => {
              // Special handling for location section with map
              const isLocationSection = section.title.includes('Location & Time')
              const isVehicleSection = section.title.includes('Vehicle & Notes')
              
              // Calculate section completion
              const sectionFilled = section.fields.filter(f => f.value !== null && f.value !== undefined && f.value !== '').length
              const sectionTotal = section.fields.length
              const isComplete = sectionFilled === sectionTotal
              const isPartial = sectionFilled > 0 && sectionFilled < sectionTotal
              
              return (
                <div key={section.title}>
                  <DataSection
                    title={section.title}
                    fields={section.fields}
                    mode="review"  // ← Always expanded, non-collapsible
                    isEditable={section.fields.some(f => f.editable)}
                    onSave={(updates) => handleSectionSave(section.title, updates)}
                    badge={
                      isComplete ? (
                        <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                          ✓ Complete
                        </span>
                      ) : isPartial ? (
                        <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                          ⚡ {sectionFilled}/{sectionTotal}
                        </span>
                      ) : null
                    }
                    map={isLocationSection && location ? (
                      <EventMapView
                        lat={location.lat}
                        lng={location.lng}
                        address={location.address || ''}
                        stationName={location.stationName || ''}
                      />
                    ) : undefined}
                    weather={isLocationSection && weather ? (
                      <WeatherDisplay
                        temperature_f={weather.temperature_f}
                        condition={weather.condition}
                        precipitation_mm={weather.precipitation_mm}
                        windspeed_mph={weather.windspeed_mph}
                        humidity_percent={weather.humidity_percent}
                        pressure_inhg={weather.pressure_inhg}
                      />
                    ) : undefined}
                  />
                  
                  {/* Inline prompts for Vehicle section */}
                  {isVehicleSection && !completion.hasOdometer && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">💡</div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-amber-900 mb-1">
                            Track your fuel efficiency
                          </div>
                          <div className="text-xs text-amber-700 mb-3">
                            Adding your odometer enables MPG tracking, maintenance reminders, and fuel cost insights over time.
                          </div>
                          <button
                            onClick={() => {
                              // Scroll to odometer field and focus
                              const odometerField = document.getElementById('field-odometer')
                              odometerField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            Add Odometer Reading
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isVehicleSection && completion.hasOdometer && !completion.hasNotes && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="text-lg">📝</div>
                        <div className="flex-1">
                          <div className="text-xs text-blue-700">
                            <strong>Bonus tip:</strong> Add notes to remember special circumstances (bad weather, highway vs city, etc.)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </Stack>
          
          {/* Quality Stars (if high quality) */}
          {fields.filter(f => f.confidence === 'high').length >= fields.length * 0.8 && (
            <div className="text-center py-3">
              <div className="text-yellow-500 text-2xl mb-1">⭐⭐⭐⭐⭐</div>
              <div className="text-sm text-gray-600">Excellent · All details captured</div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4">
            <Stack spacing="sm">
              <button
                onClick={() => onAccept(buildFinalData())}
                disabled={!isValid() || isSaving}
                className={`
                  w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors text-lg flex items-center justify-center gap-2
                  ${
                    isValid() && !isSaving
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-300 cursor-not-allowed'
                  }
                `}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  '✓ Save Fill-Up'
                )}
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={onRetake}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Retake
                </button>
                
                <button
                  onClick={onCancel}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </Stack>
          </div>
          
        </Stack>
      </Section>
    </Container>
  )
}
