/**
 * SectionHeader - Standardized section header design system
 * 
 * Provides consistent typography hierarchy and spacing for all section headers
 * across the application. Replaces ad-hoc header implementations with a 
 * unified, accessible system.
 */

import React from 'react'
import { cn } from '@/lib/utils/cn'

// ============================================================================
// DESIGN TOKENS
// ============================================================================

export const SECTION_HEADER_TOKENS = {
  // Typography hierarchy
  typography: {
    // Page-level headers
    hero: 'text-4xl font-black text-gray-900 tracking-tight leading-tight',
    page: 'text-3xl font-bold text-gray-900 tracking-tight leading-tight',
    
    // Section headers
    section: 'text-2xl font-bold text-gray-900 tracking-tight leading-tight',
    subsection: 'text-xl font-semibold text-gray-900 leading-tight',
    
    // Component headers
    component: 'text-lg font-semibold text-gray-900 leading-tight',
    card: 'text-base font-semibold text-gray-900 leading-tight',
    
    // List/group headers
    group: 'text-sm font-semibold text-gray-800 uppercase tracking-wide',
    label: 'text-xs font-medium text-gray-600 uppercase tracking-wider',
    
    // Subtitles
    subtitle: {
      large: 'text-lg text-gray-600 leading-relaxed',
      medium: 'text-base text-gray-600 leading-relaxed',
      small: 'text-sm text-gray-600 leading-relaxed',
      tiny: 'text-xs text-gray-500 leading-relaxed'
    }
  },
  
  // Spacing system
  spacing: {
    hero: 'mb-8',
    page: 'mb-6',
    section: 'mb-6',
    subsection: 'mb-4',
    component: 'mb-4',
    card: 'mb-3',
    group: 'mb-3',
    label: 'mb-2'
  },
  
  // Divider styles
  dividers: {
    full: 'border-b border-gray-200 pb-6 mb-8',
    section: 'border-b border-gray-100 pb-4 mb-6',
    subtle: 'border-b border-gray-50 pb-3 mb-4'
  }
}

// ============================================================================
// TYPES
// ============================================================================

type HeaderLevel = 'hero' | 'page' | 'section' | 'subsection' | 'component' | 'card' | 'group' | 'label'
type SubtitleSize = 'large' | 'medium' | 'small' | 'tiny'
type DividerStyle = 'full' | 'section' | 'subtle' | 'none'

interface SectionHeaderProps {
  children: React.ReactNode
  level: HeaderLevel
  subtitle?: string
  subtitleSize?: SubtitleSize
  divider?: DividerStyle
  className?: string
  action?: React.ReactNode
  badge?: React.ReactNode
  icon?: React.ReactNode
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SectionHeader({
  children,
  level,
  subtitle,
  subtitleSize = 'medium',
  divider = 'none',
  className,
  action,
  badge,
  icon
}: SectionHeaderProps) {
  const headerClasses = SECTION_HEADER_TOKENS.typography[level]
  const spacingClasses = SECTION_HEADER_TOKENS.spacing[level]
  const subtitleClasses = SECTION_HEADER_TOKENS.typography.subtitle[subtitleSize]
  const dividerClasses = divider !== 'none' ? SECTION_HEADER_TOKENS.dividers[divider] : ''
  
  // Choose semantic HTML element based on level
  const getHeaderElement = () => {
    switch (level) {
      case 'hero':
      case 'page':
        return 'h1'
      case 'section':
        return 'h2'
      case 'subsection':
        return 'h3'
      case 'component':
        return 'h4'
      case 'card':
        return 'h5'
      case 'group':
      case 'label':
        return 'h6'
      default:
        return 'h2'
    }
  }
  
  const HeaderElement = getHeaderElement() as keyof JSX.IntrinsicElements
  
  return (
    <div className={cn(spacingClasses, dividerClasses, className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {icon && (
              <div className="flex-shrink-0">
                {icon}
              </div>
            )}
            <HeaderElement className={cn(headerClasses, 'truncate')}>
              {children}
            </HeaderElement>
            {badge && (
              <div className="flex-shrink-0">
                {badge}
              </div>
            )}
          </div>
          
          {subtitle && (
            <p className={cn(subtitleClasses, 'mt-1')}>
              {subtitle}
            </p>
          )}
        </div>
        
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

export function PageHeader({ children, ...props }: Omit<SectionHeaderProps, 'level'>) {
  return <SectionHeader level="page" divider="full" {...props}>{children}</SectionHeader>
}

export function SectionTitle({ children, ...props }: Omit<SectionHeaderProps, 'level'>) {
  return <SectionHeader level="section" divider="section" {...props}>{children}</SectionHeader>
}

export function ComponentHeader({ children, ...props }: Omit<SectionHeaderProps, 'level'>) {
  return <SectionHeader level="component" {...props}>{children}</SectionHeader>
}

export function GroupHeader({ children, ...props }: Omit<SectionHeaderProps, 'level'>) {
  return <SectionHeader level="group" {...props}>{children}</SectionHeader>
}

export function LabelHeader({ children, ...props }: Omit<SectionHeaderProps, 'level'>) {
  return <SectionHeader level="label" {...props}>{children}</SectionHeader>
}

// ============================================================================
// SPECIALIZED PATTERNS
// ============================================================================

interface StatsHeaderProps {
  title: string
  subtitle?: string
  stats: Array<{
    label: string
    value: string | number
    change?: string
    trend?: 'up' | 'down' | 'neutral'
  }>
  action?: React.ReactNode
  className?: string
}

export function StatsHeader({ title, subtitle, stats, action, className }: StatsHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-gray-600 leading-relaxed mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {stat.value}
              </span>
              {stat.change && (
                <span className={cn(
                  'text-sm font-medium',
                  stat.trend === 'up' ? 'text-green-600' :
                  stat.trend === 'down' ? 'text-red-600' :
                  'text-gray-500'
                )}>
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface BreadcrumbHeaderProps {
  breadcrumbs: Array<{
    label: string
    href?: string
  }>
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function BreadcrumbHeader({ breadcrumbs, title, subtitle, action, className }: BreadcrumbHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {/* Breadcrumbs */}
      <nav className="mb-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-gray-700 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-900 font-medium">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-gray-600 leading-relaxed mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
