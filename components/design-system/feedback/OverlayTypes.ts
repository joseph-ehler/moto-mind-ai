/**
 * Elite TypeScript Types for Overlays
 * Discriminated unions ensure type-safe props per variant
 */

import * as React from 'react'
import { ResponsiveBreakpoints } from '../feedback/OverlayUtils'

// ============================================================================
// BASE TYPES
// ============================================================================

export type OverlaySize = 'sm' | 'md' | 'lg' | 'xl' | 'full'
export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom'

// ============================================================================
// ENHANCED DRAWER TYPES (Discriminated Unions)
// ============================================================================

/**
 * Base props shared across all drawer variants
 */
interface BaseDrawerProps {
  isOpen: boolean
  onClose: () => void
  position?: DrawerPosition
  title?: string
  description?: string
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  footer?: React.ReactNode
  size?: OverlaySize
  stickyHeader?: boolean
  stickyFooter?: boolean
  responsive?: boolean
  responsiveBreakpoints?: ResponsiveBreakpoints
}

/**
 * Default drawer - generic content
 */
export interface DefaultDrawerProps extends BaseDrawerProps {
  variant?: 'default'
  children: React.ReactNode
}

/**
 * Form drawer - optimized for forms
 */
export interface FormDrawerProps extends BaseDrawerProps {
  variant: 'form'
  children: React.ReactNode
  /** Optional: Form submit handler */
  onSubmit?: (e: React.FormEvent) => void
  /** Optional: Form validation errors */
  errors?: Record<string, string>
}

/**
 * Detail drawer - optimized for reading content
 */
export interface DetailDrawerProps extends BaseDrawerProps {
  variant: 'detail'
  children: React.ReactNode
  /** Optional: Table of contents for long content */
  tableOfContents?: Array<{ id: string; label: string }>
}

/**
 * Media drawer - optimized for images/videos
 */
export interface MediaDrawerProps extends BaseDrawerProps {
  variant: 'media'
  /** Media items to display */
  media: Array<{
    id: string
    type: 'image' | 'video'
    url: string
    thumbnail?: string
    alt?: string
  }>
  /** Current media index */
  currentIndex?: number
  /** Callback when media changes */
  onMediaChange?: (index: number) => void
}

/**
 * Data drawer - optimized for tables/grids
 */
export interface DataDrawerProps<T = any> extends BaseDrawerProps {
  variant: 'data'
  /** Column definitions */
  columns: Array<{
    key: keyof T
    label: string
    width?: string
    render?: (value: any, row: T) => React.ReactNode
  }>
  /** Data rows */
  data: T[]
  /** Optional: Row click handler */
  onRowClick?: (row: T) => void
  /** Optional: Selected rows */
  selectedRows?: Set<string | number>
  /** Optional: Selection handler */
  onSelectionChange?: (selected: Set<string | number>) => void
}

/**
 * Union type - TypeScript will enforce correct props per variant!
 */
export type EnhancedDrawerProps =
  | DefaultDrawerProps
  | FormDrawerProps
  | DetailDrawerProps
  | MediaDrawerProps
  | DataDrawerProps

// ============================================================================
// MODAL VARIANTS (Future Enhancement)
// ============================================================================

/**
 * Enhanced modal props (can be expanded similarly)
 */
export interface EnhancedModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: OverlaySize
  variant?: 'default' | 'centered' | 'fullscreen'
  children: React.ReactNode
  footer?: React.ReactNode
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  responsive?: boolean
  responsiveBreakpoints?: ResponsiveBreakpoints
  /** Optional: Keyboard shortcut to open */
  keyboardShortcut?: { key: string; modifiers?: Array<'cmd' | 'ctrl' | 'shift' | 'alt'> }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if drawer is form variant
 */
export function isFormDrawer(props: EnhancedDrawerProps): props is FormDrawerProps {
  return props.variant === 'form'
}

/**
 * Type guard to check if drawer is media variant
 */
export function isMediaDrawer(props: EnhancedDrawerProps): props is MediaDrawerProps {
  return props.variant === 'media'
}

/**
 * Type guard to check if drawer is data variant
 */
export function isDataDrawer(props: EnhancedDrawerProps): props is DataDrawerProps {
  return props.variant === 'data'
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Extract data type from DataDrawerProps
 */
export type ExtractDataType<T> = T extends DataDrawerProps<infer U> ? U : never

/**
 * Props for drawer content based on variant
 */
export type DrawerContentProps<V extends EnhancedDrawerProps['variant']> = 
  V extends 'form' ? FormDrawerProps :
  V extends 'detail' ? DetailDrawerProps :
  V extends 'media' ? MediaDrawerProps :
  V extends 'data' ? DataDrawerProps :
  DefaultDrawerProps
