'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../primitives/Layout'

// ============================================================================
// FORM SECTION - MotoMind patterns
// ============================================================================

export interface FormSectionProps {
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  /** Section content */
  children: React.ReactNode
  /** Make section collapsible */
  collapsible?: boolean
  /** Default open state (when collapsible) */
  defaultOpen?: boolean
  /** Show divider line */
  showDivider?: boolean
  /** Section variant */
  variant?: 'default' | 'outlined' | 'filled'
  /** Show completion status */
  status?: 'incomplete' | 'complete' | 'error'
  /** Show progress indicator */
  progress?: {
    current: number
    total: number
    showPercentage?: boolean
  }
  /** Required indicator */
  required?: boolean
  /** Additional actions in header */
  actions?: React.ReactNode
  /** Additional className */
  className?: string
  /** Icon for the section */
  icon?: React.ReactNode
}

/**
 * FormSection - Groups related form fields with optional collapsible functionality
 * 
 * Features:
 * - Collapsible sections
 * - Progress indicators
 * - Status indicators
 * - Multiple variants
 * - Accessibility support
 * 
 * @example
 * <FormSection
 *   title="Vehicle Information"
 *   description="Basic details about the vehicle"
 *   collapsible
 *   progress={{ current: 3, total: 5 }}
 * >
 *   <Grid columns={2} gap="lg">
 *     <Input label="VIN" />
 *     <Input label="Make" />
 *   </Grid>
 * </FormSection>
 */
export function FormSection({
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
  showDivider = true,
  variant = 'default',
  status,
  progress,
  required,
  actions,
  className,
  icon
}: FormSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const sectionId = React.useId()

  const toggleOpen = React.useCallback(() => {
    if (collapsible) {
      setIsOpen(prev => !prev)
    }
  }, [collapsible])

  const variantClasses = {
    default: '',
    outlined: 'border border-black/10 rounded-lg p-6',
    filled: 'bg-slate-50 border border-black/5 rounded-lg p-6'
  }

  const statusIcons = {
    incomplete: (
      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    complete: (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  const progressPercentage = progress ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <Stack spacing="md" className={cn(variantClasses[variant], className)}>
      {/* Header */}
      {(title || description || progress || actions) && (
        <Stack spacing="sm">
          {/* Title Row */}
          {title && (
            <Flex align="start" justify="between" gap="md">
              <div
                className={cn(
                  'flex-1 flex items-center gap-2',
                  collapsible && 'cursor-pointer select-none hover:opacity-80 transition-opacity'
                )}
                onClick={toggleOpen}
                role={collapsible ? 'button' : undefined}
                aria-expanded={collapsible ? isOpen : undefined}
                tabIndex={collapsible ? 0 : undefined}
                onKeyDown={collapsible ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleOpen()
                  }
                } : undefined}
              >
                {icon && (
                  <div className="text-black/60 [&>svg]:w-5 [&>svg]:h-5 flex-shrink-0">
                    {icon}
                  </div>
                )}
                
                <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                  {title}
                  {required && <span className="text-red-500">*</span>}
                </h3>

                {status && (
                  <div className="flex-shrink-0">
                    {statusIcons[status]}
                  </div>
                )}

                {collapsible && (
                  <svg
                    className={cn(
                      'w-5 h-5 text-black/40 transition-transform duration-300 flex-shrink-0',
                      isOpen && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>

              {actions && (
                <div className="flex-shrink-0">
                  {actions}
                </div>
              )}
            </Flex>
          )}

          {/* Description */}
          {description && (
            <p className="text-sm text-black/60">
              {description}
            </p>
          )}

          {/* Progress Indicator */}
          {progress && (
            <Stack spacing="xs">
              <Flex align="center" justify="between" gap="sm">
                <span className="text-xs text-black/60">
                  {progress.current} of {progress.total} completed
                </span>
                {progress.showPercentage && (
                  <span className="text-xs font-medium text-primary">
                    {progressPercentage}%
                  </span>
                )}
              </Flex>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                  role="progressbar"
                  aria-valuenow={progress.current}
                  aria-valuemin={0}
                  aria-valuemax={progress.total}
                  aria-label={`${progress.current} of ${progress.total} completed`}
                />
              </div>
            </Stack>
          )}
        </Stack>
      )}

      {/* Divider */}
      {showDivider && (title || description || progress) && (
        <div className="h-px bg-black/10" />
      )}

      {/* Content */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          collapsible && !isOpen && 'max-h-0 opacity-0',
          collapsible && isOpen && 'max-h-[2000px] opacity-100',
          !collapsible && 'max-h-none opacity-100'
        )}
      >
        <div
          id={sectionId}
          role="region"
          aria-labelledby={title ? `${sectionId}-title` : undefined}
          className={cn(collapsible && 'pt-2')}
        >
          {children}
        </div>
      </div>
    </Stack>
  )
}

// ============================================================================
// FORM SECTION GROUP - Multiple sections with shared progress
// ============================================================================

export interface FormSectionGroupProps {
  /** Group title */
  title?: string
  /** Group description */
  description?: string
  /** Sections */
  children: React.ReactNode
  /** Overall progress */
  progress?: {
    completed: number
    total: number
  }
  /** Additional className */
  className?: string
}

/**
 * FormSectionGroup - Container for multiple FormSections with overall progress
 * 
 * @example
 * <FormSectionGroup
 *   title="Vehicle Onboarding"
 *   progress={{ completed: 2, total: 3 }}
 * >
 *   <FormSection title="Basic Info">...</FormSection>
 *   <FormSection title="Owner Details">...</FormSection>
 *   <FormSection title="Documents">...</FormSection>
 * </FormSectionGroup>
 */
export function FormSectionGroup({
  title,
  description,
  children,
  progress,
  className
}: FormSectionGroupProps) {
  const progressPercentage = progress ? Math.round((progress.completed / progress.total) * 100) : 0

  return (
    <Stack spacing="lg" className={className}>
      {/* Group Header */}
      {(title || description || progress) && (
        <Stack spacing="md">
          {title && (
            <h2 className="text-2xl font-bold text-black">
              {title}
            </h2>
          )}
          
          {description && (
            <p className="text-base text-black/60">
              {description}
            </p>
          )}

          {progress && (
            <Stack spacing="xs">
              <Flex align="center" justify="between" gap="sm">
                <span className="text-sm font-medium text-black/70">
                  Overall Progress
                </span>
                <span className="text-sm font-bold text-primary">
                  {progress.completed}/{progress.total} sections complete ({progressPercentage}%)
                </span>
              </Flex>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </Stack>
          )}
        </Stack>
      )}

      {/* Sections */}
      <Stack spacing="lg">
        {children}
      </Stack>
    </Stack>
  )
}
