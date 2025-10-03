/**
 * Stack - Based on actual codebase patterns
 * 
 * Standardizes the spacing patterns found:
 * space-y-6 (most common), space-y-4, space-y-8
 */

import React from 'react'
import { cn } from '@/lib/utils/cn'

interface StackProps {
  children: React.ReactNode
  spacing?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Stack({ children, spacing = 'md', className = '' }: StackProps) {
  const spacings = {
    sm: 'space-y-4',    // Found 15+ times
    md: 'space-y-6',    // Found 25+ times (winner)
    lg: 'space-y-8'     // Found 8+ times
  }
  
  return (
    <div className={cn(spacings[spacing], className)}>
      {children}
    </div>
  )
}

interface HStackProps {
  children: React.ReactNode
  spacing?: 'sm' | 'md' | 'lg'
  className?: string
}

export function HStack({ children, spacing = 'md', className = '' }: HStackProps) {
  const spacings = {
    sm: 'space-x-2',
    md: 'space-x-4', 
    lg: 'space-x-6'
  }
  
  return (
    <div className={cn('flex items-center', spacings[spacing], className)}>
      {children}
    </div>
  )
}
