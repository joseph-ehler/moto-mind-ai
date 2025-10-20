/**
 * Onboarding Shell
 * 
 * Unified shell for all onboarding flows.
 * Provides header (back, progress), footer (skip, continue), and validation context.
 */

'use client'

import { type ReactNode } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useValidation } from '@/wizard/validation-context'

type OnboardingShellProps = {
  // Content
  children: ReactNode
  title?: string
  subtitle?: string
  
  // Progress
  currentStep: number
  totalSteps: number
  progress: number
  
  // Navigation
  onBack?: () => void
  onNext?: () => void
  onSkip?: () => void
  onExit?: () => void
  onStartOver?: () => void
  
  // State
  canGoBack: boolean
  canGoNext: boolean
  canSkip: boolean
  isProcessing?: boolean
  
  // Display
  hideProgress?: boolean
  hideBack?: boolean
  hideSkip?: boolean
  hideExit?: boolean
  hideStartOver?: boolean
  continueLabel?: string
  mode?: 'fullscreen' | 'modal'
}

export function OnboardingShell({
  children,
  title,
  subtitle,
  currentStep,
  totalSteps,
  progress,
  onBack,
  onNext,
  onSkip,
  onExit,
  onStartOver,
  canGoBack,
  canGoNext,
  canSkip,
  isProcessing = false,
  hideProgress = false,
  hideBack = false,
  hideSkip = false,
  hideExit = false,
  hideStartOver = false,
  continueLabel = 'Continue',
  mode = 'fullscreen'
}: OnboardingShellProps) {
  const { isValid, onSubmit } = useValidation()
  
  const handleContinue = () => {
    // If step has custom submit handler, call it
    if (onSubmit) {
      onSubmit()
    } else if (onNext) {
      // Otherwise use default next
      onNext()
    }
  }
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && canGoNext && isValid) {
      e.preventDefault()
      handleContinue()
    }
    
    if (e.key === 'Escape') {
      // Blur active element
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }
  }
  
  const isModal = mode === 'modal'
  
  return (
    <div className={isModal ? 'flex flex-col h-full bg-white' : 'min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50'}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back */}
            <div className="flex items-center gap-3 flex-1">
              {!hideBack && canGoBack && onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="text-gray-600 hover:text-gray-900 -ml-2"
                  disabled={isProcessing}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
            </div>
            
            {/* Center: Title */}
            <div className="flex-1 flex flex-col items-center text-center px-4">
              {title && (
                <h1 className="text-base font-semibold text-gray-900 truncate max-w-md">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">
                  {subtitle}
                </p>
              )}
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-2 flex-1">
              {!hideExit && onExit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExit}
                  className="text-gray-600 hover:text-gray-900"
                  title="Progress is saved automatically"
                  disabled={isProcessing}
                >
                  {isModal ? <X className="w-4 h-4" /> : 'Save & exit'}
                </Button>
              )}
              {!hideStartOver && onStartOver && !isModal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onStartOver}
                  className="text-gray-600 hover:text-gray-900"
                  disabled={isProcessing}
                >
                  Start over
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="flex-1 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>
      
      {/* Footer / Action Bar */}
      <footer className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress indicator */}
          {!hideProgress && (
            <div className="flex items-center justify-center py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500">
                  Step {currentStep} of {totalSteps}
                </span>
                <div className="w-48 h-1.5">
                  <Progress value={progress} className="h-1.5" />
                </div>
                <span className="text-xs font-medium text-gray-500">
                  {progress}%
                </span>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex items-center justify-between h-20">
            {/* Left: Skip */}
            <div className="flex-1">
              {!hideSkip && canSkip && onSkip && !isProcessing && (
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Skip for now
                </Button>
              )}
            </div>
            
            {/* Right: Continue */}
            <div className="flex-1 flex justify-end">
              <Button
                onClick={handleContinue}
                disabled={!canGoNext || !isValid || isProcessing}
                size="lg"
                className="min-w-[140px]"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  continueLabel
                )}
              </Button>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Keyboard shortcuts hint */}
      <div className="sr-only" aria-live="polite">
        Press Enter to continue, Escape to blur input
      </div>
    </div>
  )
}
