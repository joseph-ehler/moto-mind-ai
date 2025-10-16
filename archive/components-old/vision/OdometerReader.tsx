'use client'

import React from 'react'
import { UnifiedCameraCapture, CaptureResult } from './UnifiedCameraCapture'

export interface DashboardSnapshotData {
  type: 'dashboard_snapshot'
  summary: string
  key_facts: {
    odometer_miles: number | null
    fuel_level_eighths: number | null  // 0-8, null if unknown
    warning_lights: string[] | null    // canonical IDs: check_engine, oil_pressure, tpms, battery, abs, airbag, brake, coolant_temp
    oil_life_percent: number | null
    service_message: string | null
  }
  validation: {
    rollup: 'ok' | 'needs_review'
    odometer_conf: number
    fuel_conf: number
    lights_conf: number
  }
  confidence: number
  processing_metadata?: any
  raw_extraction?: any
}

// Legacy interface for backward compatibility
export interface OdometerData {
  type: 'odometer'
  current_mileage: number
  display_type?: string
  units?: string
  trip_meters?: {
    trip_a?: number
    trip_b?: number
  }
  fuel_gauge?: string
  warning_lights?: string[]
  confidence: number
  reading_quality?: string
}

export interface DashboardReaderProps {
  onDashboardRead: (dashboardData: DashboardSnapshotData) => void
  onCancel?: () => void
  title?: string
}

export interface OdometerReaderProps {
  onMileageRead: (odometerData: OdometerData) => void
  onCancel?: () => void
  title?: string
}

// Enhanced Dashboard Reader (MVP implementation)
export function DashboardReader({ 
  onDashboardRead, 
  onCancel, 
  title = "Dashboard Snapshot (Parked Only)" 
}: DashboardReaderProps) {
  const handleCapture = (result: CaptureResult<DashboardSnapshotData>) => {
    if (result.success && result.data) {
      onDashboardRead(result.data)
    } else {
      console.error('Dashboard reading failed:', result.error)
    }
  }

  return (
    <div>
      {/* Safety Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 relative z-60">
        <div className="flex items-start gap-2">
          <div className="text-amber-600 mt-0.5">⚠️</div>
          <div className="text-sm text-amber-800">
            <div className="font-medium mb-1">Safety Requirements:</div>
            <ul className="space-y-1 text-xs">
              <li>• Vehicle must be parked safely</li>
              <li>• Engine OFF, key in accessory mode</li>
              <li>• Never capture while driving</li>
            </ul>
          </div>
        </div>
      </div>

      <UnifiedCameraCapture
        captureType="dashboard_snapshot"
        frameGuide="dashboard-cluster"
        instructions="Include odometer, fuel gauge, and warning lights in frame"
        onCapture={handleCapture}
        onCancel={onCancel}
        processingAPI="/api/vision/process"
        title={title}
        allowFileUpload={true}
        cameraConstraints={{
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }}
        maxRetries={3}
      />
    </div>
  )
}

// Legacy Odometer Reader (backward compatibility)
export function OdometerReader({ 
  onMileageRead, 
  onCancel, 
  title = "Read Odometer" 
}: OdometerReaderProps) {
  const handleCapture = (result: CaptureResult<OdometerData>) => {
    if (result.success && result.data) {
      onMileageRead(result.data)
    } else {
      console.error('Odometer reading failed:', result.error)
    }
  }

  return (
    <UnifiedCameraCapture
      captureType="odometer"
      frameGuide="odometer-display"
      instructions="Focus on odometer display"
      onCapture={handleCapture}
      onCancel={onCancel}
      processingAPI="/api/vision/process"
      title={title}
      allowFileUpload={true}
      cameraConstraints={{
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }}
      maxRetries={3}
    />
  )
}
