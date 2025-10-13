/**
 * MotoMind Modal System
 * 
 * Built on design system foundation with Cards, focusRing, zIndex, and accessibility
 */

import React, { useEffect, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { focusRing, interactionStates, zIndex } from '@/lib/design-system/tokens'
import { BaseCard, ColoredCard, AlertCard } from '../patterns/Cards'
import { Heading, Text, Stack, Flex } from '@/components/design-system'
import { X } from 'lucide-react'

// ============================================================================
// BASE MODAL
// ============================================================================

export interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  children: React.ReactNode
  className?: string
}

export const BaseModal = forwardRef<HTMLDivElement, BaseModalProps>(
  ({
    isOpen,
    onClose,
    size = 'md',
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    children,
    className
  }, ref) => {
    // Lock body scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
        return () => {
          document.body.style.overflow = 'unset'
        }
      }
    }, [isOpen])

    // Handle ESC key
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
      sm: 'max-w-sm',    // 384px
      md: 'max-w-md',    // 448px
      lg: 'max-w-2xl',   // 672px
      xl: 'max-w-4xl',   // 896px
      full: 'max-w-6xl'  // 1152px
    }[size]

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose()
      }
    }

    const modal = (
      <div
        className={cn(
          'fixed inset-0 flex items-center justify-center p-4',
          'bg-black/50 backdrop-blur-sm',
          'animate-in fade-in duration-200'
        )}
        style={{ zIndex: zIndex.modal }}
        onClick={handleOverlayClick}
      >
        <div
          ref={ref}
          className={cn(
            'relative w-full max-h-[90vh] overflow-y-auto',
            'bg-white rounded-lg shadow-2xl',
            'animate-in zoom-in-95 duration-200',
            sizeClasses,
            focusRing.default,
            className
          )}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className={cn(
                'absolute top-4 right-4 p-2 rounded-lg',
                'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                focusRing.default,
                interactionStates.hover.opacity
              )}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {children}
        </div>
      </div>
    )

    return createPortal(modal, document.body)
  }
)
BaseModal.displayName = 'BaseModal'

// ============================================================================
// CONTENT MODAL (Generic content)
// ============================================================================

export interface ContentModalProps extends Omit<BaseModalProps, 'children'> {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export const ContentModal = forwardRef<HTMLDivElement, ContentModalProps>(
  ({ title, description, children, footer, ...props }, ref) => {
    return (
      <BaseModal ref={ref} {...props}>
        <Stack spacing="none">
          {/* Header */}
          <div className="p-6 border-b">
            <Heading level="title">{title}</Heading>
            {description && (
              <Text size="sm" className="text-gray-600 mt-2">
                {description}
              </Text>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-6 border-t bg-gray-50">
              {footer}
            </div>
          )}
        </Stack>
      </BaseModal>
    )
  }
)
ContentModal.displayName = 'ContentModal'

// ============================================================================
// ALERT MODAL (Confirmation/Warning)
// ============================================================================

export interface AlertModalProps extends Omit<BaseModalProps, 'children'> {
  variant: 'info' | 'success' | 'warning' | 'error'
  title: string
  description: string
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
}

export const AlertModal = forwardRef<HTMLDivElement, AlertModalProps>(
  ({
    variant,
    title,
    description,
    onConfirm,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isLoading,
    onClose,
    ...props
  }, ref) => {
    return (
      <BaseModal ref={ref} size="sm" onClose={onClose} {...props}>
        <div className="p-6">
          <AlertCard
            variant={variant}
            title={title}
            description={description}
            action={{
              label: confirmLabel,
              onClick: onConfirm
            }}
          />

          {/* Actions */}
          <Flex className="gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-2 rounded-lg border',
                'font-medium text-gray-700',
                focusRing.default,
                interactionStates.hover.opacity,
                interactionStates.disabled.base
              )}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-2 rounded-lg',
                variant === 'error' ? 'bg-red-600 text-white' : 'bg-primary text-primary-foreground',
                focusRing.default,
                interactionStates.hover.opacity,
                interactionStates.disabled.base
              )}
            >
              {isLoading ? 'Loading...' : confirmLabel}
            </button>
          </Flex>
        </div>
      </BaseModal>
    )
  }
)
AlertModal.displayName = 'AlertModal'

// ============================================================================
// FORM MODAL
// ============================================================================

export interface FormModalProps extends Omit<BaseModalProps, 'children'> {
  title: string
  description?: string
  onSubmit: (e: React.FormEvent) => void | Promise<void>
  submitLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  error?: string
  children: React.ReactNode
}

