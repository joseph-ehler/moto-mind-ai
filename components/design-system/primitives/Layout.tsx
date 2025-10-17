/**
 * Layout Design System
 * 
 * Comprehensive layout system for responsive, mobile-first designs
 * Built on CSS Grid, Flexbox, and Tailwind utilities
 */

import React from 'react'
import { cn } from '@/lib/design-system'

// ============================================================================
// BREAKPOINT SYSTEM
// ============================================================================

export const breakpoints = {
  sm: '640px',   // Small devices (phones)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (laptops)
  xl: '1280px',  // Extra large devices (desktops)
  '2xl': '1536px' // 2X large devices (large desktops)
} as const

// ============================================================================
// CONTAINER - Responsive content wrapper with UX rules enforcement
// ============================================================================

import { designSystemRules } from '@/lib/design-system/rules'

interface ContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'fluid'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  useCase?: string // Required for lg+ containers
  override?: {
    reason: string
    approvedBy: string
  }
  className?: string
}

export function Container({ 
  children, 
  size = 'md', // 🔥 CHANGED: Default to 'md' for consumer content
  padding = 'md',
  useCase = 'general_content',
  override,
  className 
}: ContainerProps) {
  // 🚨 RULE ENFORCEMENT: Validate container usage
  if (process.env.NODE_ENV === 'development') {
    const validation = designSystemRules.validateContainerUsage(size, useCase, override)
    
    if (!validation.allowed) {
      console.error(`🚨 DESIGN SYSTEM VIOLATION: ${validation.error}`)
      console.error(`💡 SOLUTION: Use 'md' container for consumer content or provide override`)
    }
    
    // Warning suppressed - approved overrides don't need console spam
    // if (validation.warning) {
    //   console.warn(`⚠️  DESIGN SYSTEM WARNING: ${validation.warning}`)
    // }
  }
  const sizeClasses = {
    sm: 'max-w-2xl mx-auto',      // 672px - Tight content
    md: 'max-w-3xl mx-auto',      // 768px - ORIGINAL AESTHETIC (perfect reading width)
    lg: 'max-w-5xl mx-auto',      // 1024px - Wide content
    xl: 'max-w-7xl mx-auto',      // 1280px - Very wide
    full: 'max-w-full mx-auto',   // No max width
    fluid: 'w-full'               // Full width, no centering
  }

  const paddingClasses = {
    none: '',
    sm: 'px-4',
    md: 'px-4 sm:px-6',
    lg: 'px-4 sm:px-6 lg:px-8'
  }

  return (
    <div className={cn(
      sizeClasses[size],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}

// ============================================================================
// GRID - CSS Grid system
// ============================================================================

interface GridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'auto' | 'fit'
  rows?: 1 | 2 | 3 | 4 | 5 | 6 | 'auto'
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 12
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 12
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 12
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  }
  className?: string
}

export function Grid({ 
  children, 
  columns = 'auto', 
  rows,
  gap = 'md',
  responsive,
  className 
}: GridProps) {
  // Base column classes
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2', 
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
    auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    fit: 'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]'
  }

  // Row classes
  const rowClasses = rows ? {
    1: 'grid-rows-1',
    2: 'grid-rows-2',
    3: 'grid-rows-3', 
    4: 'grid-rows-4',
    5: 'grid-rows-5',
    6: 'grid-rows-6',
    auto: 'grid-rows-auto'
  }[rows] : ''

  // Gap classes
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }

  // Responsive classes
  const responsiveClasses = responsive ? [
    responsive.sm && `sm:grid-cols-${responsive.sm}`,
    responsive.md && `md:grid-cols-${responsive.md}`,
    responsive.lg && `lg:grid-cols-${responsive.lg}`,
    responsive.xl && `xl:grid-cols-${responsive.xl}`
  ].filter(Boolean).join(' ') : ''

  return (
    <div className={cn(
      'grid',
      typeof columns === 'string' ? columnClasses[columns] : columnClasses[columns],
      rowClasses,
      gapClasses[gap],
      responsiveClasses,
      className
    )}>
      {children}
    </div>
  )
}

// ============================================================================
// FLEX - Flexbox system
// ============================================================================

interface FlexProps {
  children: React.ReactNode
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse'
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse'
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch'
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  responsive?: boolean
  className?: string
}

