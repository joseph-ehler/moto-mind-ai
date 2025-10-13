/**
 * Modal Internal Components
 * 
 * Standardized components that go INSIDE modals to ensure consistent design language
 * These are the building blocks for all modal content
 */

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { focusRing, interactionStates } from '@/lib/design-system/tokens'
import { Heading, Text, Stack, Flex } from '@/components/design-system'
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

// ============================================================================
// MODAL SECTION (Flat, no nested cards)
// ============================================================================

export interface ModalSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  /** Show divider below section */
  showDivider?: boolean
  className?: string
}

export const ModalSection = forwardRef<HTMLDivElement, ModalSectionProps>(
  ({ title, description, children, showDivider = true, className }, ref) => {
    return (
      <div ref={ref} className={cn('py-6 first:pt-0 last:pb-0', className)}>
        <Stack spacing="md">
          {/* Section Header */}
          <div>
            <Heading level="subtitle" className="text-gray-900">
              {title}
            </Heading>
            {description && (
              <Text size="sm" className="text-gray-600 mt-1">
                {description}
              </Text>
            )}
          </div>

          {/* Section Content */}
          <div>
            {children}
          </div>
        </Stack>

        {/* Divider */}
        {showDivider && (
          <div className="mt-6 border-b border-gray-200" />
        )}
      </div>
    )
  }
)
ModalSection.displayName = 'ModalSection'

// ============================================================================
// MODAL FORM FIELD (Consistent field layout)
// ============================================================================

export interface ModalFormFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export const ModalFormField = forwardRef<HTMLDivElement, ModalFormFieldProps>(
  ({ label, required, error, hint, children, className }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-1.5', className)}>
        {/* Label */}
        <label className="block text-sm font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* Input */}
        {children}

        {/* Hint or Error */}
        {error ? (
          <div className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : hint ? (
          <Text size="sm" className="text-gray-500">
            {hint}
          </Text>
        ) : null}
      </div>
    )
  }
)
ModalFormField.displayName = 'ModalFormField'

// ============================================================================
// MODAL HEADER (Consistent header with icon + title)
// ============================================================================

export interface ModalHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  iconColor?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  onClose?: () => void
  showCloseButton?: boolean
}

export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ title, description, icon, iconColor = 'blue', onClose, showCloseButton = true }, ref) => {
    const iconBgColors = {
      blue: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100',
      green: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100',
      red: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-100',
      yellow: 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-100',
      purple: 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100',
    }

    const iconTextColors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      red: 'text-red-600',
      yellow: 'text-yellow-600',
      purple: 'text-purple-600',
    }

    return (
      <div ref={ref} className="px-6 py-5 border-b sm:px-8 sm:py-6">
        <Flex className="items-start justify-between gap-4">
          <Flex className="items-start gap-4 flex-1">
            {/* Icon */}
            {icon && (
              <div className={cn(
                'flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border',
                iconBgColors[iconColor]
              )}>
                <div className={iconTextColors[iconColor]}>
                  {icon}
                </div>
              </div>
            )}

            {/* Title + Description */}
            <div className="flex-1 min-w-0">
              <Heading level="title" className="text-gray-900 pr-8">
                {title}
              </Heading>
              {description && (
                <Text size="sm" className="text-gray-600 mt-1">
                  {description}
                </Text>
              )}
            </div>
          </Flex>

          {/* Close Button */}
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className={cn(
                'flex-shrink-0 p-2 rounded-lg',
                'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                'transition-colors',
                focusRing.default
              )}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </Flex>
      </div>
    )
  }
)
ModalHeader.displayName = 'ModalHeader'

// ============================================================================
// MODAL CONTENT (Scrollable content area)
// ============================================================================

export interface ModalContentProps {
  children: React.ReactNode
  className?: string
  /** Add padding (default: true) */
  padded?: boolean
}

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, className, padded = true }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'overflow-y-auto flex-1',
          padded && 'px-6 py-4 sm:px-8 sm:py-6',
          className
        )}
      >
        {children}
      </div>
    )
  }
)
ModalContent.displayName = 'ModalContent'

// ============================================================================
// MODAL ACTIONS (Footer buttons)
// ============================================================================