export const FormModal = forwardRef<HTMLDivElement, FormModalProps>(
  ({
    title,
    description,
    onSubmit,
    submitLabel = 'Submit',
    cancelLabel = 'Cancel',
    isLoading,
    error,
    children,
    onClose,
    ...props
  }, ref) => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      await onSubmit(e)
    }

    return (
      <BaseModal ref={ref} onClose={onClose} {...props}>
        <form onSubmit={handleSubmit}>
          <Stack spacing="none">
            {/* Header */}
            <div className="p-6 border-b">
              <Heading level="title">{title}</Heading>
              {description && (
                <Text size="sm" className="text-gray-600 mt-2">
                  {description}
                </Text>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <Stack spacing="md">
                {children}
                
                {/* Error */}
                {error && (
                  <ColoredCard variant="destructive" padding="sm">
                    <Text size="sm">{error}</Text>
                  </ColoredCard>
                )}
              </Stack>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50">
              <Flex className="gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg border',
                    'font-medium text-gray-700',
                    focusRing.default,
                    interactionStates.hover.opacity,
                    interactionStates.disabled.base
                  )}
                >
                  {cancelLabel}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg',
                    'bg-primary text-primary-foreground font-medium',
                    focusRing.default,
                    interactionStates.hover.opacity,
                    interactionStates.disabled.base
                  )}
                >
                  {isLoading ? 'Submitting...' : submitLabel}
                </button>
              </Flex>
            </div>
          </Stack>
        </form>
      </BaseModal>
    )
  }
)
FormModal.displayName = 'FormModal'

// ============================================================================
// CONFIRMATION MODAL (Dangerous actions)
// ============================================================================

export interface ConfirmationModalProps extends Omit<BaseModalProps, 'children'> {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
  isDangerous?: boolean
}

export const ConfirmationModal = forwardRef<HTMLDivElement, ConfirmationModalProps>(
  ({
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    isLoading,
    isDangerous = false,
    onClose,
    ...props
  }, ref) => {
    const handleConfirm = async () => {
      await onConfirm()
    }

    return (
      <BaseModal ref={ref} size="sm" onClose={onClose} {...props}>
        <div className="p-6">
          <Stack spacing="md">
            {/* Content */}
            <div>
              <Heading level="subtitle">{title}</Heading>
              <Text size="sm" className="text-gray-600 mt-2">
                {description}
              </Text>
            </div>

            {/* Actions */}
            <Flex className="gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg border',
                  'font-medium text-gray-700',
                  focusRing.default,
                  interactionStates.hover.opacity,
                  interactionStates.disabled.base
                )}
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg font-medium',
                  isDangerous
                    ? 'bg-red-600 text-white'
                    : 'bg-primary text-primary-foreground',
                  focusRing.default,
                  interactionStates.hover.opacity,
                  interactionStates.disabled.base
                )}
              >
                {isLoading ? 'Processing...' : confirmLabel}
              </button>
            </Flex>
          </Stack>
        </div>
      </BaseModal>
    )
  }
)
ConfirmationModal.displayName = 'ConfirmationModal'

// ============================================================================
// DRAWER (Side panel)
// ============================================================================

export interface DrawerProps extends Omit<BaseModalProps, 'size'> {
  title: string
  description?: string
  position?: 'left' | 'right'
  width?: 'sm' | 'md' | 'lg'
}

export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(
  ({
    isOpen,
    onClose,
    title,
    description,
    position = 'right',
    width = 'md',
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
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

    // Handle ESC
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

    const widthClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg'
    }[width]

    const positionClasses = position === 'right' 
      ? 'right-0 animate-in slide-in-from-right duration-300'
      : 'left-0 animate-in slide-in-from-left duration-300'

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose()
      }
    }

    const drawer = (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        style={{ zIndex: zIndex.modal }}
        onClick={handleOverlayClick}
      >
        <div
          ref={ref}
          className={cn(
            'fixed inset-y-0 w-full h-full',
            'bg-white shadow-2xl',
            'flex flex-col',
            widthClasses,
            positionClasses,
            className
          )}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b flex items-start justify-between">
            <div className="flex-1">
              <Heading level="title">{title}</Heading>
              {description && (
                <Text size="sm" className="text-gray-600 mt-2">
                  {description}
                </Text>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'p-2 rounded-lg ml-4',
                  'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                  focusRing.default
                )}
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    )

    return createPortal(drawer, document.body)
  }
)
Drawer.displayName = 'Drawer'
