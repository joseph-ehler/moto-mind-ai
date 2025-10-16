/**
 * StepperModal (TYPE 4)
 * For multi-step wizards, guided workflows, and onboarding sequences
 * Size: max-w-lg (512px) - Optimized for step-by-step flows
 * Features: Accordion steps, progress tracking, validation, auto-advance
 */

'use client'

import React from 'react'
import { ChevronDown, CheckCircle, Camera, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BaseModal, ModalHeader, ModalContent, ModalFooter } from './BaseModal'
import { StepperModalProps, Step } from './types'

export function StepperModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  steps,
  currentStepId,
  onStepChange,
  onStepComplete,
  onCameraCapture,
  onFileUpload,
  isProcessing = false,
  processingMessage,
  showCloseButton = true,
}: StepperModalProps) {
  // Refs for scrolling behavior
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const activeStepRef = React.useRef<HTMLDivElement>(null)

  // Scroll to active step when it changes with offset to avoid sticky header
  React.useEffect(() => {
    if (isOpen && activeStepRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        const element = activeStepRef.current
        const container = scrollContainerRef.current
        
        if (element && container) {
          // Get the element's position relative to the container
          const elementRect = element.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          
          // Calculate offset: add 32px (2rem) spacing above the card
          const offset = 32
          const scrollTop = container.scrollTop + elementRect.top - containerRect.top - offset
          
          // Smooth scroll with offset
          container.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }, [currentStepId, isOpen])

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
    onStepComplete(currentStep.id)
  }

  const isLastStep = currentStepIndex === steps.length - 1
  const canProceed = currentStep.canProceed !== false
  const ctaLabel = currentStep.ctaLabel || (isLastStep ? 'Complete' : 'Next')

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeOnOverlayClick={false}
      showCloseButton={false}
      title={title}
      description={description}
      icon={icon}
    >
      {/* Custom Header for Stepper */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
        {showCloseButton && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Accordion Steps - Scrollable Content with Flat Card Design */}
      <ModalContent className="p-8" ref={scrollContainerRef}>
        <div className="space-y-6">
          {steps.map((step, index) => {
            const isActive = step.id === currentStepId
            const isCompleted = step.isCompleted
            const isAccessible = isCompleted || index <= maxReachedStepIndex
            
            return (
              <div 
                key={step.id} 
                ref={isActive ? activeStepRef : null}
                className={`
                  rounded-2xl border transition-all duration-200
                  ${isActive ? 'border-blue-200 bg-blue-50/50 shadow-sm' : 'border-gray-200 bg-white'}
                  ${!isAccessible ? 'opacity-60' : ''}
                `}
              >
                {/* Step Header - Collapsible */}
                <button
                  onClick={() => handleStepClick(step.id, index)}
                  disabled={!isAccessible}
                  className={`
                    w-full px-6 py-4 text-left transition-all duration-200 rounded-t-2xl
                    ${isAccessible ? 'hover:bg-gray-50/50 cursor-pointer' : 'cursor-not-allowed'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center transition-colors
                        ${isCompleted ? 'bg-green-600' : isActive ? 'bg-blue-600' : isAccessible ? 'bg-gray-300' : 'bg-gray-200'}
                      `}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <div className="text-white text-sm font-semibold">{index + 1}</div>
                        )}
                      </div>
                      <div>
                        <h3 className={`text-base font-semibold ${!isAccessible ? 'text-gray-400' : isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                          {step.title}
                        </h3>
                        {isCompleted && !isActive && (
                          <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Completed
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {isAccessible && (
                      <ChevronDown className={`
                        w-5 h-5 transition-transform duration-200 
                        ${isActive ? 'rotate-180 text-blue-600' : 'text-gray-400'}
                      `} />
                    )}
                  </div>
                </button>

                {/* Step Content - Expandable */}
                {isActive && (
                  <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="pt-4 border-t border-gray-200">
                      {step.content}
                    </div>
                    
                    {/* Camera Controls if needed */}
                    {step.showCameraControls && onCameraCapture && onFileUpload && (
                      <div className="mt-6 flex gap-3">
                        <Button
                          onClick={onCameraCapture}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 rounded-xl"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Take Photo
                        </Button>
                        <Button
                          onClick={onFileUpload}
                          variant="outline"
                          className="flex-1 h-12 rounded-xl border-gray-300"
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
      </ModalContent>

      {/* Footer with Sticky CTA */}
      <ModalFooter className="space-y-3">
        {/* Secondary Action Area */}
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
      </ModalFooter>
    </BaseModal>
  )
}

// Export Step type for convenience
export type { Step }
