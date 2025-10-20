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
  
  // Display
  hideProgress?: boolean
  hideBack?: boolean
  hideSkip?: boolean
  mode?: 'fullscreen' | 'modal'
}

export function OnboardingShell({
  children,
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
  hideProgress = false,
  hideBack = false,
  hideSkip = false,
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
            <div className="flex-1">
              {!hideBack && canGoBack && onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            
            {/* Center: Progress */}
            <div className="flex-1 flex flex-col items-center">
              {!hideProgress && (
                <>
                  <span className="text-sm font-medium text-gray-600 mb-1">
                    Step {currentStep} of {totalSteps}
                  </span>
                  <div className="w-32 h-1">
                    <Progress value={progress} className="h-1" />
                  </div>
                </>
              )}
            </div>
            
            {/* Right: Actions */}
            <div className="flex-1 flex items-center justify-end gap-2">
              {onExit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExit}
                  className="text-gray-600 hover:text-gray-900"
                  title="Progress is saved automatically"
                >
                  {isModal ? <X className="w-4 h-4" /> : 'Save & exit'}
                </Button>
              )}
              {onStartOver && !isModal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onStartOver}
                  className="text-gray-600 hover:text-gray-900"
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
      
      {/* Footer */}
      <footer className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Skip */}
            <div className="flex-1">
              {!hideSkip && canSkip && onSkip && (
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
                disabled={!canGoNext || !isValid}
                size="lg"
                className="min-w-[140px]"
              >
                Continue
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
