/**
 * Form Section Header
 * 
 * Clear section headers that tell users exactly what we need.
 * 
 * Features:
 * - Clear question/title
 * - Optional description
 * - Optional icon/illustration
 * - Accessibility (proper heading levels)
 * 
 * Usage:
 * ```tsx
 * <FormSection
 *   title="What's your vehicle's VIN?"
 *   description="We'll use this to pull accurate specs and service history"
 *   icon={<Car className="w-6 h-6" />}
 * >
 *   <FormInput ... />
 * </FormSection>
 * ```
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface FormSectionProps {
  // Content
  title: string
  description?: string
  icon?: React.ReactNode
  
  // Heading level (for semantic HTML)
  level?: 1 | 2 | 3 | 4 | 5 | 6
  
  // Children (form fields)
  children: React.ReactNode
  
  // Styling
  className?: string
  spacing?: 'compact' | 'normal' | 'relaxed'
}

export function FormSection({
  title,
  description,
  icon,
  level = 2,
  children,
  className,
  spacing = 'normal',
}: FormSectionProps) {
  const Heading = `h${level}` as keyof JSX.IntrinsicElements
  
  const spacingClasses = {
    compact: 'space-y-3',
    normal: 'space-y-4',
    relaxed: 'space-y-6',
  }
  
  return (
    <section className={cn('w-full', spacingClasses[spacing], className)}>
      {/* Header */}
      <div className="space-y-2">
        {/* Icon + Title */}
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex-shrink-0 text-blue-600 mt-1">
              {icon}
            </div>
          )}
          
          <Heading className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight">
            {title}
          </Heading>
        </div>
        
        {/* Description */}
        {description && (
          <p className="text-base text-gray-600 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      
      {/* Fields */}
      <div className="space-y-4">
        {children}
      </div>
    </section>
  )
}

/**
 * Multi-field section with auto-spacing
 */
export interface FormFieldGroupProps {
  children: React.ReactNode
  columns?: 1 | 2
  className?: string
}

export function FormFieldGroup({
  children,
  columns = 1,
  className,
}: FormFieldGroupProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 2 && 'sm:grid-cols-2',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Helper section for explanations/tips
 */
export interface FormHelperProps {
  children: React.ReactNode
  type?: 'info' | 'tip' | 'warning'
  className?: string
}

export function FormHelper({
  children,
  type = 'info',
  className,
}: FormHelperProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    tip: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  }
  
  const icons = {
    info: '💡',
    tip: '✨',
    warning: '⚠️',
  }
  
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border',
        styles[type],
        className
      )}
      role="note"
    >
      <p className="text-sm flex items-start gap-2">
        <span className="text-base flex-shrink-0">{icons[type]}</span>
        <span>{children}</span>
      </p>
    </div>
  )
}