export function Flex({ 
  children, 
  direction = 'row',
  wrap = 'nowrap',
  justify = 'start',
  align = 'start',
  gap = 'md',
  responsive = false,
  className 
}: FlexProps) {
  const directionClasses = {
    row: responsive ? 'flex-col sm:flex-row' : 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse'
  }

  const wrapClasses = {
    wrap: 'flex-wrap',
    nowrap: 'flex-nowrap', 
    'wrap-reverse': 'flex-wrap-reverse'
  }

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch'
  }

  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2', 
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }

  return (
    <div className={cn(
      'flex',
      directionClasses[direction],
      wrapClasses[wrap],
      justifyClasses[justify],
      alignClasses[align],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

// ============================================================================
// STACK - Vertical spacing system
// ============================================================================

interface StackProps {
  children: React.ReactNode
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  className?: string
}

export function Stack({ 
  children, 
  spacing = 'md',
  align = 'stretch',
  className 
}: StackProps) {
  const spacingClasses = {
    none: 'space-y-0',
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
    '2xl': 'space-y-12'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center', 
    end: 'items-end',
    stretch: 'items-stretch'
  }

  return (
    <div className={cn(
      'flex flex-col',
      spacingClasses[spacing],
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  )
}

// ============================================================================
// SECTION - Page sections with consistent spacing
// ============================================================================

interface SectionProps {
  children: React.ReactNode
  spacing?: 'sm' | 'md' | 'lg' | 'xl' | 'none'
  background?: 'transparent' | 'white' | 'gray' | 'primary'
  className?: string
}

export function Section({ 
  children, 
  spacing = 'md',
  background = 'transparent',
  className 
}: SectionProps) {
  const spacingClasses = {
    none: '',
    sm: 'py-8',
    md: 'py-12 sm:py-16',
    lg: 'py-16 sm:py-20',
    xl: 'py-20 sm:py-24'
  }

  const backgroundClasses = {
    transparent: '',
    white: 'bg-white',
    gray: 'bg-slate-50',
    primary: 'bg-blue-50'
  }

  return (
    <section className={cn(
      spacingClasses[spacing],
      backgroundClasses[background],
      className
    )}>
      {children}
    </section>
  )
}

// ============================================================================
// COLUMNS - Multi-column text layout
// ============================================================================

interface ColumnsProps {
  children: React.ReactNode
  count?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Columns({ 
  children, 
  count = 2,
  gap = 'md',
  className 
}: ColumnsProps) {
  const countClasses = {
    1: 'columns-1',
    2: 'columns-1 sm:columns-2',
    3: 'columns-1 sm:columns-2 lg:columns-3',
    4: 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4'
  }

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  }

  return (
    <div className={cn(
      countClasses[count],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

// ============================================================================
// ASPECT RATIO - Maintain aspect ratios
// ============================================================================

interface AspectRatioProps {
  children: React.ReactNode
  ratio?: 'square' | 'video' | 'photo' | 'wide' | 'ultrawide'
  className?: string
}

export function AspectRatio({ 
  children, 
  ratio = 'video',
  className 
}: AspectRatioProps) {
  const ratioClasses = {
    square: 'aspect-square',      // 1:1
    video: 'aspect-video',        // 16:9
    photo: 'aspect-[4/3]',        // 4:3
    wide: 'aspect-[21/9]',        // 21:9
    ultrawide: 'aspect-[32/9]'    // 32:9
  }

  return (
    <div className={cn(
      ratioClasses[ratio],
      className
    )}>
      {children}
    </div>
  )
}

// ============================================================================
// LAYOUT PATTERNS - Common layout combinations
// ============================================================================

// Sidebar Layout
interface SidebarLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  sidebarWidth?: 'sm' | 'md' | 'lg'
  sidebarPosition?: 'left' | 'right'
  className?: string
}

export function SidebarLayout({ 
  children, 
  sidebar,
  sidebarWidth = 'md',
  sidebarPosition = 'left',
  className 
}: SidebarLayoutProps) {
  const widthClasses = {
    sm: 'lg:w-64',   // 256px
    md: 'lg:w-80',   // 320px
    lg: 'lg:w-96'    // 384px
  }

  return (
    <div className={cn(
      'flex flex-col lg:flex-row gap-6 lg:gap-8',
      className
    )}>
      {sidebarPosition === 'left' && (
        <aside className={cn('flex-shrink-0', widthClasses[sidebarWidth])}>
          {sidebar}
        </aside>
      )}
      
      <main className="flex-1 min-w-0">
        {children}
      </main>
      
      {sidebarPosition === 'right' && (
        <aside className={cn('flex-shrink-0', widthClasses[sidebarWidth])}>
          {sidebar}
        </aside>
      )}
    </div>
  )
}

// Dashboard Layout
interface DashboardLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
  sidebar?: React.ReactNode
  className?: string
}

export function DashboardLayout({ 
  children, 
  header,
  sidebar,
  className 
}: DashboardLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {header && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          {header}
        </header>
      )}
      
      <div className="flex">
        {sidebar && (
          <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
            {sidebar}
          </aside>
        )}
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// Hero Layout
interface HeroLayoutProps {
  children: React.ReactNode
  background?: 'gradient' | 'image' | 'solid'
  height?: 'sm' | 'md' | 'lg' | 'screen'
  className?: string
}

export function HeroLayout({ 
  children, 
  background = 'gradient',
  height = 'lg',
  className 
}: HeroLayoutProps) {
  const backgroundClasses = {
    gradient: 'bg-gradient-to-br from-blue-600 to-purple-700',
    image: 'bg-cover bg-center bg-no-repeat',
    solid: 'bg-gray-900'
  }

  const heightClasses = {
    sm: 'min-h-[400px]',
    md: 'min-h-[500px]', 
    lg: 'min-h-[600px]',
    screen: 'min-h-screen'
  }

  return (
    <section className={cn(
      'relative flex items-center justify-center text-white',
      backgroundClasses[background],
      heightClasses[height],
      className
    )}>
      <div className="relative z-10 text-center">
        {children}
      </div>
    </section>
  )
}
