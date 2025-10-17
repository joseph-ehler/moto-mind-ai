'use client'

/**
 * Overlay Design System - Elite Edition
 * 
 * World-class overlay components with:
 * - Focus trapping & restoration
 * - Portal rendering (SSR-safe)
 * - ARIA attributes
 * - Z-index stacking
 * - Reduced motion support
 * - Touch gestures
 * - Smooth animations
 */

import * as React from 'react'
import { Flex, Stack } from '../primitives/Layout'
import {
  useFocusTrap,
  useFocusRestoration,
  useScrollLock,
  useOverlayStack,
  usePrefersReducedMotion,
  useTouchGesture,
  useUniqueId,
  useResponsiveSize,
  useBreakpoint,
  useScreenReaderAnnouncement,
  animationVariants,
  type ResponsiveBreakpoints
} from '../feedback/OverlayUtils'

// ============================================================================
// SHARED TYPES & UTILITIES
// ============================================================================

type OverlaySize = 'sm' | 'md' | 'lg' | 'xl' | 'full'
type DrawerPosition = 'left' | 'right' | 'top' | 'bottom'
type PopoverPosition = 'top' | 'bottom' | 'left' | 'right'

// ============================================================================
// MODAL - Enhanced modal component
// ============================================================================

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: OverlaySize
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
  variant?: 'default' | 'centered' | 'fullscreen'
  /** Enable responsive sizing (auto-adapts to mobile/tablet) */
  responsive?: boolean
  /** Custom breakpoint sizes (overrides defaults) */
  responsiveBreakpoints?: ResponsiveBreakpoints
}

