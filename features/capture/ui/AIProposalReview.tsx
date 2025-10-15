/**
 * AIProposalReview
 * Main component for reviewing and validating AI-extracted data
 * Follows "AI proposes, human disposes" pattern
 */

'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, Info, Camera, Loader2 } from 'lucide-react'
import { ProposalField, type ConfidenceLevel } from './ProposalField'
import { ConfidenceSection } from './ConfidenceSection'
import { QualityScoreCard } from './QualityScoreCard'
import { DataSourceBadge, type DataSource } from './DataSourceBadge'
import { ConflictSection } from './ConflictWarning'
import { LocationSection } from './LocationSection'
import type { QualityScoreResult } from '@/lib/quality-score'
import { calculateQualityScore } from '@/lib/quality-score'
import type { EventCardData } from '@/components/timeline/event-types/types'
import type { DataConflict } from '@/lib/data-conflict-detection'
import type { LocationResult } from '@/lib/location-intelligence'

export interface ExtractedField {
  name: string
  label: string
  value: string | number | null | undefined
  confidence: ConfidenceLevel
  source?: DataSource
  warning?: string
  prompt?: string
  inputType?: 'text' | 'number' | 'date'
  required?: boolean
}

export interface ProcessingMetadata {
  model_version?: string
  processing_ms?: number
  input_tokens?: number
  output_tokens?: number
}

export interface SupplementalData {
  exif?: {
    capture_date?: Date
    gps?: { latitude: number; longitude: number }
    device?: string
    resolution?: { width: number; height: number }
  }
  gps?: {
    latitude: number
    longitude: number
    accuracy: number
    address?: string
  }
  weather?: {
    temp_f?: number
    condition?: string
  }
}

interface AIProposalReviewProps {
  // Core extracted data
  fields: ExtractedField[]
  
  // Image source
  imageUrl?: string
  
  // Processing metadata
  processingMetadata?: any
  
  // Supplemental data (GPS, EXIF, etc.)
  supplementalData?: any
  
  // Location intelligence
  locationResult?: LocationResult
  
  conflicts?: DataConflict[]
  eventType: string
  isSaving?: boolean
  onAccept: (data: Record<string, any>) => void
  onRetake: () => void
  onCancel: () => void
}

