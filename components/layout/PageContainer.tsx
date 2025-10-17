// MotoMindAI: Unified Page Container System
// Ensures consistent layout widths and spacing across all pages

import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface PageContainerProps {
  children: ReactNode
  size?: 'default' | 'narrow' | 'wide' | 'full'
  className?: string
}

/**
 * Standard page container with consistent widths across the application
 * 
 * Sizes:
 * - default: Standard content width (max-w-6xl) - Use for most pages
 * - narrow: Narrower content (max-w-4xl) - Use for forms, articles, settings
 * - wide: Wider content (max-w-7xl) - Use for dashboards, data tables
 * - full: Full width with padding - Use for special layouts
 */
export function PageContainer({ 
  children, 
  size = 'default', 
  className 
}: PageContainerProps) {
  const sizeClasses = {
    default: 'max-w-6xl',   // 1152px - Standard for most content
    narrow: 'max-w-4xl',    // 896px - Forms, articles, settings
    wide: 'max-w-7xl',      // 1280px - Dashboards, tables
    full: 'max-w-none'      // Full width with padding
  }
  
  return (
    <div className={cn(
      'mx-auto px-4 py-6',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Section container for consistent spacing within pages
 */
export function PageSection({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <section className={cn('space-y-6', className)}>
      {children}
    </section>
  )
}

/**
 * Standard page header with consistent typography and spacing
 */
export function PageHeader({ 
  title, 
  subtitle, 
  actions,
  className 
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex items-start justify-between mb-8', className)}>
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-slate-600">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  )
}

/**
 * Grid container with consistent responsive breakpoints
 */
export function ResponsiveGrid({ 
  children, 
  columns = 'auto',
  gap = '6',
  className 
}: {
  children: ReactNode
  columns?: 'auto' | '1' | '2' | '3' | '4' | 'adaptive'
  gap?: '4' | '6' | '8'
  className?: string
}) {
  const columnClasses = {
    auto: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    adaptive: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' // Will be overridden by specific logic
  }
  
  return (
    <div className={cn(
      'grid',
      columnClasses[columns],
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  )
}

/**
 * Standard content card with consistent styling
 */
export function ContentCard({ 
  children, 
  className,
  padding = 'default'
}: {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'default' | 'lg'
}) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  }
  
  return (
    <div className={cn(
      'bg-white rounded-lg border border-slate-200 shadow-sm',
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}