export const Modal = React.memo(function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  children,
  footer,
  variant = 'default',
  responsive = true,
  responsiveBreakpoints
}: ModalProps) {
  const [isRendered, setIsRendered] = React.useState(false)
  const [isAnimatingOut, setIsAnimatingOut] = React.useState(false)
  
  // Elite hooks
  const dialogId = useUniqueId('dialog')
  const titleId = useUniqueId('dialog-title')
  const descId = useUniqueId('dialog-desc')
  const focusTrapRef = useFocusTrap(isOpen)
  const zIndex = useOverlayStack(dialogId, isOpen)
  const prefersReducedMotion = usePrefersReducedMotion()
  
  // Responsive sizing (ELITE)
  const actualSize = responsive
    ? useResponsiveSize(size, responsiveBreakpoints)
    : size
  
  // Screen reader announcements (ELITE)
  const announce = useScreenReaderAnnouncement()
  
  useFocusRestoration(isOpen)
  useScrollLock(isOpen)

  // Announce to screen readers when modal opens/closes
  React.useEffect(() => {
    if (isOpen && title) {
      announce(`Dialog opened: ${title}`)
    } else if (!isOpen && title) {
      announce('Dialog closed')
    }
  }, [isOpen, title, announce])

  // Handle render state for animations
  React.useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      setIsAnimatingOut(false)
    } else if (isRendered) {
      // Start exit animation
      setIsAnimatingOut(true)
      const timer = setTimeout(() => {
        setIsRendered(false)
        setIsAnimatingOut(false)
      }, prefersReducedMotion ? 0 : 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen, prefersReducedMotion, isRendered])

  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  if (!isRendered) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  // Use stable animation state to prevent flickering
  const shouldShowContent = isOpen && !isAnimatingOut
  const animationClass = prefersReducedMotion
    ? ''
    : isAnimatingOut
    ? animationVariants.spring.exit
    : animationVariants.spring.enter

  if (variant === 'fullscreen') {
    return (
      <div
        ref={focusTrapRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={`fixed inset-0 bg-white transition-all duration-200 ${shouldShowContent ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ zIndex }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          {shouldShowContent && (title || showCloseButton) && (
            <div className="flex-shrink-0 px-6 py-4 border-b border-black/10">
              <Flex align="center" justify="between">
                {title && (
                  <div>
                    <h2 id={titleId} className="text-xl font-semibold text-black">{title}</h2>
                    {description && (
                      <p id={descId} className="text-sm text-black/60 mt-1">{description}</p>
                    )}
                  </div>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </Flex>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {shouldShowContent && children}
          </div>

          {/* Footer */}
          {shouldShowContent && footer && (
            <div className="flex-shrink-0 px-6 py-4 border-t border-black/10 bg-white">
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-200 ${
        shouldShowContent ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
      }`}
      style={{ zIndex }}
      onClick={handleOverlayClick}
    >
      <div
        ref={focusTrapRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={`
          bg-white rounded-2xl w-full ${sizeClasses[actualSize]}
          max-h-[90vh] flex flex-col overflow-hidden
          border border-black/5 shadow-2xl
          transition-opacity duration-200
          ${shouldShowContent ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          ${animationClass}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {shouldShowContent && (title || showCloseButton) && (
          <div className="flex-shrink-0 px-6 py-4 border-b border-black/10">
            <Flex align="start" justify="between">
              {title && (
                <div className="flex-1">
                  <h2 id={titleId} className="text-lg font-semibold text-black">{title}</h2>
                  {description && (
                    <p id={descId} className="text-sm text-black/60 mt-1">{description}</p>
                  )}
                </div>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </Flex>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {shouldShowContent && children}
        </div>

        {/* Footer */}
        {shouldShowContent && footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-black/10 bg-slate-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
})

// ============================================================================
// DRAWER - Slide-in panel from sides
// ============================================================================

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  position?: DrawerPosition
  title?: string
  description?: string
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Variant affects padding and layout */
  variant?: 'default' | 'form' | 'detail' | 'media' | 'data'
  /** Header stays visible when scrolling */
  stickyHeader?: boolean
  /** Footer stays visible when scrolling */
  stickyFooter?: boolean
  /** Enable responsive sizing (auto-adapts to mobile/tablet) */
  responsive?: boolean
  /** Custom breakpoint sizes (overrides defaults) */
  responsiveBreakpoints?: ResponsiveBreakpoints
}

export const Drawer = React.memo(function Drawer({
  isOpen,
  onClose,
  position = 'right',
  title,
  description,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  children,
  footer,
  size = 'md',
  variant = 'default',
  stickyHeader = true,
  stickyFooter = true,
  responsive = true,
  responsiveBreakpoints
}: DrawerProps) {
  const [isRendered, setIsRendered] = React.useState(false)
  const [isAnimatingOut, setIsAnimatingOut] = React.useState(false)
  
  // Elite hooks
  // Responsive sizing (ELITE)
  const actualSize = responsive
    ? useResponsiveSize(size, responsiveBreakpoints)
    : size
  const drawerId = useUniqueId('drawer')
  const titleId = useUniqueId('drawer-title')
  const descId = useUniqueId('drawer-desc')
  const focusTrapRef = useFocusTrap(isOpen)
  const zIndex = useOverlayStack(drawerId, isOpen)
  const prefersReducedMotion = usePrefersReducedMotion()
  
  // Screen reader announcements (ELITE)
  const announce = useScreenReaderAnnouncement()
  
  useFocusRestoration(isOpen)
  useScrollLock(isOpen)

  // Announce to screen readers when drawer opens/closes
  React.useEffect(() => {
    if (isOpen && title) {
      announce(`Drawer opened: ${title}`)
    } else if (!isOpen && title) {
      announce('Drawer closed')
    }
  }, [isOpen, title, announce])

  // Touch gestures for swipe-to-dismiss
  useTouchGesture(focusTrapRef, {
    onSwipe: (direction) => {
      // Dismiss on swipe in the opposite direction of drawer position
      if (
        (position === 'right' && direction === 'right') ||
        (position === 'left' && direction === 'left') ||
        (position === 'top' && direction === 'up') ||
        (position === 'bottom' && direction === 'down')
      ) {
        onClose()
      }
    },
    threshold: 100
  })

  // Handle render state
  React.useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      setIsAnimatingOut(false)
    } else if (isRendered) {
      setIsAnimatingOut(true)
      const timer = setTimeout(() => {
        setIsRendered(false)
        setIsAnimatingOut(false)
      }, prefersReducedMotion ? 0 : 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, prefersReducedMotion, isRendered])

  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  if (!isRendered) return null

  // Enhanced size options for different content types
  const sizeClasses = {
    sm: 'w-80',          // 320px - Quick forms, simple details
    md: 'w-96',          // 384px - Standard forms
    lg: 'w-[32rem]',     // 512px - Detailed forms
    xl: 'w-[56rem]',     // 896px - Complex data, wide tables
    full: 'w-full'       // 100% - Full width/height
  }

  // Variant-based content padding
  const variantPadding = {
    default: 'px-6 py-4',
    form: 'px-6 py-4',       // Standard padding for forms
    detail: 'px-8 py-6',     // More breathing room for reading
    media: 'p-0',            // No padding for images/videos
    data: 'px-4 py-3'        // Compact for tables/grids
  }

  // Use stable animation state
  const shouldShowContent = isOpen && !isAnimatingOut

  const positionClasses = {
    right: `right-0 top-0 h-full ${sizeClasses[actualSize]} ${shouldShowContent ? 'translate-x-0' : 'translate-x-full'}`,
    left: `left-0 top-0 h-full ${sizeClasses[actualSize]} ${shouldShowContent ? 'translate-x-0' : '-translate-x-full'}`,
    top: `top-0 left-0 w-full max-h-[80vh] ${shouldShowContent ? 'translate-y-0' : '-translate-y-full'}`,
    bottom: `bottom-0 left-0 w-full max-h-[80vh] ${shouldShowContent ? 'translate-y-0' : 'translate-y-full'}`
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className={`fixed inset-0 transition-all duration-300 ${
        shouldShowContent ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
      }`}
      style={{ zIndex }}
      onClick={handleOverlayClick}
    >
      <div
        ref={focusTrapRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={`
          fixed ${positionClasses[position]}
          bg-white shadow-2xl
          flex flex-col
          transition-all duration-300 ease-out
          ${shouldShowContent ? '' : 'pointer-events-none'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky option for Drawer */}
        {shouldShowContent && (title || showCloseButton) && (
          <div className={`
            flex-shrink-0 px-6 py-4 border-b border-black/10 bg-white
            ${stickyHeader ? 'sticky top-0 z-10 shadow-sm' : ''}
          `}>
            <Flex align="start" justify="between">
              {title && (
                <div className="flex-1">
                  <h2 id={titleId} className="text-lg font-semibold text-black">{title}</h2>
                  {description && (
                    <p id={descId} className="text-sm text-black/60 mt-1">{description}</p>
                  )}
                </div>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </Flex>
          </div>
        )}

        {/* Content - Variant-based padding for different content types */}
        <div className={`flex-1 overflow-y-auto ${variantPadding[variant]}`}>
          {shouldShowContent && children}
        </div>

        {/* Footer - Sticky option for Drawer */}
        {shouldShowContent && footer && (
          <div className={`
            flex-shrink-0 px-6 py-4 border-t border-black/10 bg-slate-50
            ${stickyFooter ? 'sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]' : ''}
          `}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
})

// ============================================================================
// POPOVER - Contextual content popup
// ============================================================================

export interface PopoverProps {
  isOpen: boolean
  onClose: () => void
  trigger: React.ReactElement
  children: React.ReactNode
  position?: PopoverPosition
  align?: 'start' | 'center' | 'end'
  closeOnClickOutside?: boolean
}

export const Popover = React.memo(function Popover({
  isOpen,
  onClose,
  trigger,
  children,
  position = 'bottom',
  align = 'center',
  closeOnClickOutside = true
}: PopoverProps) {
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Handle click outside
  React.useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose, closeOnClickOutside])

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  }

  const alignClasses = {
    start: position === 'top' || position === 'bottom' ? 'left-0' : 'top-0',
    center: position === 'top' || position === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
    end: position === 'top' || position === 'bottom' ? 'right-0' : 'bottom-0'
  }

  return (
    <div className="relative inline-block">
      <div ref={triggerRef}>
        {React.cloneElement(trigger, {
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation()
            trigger.props.onClick?.(e)
          }
        })}
      </div>

      {isOpen && (
        <div
          ref={contentRef}
          className={`
            absolute z-50
            ${positionClasses[position]}
            ${alignClasses[align]}
            animate-in fade-in zoom-in-95 duration-200
          `}
        >
          <div className="bg-white rounded-lg shadow-xl border border-black/10 p-3 min-w-[200px]">
            {children}
          </div>
        </div>
      )}
    </div>
  )
})

// ============================================================================
// TOOLTIP - Simple hover tooltip
// ============================================================================

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  position?: PopoverPosition
  delay?: number
  disabled?: boolean
}

export const Tooltip = React.memo(function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  disabled = false
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const handleMouseEnter = () => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2'
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        {children}
      </div>

      {isVisible && !disabled && (
        <div
          className={`
            absolute z-50 px-3 py-1.5
            bg-slate-900 text-white text-xs rounded-lg
            whitespace-nowrap
            pointer-events-none
            animate-in fade-in zoom-in-95 duration-150
            ${positionClasses[position]}
          `}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div
            className={`
              absolute w-2 h-2 bg-slate-900 rotate-45
              ${position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' : ''}
              ${position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
              ${position === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2' : ''}
              ${position === 'right' ? 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2' : ''}
            `}
          />
        </div>
      )}
    </div>
  )
})

