'use client'

/**
 * Complete Modal System
 * 
 * Comprehensive modal types built on ModalInternals for consistent design language
 * Uses design system foundation: zIndex, focusRing, interactionStates, ColoredBox
 */

import React, { useEffect, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { focusRing, zIndex } from '@/lib/design-system/tokens'
import { Stack } from '@/components/design-system'
import {
  ModalHeader,
  ModalContent,
  ModalActions,
  ModalSection,
  ModalFormField,
  ModalAlert
} from '../feedback/ModalInternals'

// ============================================================================
// BASE MODAL FOUNDATION
// ============================================================================

export interface BaseModalShellProps {
  isOpen: boolean
  onClose: () => void
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  children: React.ReactNode
  className?: string
}

export const BaseModalShell = forwardRef<HTMLDivElement, BaseModalShellProps>(
  ({
    isOpen,
    onClose,
    size = 'md',
    closeOnOverlayClick = true,
    closeOnEscape = true,
    children,
    className
  }, ref) => {
    // Lock body scroll
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
        return () => {
          document.body.style.overflow = 'unset'
        }
      }
    }, [isOpen])

    // ESC key
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }

      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }, [isOpen, closeOnEscape, onClose])

    if (!isOpen) return null

    const sizeClasses = {
      sm: 'max-w-sm',    // 384px - Alerts
      md: 'max-w-md',    // 448px - Simple forms
      lg: 'max-w-2xl',   // 672px - Standard forms
      xl: 'max-w-4xl',   // 896px - Wide content
      full: 'max-w-6xl'  // 1152px - Full width
    }[size]

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose()
      }
    }

    const modal = (
      <div
        className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        style={{ zIndex: zIndex.modal }}
        onClick={handleOverlayClick}
      >
        <div
          ref={ref}
          className={cn(
            'relative w-full max-h-[90vh] sm:max-h-[85vh]',
            'bg-white rounded-3xl shadow-2xl',
            'flex flex-col overflow-hidden',
            'border border-black/5',
            'animate-in zoom-in-95 duration-200',
            sizeClasses,
            focusRing.default,
            className
          )}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    )

    return createPortal(modal, document.body)
  }
)
BaseModalShell.displayName = 'BaseModalShell'

// ============================================================================
// 1. SIMPLE FORM MODAL (Quick edits, single purpose)
// ============================================================================

export interface SimpleFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void | Promise<void>
  title: string
  description?: string
  icon?: React.ReactNode
  iconColor?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  submitLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  error?: string
  children: React.ReactNode
}

export const SimpleFormModal = forwardRef<HTMLDivElement, SimpleFormModalProps>(
  ({
    isOpen,
    onClose,
    onSubmit,
    title,
    description,
    icon,
    iconColor,
    submitLabel = 'Save',
    cancelLabel = 'Cancel',
    isLoading,
    error,
    children
  }, ref) => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      await onSubmit(e)
    }

    return (
      <BaseModalShell
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        closeOnOverlayClick={!isLoading}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <ModalHeader
            title={title}
            description={description}
            icon={icon}
            iconColor={iconColor}
            onClose={onClose}
          />

          <ModalContent>
            <Stack spacing="md">
              {error && (
                <ModalAlert variant="error" message={error} />
              )}
              {children}
            </Stack>
          </ModalContent>

          <ModalActions
            primaryAction={{
              label: submitLabel,
              onClick: () => {}, // Form submission handled by form element
              loading: isLoading
            }}
            onCancel={onClose}
            cancelLabel={cancelLabel}
          />
        </form>
      </BaseModalShell>
    )
  }
)
SimpleFormModal.displayName = 'SimpleFormModal'

// ============================================================================
// 2. BLOCK FORM MODAL (Most common - 2-5 sections)
// ============================================================================

export interface ModalSectionConfig {
  id: string
  title: string
  description?: string
  content: React.ReactNode
  show?: boolean
}

export interface BlockFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void | Promise<void>
  title: string
  description?: string
  icon?: React.ReactNode
  iconColor?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  sections: ModalSectionConfig[]
  submitLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  error?: string
}

export const BlockFormModal = forwardRef<HTMLDivElement, BlockFormModalProps>(
  ({
    isOpen,
    onClose,
    onSubmit,
    title,
    description,
    icon,
    iconColor,
    sections,
    submitLabel = 'Save Changes',
    cancelLabel = 'Cancel',
    isLoading,
    error
  }, ref) => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      await onSubmit(e)
    }

    const visibleSections = sections.filter(section => section.show !== false)

    return (
      <BaseModalShell
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        closeOnOverlayClick={!isLoading}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <ModalHeader
            title={title}
            description={description}
            icon={icon}
            iconColor={iconColor}
            onClose={onClose}
          />

          <ModalContent>
            <Stack spacing="none">
              {error && (
                <div className="mb-6">
                  <ModalAlert variant="error" message={error} />
                </div>
              )}
              
              {visibleSections.map((section, index) => (
                <ModalSection
                  key={section.id}
                  title={section.title}
                  description={section.description}
                  showDivider={index < visibleSections.length - 1}
                >
                  {section.content}
                </ModalSection>
              ))}
            </Stack>
          </ModalContent>

          <ModalActions
            primaryAction={{
              label: submitLabel,
              onClick: () => {},
              loading: isLoading
            }}
            onCancel={onClose}
            cancelLabel={cancelLabel}
          />
        </form>
      </BaseModalShell>
    )
  }
)
BlockFormModal.displayName = 'BlockFormModal'

