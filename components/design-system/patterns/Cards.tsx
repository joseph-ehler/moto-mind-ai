/**
 * MotoMind Card System
 * 
 * Comprehensive card components built on the design system foundation
 * Uses ColoredBox, focusRing, interactionStates, and z-index tokens
 */

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { focusRing, interactionStates } from '@/lib/design-system/tokens'
import { ColoredBox, PrimaryBox, DestructiveBox, SecondaryBox, MutedBox } from '../primitives/ColoredBox'

// ============================================================================
// BASE CARD
// ============================================================================

export interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual elevation level */
  elevation?: 'flat' | 'low' | 'medium' | 'high'
  /** Border style */
  border?: 'none' | 'default' | 'accent'
  /** Corner radius */
  rounded?: 'sm' | 'md' | 'lg' | 'xl'
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const BaseCard = forwardRef<HTMLDivElement, BaseCardProps>(
  ({ elevation = 'flat', border = 'default', rounded = 'xl', padding = 'lg', className, children, ...props }, ref) => {
    const elevationClass = {
      flat: '',
      low: 'shadow-sm',
      medium: 'shadow-md',
      high: 'shadow-lg'
    }[elevation]

    const borderClass = {
      none: '',
      default: 'border border-gray-200',
      accent: 'border-2 border-primary'
    }[border]

    const roundedClass = {
      sm: 'rounded-xl',
      md: 'rounded-xl',
      lg: 'rounded-xl',
      xl: 'rounded-xl'
    }[rounded]

    const paddingClass = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    }[padding]

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white',
          elevationClass,
          borderClass,
          roundedClass,
          paddingClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
BaseCard.displayName = 'BaseCard'

// ============================================================================
// INTERACTIVE CARD (Clickable)
// ============================================================================

export interface InteractiveCardProps extends BaseCardProps {
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void
  /** Aria label for accessibility */
  ariaLabel?: string
}

export const InteractiveCard = forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ onClick, ariaLabel, className, children, ...props }, ref) => {
    return (
      <BaseCard
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick(e as any)
          }
        }}
        className={cn(
          'cursor-pointer',
          focusRing.default,
          interactionStates.hover.shadow,
          interactionStates.hover.scale,
          interactionStates.active.scale,
          className
        )}
        {...props}
      >
        {children}
      </BaseCard>
    )
  }
)
InteractiveCard.displayName = 'InteractiveCard'

// ============================================================================
// COLORED CARD (Using ColoredBox)
// ============================================================================

export interface ColoredCardProps extends Omit<BaseCardProps, 'className'> {
  variant: 'primary' | 'secondary' | 'destructive' | 'muted'
  className?: string
}

export const ColoredCard = forwardRef<HTMLDivElement, ColoredCardProps>(
  ({ variant, rounded = 'lg', padding = 'md', children, className, ...props }, ref) => {
    const BoxComponent = {
      primary: PrimaryBox,
      secondary: SecondaryBox,
      destructive: DestructiveBox,
      muted: MutedBox
    }[variant]

    const roundedClass = {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl'
    }[rounded]

    const paddingClass = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    }[padding as 'none' | 'sm' | 'md' | 'lg']

    return (
      <BoxComponent
        ref={ref}
        className={cn(roundedClass, paddingClass, className)}
        {...props}
      >
        {children}
      </BoxComponent>
    )
  }
)
ColoredCard.displayName = 'ColoredCard'

// ============================================================================
// METRIC CARD
// ============================================================================

export interface MetricCardProps extends Omit<BaseCardProps, 'children'> {
  label: string
  value: string | number
  subtitle?: string
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
  }
  icon?: React.ReactNode
}

export const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  ({ label, value, subtitle, trend, icon, ...props }, ref) => {
    const trendColor = {
      up: 'text-green-600 bg-green-50',
      down: 'text-red-600 bg-red-50',
      neutral: 'text-gray-600 bg-gray-50'
    }[trend?.direction || 'neutral']

    return (
      <BaseCard ref={ref} {...props}>
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              {label}
            </span>
            {icon && (
              <div className="text-gray-400">
                {icon}
              </div>
            )}
          </div>

          {/* Value */}
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {value}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Trend */}
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium self-start',
              trendColor
            )}>
              <span>{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </BaseCard>
    )
  }
)
MetricCard.displayName = 'MetricCard'

// ============================================================================
// FEATURE CARD
// ============================================================================

export interface FeatureCardProps extends Omit<BaseCardProps, 'children'> {
  icon: React.ReactNode
  title: string
  description: string
  link?: {
    label: string
    href: string
  }
}

