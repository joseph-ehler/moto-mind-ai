/**
 * Modal Design System - Type Definitions
 * Standardized modal types and interfaces for consistent UX across the app
 */

import { ReactNode } from 'react'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: ReactNode
  size?: ModalSize
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
  children: ReactNode
}

export interface SimpleFormModalProps extends Omit<BaseModalProps, 'children'> {
  onSubmit: (e: React.FormEvent) => void
  submitLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  error?: string
  children: ReactNode
}

export interface BlockFormModalProps extends Omit<BaseModalProps, 'children'> {
  onSubmit: (e: React.FormEvent) => void
  submitLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  error?: string
  sections: ModalSection[]
}

// Legacy alias for backward compatibility
export type CardFormModalProps = BlockFormModalProps

export interface ModalSection {
  id: string
  title: string
  description?: string
  content: ReactNode
  show?: boolean // Conditional visibility
}

export interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  icon?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
}

export interface FullWidthModalProps extends Omit<BaseModalProps, 'children'> {
  onSubmit?: (e: React.FormEvent) => void
  submitLabel?: string
  cancelLabel?: string
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  isLoading?: boolean
  error?: string
  children: ReactNode
}

// StepperModal (TYPE 4) - Multi-step wizards
export interface Step {
  id: string
  title: string
  content: ReactNode
  canProceed?: boolean
  isCompleted?: boolean
  autoAdvance?: boolean
  showCameraControls?: boolean
  ctaLabel?: string
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: 'skip' | 'loading'
  }
}

export interface StepperModalProps extends Omit<BaseModalProps, 'children'> {
  steps: Step[]
  currentStepId: string
  onStepChange: (stepId: string) => void
  onStepComplete: (stepId: string) => void
  onCameraCapture?: () => void
  onFileUpload?: () => void
  isProcessing?: boolean
  processingMessage?: string
}

// Size mapping to Tailwind classes
export const modalSizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',    // 384px - Alerts, simple confirmations
  md: 'max-w-md',    // 448px - Simple forms
  lg: 'max-w-2xl',   // 672px - Standard forms with cards
  xl: 'max-w-4xl',   // 896px - Full-width content
  full: 'max-w-5xl', // 1024px - Rich media modals
}

// Spacing constants for consistency
export const MODAL_SPACING = {
  headerPadding: {
    simple: 'px-6 py-4',
    standard: 'px-8 py-6',
  },
  contentPadding: {
    simple: 'p-6',
    standard: 'p-8',
    withFooter: 'p-8 pb-24', // Extra bottom padding for fixed footer
  },
  footerPadding: 'p-6',
  sectionSpacing: {
    compact: 'space-y-4',
    standard: 'space-y-6',
    relaxed: 'space-y-8',
  },
} as const

// Viewport height management
export const MODAL_VIEWPORT = {
  // Responsive max-height values
  maxHeight: {
    mobile: 'max-h-[90vh]',      // Mobile: 90vh (more screen space)
    desktop: 'sm:max-h-[85vh]',  // Desktop: 85vh (comfortable spacing)
  },
  // Overlay padding (responsive)
  overlayPadding: 'p-4 sm:p-6',
  // Typical measurements (for reference)
  typical: {
    headerHeight: '~80-90px',
    footerHeight: '~84px',
    chromeTotal: '~170px',
    // Available content = viewport - chrome
  },
} as const
