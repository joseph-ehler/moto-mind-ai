'use client'

import React, { useState } from 'react'
import { Camera, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UnifiedCameraCapture, CaptureResult } from './UnifiedCameraCapture'

interface RoutineDashboardCaptureProps {
  onCapture: (result: any) => void
  onCancel: () => void
  vehicleName?: string
}

type FlowStep = 'instructions' | 'camera' | 'processing' | 'success'

export function RoutineDashboardCapture({
  onCapture,
  onCancel,
  vehicleName = 'your vehicle'
}: RoutineDashboardCaptureProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('instructions')
  const [capturedData, setCapturedData] = useState<any>(null)

  const handleStartCapture = () => {
    setCurrentStep('camera')
  }

  const handleCameraCapture = (result: CaptureResult) => {
    if (result.success && result.data) {
      setCapturedData(result.data)
      setCurrentStep('success')
      // Auto-save after 2 seconds or user can save immediately
      setTimeout(() => {
        onCapture(result)
      }, 2000)
    } else {
      // Handle capture failure - go back to camera
      console.error('Dashboard capture failed:', result.error)
      // Stay on camera step for retry
    }
  }

  const handleSaveNow = () => {
    if (capturedData) {
      onCapture({ success: true, data: capturedData })
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Step 1: Simple Instructions */}
      {currentStep === 'instructions' && (
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Dashboard Reading
            </h3>
            <p className="text-sm text-gray-600">
              Quick snapshot of {vehicleName}
            </p>
          </div>

          {/* Ultra-Simple Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <span>Put car in Park</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <span>Start engine, wait 30 seconds</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <span>Take photo of dashboard</span>
            </div>
          </div>

          {/* Safety Reminder - Minimal */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <span>⚠️</span>
              <span>Vehicle must be parked and stationary</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleStartCapture}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              Start
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Camera Interface */}
      {currentStep === 'camera' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Capture Dashboard
            </h3>
            <p className="text-sm text-gray-600">
              Include all gauges and displays
            </p>
          </div>

          {/* Real Camera Component */}
          <UnifiedCameraCapture
            captureType="dashboard_snapshot"
            frameGuide="dashboard-cluster"
            instructions="Include all gauges and displays in frame"
            onCapture={handleCameraCapture}
            onCancel={() => setCurrentStep('instructions')}
            processingAPI="/api/vision/process"
            title="Dashboard Reading"
            allowFileUpload={true}
            maxRetries={2}
          />
        </div>
      )}

      {/* Step 3: Processing */}
      {currentStep === 'processing' && (
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Processing...</h3>
            <p className="text-sm text-gray-600">Reading your dashboard</p>
          </div>
        </div>
      )}

      {/* Step 4: Success & Auto-Save */}
      {currentStep === 'success' && capturedData && (
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">
              Dashboard Captured!
            </h3>
          </div>

          {/* Show Extracted Data */}
          <div className="bg-green-50 rounded-lg p-4 text-left space-y-2">
            <div className="text-sm font-medium text-green-900">
              {capturedData.summary}
            </div>
            <div className="text-xs text-green-700 space-y-1">
              {capturedData.odometer_miles && (
                <div>• Odometer: {capturedData.odometer_miles.toLocaleString()} miles</div>
              )}
              {capturedData.fuel_level_eighths && (
                <div>• Fuel: {Math.round(capturedData.fuel_level_eighths / 8 * 100)}%</div>
              )}
              {capturedData.warning_lights?.length > 0 && (
                <div>• Warning lights detected</div>
              )}
            </div>
          </div>

          {/* Auto-save countdown */}
          <div className="text-sm text-gray-600">
            Saving automatically in 2 seconds...
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('camera')}
              className="flex-1"
            >
              Retake
            </Button>
            <Button
              onClick={handleSaveNow}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Save Now
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
