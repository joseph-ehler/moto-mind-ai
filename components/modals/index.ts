/**
 * Modal Design System - Public API
 * Export all modal components and types for easy importing
 */

// Base components
export { BaseModal, ModalHeader, ModalContent, ModalFooter } from './BaseModal'

// Modal variants
export { SimpleFormModal } from './SimpleFormModal'
export { BlockFormModal } from './BlockFormModal'
export { FullWidthModal } from './FullWidthModal'
export { StepperModal } from './StepperModal'
export { AlertModal } from './AlertModal'

// Backward compatibility aliases
export { BlockFormModal as CardFormModal } from './BlockFormModal'
export { StepperModal as AccordionStepperModal } from './StepperModal'

// Types and utilities
export type {
  BaseModalProps,
  SimpleFormModalProps,
  BlockFormModalProps,
  CardFormModalProps, // Legacy alias
  AlertModalProps,
  FullWidthModalProps,
  StepperModalProps,
  ModalSection,
  Step,
  ModalSize,
} from './types'

export { modalSizeClasses, MODAL_SPACING, MODAL_VIEWPORT } from './types'