export interface ModalActionsProps {
  /** Primary action button */
  primaryAction?: {
    label: string
    onClick: () => void
    loading?: boolean
    variant?: 'primary' | 'destructive'
  }
  /** Secondary action button */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  /** Cancel button (always shown) */
  onCancel: () => void
  cancelLabel?: string
  /** Align buttons */
  align?: 'left' | 'right' | 'space-between'
}

export const ModalActions = forwardRef<HTMLDivElement, ModalActionsProps>(
  ({
    primaryAction,
    secondaryAction,
    onCancel,
    cancelLabel = 'Cancel',
    align = 'right'
  }, ref) => {
    const alignClass = {
      left: 'justify-start',
      right: 'justify-end',
      'space-between': 'justify-between'
    }[align]

    return (
      <div
        ref={ref}
        className="px-6 py-4 border-t bg-gray-50 sm:px-8 sm:py-5"
      >
        <Flex className={cn('gap-3', alignClass)}>
          {/* Cancel */}
          <button
            onClick={onCancel}
            disabled={primaryAction?.loading}
            className={cn(
              'px-4 py-2 rounded-lg border border-gray-300',
              'text-sm font-medium text-gray-700',
              'hover:bg-gray-50',
              focusRing.default,
              interactionStates.disabled.base
            )}
          >
            {cancelLabel}
          </button>

          {/* Secondary Action */}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              disabled={primaryAction?.loading}
              className={cn(
                'px-4 py-2 rounded-lg border border-gray-300',
                'text-sm font-medium text-gray-700',
                'hover:bg-gray-50',
                focusRing.default,
                interactionStates.disabled.base
              )}
            >
              {secondaryAction.label}
            </button>
          )}

          {/* Primary Action */}
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              disabled={primaryAction.loading}
              className={cn(
                'px-4 py-2 rounded-lg',
                'text-sm font-medium',
                primaryAction.variant === 'destructive'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-primary text-primary-foreground hover:opacity-90',
                focusRing.default,
                interactionStates.disabled.base
              )}
            >
              {primaryAction.loading ? 'Loading...' : primaryAction.label}
            </button>
          )}
        </Flex>
      </div>
    )
  }
)
ModalActions.displayName = 'ModalActions'

// ============================================================================
// MODAL ALERT (Contextual alert inside modal)
// ============================================================================

export interface ModalAlertProps {
  variant: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: string
  className?: string
}

export const ModalAlert = forwardRef<HTMLDivElement, ModalAlertProps>(
  ({ variant, title, message, className }, ref) => {
    const config = {
      info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        icon: Info
      },
      success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-900',
        icon: CheckCircle2
      },
      warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-900',
        icon: AlertTriangle
      },
      error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-900',
        icon: AlertCircle
      }
    }[variant]

    const IconComponent = config.icon

    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-3 p-4 rounded-lg border',
          config.bg,
          config.border,
          className
        )}
      >
        <IconComponent className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.text)} />
        <div className="flex-1">
          {title && (
            <Text className={cn('font-semibold', config.text)}>
              {title}
            </Text>
          )}
          <Text size="sm" className={cn(config.text, title && 'mt-1')}>
            {message}
          </Text>
        </div>
      </div>
    )
  }
)
ModalAlert.displayName = 'ModalAlert'

// ============================================================================
// MODAL DIVIDER (Section separator)
// ============================================================================

export const ModalDivider = forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('border-b border-gray-200', className)}
      />
    )
  }
)
ModalDivider.displayName = 'ModalDivider'

// ============================================================================
// MODAL EMPTY STATE (For empty sections)
// ============================================================================

export interface ModalEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const ModalEmptyState = forwardRef<HTMLDivElement, ModalEmptyStateProps>(
  ({ icon, title, description, action }, ref) => {
    return (
      <div ref={ref} className="py-12 text-center">
        <Stack spacing="md" className="items-center">
          {icon && (
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              {icon}
            </div>
          )}
          <div>
            <Heading level="subtitle" className="text-gray-900">
              {title}
            </Heading>
            {description && (
              <Text size="sm" className="text-gray-600 mt-2">
                {description}
              </Text>
            )}
          </div>
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'px-4 py-2 rounded-lg',
                'text-sm font-medium',
                'bg-primary text-primary-foreground',
                focusRing.default,
                interactionStates.hover.opacity
              )}
            >
              {action.label}
            </button>
          )}
        </Stack>
      </div>
    )
  }
)
ModalEmptyState.displayName = 'ModalEmptyState'
