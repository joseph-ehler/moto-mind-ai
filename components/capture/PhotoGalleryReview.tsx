/**
 * Photo Gallery Review Component
 * 
 * Review all captured photos before saving
 * - Grid layout of all photos
 * - Quality score badges
 * - Retake/delete buttons
 * - Batch save
 */

'use client'

import React, { useState } from 'react'
import { Flex, Stack, Heading, Text, Button } from '@/components/design-system'
import { RotateCcw, Trash2, Check, ArrowLeft, Camera, Edit } from 'lucide-react'
import { PhotoEditor } from './PhotoEditor'

interface CapturedPhoto {
  stepId: string
  file: File
  preview: string
  extractedData?: any
  qualityScore?: number
  qualityIssues?: Array<{
    type: string
    severity: string
    message: string
    icon: string
  }>
}

interface PhotoGalleryReviewProps {
  photos: CapturedPhoto[]
  flowSteps: Array<{ id: string; label: string; required?: boolean }>
  onRetake: (stepId: string) => void
  onDelete: (stepId: string) => void
  onEdit: (stepId: string, editedBlob: Blob, editedUrl: string) => void
  onSave: () => void
  onBack: () => void
  isSaving: boolean
}

export function PhotoGalleryReview({
  photos,
  flowSteps,
  onRetake,
  onDelete,
  onEdit,
  onSave,
  onBack,
  isSaving
}: PhotoGalleryReviewProps) {
  const [editingPhoto, setEditingPhoto] = useState<CapturedPhoto | null>(null)
  
  const hasRequiredPhotos = flowSteps
    .filter(s => s.required)
    .every(s => photos.some(p => p.stepId === s.id))

  const getStepLabel = (stepId: string) => {
    return flowSteps.find(s => s.id === stepId)?.label || stepId
  }

  const getQualityColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-600'
    if (score >= 80) return 'bg-green-100 text-green-700'
    if (score >= 50) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Flex align="center" justify="between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Capture
            </button>
            
            <Button
              onClick={onSave}
              disabled={!hasRequiredPhotos || isSaving}
              className="min-w-[120px]"
            >
              {isSaving ? 'Saving...' : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save All ({photos.length})
                </>
              )}
            </Button>
          </Flex>
        </div>
      </div>

      {/* Gallery */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Stack spacing="lg">
          {/* Title */}
          <div>
            <Heading level="title" className="mb-2">
              Review Your Photos
            </Heading>
            <Text className="text-gray-600">
              {hasRequiredPhotos 
                ? `${photos.length} photo${photos.length !== 1 ? 's' : ''} captured. Review and save when ready.`
                : 'Please capture all required photos before saving.'}
            </Text>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.stepId}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Photo */}
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={photo.preview}
                    alt={getStepLabel(photo.stepId)}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Quality Badge */}
                  {photo.qualityScore !== undefined && (
                    <div className="absolute top-2 right-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getQualityColor(photo.qualityScore)}`}>
                        {photo.qualityScore}/100
                      </div>
                    </div>
                  )}
                </div>

                {/* Info & Actions */}
                <div className="p-4">
                  <Stack spacing="sm">
                    {/* Step Label */}
                    <Text className="font-semibold text-gray-900">
                      {getStepLabel(photo.stepId)}
                    </Text>

                    {/* Quality Issues */}
                    {photo.qualityIssues && photo.qualityIssues.length > 0 && (
                      <div className="space-y-1">
                        {photo.qualityIssues.slice(0, 2).map((issue, index) => (
                          <div
                            key={index}
                            className={`text-xs px-2 py-1 rounded ${
                              issue.severity === 'error'
                                ? 'bg-red-50 text-red-700'
                                : issue.severity === 'warning'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {issue.icon} {issue.message}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-2 space-y-2">
                      <Flex gap="sm">
                        <button
                          onClick={() => setEditingPhoto(photo)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => onRetake(photo.stepId)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Retake
                        </button>
                      </Flex>
                      <button
                        onClick={() => onDelete(photo.stepId)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </Stack>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {photos.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <Heading level="subtitle" className="mb-2">
                No Photos Yet
              </Heading>
              <Text className="text-gray-600 mb-4">
                Capture photos using the steps above
              </Text>
              <Button onClick={onBack}>
                Start Capturing
              </Button>
            </div>
          )}

          {/* Missing Required Photos Warning */}
          {!hasRequiredPhotos && photos.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Flex align="start" gap="sm">
                <div className="text-yellow-600 mt-0.5">⚠️</div>
                <div>
                  <Text className="text-sm font-medium text-yellow-900 mb-1">
                    Missing Required Photos
                  </Text>
                  <Text className="text-xs text-yellow-700">
                    Please capture all required photos before saving. Look for steps marked as "Required".
                  </Text>
                </div>
              </Flex>
            </div>
          )}

          {/* Help Text */}
          <div className="text-center">
            <Text className="text-sm text-gray-500">
              💡 Tip: Review each photo's quality score. Edit, retake, or delete any photos before saving.
            </Text>
          </div>
        </Stack>
      </div>

      {/* Photo Editor Modal */}
      {editingPhoto && (
        <PhotoEditor
          imageUrl={editingPhoto.preview}
          onSave={(editedBlob, editedUrl) => {
            onEdit(editingPhoto.stepId, editedBlob, editedUrl)
            setEditingPhoto(null)
          }}
          onCancel={() => setEditingPhoto(null)}
        />
      )}
    </div>
  )
}
