/**
 * Comprehensive Surface System
 * 
 * Surfaces are containers with elevation that create visual hierarchy.
 * Based on Material Design principles with shadcn/ui styling.
 */

import React, { forwardRef } from 'react'
import { cn } from '@/lib/design-system'

// Elevation levels from Material Design
const elevationStyles = {
  0: 'shadow-none',
  1: 'shadow-sm',
  2: 'shadow',
  3: 'shadow-md',
  4: 'shadow-lg',
  8: 'shadow-xl',
  16: 'shadow-2xl',
  24: 'shadow-2xl'
} as const

type Elevation = keyof typeof elevationStyles

// ============================================================================
// BASE SURFACE COMPONENT
// ============================================================================

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation
  interactive?: boolean
  border?: boolean | 'none' | 'default' | 'accent'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ 
    elevation = 1, 
    interactive = false, 
    border = 'default', // DEFAULT: surfaces have borders for accessibility
    rounded = 'lg',
    className, 
    ...props 
  }, ref) => {
    const borderStyles = {
      none: '',
      default: 'border border-border',
      accent: 'border-2 border-primary'
    }
    
    const roundedStyles = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-card text-card-foreground',
          roundedStyles[rounded],
          elevationStyles[elevation],
          // Border is DEFAULT for accessibility
          border === false ? '' : 
          border === true ? borderStyles.default :
          typeof border === 'string' && borderStyles[border as keyof typeof borderStyles],
          interactive && 'cursor-pointer transition-shadow hover:shadow-lg',
          className
        )}
        {...props}
      />
    )
  }
)

Surface.displayName = 'Surface'

// ============================================================================
// NOTE: Card components removed from here
// ============================================================================
// 
// Card primitives are now exported directly from shadcn/ui (components/ui/card.tsx)
// This avoids redundancy and keeps a single source of truth.
// 
// Enhanced Card with padding/elevation props lives in patterns/Card.tsx
// 
// Architecture:
//   shadcn Card (base) → Enhanced Pattern Card (design system features)
// ============================================================================
