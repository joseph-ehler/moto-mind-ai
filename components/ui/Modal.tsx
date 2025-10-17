'use client'

/**
 * Modal - Mobile-first modal system
 * 
 * Touch-friendly modals optimized for mobile with full-screen behavior
 * on small screens and centered dialogs on larger screens.
 */

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { X } from 'lucide-react'
import { Button } from './button'

// ============================================================================
// MODAL CONTEXT & HOOKS
// ============================================================================

interface ModalContextType {
  isOpen: boolean
  onClose: () => void
}

const ModalContext = React.createContext<ModalContextType | null>(null)

function useModal() {
  const context = React.useContext(ModalContext)
  if (!context) {
    throw new Error('Modal components must be used within a Modal')
  }
  return context
}

// ============================================================================
// BASE MODAL COMPONENTS
// ============================================================================

interface ModalProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

export function Modal({ children, isOpen, onClose, size = 'md', className }: ModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md sm:max-w-lg',
    lg: 'max-w-lg sm:max-w-xl lg:max-w-2xl',
    xl: 'max-w-xl sm:max-w-2xl lg:max-w-4xl',
    full: 'max-w-none'
  }

  return (
    <ModalContext.Provider value={{ isOpen, onClose }}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
        <div 
          className={cn(
            // Mobile-first: Full screen on mobile, centered on desktop
            'w-full h-full sm:h-auto sm:rounded-xl',
            'bg-white shadow-xl',
            'flex flex-col',
            'max-h-full overflow-hidden',
            // Size classes (only apply on desktop)
            'sm:w-auto sm:min-w-[400px]',
            sizeClasses[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  )
}

// ============================================================================
// MODAL HEADER
// ============================================================================

interface ModalHeaderProps {
  children: React.ReactNode
  showClose?: boolean
  className?: string
}

export function ModalHeader({ children, showClose = true, className }: ModalHeaderProps) {
  const { onClose } = useModal()
  
  return (
    <div className={cn(
      'flex items-center justify-between gap-4',
      'p-4 sm:p-6 border-b border-gray-200',
      'flex-shrink-0',
      className
    )}>
      <div className="min-w-0 flex-1">
        {children}
      </div>
      
      {showClose && (
        <button
          onClick={onClose}
          className={cn(
            'flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors',
            'min-h-[44px] min-w-[44px]' // Touch target
          )}
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

interface ModalTitleProps {
  children: React.ReactNode
  className?: string
}

export function ModalTitle({ children, className }: ModalTitleProps) {
  return (
    <h2 className={cn(
      'text-xl sm:text-2xl font-semibold text-gray-900 leading-tight',
      className
    )}>
      {children}
    </h2>
  )
}

interface ModalDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function ModalDescription({ children, className }: ModalDescriptionProps) {
  return (
    <p className={cn(
      'text-base text-gray-600 leading-relaxed mt-1',
      className
    )}>
      {children}
    </p>
  )
}

// ============================================================================
// MODAL CONTENT
// ============================================================================

interface ModalContentProps {
  children: React.ReactNode
  className?: string
}

export function ModalContent({ children, className }: ModalContentProps) {
  return (
    <div className={cn(
      'flex-1 overflow-y-auto',
      'p-4 sm:p-6',
      className
    )}>
      {children}
    </div>
  )
}

// ============================================================================
// MODAL FOOTER
// ============================================================================

interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn(
      'flex-shrink-0 border-t border-gray-200',
      'p-4 sm:p-6',
      'flex flex-col sm:flex-row gap-3 sm:justify-end',
      className
    )}>
      {children}
    </div>
  )
}

// ============================================================================
// SPECIALIZED MODAL PATTERNS
// ============================================================================

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
        <ModalDescription>{description}</ModalDescription>
      </ModalHeader>
      
      <ModalFooter>
        <Button
          onClick={onClose}
          variant="secondary"
          fullWidth
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        
        <Button
          onClick={onConfirm}
          variant={variant === 'danger' ? 'danger' : 'primary'}
          fullWidth
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  onSubmit: () => void
  submitLabel?: string
  cancelLabel?: string
  loading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function FormModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  size = 'md'
}: FormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
        {description && <ModalDescription>{description}</ModalDescription>}
      </ModalHeader>
      
      <ModalContent>
        {children}
      </ModalContent>
      
      <ModalFooter>
        <Button
          onClick={onClose}
          variant="secondary"
          fullWidth
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        
        <Button
          onClick={onSubmit}
          variant="primary"
          fullWidth
          loading={loading}
        >
          {submitLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  type?: 'info' | 'success' | 'warning' | 'error'
  actionLabel?: string
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  description,
  type = 'info',
  actionLabel = 'OK'
}: AlertModalProps) {
  const typeConfig = {
    info: { variant: 'primary' as const },
    success: { variant: 'success' as const },
    warning: { variant: 'primary' as const },
    error: { variant: 'danger' as const }
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
        <ModalDescription>{description}</ModalDescription>
      </ModalHeader>
      
      <ModalFooter>
        <Button
          onClick={onClose}
          variant={typeConfig[type].variant}
          fullWidth
        >
          {actionLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
