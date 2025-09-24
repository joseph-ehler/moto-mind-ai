// MotoMindAI: Smartphone Capture Page
// Main interface for photo capture and data entry

import { useState } from 'react'
import Head from 'next/head'
import { CameraCapture } from '../components/capture/CameraCapture'
import { DataConfirmation } from '../components/capture/DataConfirmation'

type CaptureKind = 'odometer_photo' | 'fuel_receipt' | 'maintenance_doc' | 'issue_photo'
type EventKind = 'odometer_reading' | 'fuel_purchase' | 'maintenance' | 'issue_report'

interface CaptureStep {
  step: 'select' | 'capture' | 'confirm' | 'complete'
  kind?: CaptureKind
  eventKind?: EventKind
  file?: File
  extractedData?: any
  uploadId?: string
}

export default function CapturePage() {
  const [captureState, setCaptureState] = useState<CaptureStep>({ step: 'select' })
  const [selectedVehicle, setSelectedVehicle] = useState('truck-47') // Default for demo

  // Mock vehicles for demo
  const mockVehicles = [
    { id: 'truck-47', label: 'Truck 47' },
    { id: 'truck-23', label: 'Truck 23' },
    { id: 'van-12', label: 'Van 12' },
    { id: 'johns-truck', label: "John's Truck" }
  ]

  const captureOptions = [
    {
      kind: 'odometer_photo' as CaptureKind,
      eventKind: 'odometer_reading' as EventKind,
      title: 'Odometer Reading',
      description: 'Capture current mileage',
      icon: '🚗',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      kind: 'fuel_receipt' as CaptureKind,
      eventKind: 'fuel_purchase' as EventKind,
      title: 'Fuel Receipt',
      description: 'Track fuel purchases and efficiency',
      icon: '⛽',
      color: 'bg-green-100 text-green-800'
    },
    {
      kind: 'maintenance_doc' as CaptureKind,
      eventKind: 'maintenance' as EventKind,
      title: 'Maintenance Record',
      description: 'Log service and repairs',
      icon: '🔧',
      color: 'bg-orange-100 text-orange-800'
    },
    {
      kind: 'issue_photo' as CaptureKind,
      eventKind: 'issue_report' as EventKind,
      title: 'Issue Report',
      description: 'Document problems or concerns',
      icon: '⚠️',
      color: 'bg-red-100 text-red-800'
    }
  ]

  const handleCaptureSelect = (kind: CaptureKind, eventKind: EventKind) => {
    setCaptureState({ step: 'capture', kind, eventKind })
  }

  const handleCaptureComplete = async (file: File, extractedData: any) => {
    try {
      // Upload file first
      const formData = new FormData()
      formData.append('file', file)
      formData.append('kind', captureState.kind!)
      formData.append('vehicleId', selectedVehicle)

      const uploadResponse = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      const uploadResult = await uploadResponse.json()

      // Move to confirmation step
      setCaptureState({
        step: 'confirm',
        kind: captureState.kind,
        eventKind: captureState.eventKind,
        file,
        extractedData,
        uploadId: uploadResult.id
      })
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload file. Please try again.')
    }
  }

  const handleDataConfirm = (result: any) => {
    setCaptureState({ step: 'complete' })
    setTimeout(() => {
      setCaptureState({ step: 'select' })
    }, 2000)
  }

  const handleCancel = () => {
    setCaptureState({ step: 'select' })
  }

  return (
    <>
      <Head>
        <title>Capture Data - MotoMindAI</title>
        <meta name="description" content="Capture vehicle data with your smartphone" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Data Capture
                </h1>
              </div>
              <a
                href="/"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {captureState.step === 'select' && (
            <>
              {/* Vehicle Selection */}
              <div className="card p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Vehicle
                </h2>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="input w-full"
                >
                  {mockVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Capture Options */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  What would you like to capture?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {captureOptions.map((option) => (
                    <button
                      key={option.kind}
                      onClick={() => handleCaptureSelect(option.kind, option.eventKind)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all duration-200 text-left"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${option.color}`}>
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {option.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-medium text-blue-900">How it works</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Take a photo with your smartphone camera. Our OCR technology will automatically extract key data like odometer readings and fuel amounts. You can review and edit the data before saving.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {captureState.step === 'complete' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Data Saved Successfully!
              </h2>
              <p className="text-gray-600">
                Your vehicle data has been captured and processed.
              </p>
            </div>
          )}
        </main>

        {/* Camera Capture Modal */}
        {captureState.step === 'capture' && captureState.kind && (
          <CameraCapture
            kind={captureState.kind}
            vehicleId={selectedVehicle}
            onCapture={handleCaptureComplete}
            onCancel={handleCancel}
          />
        )}

        {/* Data Confirmation Modal */}
        {captureState.step === 'confirm' && captureState.eventKind && (
          <DataConfirmation
            kind={captureState.eventKind}
            extractedData={captureState.extractedData}
            vehicleId={selectedVehicle}
            uploadId={captureState.uploadId}
            onConfirm={handleDataConfirm}
            onCancel={handleCancel}
          />
        )}
      </div>
    </>
  )
}
