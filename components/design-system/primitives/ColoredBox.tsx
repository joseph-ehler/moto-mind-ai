/**
 * ColoredBox Component
 * 
 * ACCESSIBILITY BUILT-IN: Automatically applies correct foreground colors
 * to all children when using semantic background colors.
 * 
 * This prevents developers from accidentally creating poor contrast.
 */

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ColorVariant = 'primary' | 'secondary' | 'destructive' | 'muted' | 'accent' | 'card' | 'popover'

interface ColoredBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: ColorVariant
  /** Override the automatic foreground class (use with caution) */
  forceTextColor?: string
}

/**
 * ColoredBox with built-in accessibility
 * 
 * Automatically applies the correct foreground color to ensure proper contrast.
 * All text children will inherit the correct color automatically.
 * 
 * @example
 * ```tsx
 * <ColoredBox variant="destructive" className="p-4 rounded-lg">
 *   <Heading level="subtitle">Error</Heading>
 *   <Text>This text is automatically white for accessibility</Text>
 * </ColoredBox>
 * ```
 */
export const ColoredBox = forwardRef<HTMLDivElement, ColoredBoxProps>(
  ({ variant, forceTextColor, className, children, ...props }, ref) => {
    // Map variant to bg and text classes
    const colorClasses = {
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      muted: 'bg-muted text-muted-foreground',
      accent: 'bg-accent text-accent-foreground',
      card: 'bg-card text-card-foreground',
      popover: 'bg-popover text-popover-foreground',
    }

    return (
      <div
        ref={ref}
        className={cn(
          colorClasses[variant],
          forceTextColor, // Allow override if absolutely necessary
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ColoredBox.displayName = 'ColoredBox'

/**
 * Specialized ColoredBox variants for common use cases
 */

export const PrimaryBox = forwardRef<HTMLDivElement, Omit<ColoredBoxProps, 'variant'>>(
  (props, ref) => <ColoredBox ref={ref} variant="primary" {...props} />
)
PrimaryBox.displayName = 'PrimaryBox'

export const DestructiveBox = forwardRef<HTMLDivElement, Omit<ColoredBoxProps, 'variant'>>(
  (props, ref) => <ColoredBox ref={ref} variant="destructive" {...props} />
)
DestructiveBox.displayName = 'DestructiveBox'

export const SecondaryBox = forwardRef<HTMLDivElement, Omit<ColoredBoxProps, 'variant'>>(
  (props, ref) => <ColoredBox ref={ref} variant="secondary" {...props} />
)
SecondaryBox.displayName = 'SecondaryBox'

export const MutedBox = forwardRef<HTMLDivElement, Omit<ColoredBoxProps, 'variant'>>(
  (props, ref) => <ColoredBox ref={ref} variant="muted" {...props} />
)
MutedBox.displayName = 'MutedBox'

export const AccentBox = forwardRef<HTMLDivElement, Omit<ColoredBoxProps, 'variant'>>(
  (props, ref) => <ColoredBox ref={ref} variant="accent" {...props} />
)
AccentBox.displayName = 'AccentBox'
