/**
 * Design System Cards
 * 
 * Enhanced shadcn/ui Cards with design system tokens
 * Mobile-first, touch-friendly, consistent patterns
 */

import React from 'react'
import { Card as ShadcnCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, designSystem as ds, patterns } from '@/lib/design-system'
import { Button } from '../primitives/Button'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

// ============================================================================
// BASE CARD (STATIC BY DEFAULT)
// ============================================================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  padding?: 'sm' | 'md' | 'lg'
  elevation?: 'flat' | 'raised' | 'floating'
  interactive?: boolean
  onClick?: () => void
  className?: string
}

export function Card({
  children,
  padding = 'md',
  elevation = 'flat',
  interactive = false,
  onClick,
  className
}: CardProps) {
  return (
    <ShadcnCard
      onClick={onClick}
      className={cn(
        // Design system enhancements
        'rounded-xl border border-gray-200',
        
        // Elevation
        elevation === 'flat' && '',
        elevation === 'raised' && 'shadow',
        elevation === 'floating' && 'shadow-lg',
        
        // Interactive states - ONLY for actual button cards
        interactive && onClick && 'cursor-pointer motion-safe:hover:shadow-md motion-safe:transition-shadow',
        interactive && onClick && ds.effects.touch,
        
        className
      )}
    >
      <div className={cn(
        padding === 'sm' && ds.spacing.padding.sm,
        padding === 'md' && ds.spacing.padding.md,
        padding === 'lg' && ds.spacing.padding.lg
      )}>
        {children}
      </div>
    </ShadcnCard>
  )
}

// ============================================================================
// METRIC CARD
// ============================================================================

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
  }
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  onClick,
  className
}: MetricCardProps) {
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : 
                   trend?.direction === 'down' ? TrendingDown : 
                   Activity

  const trendConfig = {
    up: 'bg-green-50 text-green-700 border-green-200',
    down: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-gray-50 text-gray-600 border-gray-200'
  }[trend?.direction || 'neutral']

  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      className={className}
    >
      <div className={ds.spacing.stack.normal}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className={cn(
            ds.typography.size.sm,
            ds.typography.weight.medium,
            'text-gray-600 uppercase tracking-wide truncate'
          )}>
            {title}
          </h3>
          {icon && (
            <div className="text-gray-400 flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
        
        {/* Value */}
        <div className={ds.spacing.stack.tight}>
          <div className={cn(
            ds.typography.patterns.hero,
            'text-gray-900 leading-none'
          )}>
            {value}
          </div>
          {subtitle && (
            <p className={cn(ds.typography.size.base, 'text-gray-600')}>
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Trend */}
        {trend && TrendIcon && (
          <div className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium border',
            trendConfig
          )}>
            <TrendIcon className="w-4 h-4" />
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

// ============================================================================
// STATUS CARD
// ============================================================================

interface StatusCardProps {
  title: string
  description: string
  status: 'success' | 'warning' | 'danger' | 'info'
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

export function StatusCard({
  title,
  description,
  status,
  action,
  dismissible,
  onDismiss,
  className
}: StatusCardProps) {
  const statusConfig = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      button: 'success' as const
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      button: 'warning' as const
    },
    danger: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      button: 'danger' as const
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      button: 'primary' as const
    }
  }[status]

  return (
    <div className={cn(
      'border rounded-lg p-4',
      statusConfig.bg,
      className
    )}>
      <div className={ds.spacing.stack.tight}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className={cn(
              ds.typography.size.base,
              ds.typography.weight.semibold,
              statusConfig.text
            )}>
              {title}
            </h4>
            <p className={cn(
              ds.typography.size.sm,
              statusConfig.text,
              'opacity-90 mt-1'
            )}>
              {description}
            </p>
          </div>
          
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className={cn(
                'p-1 rounded hover:bg-black/5 transition-colors',
                ds.spacing.touch.min
              )}
            >
              <span className="sr-only">Dismiss</span>
              ×
            </button>
          )}
        </div>
        
        {action && (
          <div className="mt-3">
            <Button
              size="sm"
              variant={statusConfig.button}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// ACTION CARD
// ============================================================================

interface ActionCardProps {
  title: string
  description?: string
  icon?: React.ReactNode
  primaryAction: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function ActionCard({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  className
}: ActionCardProps) {
  return (
    <Card className={className}>
      <div className={ds.spacing.stack.normal}>
        {/* Content */}
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex-shrink-0 mt-1">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <h3 className={cn(
              ds.typography.size.lg,
              ds.typography.weight.semibold,
              'text-gray-900'
            )}>
              {title}
            </h3>
            {description && (
              <p className={cn(
                ds.typography.size.base,
                'text-gray-600 mt-1'
              )}>
                {description}
              </p>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className={cn(
          'flex flex-col sm:flex-row',
          ds.spacing.gap.md
        )}>
          <Button
            onClick={primaryAction.onClick}
            variant="primary"
            fullWidth
          >
            {primaryAction.label}
          </Button>
          
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              fullWidth
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

// ============================================================================
// CARD GRID
// ============================================================================

interface CardGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CardGrid({
  children,
  columns = 3,
  gap = 'md',
  className
}: CardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }[columns]

  return (
    <div className={cn(
      'grid',
      gridCols,
      gap === 'sm' && ds.spacing.gap.sm,
      gap === 'md' && ds.spacing.gap.md,
      gap === 'lg' && ds.spacing.gap.lg,
      className
    )}>
      {children}
    </div>
  )
}

// ============================================================================
// CLICKABLE CARD (FOR WHEN CARDS ARE ACTUAL BUTTONS)
// ============================================================================

interface ClickableCardProps extends Omit<CardProps, 'interactive'> {
  onClick: () => void // Required for clickable cards
  ariaLabel?: string
}

export function ClickableCard({
  children,
  onClick,
  ariaLabel,
  className,
  ...props
}: ClickableCardProps) {
  return (
    <Card
      interactive={true}
      onClick={onClick}
      className={cn('focus-visible:outline-2 focus-visible:outline-blue-500', className)}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      {...props}
    >
      {children}
    </Card>
  )
}
