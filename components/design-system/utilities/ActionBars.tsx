'use client'

/**
 * Action Bars
 * 
 * Sticky/fixed action bars for page-level actions
 * Based on specs page aesthetic
 */

import React from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { Stack, Flex } from '../primitives/Layout'

// ============================================================================
// 1. PAGE ACTION BAR - Top-level page actions (Save, Cancel, etc.)
// ============================================================================

export interface PageActionBarProps {
  title?: string
  description?: string
  primaryAction?: {
    label: string
    onClick: () => void
    disabled?: boolean
    loading?: boolean
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  onBack?: () => void
  sticky?: boolean
}

/**
 * PageActionBar - Primary action bar for pages
 * 
 * Use at top of pages with primary actions (Save, Delete, etc.)
 * Can be sticky or static
 * 
 * @example
 * <PageActionBar
 *   title="Edit Vehicle"
 *   onBack={() => router.back()}
 *   primaryAction={{
 *     label: 'Save Changes',
 *     onClick: handleSave,
 *     loading: isSaving
 *   }}
 *   secondaryAction={{
 *     label: 'Cancel',
 *     onClick: () => router.back()
 *   }}
 *   sticky
 * />
 */
export function PageActionBar({
  title,
  description,
  primaryAction,
  secondaryAction,
  onBack,
  sticky = false
}: PageActionBarProps) {
  return (
    <div
      className={`bg-white border-b border-black/5 ${
        sticky ? 'sticky top-0 z-20' : ''
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 py-4">
        <Flex direction="row" justify="between" align="center" gap="lg" responsive>
          {/* Left: Back + Title */}
          <Flex align="center" gap="md" className="flex-1 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary flex-shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-black/70" />
              </button>
            )}
            {(title || description) && (
              <Stack spacing="xs" className="flex-1 min-w-0">
                {title && (
                  <h1 className="text-lg font-semibold text-black truncate">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-sm text-black/60 truncate">{description}</p>
                )}
              </Stack>
            )}
          </Flex>

          {/* Right: Actions */}
          {(primaryAction || secondaryAction) && (
            <Flex gap="md" className="flex-shrink-0">
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  className="px-4 py-2 text-sm font-medium border border-black/10 text-black bg-white rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                >
                  {secondaryAction.label}
                </button>
              )}
              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled || primaryAction.loading}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {primaryAction.loading ? 'Saving...' : primaryAction.label}
                </button>
              )}
            </Flex>
          )}
        </Flex>
      </div>
    </div>
  )
}

// ============================================================================
// 2. MODAL ACTION BAR - Bottom actions for modals/sheets
// ============================================================================

export interface ModalActionBarProps {
  primaryAction: {
    label: string
    onClick: () => void | Promise<void>
    disabled?: boolean
    loading?: boolean | {
      /** Custom loading message */
      message?: string
      /** Show progress percentage (0-100) */
      progress?: number
      /** Show spinner icon */
      showSpinner?: boolean
    }
    /** Auto-disable button after click to prevent double-submit */
    preventDoubleSubmit?: boolean
    /** Require confirmation before executing (for destructive actions) */
    requireConfirmation?: boolean
    /** Custom confirmation message (default: "Are you sure?") */
    confirmationMessage?: string
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'danger'
  /** Stack buttons on narrow containers (default: auto) */
  layout?: 'horizontal' | 'vertical' | 'auto'
  /** Bare mode: no border/padding/background (for use inside Modal footer) */
  bare?: boolean
  /** Enable keyboard shortcuts: Enter = primary, Escape = secondary/cancel */
  enableKeyboardShortcuts?: boolean
  /** Auto-focus primary action button on mount */
  autoFocus?: boolean
  /** Phase 2: Validation error message to display */
  validationError?: string
  /** Phase 2: Success feedback after action completes */
  successFeedback?: {
    message: string
    /** Auto-dismiss after milliseconds */
    autoDismiss?: number
  }
  /** Phase 2: Error feedback if action fails */
  errorFeedback?: {
    message: string
  }
}

/**
 * ModalActionBar - RESPONSIVE Action bar for modal footers
 * 
 * Automatically adapts to container width:
 * - Wide: Horizontal layout, right-aligned
 * - Narrow: Stacked buttons, full-width
 * - Handles long labels gracefully
 * 
 * @example
 * <ModalActionBar
 *   primaryAction={{
 *     label: 'Save Changes',
 *     onClick: handleSave,
 *     loading: isSaving
 *   }}
 *   secondaryAction={{
 *     label: 'Cancel',
 *     onClick: onClose
 *   }}
 * />
 */
export function ModalActionBar({
  primaryAction,
  secondaryAction,
  variant = 'default',
  layout = 'auto',
  bare = true, // Default to true - most common use case is inside Modal footer
  enableKeyboardShortcuts = false,
  autoFocus = false,
  validationError,
  successFeedback,
  errorFeedback
}: ModalActionBarProps) {
  // Phase 1: State management for elite features
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showConfirmation, setShowConfirmation] = React.useState(false)
  const primaryButtonRef = React.useRef<HTMLButtonElement>(null)
  
  // Phase 2: State management for feedback
  const [showSuccess, setShowSuccess] = React.useState(false)
  const [showError, setShowError] = React.useState(false)
  
  const primaryStyles =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
      : 'bg-primary text-primary-foreground hover:opacity-90 focus:ring-primary'

  // Responsive layout classes
  const containerClass = layout === 'vertical' 
    ? 'flex flex-col gap-2'
    : layout === 'horizontal'
    ? 'flex flex-row justify-end gap-2'
    : 'flex flex-col sm:flex-row sm:justify-end gap-2' // Auto: stack on mobile, horizontal on desktop

  const buttonBaseClass = layout === 'vertical' || (layout === 'auto')
    ? 'w-full sm:w-auto' // Full width on mobile, auto on desktop
    : ''
  
  // Phase 1 Feature: Auto-focus primary button on mount
  React.useEffect(() => {
    if (autoFocus && primaryButtonRef.current) {
      primaryButtonRef.current.focus()
    }
  }, [autoFocus])
  
  // Phase 2: Auto-dismiss success feedback
  React.useEffect(() => {
    if (showSuccess && successFeedback?.autoDismiss) {
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, successFeedback.autoDismiss)
      return () => clearTimeout(timer)
    }
  }, [showSuccess, successFeedback])
  
  // Helper: Check if loading (boolean or object)
  const isLoading = typeof primaryAction.loading === 'boolean' 
    ? primaryAction.loading 
    : !!primaryAction.loading
  
  // Helper: Get loading details
  const loadingDetails = typeof primaryAction.loading === 'object' ? primaryAction.loading : null
  
  // Phase 1 Feature: Keyboard shortcuts (Enter = primary, Escape = secondary)
  React.useEffect(() => {
    if (!enableKeyboardShortcuts) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (e.key === 'Enter' && !primaryAction.disabled && !isLoading && !isSubmitting) {
        e.preventDefault()
        handlePrimaryClick()
      } else if (e.key === 'Escape' && secondaryAction) {
        e.preventDefault()
        secondaryAction.onClick()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardShortcuts, primaryAction.disabled, isLoading, isSubmitting, secondaryAction])
  
  // Phase 1 & 2: Handle primary action with all elite features
  const handlePrimaryClick = async () => {
    // Phase 1: Require confirmation for destructive actions
    if (primaryAction.requireConfirmation && !showConfirmation) {
      setShowConfirmation(true)
      return
    }
    
    // Phase 1: Double-submit prevention
    if (primaryAction.preventDoubleSubmit && isSubmitting) {
      return
    }
    
    // Phase 2: Clear previous feedback
    setShowSuccess(false)
    setShowError(false)
    
    try {
      if (primaryAction.preventDoubleSubmit) {
        setIsSubmitting(true)
      }
      
      await primaryAction.onClick()
      
      setShowConfirmation(false)
      
      // Phase 2: Show success feedback
      if (successFeedback) {
        setShowSuccess(true)
      }
    } catch (error) {
      // Phase 2: Show error feedback
      if (errorFeedback) {
        setShowError(true)
      }
      console.error('Action failed:', error)
    } finally {
      if (primaryAction.preventDoubleSubmit) {
        // Small delay to prevent rapid re-clicks
        setTimeout(() => setIsSubmitting(false), 300)
      }
    }
  }
  
  // Determine if primary button should be disabled
  const isPrimaryDisabled = primaryAction.disabled || isLoading || isSubmitting

  // Phase 1: Confirmation dialog content
  const confirmationContent = showConfirmation && (
    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <p className="text-sm text-amber-900 font-medium mb-2">
        {primaryAction.confirmationMessage || 'Are you sure you want to proceed?'}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setShowConfirmation(false)}
          className="px-3 py-1.5 text-xs font-medium border border-amber-300 text-amber-900 bg-white rounded hover:bg-amber-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handlePrimaryClick}
          className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
        >
          Yes, Continue
        </button>
      </div>
    </div>
  )
  
  // Phase 2: Validation error content
  const validationContent = validationError && !showSuccess && !showError && (
    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
      <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm text-red-800">{validationError}</p>
    </div>
  )
  
  // Phase 2: Success feedback content
  const successContent = showSuccess && successFeedback && (
    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm text-green-800">{successFeedback.message}</p>
    </div>
  )
  
  // Phase 2: Error feedback content
  const errorContent = showError && errorFeedback && (
    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
      <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm text-red-800">{errorFeedback.message}</p>
    </div>
  )
  
  // Phase 2: Rich loading button label
  const getButtonLabel = () => {
    if (isLoading || isSubmitting) {
      if (loadingDetails) {
        const parts = []
        if (loadingDetails.showSpinner !== false) parts.push('⟳')
        if (loadingDetails.message) parts.push(loadingDetails.message)
        else parts.push('Processing...')
        if (loadingDetails.progress !== undefined) parts.push(`${loadingDetails.progress}%`)
        return parts.join(' ')
      }
      return 'Processing...'
    }
    return primaryAction.label
  }

  // Bare mode: just buttons, no container styling
  if (bare) {
    return (
      <div>
        {confirmationContent}
        {validationContent}
        {successContent}
        {errorContent}
        <div className={containerClass}>
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={`${buttonBaseClass} px-4 py-2 text-sm font-medium border border-black/10 text-black bg-white rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 order-2 sm:order-1`}
            >
              {secondaryAction.label}
            </button>
          )}
          <button
            ref={primaryButtonRef}
            onClick={handlePrimaryClick}
            disabled={isPrimaryDisabled}
            className={`${buttonBaseClass} px-4 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${primaryStyles} order-1 sm:order-2`}
          >
            {getButtonLabel()}
          </button>
        </div>
      </div>
    )
  }

  // Full mode: with border, padding, background (standalone usage)
  return (
    <div className="border-t border-black/5 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
      {confirmationContent}
      {validationContent}
      {successContent}
      {errorContent}
      <div className={containerClass}>
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className={`${buttonBaseClass} px-4 py-2 text-sm font-medium border border-black/10 text-black bg-white rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 order-2 sm:order-1`}
          >
            {secondaryAction.label}
          </button>
        )}
        <button
          ref={primaryButtonRef}
          onClick={handlePrimaryClick}
          disabled={isPrimaryDisabled}
          className={`${buttonBaseClass} px-4 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${primaryStyles} order-1 sm:order-2`}
        >
          {getButtonLabel()}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// 3. BULK ACTION BAR - For multi-select operations
// ============================================================================

export interface BulkActionBarProps {
  selectedCount: number
  onClear: () => void
  actions: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'danger'
    icon?: React.ReactNode
  }>
}

/**
 * BulkActionBar - Action bar for bulk operations
 * 
 * Use when multiple items are selected
 * Slides up from bottom with selected count and actions
 * 
 * @example
 * <BulkActionBar
 *   selectedCount={3}
 *   onClear={() => setSelected([])}
 *   actions={[
 *     { label: 'Export', onClick: handleExport },
 *     { label: 'Delete', onClick: handleDelete, variant: 'danger' }
 *   ]}
 * />
 */
export function BulkActionBar({
  selectedCount,
  onClear,
  actions
}: BulkActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-black/5 shadow-lg">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <Flex justify="between" align="center" gap="lg">
          {/* Left: Selected count + clear */}
          <Flex align="center" gap="md">
            <p className="text-sm font-medium text-black">
              {selectedCount} selected
            </p>
            <button
              onClick={onClear}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Clear
            </button>
          </Flex>

          {/* Right: Actions */}
          <Flex gap="md" className="flex-shrink-0">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-2 ${
                  action.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                    : 'border border-black/10 text-black bg-white hover:bg-slate-50 focus:ring-slate-300'
                }`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </Flex>
        </Flex>
      </div>
    </div>
  )
}

// ============================================================================
// 4. FLOATING ACTION BAR - Floating button(s)
// ============================================================================

export interface FloatingActionBarProps {
  primaryAction: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left'
}

/**
 * FloatingActionBar - Floating action button
 * 
 * Use for primary page action (e.g., "Add Vehicle")
 * Floats above content, typically bottom-right
 * 
 * @example
 * <FloatingActionBar
 *   primaryAction={{
 *     label: 'Add Vehicle',
 *     onClick: () => setShowModal(true),
 *     icon: <Plus className="w-5 h-5" />
 *   }}
 *   position="bottom-right"
 * />
 */
export function FloatingActionBar({
  primaryAction,
  position = 'bottom-right'
}: FloatingActionBarProps) {
  const positionStyles = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-6 left-6'
  }

  return (
    <div className={`fixed z-30 ${positionStyles[position]}`}>
      <button
        onClick={primaryAction.onClick}
        className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={primaryAction.label}
      >
        {primaryAction.icon}
        <span>{primaryAction.label}</span>
      </button>
    </div>
  )
}

// ============================================================================
// 5. WIZARD ACTION BAR - Multi-step flows
// ============================================================================

export interface WizardActionBarProps {
  currentStep: number
  totalSteps: number
  onPrevious?: () => void
  onNext?: () => void
  onSkip?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  nextLoading?: boolean
  showProgress?: boolean
}

/**
 * WizardActionBar - Navigation for multi-step flows
 * 
 * Use for onboarding, forms, or any stepped process
 * Shows progress, Previous/Next buttons, optional Skip
 * 
 * @example
 * <WizardActionBar
 *   currentStep={2}
 *   totalSteps={4}
 *   onPrevious={() => setStep(step - 1)}
 *   onNext={() => setStep(step + 1)}
 *   onSkip={() => router.push('/dashboard')}
 *   nextLabel="Continue"
 *   showProgress
 * />
 */
export function WizardActionBar({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSkip,
  nextLabel = 'Next',
  nextDisabled = false,
  nextLoading = false,
  showProgress = true
}: WizardActionBarProps) {
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps
  const progressPercent = (currentStep / totalSteps) * 100

  return (
    <div className="bg-white border-t border-black/5">
      {showProgress && (
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
          />
        </div>
      )}
      <div className="max-w-3xl mx-auto px-6 py-4">
        <Flex justify="between" align="center" gap="lg">
          {/* Left: Previous or Skip */}
          <div>
            {!isFirstStep && onPrevious && (
              <button
                onClick={onPrevious}
                className="px-4 py-2 text-sm font-medium text-black hover:bg-slate-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
              >
                Previous
              </button>
            )}
            {isFirstStep && onSkip && (
              <button
                onClick={onSkip}
                className="px-4 py-2 text-sm font-medium text-black/60 hover:text-black hover:bg-slate-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
              >
                Skip
              </button>
            )}
          </div>

          {/* Center: Step indicator */}
          <div className="text-sm text-black/60 font-medium">
            Step {currentStep} of {totalSteps}
          </div>

          {/* Right: Next */}
          {onNext && (
            <button
              onClick={onNext}
              disabled={nextDisabled || nextLoading}
              className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {nextLoading ? 'Loading...' : isLastStep ? 'Finish' : nextLabel}
            </button>
          )}
        </Flex>
      </div>
    </div>
  )
}

// ============================================================================
// 6. TOOLBAR ACTION BAR - Rich editing tools
// ============================================================================

export interface ToolbarActionBarProps {
  tools: Array<{
    icon: React.ReactNode
    label: string
    onClick: () => void
    active?: boolean
    disabled?: boolean
  }>
  groups?: boolean
}

/**
 * ToolbarActionBar - Tool buttons for editors
 * 
 * Use for text editors, drawing tools, or any rich content creation
 * Supports icon buttons, active states, grouping
 * 
 * @example
 * <ToolbarActionBar
 *   tools={[
 *     { icon: <Bold />, label: 'Bold', onClick: toggleBold, active: isBold },
 *     { icon: <Italic />, label: 'Italic', onClick: toggleItalic },
 *     { icon: <Link />, label: 'Link', onClick: insertLink }
 *   ]}
 * />
 */
export function ToolbarActionBar({ tools, groups = false }: ToolbarActionBarProps) {
  return (
    <div className="bg-white border-b border-black/5 px-4 py-2">
      <Flex gap="xs" className="flex-wrap">
        {tools.map((tool, index) => (
          <button
            key={index}
            onClick={tool.onClick}
            disabled={tool.disabled}
            title={tool.label}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ${
              tool.active
                ? 'bg-primary/10 text-primary'
                : 'text-black/70 hover:bg-slate-100'
            }`}
            aria-label={tool.label}
            aria-pressed={tool.active}
          >
            {tool.icon}
          </button>
        ))}
      </Flex>
    </div>
  )
}

// ============================================================================
// 7. COMMAND BAR - Keyboard-first navigation
// ============================================================================

export interface CommandBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSubmit?: () => void
  shortcuts?: Array<{
    label: string
    keys: string
  }>
}

/**
 * CommandBar - Keyboard-driven command input
 * 
 * Use for power users, search, or command palette
 * Shows keyboard shortcuts, supports quick navigation
 * 
 * @example
 * <CommandBar
 *   placeholder="Search or type a command..."
 *   value={query}
 *   onChange={setQuery}
 *   shortcuts={[
 *     { label: 'Search', keys: '⌘K' },
 *     { label: 'Add Vehicle', keys: '⌘N' }
 *   ]}
 * />
 */
export function CommandBar({
  placeholder = 'Search or type a command...',
  value = '',
  onChange,
  onSubmit,
  shortcuts = []
}: CommandBarProps) {
  return (
    <div className="bg-white border-b border-black/5">
      <div className="max-w-3xl mx-auto px-6 py-3">
        <Flex gap="md" align="center">
          {/* Search input */}
          <div className="flex-1">
            <input
              type="search"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
              className="w-full px-4 py-2 text-sm border border-black/10 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              aria-label="Command input"
            />
          </div>

          {/* Shortcuts */}
          {shortcuts.length > 0 && (
            <Flex gap="sm" className="flex-shrink-0">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs text-black/60"
                >
                  <span>{shortcut.label}</span>
                  <kbd className="px-2 py-1 bg-slate-100 border border-black/10 rounded text-black/70 font-mono">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </Flex>
          )}
        </Flex>
      </div>
    </div>
  )
}

// ============================================================================
// 8. CONTEXTUAL ACTION BAR - Selection-based actions
// ============================================================================

export interface ContextualActionBarProps {
  actions: Array<{
    icon: React.ReactNode
    label: string
    onClick: () => void
  }>
  position: { top: number; left: number }
  visible: boolean
}

/**
 * ContextualActionBar - Appears on text/content selection
 * 
 * Use when user selects text, images, or content
 * Floats near selection with relevant actions
 * 
 * @example
 * <ContextualActionBar
 *   visible={hasSelection}
 *   position={selectionPosition}
 *   actions={[
 *     { icon: <Copy />, label: 'Copy', onClick: handleCopy },
 *     { icon: <Share />, label: 'Share', onClick: handleShare }
 *   ]}
 * />
 */
export function ContextualActionBar({
  actions,
  position,
  visible
}: ContextualActionBarProps) {
  if (!visible) return null

  return (
    <div
      className="fixed z-50 bg-black text-white rounded-lg shadow-xl py-1 px-1 animate-in fade-in slide-in-from-bottom-2"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateY(-100%) translateY(-8px)'
      }}
    >
      <Flex gap="xs">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            title={action.label}
            className="w-9 h-9 flex items-center justify-center rounded hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={action.label}
          >
            {action.icon}
          </button>
        ))}
      </Flex>
    </div>
  )
}

// ============================================================================
// 9. BOTTOM SHEET ACTION BAR - Mobile-optimized
// ============================================================================

export interface BottomSheetActionBarProps {
  title?: string
  onClose?: () => void
  primaryAction?: {
    label: string
    onClick: () => void
    disabled?: boolean
  }
  showHandle?: boolean
}

/**
 * BottomSheetActionBar - Mobile-friendly sheet header
 * 
 * Use for mobile bottom sheets or drawers
 * Includes swipe indicator, large touch targets
 * 
 * @example
 * <BottomSheetActionBar
 *   title="Filter Options"
 *   onClose={() => setOpen(false)}
 *   primaryAction={{
 *     label: 'Apply',
 *     onClick: handleApply
 *   }}
 *   showHandle
 * />
 */
export function BottomSheetActionBar({
  title,
  onClose,
  primaryAction,
  showHandle = true
}: BottomSheetActionBarProps) {
  return (
    <div className="bg-white border-b border-black/5">
      {showHandle && (
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-black/10 rounded-full" aria-hidden="true" />
        </div>
      )}
      <div className="px-6 py-4">
        <Flex justify="between" align="center" gap="lg">
          {title && (
            <h2 className="text-lg font-semibold text-black flex-1 min-w-0 truncate">
              {title}
            </h2>
          )}
          <Flex gap="md" className="flex-shrink-0">
            {onClose && (
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-black/70" />
              </button>
            )}
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {primaryAction.label}
              </button>
            )}
          </Flex>
        </Flex>
      </div>
    </div>
  )
}
