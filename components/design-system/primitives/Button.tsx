/**
 * Design System Button
 * 
 * Enhanced shadcn/ui Button with design system tokens
 * Mobile-first, touch-friendly, consistent with design system
 */

import React from 'react'
import { Button as ShadcnButton } from '@/components/ui/button'
import { cn, designSystem as ds, componentVariants as cv } from '@/lib/design-system'
import { Loader2 } from 'lucide-react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  // Map to shadcn variants
  const shadcnVariant = variant === 'primary' ? 'default' :
                       variant === 'danger' ? 'destructive' :
                       variant === 'success' ? 'default' :
                       variant === 'warning' ? 'default' :
                       variant as any

  const shadcnSize = size === 'sm' ? 'sm' :
                    size === 'lg' ? 'lg' : 'default'

  return (
    <ShadcnButton
      type={type}
      onClick={onClick}
      variant={shadcnVariant}
      size={shadcnSize}
      disabled={disabled || loading}
      className={cn(
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </ShadcnButton>
  )
}

// Button Group component
interface ButtonGroupProps {
  children: React.ReactNode
  orientation?: 'horizontal' | 'vertical'
  fullWidthOnMobile?: boolean
  className?: string
}

export function ButtonGroup({ 
  children, 
  orientation = 'horizontal',
  fullWidthOnMobile = true,
  className 
}: ButtonGroupProps) {
  return (
    <div className={cn(
      'flex',
      orientation === 'horizontal' ? 'flex-col sm:flex-row' : 'flex-col',
      'gap-3 sm:gap-4',
      fullWidthOnMobile && '[&>*]:w-full sm:[&>*]:w-auto',
      className
    )}>
      {children}
    </div>
  )
}
