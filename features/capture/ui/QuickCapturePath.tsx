/**
 * Quick Capture Path Component
 * 
 * Fast capture flow:
 * 1. Camera opens immediately
 * 2. Take photo
 * 3. AI detects event type
 * 4. Ask if user wants to add more photos
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Stack, Flex, Heading, Text, Button } from '@/components/design-system'
import { AppNavigation } from '@/components/app/AppNavigation'
import { CameraInterface } from './CameraInterface'
import { CaptureMetadata } from '@/lib/capture-metadata'
import { processImageFile } from '@/lib/heic-converter'
import { detectEventType, CAPTURE_FLOWS } from '@/features/capture/domain/flow-config'
import { Camera, ArrowLeft, Check, X, Sparkles } from 'lucide-react'
import { captureAnalytics } from '@/lib/analytics'

interface QuickCapturePathProps {
  vehicleId: string
}

export function QuickCapturePath({ vehicleId }: QuickCapturePathProps) {
  const router = useRouter()
  
  const [showCamera, setShowCamera] = useState(true) // Start with camera open
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoMetadata, setPhotoMetadata] = useState<CaptureMetadata | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [detectedType, setDetectedType] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number>(0)

  const handlePhotoCapture = async (file: File, preview: string, metadata: CaptureMetadata) => {
    setCapturedPhoto(file)
    setPhotoPreview(preview)
    setPhotoMetadata(metadata)
    setShowCamera(false)
    
    // Analyze photo to detect event type
    setIsAnalyzing(true)
    
    try {
      // TODO: Call actual AI vision API
      // For now, simulate detection
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simulate detection based on file name or random
      const mockDetection = {
        type: 'fuel',
        confidence: 0.85
      }
      
      setDetectedType(mockDetection.type)
      setConfidence(mockDetection.confidence)
    } catch (error) {
      console.error('Error detecting event type:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const openCamera = () => {
    setShowCamera(true)
  }

  const handleContinueToGuided = () => {
    if (!detectedType) return
    
    // Navigate to guided flow for this event type
    router.push(`/vehicles/${vehicleId}/capture/${detectedType}`)
  }

  const handleJustSave = async () => {
    if (!capturedPhoto || !detectedType) return
    
    try {
      // TODO: Save single photo event
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push(`/vehicles/${vehicleId}`)
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Failed to save. Please try again.')
    }
  }

  const handleChangeType = () => {
    // Go back to capture modal to choose different type
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavigation />
      
      <Container size="md" useCase="general_content">
        <div className="py-6">
          <Stack spacing="lg">
            {/* Header */}
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              
              <Heading level="title" className="mb-2">
                ⚡ Quick Capture
              </Heading>
              <Text className="text-gray-600">
                Snap a photo, and we'll figure out the rest
              </Text>
            </div>

            {/* Main Content */}
            {!capturedPhoto ? (
              /* Initial Camera Prompt */
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-12">
                  <Stack spacing="lg" className="items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <Camera className="w-12 h-12 text-blue-600" />
                    </div>
                    
                    <div>
                      <Heading level="subtitle" className="mb-2">
                        Ready to capture?
                      </Heading>
                      <Text className="text-gray-600">
                        Take a photo of your receipt, odometer, or any vehicle-related document
                      </Text>
                    </div>

                    <Button
                      onClick={openCamera}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Open Camera
                    </Button>

                    <Text className="text-xs text-gray-500">
                      💡 Our AI will automatically detect what you captured
                    </Text>
                  </Stack>
                </div>
              </div>
            ) : isAnalyzing ? (
              /* Analyzing State */
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-12">
                  <Stack spacing="lg" className="items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center animate-pulse">
                      <Sparkles className="w-12 h-12 text-purple-600" />
                    </div>
                    
                    <div>
                      <Heading level="subtitle" className="mb-2">
                        Analyzing photo...
                      </Heading>
                      <Text className="text-gray-600">
                        Our AI is detecting what you captured
                      </Text>
                    </div>

                    {photoPreview && (
                      <div className="w-full max-w-md aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={photoPreview}
                          alt="Captured photo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </Stack>
                </div>
              </div>
            ) : detectedType ? (
              /* Detection Result */
              <div className="space-y-4">
                {/* Photo Preview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="aspect-video bg-gray-100">
                    <img
                      src={photoPreview!}
                      alt="Captured photo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Detection Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
                  <Stack spacing="md">
                    <Flex align="center" gap="sm">
                      <Check className="w-5 h-5 text-green-600" />
                      <Heading level="subtitle" className="text-green-900">
                        Detected: {CAPTURE_FLOWS[detectedType]?.icon} {CAPTURE_FLOWS[detectedType]?.name}
                      </Heading>
                    </Flex>
                    
                    <Text className="text-green-800">
                      {confidence > 0.8 
                        ? "High confidence - looks good!"
                        : "Is this correct?"}
                    </Text>

                    <Flex gap="sm" className="pt-2">
                      <Button
                        onClick={handleContinueToGuided}
                        className="flex-1"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Add More Photos
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleJustSave}
                        className="flex-1"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Just Save This
                      </Button>
                    </Flex>

                    <button
                      onClick={handleChangeType}
                      className="text-sm text-green-700 hover:text-green-900 underline"
                    >
                      Wrong type? Choose manually
                    </button>
                  </Stack>
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <Flex align="start" gap="sm">
                    <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <Text className="text-sm font-medium text-blue-900 mb-1">
                        Want complete documentation?
                      </Text>
                      <Text className="text-xs text-blue-700">
                        Adding more photos (odometer, gauge, etc.) helps track your vehicle better
                        and gives you more insights over time.
                      </Text>
                    </div>
                  </Flex>
                </div>
              </div>
            ) : (
              /* Detection Failed */
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <Stack spacing="md" className="items-center text-center">
                  <X className="w-12 h-12 text-red-500" />
                  <div>
                    <Heading level="subtitle" className="mb-2">
                      Couldn't detect event type
                    </Heading>
                    <Text className="text-gray-600">
                      No worries! You can choose manually or retake the photo.
                    </Text>
                  </div>
                  <Flex gap="sm">
                    <Button variant="outline" onClick={openCamera}>
                      <Camera className="w-4 h-4 mr-2" />
                      Retake Photo
                    </Button>
                    <Button onClick={handleChangeType}>
                      Choose Type Manually
                    </Button>
                  </Flex>
                </Stack>
              </div>
            )}
          </Stack>
        </div>
      </Container>

      {/* Camera Interface */}
      <CameraInterface
        isOpen={showCamera}
        onClose={() => {
          setShowCamera(false)
          if (!capturedPhoto) {
            router.back()
          }
        }}
        onCapture={handlePhotoCapture}
        stepLabel="Quick Capture"
        stepHint="Take a photo of any vehicle-related document"
        vehicleId={vehicleId}
        eventType="quick"
        stepId="quick_capture"
      />
    </div>
  )
}
