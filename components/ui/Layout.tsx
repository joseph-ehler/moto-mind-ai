/**
 * Layout - Mobile-first layout components
 * 
 * Responsive layout utilities that start mobile and enhance for desktop.
 * All components use mobile-first responsive design principles.
 */

import React from 'react'
import { cn } from '@/lib/utils/cn'

// ============================================================================
// STACK - Vertical layout with responsive spacing
// ============================================================================

interface StackProps {
  children: React.ReactNode
  spacing?: 'tight' | 'normal' | 'loose'
  className?: string
}

export function Stack({ children, spacing = 'normal', className }: StackProps) {
  const spacingClasses = {
    tight: 'space-y-2 sm:space-y-3',
    normal: 'space-y-4 sm:space-y-6',
    loose: 'space-y-6 sm:space-y-8 lg:space-y-10'
  }
  
  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {children}
    </div>
  )
}

// ============================================================================
// GRID - Responsive grid layout
// ============================================================================

interface GridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Grid({ children, columns = 2, gap = 'md', className }: GridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }
  
  const gapClasses = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  }
  
  return (
    <div className={cn('grid', gridClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  )
}

// ============================================================================
// CONTAINER - Responsive container with mobile-first padding
// ============================================================================

interface ContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: boolean
  className?: string
}

export function Container({ children, size = 'lg', padding = true, className }: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl', 
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none'
  }
  
  return (
    <div className={cn(
      'mx-auto w-full',
      sizeClasses[size],
      padding && 'px-4 sm:px-6 lg:px-8',
      className
    )}>
      {children}
    </div>
  )
}

// ============================================================================
// SECTION - Page sections with responsive spacing
// ============================================================================

interface SectionProps {
  children: React.ReactNode
  spacing?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Section({ children, spacing = 'md', className }: SectionProps) {
  const spacingClasses = {
    sm: 'py-6 sm:py-8',
    md: 'py-8 sm:py-12 lg:py-16',
    lg: 'py-12 sm:py-16 lg:py-20'
  }
  
  return (
    <section className={cn(spacingClasses[spacing], className)}>
      {children}
    </section>
  )
}

// ============================================================================
// FLEX - Flexible layouts with mobile-first responsive behavior
// ============================================================================

interface FlexProps {
  children: React.ReactNode
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  gap?: 'sm' | 'md' | 'lg'
  wrap?: boolean
  className?: string
}

export function Flex({ 
  children, 
  direction = 'row', 
  align = 'start', 
  justify = 'start',
  gap = 'md',
  wrap = false,
  className 
}: FlexProps) {
  const directionClasses = {
    row: 'flex-col sm:flex-row',      // Mobile-first: stack on mobile, row on desktop
    col: 'flex-col',
    'row-reverse': 'flex-col-reverse sm:flex-row-reverse',
    'col-reverse': 'flex-col-reverse'
  }
  
  const alignClasses = {
    start: 'items-start',
    center: 'items-center', 
    end: 'items-end',
    stretch: 'items-stretch'
  }
  
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  }
  
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6'
  }
  
  return (
    <div className={cn(
      'flex',
      directionClasses[direction],
      alignClasses[align],
      justifyClasses[justify],
      gapClasses[gap],
      wrap && 'flex-wrap',
      className
    )}>
      {children}
    </div>
  )
}