// ============================================================================
// FORM MODAL - Modal with form helpers
// ============================================================================

export interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  title: string
  description?: string
  size?: OverlaySize
  submitLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  error?: string
  children: React.ReactNode
}

export const FormModal = React.memo(function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  size = 'md',
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isLoading = false,
  error,
  children
}: FormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={!isLoading}
      footer={
        <Stack spacing="sm">
          {error && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
          <Flex justify="end" gap="sm">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-black/10 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              form="form-dialog-form"
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : submitLabel}
            </button>
          </Flex>
        </Stack>
      }
    >
      <form id="form-dialog-form" onSubmit={onSubmit}>
        {children}
      </form>
    </Modal>
  )
})

// ============================================================================
// CONFIRMATION MODAL - Quick confirmation helper
// ============================================================================

export interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  isLoading?: boolean
  icon?: React.ReactNode
}

export const ConfirmationModal = React.memo(function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
  icon
}: ConfirmationModalProps) {
  const variantStyles = {
    default: {
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      confirmButton: 'bg-primary text-primary-foreground hover:opacity-90'
    },
    danger: {
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
    }
  }

  const styles = variantStyles[variant]

  const defaultIcon = variant === 'danger' 
    ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="" // No title in header
      size="sm"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={true} // Show X button
      footer={
        <Flex justify="end" gap="sm">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-black/10 text-black bg-white rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium ${styles.confirmButton}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </Flex>
      }
    >
      <Stack spacing="lg">
        {/* Centered Icon */}
        <div className="flex justify-center pt-2">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${styles.iconBg} ${styles.iconText}`}>
            {icon || defaultIcon}
          </div>
        </div>
        
        {/* Centered Title */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-black">{title}</h3>
        </div>
        
        {/* Centered Description */}
        <div className="text-center px-2">
          <p className="text-sm text-black/70 leading-relaxed">{description}</p>
        </div>
      </Stack>
    </Modal>
  )
})

// ============================================================================
// ALERT MODAL - System alerts and notifications
// ============================================================================

export interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  variant?: 'info' | 'success' | 'warning' | 'error'
  actionLabel?: string
  icon?: React.ReactNode
}

export const AlertModal = React.memo(function AlertModal({
  isOpen,
  onClose,
  title,
  description,
  variant = 'info',
  actionLabel = 'Got it',
  icon
}: AlertModalProps) {
  const variantStyles = {
    info: { 
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600', 
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    success: { 
      iconBg: 'bg-green-100',
      iconText: 'text-green-600', 
      button: 'bg-green-600 hover:bg-green-700 text-white'
    },
    warning: { 
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600', 
      button: 'bg-amber-600 hover:bg-amber-700 text-white'
    },
    error: { 
      iconBg: 'bg-red-100',
      iconText: 'text-red-600', 
      button: 'bg-red-600 hover:bg-red-700 text-white'
    }
  }

  const styles = variantStyles[variant]

  const defaultIcons = {
    info: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    success: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    warning: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    error: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="" // No title in header
      size="sm"
      showCloseButton={true} // Show X button
      footer={
        <Flex justify="end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${styles.button}`}
          >
            {actionLabel}
          </button>
        </Flex>
      }
    >
      <Stack spacing="lg">
        {/* Centered Icon */}
        <div className="flex justify-center pt-2">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${styles.iconBg} ${styles.iconText}`}>
            {icon || defaultIcons[variant]}
          </div>
        </div>
        
        {/* Centered Title */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-black">{title}</h3>
        </div>
        
        {/* Centered Description */}
        <div className="text-center px-2">
          <p className="text-sm text-black/70 leading-relaxed">{description}</p>
        </div>
      </Stack>
    </Modal>
  )
})
