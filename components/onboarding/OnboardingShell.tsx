/**
 * Onboarding Shell
 * 
 * Unified shell for all onboarding flows.
 * Provides header (back, progress), footer (skip, continue), and validation context.
 */

'use client'

import { type ReactNode, useRef, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useValidation } from '@/wizard/validation-context'
import { ChapterProgress, type Chapter } from './ChapterProgress'
import { WizardOverflowMenu } from './WizardOverflowMenu'
import { StepErrorBoundary } from './StepErrorBoundary'

type OnboardingShellProps = {
  // Content
  children: ReactNode
  title?: string
  subtitle?: string
  
  // Progress (chapter-based)
  chapters?: Chapter[]
  currentChapterId?: string
  showChapterName?: boolean
  
  // Legacy progress (fallback for simple wizards)
  currentStep?: number
  totalSteps?: number
  progress?: number
  
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
  lastSaved?: Date | null
  
  // Display
  hideProgress?: boolean
  hideBack?: boolean
  hideSkip?: boolean
  hideExit?: boolean
  hideStartOver?: boolean
  showFooterBack?: boolean
  hideContinueButton?: boolean
  continueLabel?: string
  mode?: 'fullscreen' | 'modal'
}

export function OnboardingShell({
  children,
  title,
  subtitle,
  chapters,
  currentChapterId,
  showChapterName = false,
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
  lastSaved,
  hideProgress = false,
  hideBack = false,
  hideSkip = false,
  hideExit = false,
  hideStartOver = false,
  showFooterBack = false,
  hideContinueButton = false,
  continueLabel = 'Continue',
  mode = 'fullscreen'
}: OnboardingShellProps) {
  // Use chapter-based progress if available, otherwise legacy
  const useChapters = chapters && currentChapterId
  const { isValid, onSubmit } = useValidation()
  
  // Focus management: move focus to title on step change
  const titleRef = useRef<HTMLHeadingElement>(null)
  const currentChapter = useChapters ? chapters?.find(c => c.id === currentChapterId) : null
  
  useEffect(() => {
    if (title && titleRef.current) {
      // Small delay to allow content to render
      setTimeout(() => {
        titleRef.current?.focus()
      }, 100)
    }
  }, [title, currentChapterId])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Enter in inputs to trigger continue
        if (e.key === 'Enter' && isValid && canGoNext && !isProcessing) {
          e.preventDefault()
          handleContinue()
        }
        return
      }
      
      // Global shortcuts (when not in input)
      if (e.key === 'Enter' && isValid && canGoNext && !isProcessing) {
        e.preventDefault()
        handleContinue()
      } else if (e.key === 'Escape') {
        // Remove focus from any element
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      } else if (e.altKey && e.key === 'ArrowLeft' && canGoBack && onBack && !isProcessing) {
        e.preventDefault()
        onBack()
      } else if (e.altKey && e.key === 'ArrowRight' && canGoNext && isValid && onNext && !isProcessing) {
        e.preventDefault()
        onNext()
      }
    }
    
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [isValid, canGoNext, canGoBack, isProcessing, onBack, onNext])
  
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
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Empty (footer handles back) */}
            <div className="flex items-center gap-3 flex-1">
              {/* Back button moved to footer for consistent navigation */}
            </div>
            
            {/* Center: Title */}
            <div className="flex-1 flex flex-col items-center text-center px-4">
              {title && (
                <h1 
                  ref={titleRef}
                  tabIndex={-1}
                  className="text-base font-semibold text-gray-900 truncate max-w-md outline-none"
                >
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">
                  {subtitle}
                </p>
              )}
            </div>
            
            {/* Right: Overflow Menu */}
            <div className="flex items-center justify-end flex-1">
              <WizardOverflowMenu
                onExit={onExit}
                onStartOver={onStartOver}
                disabled={isProcessing}
                hideExit={hideExit || isModal}
                hideStartOver={hideStartOver || isModal}
                lastSaved={lastSaved}
              />
            </div>
          </div>
        </div>
      </header>
      
      {/* Progress Bar (separate section) */}
      {!hideProgress && useChapters && (
        <div className="sticky top-16 z-10 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <ChapterProgress
              chapters={chapters!}
              currentChapterId={currentChapterId!}
              showChapterName={showChapterName}
            />
          </div>
        </div>
      )}
      
      {/* Content */}
      <main className="flex-1 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <StepErrorBoundary
            onRetry={() => window.location.reload()}
            onBack={canGoBack && onBack ? onBack : undefined}
          >
            {children}
          </StepErrorBoundary>
        </div>
      </main>
      
      {/* Footer - Mobile/Native Optimized */}
      <footer className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-2px_16px_rgba(0,0,0,0.08)] safe-area-inset-bottom">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 sm:gap-4 min-h-[60px] sm:h-16 py-2 sm:py-0">
            {/* Left: Back */}
            <div className="flex-1">
              {showFooterBack && canGoBack && onBack && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="h-11 px-4 text-base font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform touch-manipulation"
                  disabled={isProcessing}
                  aria-disabled={isProcessing}
                  aria-label="Go back to previous step"
                >
                  ← Back
                </Button>
              )}
            </div>
            
            {/* Middle: Skip (optional) */}
            <div className="flex-shrink-0">
              {!hideSkip && canSkip && onSkip && (
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  className="h-11 px-3 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform touch-manipulation"
                  disabled={isProcessing}
                  aria-disabled={isProcessing}
                >
                  Skip
                </Button>
              )}
            </div>
            
            {/* Right: Continue */}
            <div className="flex-1 flex justify-end">
              {!hideContinueButton && (
                <Button
                  onClick={handleContinue}
                  disabled={!canGoNext || !isValid || isProcessing}
                  aria-disabled={!canGoNext || !isValid || isProcessing}
                  className="h-11 px-6 min-w-[120px] sm:min-w-[140px] text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform touch-manipulation"
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      <span className="hidden sm:inline">Processing...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    continueLabel
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </footer>
      
      {/* ARIA live region for progress announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {useChapters && currentChapter && currentChapter.currentStep && (
          `${currentChapter.name}, step ${currentChapter.currentStep} of ${currentChapter.stepCount}`
        )}
      </div>
      
      {/* Keyboard shortcuts hint */}
      <div className="sr-only" role="status">
        Press Enter to continue, Escape to blur input
      </div>
    </div>
  )
}