export function AIProposalReview({
  fields: initialFields,
  imageUrl,
  processingMetadata,
  supplementalData,
  locationResult,
  conflicts = [],
  eventType,
  isSaving = false,
  onAccept,
  onRetake,
  onCancel,
}: AIProposalReviewProps) {
  // Track edited field values
  const [fields, setFields] = useState(initialFields)
  
  // Track resolved conflicts
  const [resolvedConflicts, setResolvedConflicts] = useState<Set<string>>(new Set())
  
  // Handle field editing
  const handleFieldEdit = (fieldName: string, newValue: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.name === fieldName ? { ...field, value: newValue } : field
      )
    )
  }
  
  // Calculate quality score from current field values
  const calculateCurrentQuality = (): QualityScoreResult => {
    // Build a mock TimelineItem and CardData for quality calculation
    const mockItem: any = {
      photo_url: imageUrl,
      mileage: fields.find(f => f.name === 'odometer')?.value || null,
      notes: fields.find(f => f.name === 'notes')?.value || null,
    }
    
    const mockCardData: EventCardData = {
      data: fields
        .filter(f => f.value)
        .map(f => ({ label: f.label, value: f.value! })),
      quality: {
        level: fields.some(f => f.confidence === 'high') ? 'high' : 'medium',
      },
    }
    
    return calculateQualityScore(mockItem, mockCardData)
  }
  
  const qualityResult = calculateCurrentQuality()
  
  // Group fields by confidence
  const highConfidenceFields = fields.filter((f) => f.confidence === 'high')
  const mediumConfidenceFields = fields.filter((f) => f.confidence === 'medium')
  const lowConfidenceFields = fields.filter((f) => f.confidence === 'low')
  const missingFields = fields.filter(
    (f) => f.confidence === 'none' || !f.value
  )
  
  // Handle conflict resolution
  const handleConflictResolve = (conflict: DataConflict, resolution: 'accept' | 'edit' | 'dismiss') => {
    if (resolution === 'accept') {
      // Mark conflict as resolved
      setResolvedConflicts(prev => new Set(prev).add(conflict.type))
    } else if (resolution === 'edit') {
      // Scroll to affected fields
      const firstAffectedField = conflict.affectedFields[0]
      if (firstAffectedField) {
        const element = document.getElementById(`field-${firstAffectedField}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }
  
  // Filter out resolved conflicts
  const activeConflicts = conflicts.filter(c => !resolvedConflicts.has(c.type))
  
  // Check if all required fields are filled and high-severity conflicts resolved
  const isValid = () => {
    const requiredFields = fields.filter((f) => f.required)
    const fieldsValid = requiredFields.every((f) => f.value)
    
    // Check if there are unresolved high-severity conflicts
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
    
    // Add supplemental data if available
    if (supplementalData) {
      data.supplemental_data = supplementalData
    }
    
    // Add quality score
    data.quality_score = qualityResult.score
    
    return data
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header - Simplified */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Review & Confirm</h2>
        <p className="text-gray-600 mt-1">
          Does everything look right?
        </p>
      </div>
      
      {/* Source image preview */}
      {imageUrl && (
        <div className="mb-6 rounded-lg overflow-hidden border border-gray-200">
          <img
            src={imageUrl}
            alt="Captured receipt"
            className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(imageUrl, '_blank')}
          />
          <div className="p-2 bg-gray-50 text-center">
            <button
              onClick={() => window.open(imageUrl, '_blank')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              👁️ View full size
            </button>
          </div>
        </div>
      )}
      
      {/* Only show high-severity conflicts that need user decision */}
      {activeConflicts.filter(c => c.severity === 'high').length > 0 && (
        <ConflictSection
          conflicts={activeConflicts.filter(c => c.severity === 'high')}
          onResolve={handleConflictResolve}
        />
      )}
      
      {/* What We Found - All filled fields together */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          💵 What We Found
        </h3>
        <div className="space-y-3">
          {[...highConfidenceFields, ...mediumConfidenceFields, ...lowConfidenceFields]
            .filter(f => f.value)
            .map((field) => {
              // Special handling for location/station fields with GPS data
              if ((field.name === 'station' || field.name === 'location') && (supplementalData?.gps || locationResult?.location)) {
                // Prioritize geocoded address coordinates over current GPS location
                const coords = supplementalData?.gps || locationResult?.location
                
                return (
                  <LocationSection
                    key={field.name}
                    location={{
                      name: String(field.value),
                      address: supplementalData.station_address || supplementalData.gps?.address || '',
                      lat: coords?.latitude || 0,
                      lng: coords?.longitude || 0,
                      source: field.source === 'exif' ? 'exif' : 'gps'
                    }}
                    confidence={locationResult?.confidence}
                    warning={locationResult?.warning}
                    locationSource={locationResult?.source}
                    stationName={supplementalData?.station_name}
                    addressSource={supplementalData?.address_source}
                    addressConfidence={
                      supplementalData?.address_source === 'vision_structured' ? 'high' :
                      supplementalData?.address_source === 'vision_ocr' ? 'medium' :
                      supplementalData?.address_source === 'geocoding' ? 'low' :
                      supplementalData?.address_source === 'manual' ? 'high' : 'none'
                    }
                    onEdit={() => {
                      // Scroll to field for editing
                      const element = document.getElementById(`field-${field.name}`)
                      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                  />
                )
              }
              
              // Regular field
              return (
                <ProposalField
                  key={field.name}
                  {...field}
                  fieldId={`field-${field.name}`}
                  onEdit={(newValue) => handleFieldEdit(field.name, newValue)}
                />
              )
            })}
        </div>
      </div>
      
      {/* Quick Questions - Missing/optional fields */}
      {missingFields.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ℹ️ A Couple Quick Questions
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            These details help us track your vehicle better
          </p>
          <div className="space-y-3">
            {missingFields.map((field) => (
              <ProposalField
                key={field.name}
                {...field}
                fieldId={`field-${field.name}`}
                onEdit={(newValue) => handleFieldEdit(field.name, newValue)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Quality indicator - Simplified to stars only */}
      {qualityResult.score >= 85 && (
        <div className="mb-6 text-center py-3">
          <div className="text-yellow-500 text-2xl mb-1">⭐⭐⭐⭐⭐</div>
          <div className="text-sm text-gray-600">{qualityResult.label} · All details captured</div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4">
        <div className="flex flex-col gap-3">
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
              Retake photo
            </button>
            
            <button
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