// ============================================================================
// 3. FULL WIDTH MODAL (Rich content, images, split layouts)
// ============================================================================

export interface FullWidthModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (e: React.FormEvent) => void | Promise<void>
  title: string
  description?: string
  icon?: React.ReactNode
  iconColor?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  submitLabel?: string
  cancelLabel?: string
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  isLoading?: boolean
  error?: string
  children: React.ReactNode
}

export const FullWidthModal = forwardRef<HTMLDivElement, FullWidthModalProps>(
  ({
    isOpen,
    onClose,
    onSubmit,
    title,
    description,
    icon,
    iconColor,
    submitLabel = 'Confirm',
    cancelLabel = 'Cancel',
    secondaryAction,
    isLoading,
    error,
    children
  }, ref) => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (onSubmit) await onSubmit(e)
    }

    const content = (
      <>
        <ModalHeader
          title={title}
          description={description}
          icon={icon}
          iconColor={iconColor}
          onClose={onClose}
        />

        <ModalContent>
          <Stack spacing="md">
            {error && (
              <ModalAlert variant="error" message={error} />
            )}
            {children}
          </Stack>
        </ModalContent>

        <ModalActions
          primaryAction={onSubmit ? {
            label: submitLabel,
            onClick: () => {},
            loading: isLoading
          } : undefined}
          secondaryAction={secondaryAction}
          onCancel={onClose}
          cancelLabel={cancelLabel}
        />
      </>
    )

    return (
      <BaseModalShell
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        closeOnOverlayClick={!isLoading}
      >
        {onSubmit ? (
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {content}
          </form>
        ) : (
          <div className="flex flex-col h-full">
            {content}
          </div>
        )}
      </BaseModalShell>
    )
  }
)
FullWidthModal.displayName = 'FullWidthModal'

// ============================================================================
// 4. ALERT MODAL (Destructive actions, confirmations)
// ============================================================================

export interface AlertModalSystemProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  variant?: 'info' | 'success' | 'warning' | 'error'
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
}

export const AlertModalSystem = forwardRef<HTMLDivElement, AlertModalSystemProps>(
  ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    variant = 'info',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isLoading
  }, ref) => {
    const config = {
      info: { icon: 'ℹ️', iconColor: 'blue' as const },
      success: { icon: '✓', iconColor: 'green' as const },
      warning: { icon: '⚠', iconColor: 'yellow' as const },
      error: { icon: '✕', iconColor: 'red' as const }
    }[variant]

    const handleConfirm = async () => {
      await onConfirm()
    }

    return (
      <BaseModalShell
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        size="sm"
        closeOnOverlayClick={!isLoading}
      >
        <div className="p-6">
          <Stack spacing="md">
            {/* Icon */}
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-xl',
              variant === 'error' && 'bg-red-100',
              variant === 'warning' && 'bg-yellow-100',
              variant === 'success' && 'bg-green-100',
              variant === 'info' && 'bg-blue-100'
            )}>
              {config.icon}
            </div>

            {/* Content */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isLoading}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg border',
                  'text-sm font-medium text-gray-700',
                  'hover:bg-gray-50',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg',
                  'text-sm font-medium',
                  variant === 'error'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-primary text-primary-foreground hover:opacity-90',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isLoading ? 'Loading...' : confirmLabel}
              </button>
            </div>
          </Stack>
        </div>
      </BaseModalShell>
    )
  }
)
AlertModalSystem.displayName = 'AlertModalSystem'

// ============================================================================
// 5. CONFIRMATION MODAL (Simple yes/no)
// ============================================================================

export interface ConfirmationModalSystemProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  isDangerous?: boolean
  isLoading?: boolean
}

export const ConfirmationModalSystem = forwardRef<HTMLDivElement, ConfirmationModalSystemProps>(
  ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDangerous = false,
    isLoading
  }, ref) => {
    return (
      <AlertModalSystem
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onConfirm}
        title={title}
        description={description}
        variant={isDangerous ? 'error' : 'info'}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        isLoading={isLoading}
      />
    )
  }
)
ConfirmationModalSystem.displayName = 'ConfirmationModalSystem'
