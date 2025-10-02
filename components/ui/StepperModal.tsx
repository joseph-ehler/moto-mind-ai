'use client'

import React from 'react'
import { X, ChevronDown, CheckCircle, Camera, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface Step {
  id: string
  title: string
  content: React.ReactNode
  canProceed?: boolean
  isCompleted?: boolean
  autoAdvance?: boolean
  showCameraControls?: boolean
  ctaLabel?: string // Custom CTA text for this step
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: 'skip' | 'loading'
  }
}

interface AccordionStepperModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  steps: Step[]
  currentStepId: string
  onStepChange: (stepId: string) => void
  onStepComplete: (stepId: string) => void
  onCameraCapture?: () => void
  onFileUpload?: () => void
  isProcessing?: boolean
  processingMessage?: string
  className?: string
}

export function AccordionStepperModal({
  isOpen,
  onClose,
  title,
  subtitle,
  steps,
  currentStepId,
  onStepChange,
  onStepComplete,
  onCameraCapture,
  onFileUpload,
  isProcessing = false,
  processingMessage,
  className = ""
}: AccordionStepperModalProps) {
  // Hooks must be called before any early returns
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const activeStepRef = React.useRef<HTMLDivElement>(null)

  // Scroll to active step when it changes
  React.useEffect(() => {
    if (isOpen && activeStepRef.current && scrollContainerRef.current) {
      // Small delay to allow DOM to update
      setTimeout(() => {
        activeStepRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }, 100)
    }
  }, [currentStepId, isOpen])
  
  if (!isOpen) return null

  const currentStepIndex = steps.findIndex(step => step.id === currentStepId)
  const currentStep = steps[currentStepIndex]
  
  // Find the furthest step the user has reached
  const completedStepIndices = steps.map((step, index) => step.isCompleted ? index : -1).filter(i => i >= 0)
  const maxReachedStepIndex = completedStepIndices.length > 0 ? Math.max(...completedStepIndices) + 1 : currentStepIndex

  const handleStepClick = (stepId: string, index: number) => {
    const isCompletedStep = steps[index].isCompleted
    const isAccessibleStep = index <= maxReachedStepIndex
    
    if (isCompletedStep || isAccessibleStep) {
      onStepChange(stepId)
    }
  }

  const handleNext = () => {
    // Just trigger completion - let the parent handle advancement
    onStepComplete(currentStep.id)
  }

  const isLastStep = currentStepIndex === steps.length - 1
  const canProceed = currentStep.canProceed !== false
  const ctaLabel = currentStep.ctaLabel || (isLastStep ? 'Complete' : 'Next')

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl w-full max-w-lg mx-auto h-[90vh] flex flex-col ${className}`}>
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Accordion Steps - Scrollable */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 scroll-smooth">
          {steps.map((step, index) => {
            const isActive = step.id === currentStepId
            const isCompleted = step.isCompleted
            const isAccessible = isCompleted || index <= maxReachedStepIndex
            
            return (
              <div 
                key={step.id} 
                ref={isActive ? activeStepRef : null}
                className="border-b border-gray-100 last:border-b-0"
              >
                {/* Step Header - Collapsible */}
                <button
                  onClick={() => handleStepClick(step.id, index)}
                  disabled={!isAccessible}
                  className={`
                    w-full px-6 py-4 text-left transition-all duration-200
                    ${isAccessible ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed'}
                    ${isActive ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center transition-colors
                        ${isCompleted ? 'bg-green-600' : isAccessible ? 'bg-gray-300' : 'bg-gray-200'}
                      `}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-blue-600' : 'bg-white'}`} />
                        )}
                      </div>
                      <div>
                        <h3 className={`text-sm font-medium ${!isAccessible ? 'text-gray-400' : 'text-gray-900'}`}>
                          {step.title}
                        </h3>
                        {isCompleted && !isActive && (
                          <p className="text-xs text-gray-500 mt-0.5">Completed</p>
                        )}
                      </div>
                    </div>
                    
                    {isAccessible && (
                      <ChevronDown className={`
                        w-5 h-5 transition-transform duration-200 text-gray-400
                        ${isActive ? 'rotate-180' : ''}
                      `} />
                    )}
                  </div>
                </button>

                {/* Step Content - Expandable with maximized height */}
                {isActive && (
                  <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200 min-h-[60vh]">
                    <div className="pt-2">
                      {step.content}
                    </div>
                    
                    {/* Camera Controls if needed */}
                    {step.showCameraControls && (
                      <div className="mt-6 flex gap-3">
                        <Button
                          onClick={onCameraCapture}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Take Photo
                        </Button>
                        <Button
                          onClick={onFileUpload}
                          variant="outline"
                          className="flex-1"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer - Fixed with Sticky CTA */}
        <div className="flex-shrink-0 border-t bg-white p-4 space-y-3 rounded-b-2xl">
          {/* Secondary Action Area (Skip, Loading, etc.) */}
          {currentStep.secondaryAction && (
            <button
              onClick={currentStep.secondaryAction.onClick}
              className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
              disabled={currentStep.secondaryAction.variant === 'loading'}
            >
              {currentStep.secondaryAction.variant === 'loading' ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  <span>{currentStep.secondaryAction.label}</span>
                </div>
              ) : (
                currentStep.secondaryAction.label
              )}
            </button>
          )}

          {isProcessing && processingMessage && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <span>{processingMessage}</span>
            </div>
          )}

          {/* Primary CTA - Always Visible */}
          <Button
            onClick={handleNext}
            disabled={!canProceed || isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed h-12 text-base font-medium rounded-xl"
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