export const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ icon, title, description, link, ...props }, ref) => {
    const content = (
      <div className="flex flex-col gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>

        {/* Content */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600">
            {description}
          </p>
        </div>

        {/* Link */}
        {link && (
          <div className="text-sm font-medium text-primary flex items-center gap-1">
            {link.label}
            <span aria-hidden="true">→</span>
          </div>
        )}
      </div>
    )

    if (link) {
      return (
        <InteractiveCard
          ref={ref}
          onClick={() => window.location.href = link.href}
          ariaLabel={`Learn more about ${title}`}
          {...props}
        >
          {content}
        </InteractiveCard>
      )
    }

    return (
      <BaseCard ref={ref} {...props}>
        {content}
      </BaseCard>
    )
  }
)
FeatureCard.displayName = 'FeatureCard'

// ============================================================================
// ALERT CARD
// ============================================================================

export interface AlertCardProps extends Omit<BaseCardProps, 'children'> {
  variant: 'info' | 'success' | 'warning' | 'error'
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
  onDismiss?: () => void
}

export const AlertCard = forwardRef<HTMLDivElement, AlertCardProps>(
  ({ variant, title, description, action, dismissible, onDismiss, ...props }, ref) => {
    const variantStyles = {
      info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        icon: 'ℹ️'
      },
      success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-900',
        icon: '✓'
      },
      warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-900',
        icon: '⚠'
      },
      error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-900',
        icon: '✕'
      }
    }[variant]

    return (
      <BaseCard
        ref={ref}
        className={cn(variantStyles.bg, variantStyles.border)}
        border="default"
        {...props}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn('text-xl', variantStyles.text)}>
            {variantStyles.icon}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h4 className={cn('font-semibold mb-1', variantStyles.text)}>
              {title}
            </h4>
            <p className={cn('text-sm', variantStyles.text)}>
              {description}
            </p>

            {/* Action */}
            {action && (
              <button
                onClick={action.onClick}
                className={cn(
                  'mt-3 px-3 py-1.5 text-sm font-medium rounded',
                  'bg-white border',
                  variantStyles.border,
                  variantStyles.text,
                  focusRing.default,
                  interactionStates.hover.opacity
                )}
              >
                {action.label}
              </button>
            )}
          </div>

          {/* Dismiss */}
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className={cn(
                'p-1 rounded hover:bg-black/5',
                variantStyles.text,
                focusRing.default
              )}
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </BaseCard>
    )
  }
)
AlertCard.displayName = 'AlertCard'

// ============================================================================
// PRODUCT CARD
// ============================================================================

export interface ProductCardProps extends Omit<BaseCardProps, 'children'> {
  image: string
  imageAlt: string
  title: string
  description?: string
  price?: string
  badge?: string
  onClick?: () => void
}

export const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(
  ({ image, imageAlt, title, description, price, badge, onClick, ...props }, ref) => {
    const content = (
      <div className="flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden rounded-t-lg">
          <img
            src={image}
            alt={imageAlt}
            className="w-full h-full object-cover"
          />
          {badge && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded">
              {badge}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2">
          <h3 className="font-semibold text-gray-900">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
          )}
          {price && (
            <p className="text-lg font-bold text-gray-900">
              {price}
            </p>
          )}
        </div>
      </div>
    )

    if (onClick) {
      return (
        <InteractiveCard
          ref={ref}
          padding="none"
          onClick={onClick}
          ariaLabel={`View ${title}`}
          {...props}
        >
          {content}
        </InteractiveCard>
      )
    }

    return (
      <BaseCard ref={ref} padding="none" {...props}>
        {content}
      </BaseCard>
    )
  }
)
ProductCard.displayName = 'ProductCard'

// ============================================================================
// TESTIMONIAL CARD
// ============================================================================

export interface TestimonialCardProps extends Omit<BaseCardProps, 'children'> {
  quote: string
  author: {
    name: string
    title?: string
    avatar?: string
  }
  rating?: number
}

export const TestimonialCard = forwardRef<HTMLDivElement, TestimonialCardProps>(
  ({ quote, author, rating, ...props }, ref) => {
    return (
      <BaseCard ref={ref} {...props}>
        <div className="flex flex-col gap-4">
          {/* Rating */}
          {rating && (
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={i < rating ? 'text-yellow-400' : 'text-gray-300'}
                >
                  ★
                </span>
              ))}
            </div>
          )}

          {/* Quote */}
          <blockquote className="text-gray-700 italic">
            "{quote}"
          </blockquote>

          {/* Author */}
          <div className="flex items-center gap-3 pt-4 border-t">
            {author.avatar && (
              <img
                src={author.avatar}
                alt={author.name}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <div className="font-semibold text-gray-900">
                {author.name}
              </div>
              {author.title && (
                <div className="text-sm text-gray-600">
                  {author.title}
                </div>
              )}
            </div>
          </div>
        </div>
      </BaseCard>
    )
  }
)
TestimonialCard.displayName = 'TestimonialCard'
