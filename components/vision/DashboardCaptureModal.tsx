'use client'

import React, { useState } from 'react'
import { AlertTriangle, CheckCircle, Camera, Upload } from 'lucide-react'
import { StepperModal, Step } from '@/components/modals'
import { UnifiedCameraCapture, CaptureResult } from './UnifiedCameraCapture'

interface DashboardCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (result: CaptureResult) => void
  vehicleName?: string
  vehicleId?: string
  mode?: 'routine' | 'diagnostic'
}

type CaptureStep = 'instructions' | 'safety' | 'engine-state' | 'capture' | 'processing' | 'success'
type EngineState = 'running' | 'accessory' | null

export function DashboardCaptureModal({
  isOpen,
  onClose,
  onCapture,
  vehicleName = 'your vehicle',
  vehicleId,
  mode = 'routine'
}: DashboardCaptureModalProps) {
  const [currentStep, setCurrentStep] = useState<CaptureStep>('instructions')
  const [capturedData, setCapturedData] = useState<any>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [showCamera, setShowCamera] = useState(false)
  const [engineState, setEngineState] = useState<EngineState>(null)

  const isRoutineMode = mode === 'routine'
  const title = isRoutineMode ? 'Quick Dashboard Reading' : 'Dashboard Diagnostic'
  const subtitle = isRoutineMode ? 'Take a photo or choose from files' : 'Diagnostic scan with detailed analysis'

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal closes
      setCurrentStep('instructions')
      setCapturedData(null)
      setCompletedSteps(new Set())
      setShowCamera(false)
      setEngineState(null)
    }
  }, [isOpen])

  const handleCameraCapture = (result: CaptureResult) => {
    if (result.success && result.data) {
      // Enrich capture data with engine state
      const enrichedData = {
        ...result.data,
        metadata: {
          ...result.data.metadata,
          engine_state: engineState
        }
      }
      setCapturedData(enrichedData)
      setShowCamera(false)
      handleStepComplete('capture')
      handleStepComplete('processing')
      setCurrentStep('success')
      
      // No auto-save - require manual confirmation
    } else {
      console.error('Dashboard capture failed:', result.error)
      setCurrentStep('capture') // Go back to capture step on error
    }
  }

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set(Array.from(prev).concat(stepId)))
    
    // Find the current step index
    const stepOrder: CaptureStep[] = ['instructions', 'safety', 'engine-state', 'capture', 'processing', 'success']
    const currentIndex = stepOrder.indexOf(stepId as CaptureStep)
    
    // Auto-advance to next step (unless it's the last step)
    if (currentIndex >= 0 && currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1]
      setCurrentStep(nextStep)
    }
  }

  const handleStepChange = (stepId: string) => {
    setCurrentStep(stepId as CaptureStep)
  }

  const handleCameraOpen = () => {
    setShowCamera(true)
  }

  const handleFileUpload = () => {
    // Create a file input element and trigger it
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        console.log('File selected:', file.name)
        
        // Process the uploaded file through the vision API
        handleStepComplete('capture')
        setCurrentStep('processing')
        
        try {
          const formData = new FormData()
          formData.append('image', file)
          formData.append('mode', 'auto')
          formData.append('document_type', 'dashboard_snapshot')
          formData.append('engine_state', engineState || 'unknown')
          if (vehicleId) {
            formData.append('vehicle_id', vehicleId)
            console.log('✅ Added vehicle_id to file upload:', vehicleId)
          } else {
            console.warn('⚠️ No vehicle_id - file upload will not store image!')
          }
          
          const response = await fetch('/api/vision/process', {
            method: 'POST',
            body: formData
          })
          
          if (response.ok) {
            const result = await response.json()
            handleCameraCapture({
              success: true,
              data: {
                ...result.data,
                metadata: {
                  ...result.data.metadata,
                  engine_state: engineState
                }
              },
              processed_at: new Date().toISOString()
            })
          } else {
            console.error('File upload processing failed:', response.status)
            setCurrentStep('capture') // Go back to capture step
          }
        } catch (error) {
          console.error('File upload error:', error)
          setCurrentStep('capture') // Go back to capture step
        }
      }
    }
    input.click()
  }

  const handleComplete = () => {
    if (capturedData) {
      onCapture({ 
        success: true, 
        data: capturedData,
        processed_at: new Date().toISOString()
      })
    }
  }

  const handleRetakePhoto = () => {
    // Reset to capture step and clear data
    setCapturedData(null)
    setShowCamera(false)
    setCurrentStep('capture')
    // Remove completion status from capture and processing steps
    setCompletedSteps(prev => {
      const newSet = new Set(Array.from(prev))
      newSet.delete('capture')
      newSet.delete('processing')
      newSet.delete('success')
      return newSet
    })
  }

  const steps: Step[] = [
    {
      id: 'instructions',
      title: 'Preparation Steps',
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <span className="text-sm">Park your car safely</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <span className="text-sm">Select engine state (next step)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <span className="text-sm">Wait 30 seconds, then capture</span>
          </div>
        </div>
      ),
      isCompleted: completedSteps.has('instructions'),
      autoAdvance: true,
      canProceed: true // Instructions are just informational
    },
    {
      id: 'safety',
      title: 'Safety Check',
      content: (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-amber-900 mb-2">Safety Requirements</div>
                <div className="text-sm text-amber-800">
                  <div className="font-medium mb-1">⚠️ Vehicle must be parked and stationary</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Engine OFF or ON (both are safe when parked)</li>
                    <li>• Never capture while driving</li>
                    <li>• Ensure vehicle is secure</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      isCompleted: completedSteps.has('safety'),
      autoAdvance: true,
      canProceed: true // Safety check is informational
    },
    {
      id: 'engine-state',
      title: 'Engine State',
      content: (
        <div className="space-y-4">
          <div className="text-sm text-gray-700 mb-4">
            Select your current engine state to ensure accurate readings:
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setEngineState('running')
                // Don't auto-complete - let user press Next
              }}
              className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                engineState === 'running'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                  ✓
                </div>
                <div className="font-semibold text-lg">Engine Running</div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• Recommended for accurate readings</div>
                <div>• All systems operational</div>
                <div>• Warning lights show real issues</div>
              </div>
              {engineState === 'running' && (
                <div className="mt-3 text-sm text-green-600 font-medium">
                  ✓ Selected
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setEngineState('accessory')
                // Don't auto-complete - let user press Next
              }}
              className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                engineState === 'accessory'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white text-xl">
                  ⚡
                </div>
                <div className="font-semibold text-lg">Key On, Engine Off</div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• Self-test mode</div>
                <div>• Limited system data</div>
                <div>• Warning lights may not be accurate</div>
              </div>
              {engineState === 'accessory' && (
                <div className="mt-3 text-sm text-amber-600 font-medium">
                  ✓ Selected - Warning lights will be excluded
                </div>
              )}
            </button>
          </div>

          {!engineState && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-600 text-center">
                Select an option above to continue
              </div>
            </div>
          )}

          {engineState && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">✓ Ready to continue</div>
                <div>Press "Next" below to proceed to capture step.</div>
              </div>
            </div>
          )}
        </div>
      ),
      isCompleted: completedSteps.has('engine-state'),
      autoAdvance: false, // Don't auto-advance, require user selection
      canProceed: engineState !== null // Can only proceed if engine state is selected
    },
    {
      id: 'capture',
      title: 'Take Photo',
      content: (
        <div className="space-y-4">
          {!capturedData && !showCamera && (
            <>
              {/* Dashboard Illustration */}
              <div className="flex justify-center py-6">
                <svg width="220" height="120" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Dashboard background with subtle shadow */}
                  <rect x="10" y="18" width="200" height="84" rx="14" fill="#0F172A"/>
                  <rect x="12" y="20" width="196" height="80" rx="12" fill="#1E293B"/>
                  
                  {/* Left gauge (speedometer) */}
                  <g transform="translate(55, 60)">
                    {/* Outer ring */}
                    <circle cx="0" cy="0" r="30" fill="#0F172A"/>
                    <circle cx="0" cy="0" r="28" fill="#1E293B"/>
                    
                    {/* Tick marks */}
                    <line x1="-24" y1="-15" x2="-21" y2="-13" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="-15" y1="-24" x2="-13" y2="-21" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="0" y1="-27" x2="0" y2="-23" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="15" y1="-24" x2="13" y2="-21" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="24" y1="-15" x2="21" y2="-13" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="27" y1="0" x2="23" y2="0" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
                    
                    {/* Speed arc */}
                    <path d="M -21 -21 A 30 30 0 0 1 21 -21" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
                    
                    {/* Needle with gradient effect */}
                    <line x1="0" y1="0" x2="-10" y2="-20" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="0" cy="0" r="4" fill="#DC2626"/>
                    <circle cx="0" cy="0" r="2" fill="#FCA5A5"/>
                    
                    {/* Labels */}
                    <text x="-22" y="-18" fontSize="9" fill="#94A3B8" fontFamily="system-ui, -apple-system" fontWeight="500">0</text>
                    <text x="0" y="-25" fontSize="9" fill="#94A3B8" fontFamily="system-ui, -apple-system" fontWeight="500" textAnchor="middle">60</text>
                    <text x="18" y="-18" fontSize="9" fill="#94A3B8" fontFamily="system-ui, -apple-system" fontWeight="500">120</text>
                    <text x="0" y="10" fontSize="7" fill="#64748B" fontFamily="system-ui, -apple-system" textAnchor="middle">MPH</text>
                  </g>
                  
                  {/* Right gauge (fuel) */}
                  <g transform="translate(165, 60)">
                    {/* Outer ring */}
                    <circle cx="0" cy="0" r="30" fill="#0F172A"/>
                    <circle cx="0" cy="0" r="28" fill="#1E293B"/>
                    
                    {/* Tick marks */}
                    <line x1="-24" y1="-15" x2="-21" y2="-13" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="-15" y1="-24" x2="-13" y2="-21" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="0" y1="-27" x2="0" y2="-23" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="15" y1="-24" x2="13" y2="-21" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="24" y1="-15" x2="21" y2="-13" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
                    
                    {/* Fuel arc */}
                    <path d="M -21 -21 A 30 30 0 0 1 21 -21" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
                    
                    {/* Needle */}
                    <line x1="0" y1="0" x2="14" y2="-18" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="0" cy="0" r="4" fill="#059669"/>
                    <circle cx="0" cy="0" r="2" fill="#6EE7B7"/>
                    
                    {/* Labels */}
                    <text x="-23" y="-18" fontSize="9" fill="#94A3B8" fontFamily="system-ui, -apple-system" fontWeight="500">E</text>
                    <text x="20" y="-18" fontSize="9" fill="#94A3B8" fontFamily="system-ui, -apple-system" fontWeight="500">F</text>
                    <text x="0" y="10" fontSize="7" fill="#64748B" fontFamily="system-ui, -apple-system" textAnchor="middle">FUEL</text>
                  </g>
                  
                  {/* Center digital display (odometer) */}
                  <rect x="96" y="48" width="28" height="18" rx="2" fill="#0F172A"/>
                  <rect x="97" y="49" width="26" height="16" rx="1.5" fill="#000000"/>
                  <g transform="translate(99, 54)">
                    <rect x="0" y="0" width="3" height="7" rx="0.5" fill="#3B82F6" opacity="0.9"/>
                    <rect x="4" y="0" width="3" height="7" rx="0.5" fill="#3B82F6" opacity="0.9"/>
                    <rect x="8" y="0" width="3" height="7" rx="0.5" fill="#3B82F6" opacity="0.9"/>
                    <rect x="12" y="0" width="3" height="7" rx="0.5" fill="#3B82F6" opacity="0.9"/>
                    <rect x="16" y="0" width="3" height="7" rx="0.5" fill="#3B82F6" opacity="0.9"/>
                    <rect x="20" y="0" width="3" height="7" rx="0.5" fill="#3B82F6" opacity="0.9"/>
                  </g>
                  <text x="110" y="73" fontSize="6" fill="#64748B" fontFamily="system-ui, -apple-system" textAnchor="middle" fontWeight="500">ODOMETER</text>
                  
                  {/* Warning lights with icons */}
                  <g transform="translate(95, 30)">
                    {/* Engine light */}
                    <circle cx="0" cy="0" r="4" fill="#F59E0B" opacity="0.7"/>
                    <path d="M -1.5 -1 L -1.5 1 M 1.5 -1 L 1.5 1 M 0 -2 L 0 2" stroke="#FFF" strokeWidth="0.6" opacity="0.9"/>
                  </g>
                  <g transform="translate(110, 30)">
                    {/* Oil light */}
                    <circle cx="0" cy="0" r="4" fill="#EF4444" opacity="0.7"/>
                    <path d="M 0 -2 L -1.5 1 L 1.5 1 Z" fill="#FFF" opacity="0.9"/>
                  </g>
                  <g transform="translate(125, 30)">
                    {/* Battery light */}
                    <circle cx="0" cy="0" r="4" fill="#10B981" opacity="0.7"/>
                    <rect x="-1.5" y="-1" width="3" height="2" fill="#FFF" opacity="0.9" rx="0.3"/>
                  </g>
                  
                  {/* Camera frame overlay */}
                  <rect x="5" y="13" width="210" height="94" rx="16" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="12 6" fill="none" opacity="0.4"/>
                  
                  {/* Corner brackets with glow */}
                  <g opacity="0.9">
                    <path d="M 10 18 L 10 33 M 10 18 L 25 18" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M 210 18 L 210 33 M 210 18 L 195 18" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M 10 102 L 10 87 M 10 102 L 25 102" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M 210 102 L 210 87 M 210 102 L 195 102" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                  
                  {/* Camera icon - refined */}
                  <g transform="translate(188, 8)">
                    <rect x="0" y="0" width="20" height="15" rx="2.5" fill="#3B82F6"/>
                    <rect x="1.5" y="1.5" width="17" height="12" rx="1.5" fill="#1E40AF" opacity="0.4"/>
                    <circle cx="10" cy="7.5" r="4" fill="#FFF" opacity="0.5"/>
                    <circle cx="10" cy="7.5" r="2.5" fill="#FFF" opacity="0.3"/>
                    <rect x="16" y="3" width="4" height="4" rx="1" fill="#2563EB"/>
                  </g>
                </svg>
              </div>
              
              <div className="text-sm text-gray-600 text-center mb-4">
                Frame your complete dashboard including all gauges and displays
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCameraOpen}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </button>
                <button
                  onClick={handleFileUpload}
                  className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload
                </button>
              </div>
            </>
          )}

          {capturedData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <div className="font-medium mb-1">✓ Photo captured successfully</div>
                <div>Press "Review Results" below to continue.</div>
              </div>
            </div>
          )}
          
          {showCamera && (
            <div className="border rounded-lg overflow-hidden bg-gray-900">
              <UnifiedCameraCapture
                captureType="dashboard_snapshot"
                frameGuide="dashboard-cluster"
                instructions="Include all gauges and displays in frame"
                onCapture={handleCameraCapture}
                onCancel={() => {
                  setShowCamera(false)
                  // Don't change step when canceling camera
                }}
                processingAPI="/api/vision/process"
                vehicleId={vehicleId}
                title=""
                allowFileUpload={false}
                maxRetries={2}
                autoStartCamera={true}
              />
            </div>
          )}
        </div>
      ),
      isCompleted: completedSteps.has('capture'),
      canProceed: capturedData !== null, // Can only proceed if photo is captured
      ctaLabel: 'Review Results'
    },
    {
      id: 'processing',
      title: 'Processing Image',
      content: (
        <div className="py-12 px-6 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          
          <div className="space-y-2">
            <div className="text-lg font-semibold text-gray-900">Processing your dashboard...</div>
            <div className="text-sm text-gray-500">Extracting odometer, fuel level, and warning lights</div>
          </div>
        </div>
      ),
      isCompleted: completedSteps.has('processing'),
      canProceed: false // Prevent any buttons on processing step
    },
    {
      id: 'success',
      title: 'Complete!',
      content: (
        <div className="py-8 px-6 space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse"></div>
              <div className="relative bg-white rounded-full p-3">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
          </div>
          
          {/* Success Message */}
          <div className="text-center space-y-2">
            <div className="text-lg font-semibold text-gray-900">Dashboard Captured!</div>
            <div className="text-sm text-gray-500">Ready to save to your vehicle timeline</div>
          </div>
          
          {/* Extracted Data Preview - Read Only */}
          {capturedData && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 space-y-3">
              <div className="text-sm font-semibold text-green-900">
                {capturedData.summary || 'Dashboard data captured successfully'}
              </div>
              
              {(capturedData.key_facts?.odometer_miles || capturedData.key_facts?.fuel_level_eighths || capturedData.key_facts?.warning_lights?.length > 0) && (
                <div className="space-y-2 pt-2 border-t border-green-200/50">
                  {capturedData.key_facts?.odometer_miles && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">Odometer</span>
                      <span className="font-medium text-green-900">{capturedData.key_facts.odometer_miles.toLocaleString()} miles</span>
                    </div>
                  )}
                  {capturedData.key_facts?.fuel_level_eighths !== null && capturedData.key_facts?.fuel_level_eighths !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">Fuel Level</span>
                      <span className="font-medium text-green-900">{Math.round(capturedData.key_facts.fuel_level_eighths / 8 * 100)}%</span>
                    </div>
                  )}
                  {capturedData.key_facts?.warning_lights && capturedData.key_facts.warning_lights.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">Warning Lights</span>
                      <span className="font-medium text-green-900">{capturedData.key_facts.warning_lights.length} detected</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="pt-3 mt-3 border-t border-green-200/50 text-xs text-green-700">
                Data looks incorrect? Use "Retake photo" below
              </div>
            </div>
          )}
          
          {/* Retake Option */}
          <div className="text-center pt-2">
            <button
              onClick={handleRetakePhoto}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Retake photo
            </button>
          </div>
        </div>
      ),
      isCompleted: false, // Keep as not completed so accordion shows button
      canProceed: true, // Always can save results
      ctaLabel: 'Save to Timeline'
    }
  ]

  return (
    <StepperModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={subtitle}
      icon={<Camera className="w-6 h-6 text-blue-600" />}
      steps={steps}
      currentStepId={currentStep}
      onStepChange={handleStepChange}
      onStepComplete={(stepId: string) => {
        if (stepId === 'success') {
          handleComplete() // Save results when success step is completed
        } else {
          handleStepComplete(stepId)
        }
      }}
      onCameraCapture={handleCameraOpen}
      onFileUpload={handleFileUpload}
    />
  )
}
