/**
 * BaseModal - Foundation component for all modals
 * Provides consistent overlay, container, and basic structure
 */

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { BaseModalProps, modalSizeClasses } from './types'

export function BaseModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  size = 'lg',
  closeOnOverlayClick = true,
  showCloseButton = true,
  children,
}: BaseModalProps) {
  // Prevent scroll on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-white rounded-3xl w-full ${modalSizeClasses[size]} max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden border border-black/5 shadow-2xl animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

interface ModalHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  onClose?: () => void
  showCloseButton?: boolean
  variant?: 'simple' | 'standard'
}

export function ModalHeader({
  title,
  description,
  icon,
  onClose,
  showCloseButton = true,
  variant = 'standard',
}: ModalHeaderProps) {
  const paddingClass = variant === 'simple' ? 'px-6 py-4' : 'px-8 py-6'

  return (
    <div className={`${paddingClass} border-b border-black/5 flex-shrink-0`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center border border-blue-100">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-black">{title}</h2>
            {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          </div>
        </div>
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  )
}

interface ModalContentProps {
  children: React.ReactNode
  variant?: 'simple' | 'standard' | 'withFooter'
  className?: string
}

export const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, variant = 'standard', className = '' }, ref) => {
    const paddingClass = {
      simple: 'p-6',
      standard: 'p-8',
      withFooter: 'p-8 pb-24',
    }[variant]

    return (
      <div ref={ref} className={`flex-1 overflow-y-auto overflow-x-hidden ${paddingClass} ${className}`}>
        {children}
      </div>
    )
  }
)

ModalContent.displayName = 'ModalContent'

interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`flex-shrink-0 border-t bg-white p-6 rounded-b-3xl ${className}`}>
      {children}
    </div>
  )
}
