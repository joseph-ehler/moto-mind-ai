/**
 * Hero - Mobile-first hero components
 * 
 * Touch-friendly hero sections optimized for mobile with progressive enhancement.
 * All variants start mobile-first and enhance for larger screens.
 */

import React from 'react'
import { cn } from '@/lib/utils/cn'

// ============================================================================
// DESIGN TOKENS
// ============================================================================

export const HERO_DESIGN_TOKENS = {
  // Layout variants
  layouts: {
    centered: 'text-center max-w-4xl mx-auto',
    split: 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center',
    asymmetric: 'grid grid-cols-1 lg:grid-cols-3 gap-8 items-center',
    stacked: 'space-y-8',
    minimal: 'text-center max-w-2xl mx-auto'
  },
  
  // Size variants
  sizes: {
    compact: {
      container: 'py-12 lg:py-16',
      title: 'text-3xl lg:text-4xl font-bold',
      subtitle: 'text-lg lg:text-xl',
      spacing: 'space-y-6'
    },
    standard: {
      container: 'py-16 lg:py-24',
      title: 'text-4xl lg:text-6xl font-bold',
      subtitle: 'text-xl lg:text-2xl',
      spacing: 'space-y-8'
    },
    large: {
      container: 'py-20 lg:py-32',
      title: 'text-5xl lg:text-7xl font-bold',
      subtitle: 'text-2xl lg:text-3xl',
      spacing: 'space-y-10'
    }
  },
  
  // Visual themes
  themes: {
    light: {
      background: 'bg-white',
      title: 'text-gray-900',
      subtitle: 'text-gray-600',
      accent: 'text-blue-600'
    },
    dark: {
      background: 'bg-gray-900',
      title: 'text-white',
      subtitle: 'text-gray-300',
      accent: 'text-blue-400'
    },
    gradient: {
      background: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800',
      title: 'text-white',
      subtitle: 'text-blue-100',
      accent: 'text-blue-200'
    },
    brand: {
      background: 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800',
      title: 'text-white',
      subtitle: 'text-emerald-100',
      accent: 'text-emerald-200'
    },
    subtle: {
      background: 'bg-gray-50',
      title: 'text-gray-900',
      subtitle: 'text-gray-600',
      accent: 'text-blue-600'
    }
  },
  
  // Typography patterns
  typography: {
    title: 'tracking-tight leading-tight font-extrabold',
    subtitle: 'leading-relaxed font-medium',
    caption: 'text-sm font-medium uppercase tracking-wider',
    highlight: 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
  },
  
  // Action button styles
  actions: {
    primary: 'px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl',
    secondary: 'px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors',
    ghost: 'px-8 py-4 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors'
  }
}

// ============================================================================
// TYPES
// ============================================================================

type HeroLayout = 'centered' | 'split' | 'asymmetric' | 'stacked' | 'minimal'
type HeroSize = 'compact' | 'standard' | 'large'
type HeroTheme = 'light' | 'dark' | 'gradient' | 'brand' | 'subtle'

interface HeroAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: React.ReactNode
}

interface HeroProps {
  layout?: HeroLayout
  size?: HeroSize
  theme?: HeroTheme
  className?: string
  children: React.ReactNode
}

interface HeroContentProps {
  title: string
  subtitle?: string
  caption?: string
  highlight?: string
  actions?: HeroAction[]
  image?: {
    src: string
    alt: string
    position?: 'left' | 'right'
  }
  stats?: Array<{
    value: string
    label: string
  }>
  layout?: HeroLayout
  size?: HeroSize
  theme?: HeroTheme
  className?: string
}

// ============================================================================
// BASE HERO CONTAINER
// ============================================================================

export function Hero({ 
  layout = 'centered', 
  size = 'standard', 
  theme = 'light',
  className,
  children 
}: HeroProps) {
  const sizeConfig = HERO_DESIGN_TOKENS.sizes[size]
  const themeConfig = HERO_DESIGN_TOKENS.themes[theme]
  const layoutConfig = HERO_DESIGN_TOKENS.layouts[layout]
  
  return (
    <section className={cn(
      'relative overflow-hidden',
      sizeConfig.container,
      themeConfig.background,
      className
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(layoutConfig, sizeConfig.spacing)}>
          {children}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// HERO CONTENT COMPONENTS
// ============================================================================

export function HeroContent({
  title,
  subtitle,
  caption,
  highlight,
  actions = [],
  image,
  stats,
  layout = 'centered',
  size = 'standard',
  theme = 'light',
  className
}: HeroContentProps) {
  const sizeConfig = HERO_DESIGN_TOKENS.sizes[size]
  const themeConfig = HERO_DESIGN_TOKENS.themes[theme]
  
  const renderContent = () => (
    <div className={cn(
      layout === 'centered' || layout === 'minimal' ? 'text-center' : 'text-left',
      className
    )}>
      {caption && (
        <p className={cn(
          HERO_DESIGN_TOKENS.typography.caption,
          themeConfig.accent,
          'mb-4'
        )}>
          {caption}
        </p>
      )}
      
      <h1 className={cn(
        sizeConfig.title,
        HERO_DESIGN_TOKENS.typography.title,
        themeConfig.title,
        'mb-6'
      )}>
        {highlight ? (
          <>
            {title.split(highlight)[0]}
            <span className={HERO_DESIGN_TOKENS.typography.highlight}>
              {highlight}
            </span>
            {title.split(highlight)[1]}
          </>
        ) : (
          title
        )}
      </h1>
      
      {subtitle && (
        <p className={cn(
          sizeConfig.subtitle,
          HERO_DESIGN_TOKENS.typography.subtitle,
          themeConfig.subtitle,
          'mb-8'
        )}>
          {subtitle}
        </p>
      )}
      
      {actions.length > 0 && (
        <div className={cn(
          'flex gap-4 mb-8',
          layout === 'centered' || layout === 'minimal' ? 'justify-center' : 'justify-start',
          'flex-wrap'
        )}>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={cn(
                HERO_DESIGN_TOKENS.actions[action.variant || 'primary'],
                'inline-flex items-center gap-2'
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
      
      {stats && stats.length > 0 && (
        <div className={cn(
          'grid grid-cols-2 md:grid-cols-4 gap-6',
          layout === 'centered' || layout === 'minimal' ? 'justify-center' : ''
        )}>
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={cn(
                'text-2xl lg:text-3xl font-bold',
                themeConfig.title,
                'mb-1'
              )}>
                {stat.value}
              </div>
              <div className={cn(
                'text-sm font-medium',
                themeConfig.subtitle
              )}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
  
  const renderImage = () => image && (
    <div className="relative">
      <img
        src={image.src}
        alt={image.alt}
        className="w-full h-auto rounded-2xl shadow-2xl"
      />
    </div>
  )
  
  if (layout === 'split') {
    return (
      <>
        {image?.position === 'left' ? (
          <>
            {renderImage()}
            {renderContent()}
          </>
        ) : (
          <>
            {renderContent()}
            {renderImage()}
          </>
        )}
      </>
    )
  }
  
  if (layout === 'asymmetric') {
    return (
      <>
        <div className="lg:col-span-2">
          {renderContent()}
        </div>
        <div className="lg:col-span-1">
          {renderImage()}
        </div>
      </>
    )
  }
  
  return (
    <div className="space-y-8">
      {renderContent()}
      {renderImage()}
    </div>
  )
}

// ============================================================================
// SPECIALIZED HERO PATTERNS
// ============================================================================

interface FeatureHeroProps {
  title: string
  subtitle: string
  features: Array<{
    icon: React.ReactNode
    title: string
    description: string
  }>
  primaryAction: HeroAction
  secondaryAction?: HeroAction
  theme?: HeroTheme
  className?: string
}

export function FeatureHero({
  title,
  subtitle,
  features,
  primaryAction,
  secondaryAction,
  theme = 'light',
  className
}: FeatureHeroProps) {
  return (
    <Hero layout="centered" size="standard" theme={theme} className={className}>
      <div className="text-center mb-12">
        <h1 className={cn(
          HERO_DESIGN_TOKENS.sizes.standard.title,
          HERO_DESIGN_TOKENS.typography.title,
          HERO_DESIGN_TOKENS.themes[theme].title,
          'mb-6'
        )}>
          {title}
        </h1>
        <p className={cn(
          HERO_DESIGN_TOKENS.sizes.standard.subtitle,
          HERO_DESIGN_TOKENS.typography.subtitle,
          HERO_DESIGN_TOKENS.themes[theme].subtitle,
          'mb-8'
        )}>
          {subtitle}
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap mb-16">
          <button
            onClick={primaryAction.onClick}
            className={cn(
              HERO_DESIGN_TOKENS.actions.primary,
              'inline-flex items-center gap-2'
            )}
          >
            {primaryAction.icon}
            {primaryAction.label}
          </button>
          
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={cn(
                HERO_DESIGN_TOKENS.actions.secondary,
                'inline-flex items-center gap-2'
              )}
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              {feature.icon}
            </div>
            <h3 className={cn(
              'text-xl font-semibold mb-2',
              HERO_DESIGN_TOKENS.themes[theme].title
            )}>
              {feature.title}
            </h3>
            <p className={cn(
              'text-base leading-relaxed',
              HERO_DESIGN_TOKENS.themes[theme].subtitle
            )}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </Hero>
  )
}

interface TestimonialHeroProps {
  title: string
  subtitle: string
  testimonial: {
    quote: string
    author: string
    role: string
    avatar?: string
    company?: string
  }
  primaryAction: HeroAction
  theme?: HeroTheme
  className?: string
}

export function TestimonialHero({
  title,
  subtitle,
  testimonial,
  primaryAction,
  theme = 'light',
  className
}: TestimonialHeroProps) {
  return (
    <Hero layout="centered" size="large" theme={theme} className={className}>
      <div className="text-center mb-12">
        <h1 className={cn(
          HERO_DESIGN_TOKENS.sizes.large.title,
          HERO_DESIGN_TOKENS.typography.title,
          HERO_DESIGN_TOKENS.themes[theme].title,
          'mb-6'
        )}>
          {title}
        </h1>
        <p className={cn(
          HERO_DESIGN_TOKENS.sizes.large.subtitle,
          HERO_DESIGN_TOKENS.typography.subtitle,
          HERO_DESIGN_TOKENS.themes[theme].subtitle,
          'mb-12'
        )}>
          {subtitle}
        </p>
        
        <button
          onClick={primaryAction.onClick}
          className={cn(
            HERO_DESIGN_TOKENS.actions.primary,
            'inline-flex items-center gap-2 mb-16'
          )}
        >
          {primaryAction.icon}
          {primaryAction.label}
        </button>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <blockquote className={cn(
          'text-2xl lg:text-3xl font-medium leading-relaxed mb-8',
          HERO_DESIGN_TOKENS.themes[theme].title
        )}>
          "{testimonial.quote}"
        </blockquote>
        
        <div className="flex items-center justify-center gap-4">
          {testimonial.avatar && (
            <img
              src={testimonial.avatar}
              alt={testimonial.author}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div className="text-left">
            <div className={cn(
              'font-semibold',
              HERO_DESIGN_TOKENS.themes[theme].title
            )}>
              {testimonial.author}
            </div>
            <div className={cn(
              'text-sm',
              HERO_DESIGN_TOKENS.themes[theme].subtitle
            )}>
              {testimonial.role}
              {testimonial.company && ` at ${testimonial.company}`}
            </div>
          </div>
        </div>
      </div>
    </Hero>
  )
}

interface StatsHeroProps {
  title: string
  subtitle: string
  stats: Array<{
    value: string
    label: string
    description?: string
  }>
  primaryAction: HeroAction
  theme?: HeroTheme
  className?: string
}

export function StatsHero({
  title,
  subtitle,
  stats,
  primaryAction,
  theme = 'gradient',
  className
}: StatsHeroProps) {
  return (
    <Hero layout="centered" size="standard" theme={theme} className={className}>
      <div className="text-center mb-12">
        <h1 className={cn(
          HERO_DESIGN_TOKENS.sizes.standard.title,
          HERO_DESIGN_TOKENS.typography.title,
          HERO_DESIGN_TOKENS.themes[theme].title,
          'mb-6'
        )}>
          {title}
        </h1>
        <p className={cn(
          HERO_DESIGN_TOKENS.sizes.standard.subtitle,
          HERO_DESIGN_TOKENS.typography.subtitle,
          HERO_DESIGN_TOKENS.themes[theme].subtitle,
          'mb-8'
        )}>
          {subtitle}
        </p>
        
        <button
          onClick={primaryAction.onClick}
          className={cn(
            HERO_DESIGN_TOKENS.actions.primary,
            'inline-flex items-center gap-2 mb-16'
          )}
        >
          {primaryAction.icon}
          {primaryAction.label}
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className={cn(
              'text-4xl lg:text-5xl font-bold mb-2',
              HERO_DESIGN_TOKENS.themes[theme].title
            )}>
              {stat.value}
            </div>
            <div className={cn(
              'text-lg font-semibold mb-1',
              HERO_DESIGN_TOKENS.themes[theme].accent
            )}>
              {stat.label}
            </div>
            {stat.description && (
              <div className={cn(
                'text-sm',
                HERO_DESIGN_TOKENS.themes[theme].subtitle
              )}>
                {stat.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </Hero>
  )
}

// ============================================================================
// APPLICATION HERO PATTERNS
// ============================================================================

interface DashboardHeroProps {
  title: string
  subtitle?: string
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
  stats?: Array<{
    label: string
    value: string | number
    change?: string
    trend?: 'up' | 'down' | 'neutral'
    icon?: React.ReactNode
  }>
  actions?: HeroAction[]
  alerts?: Array<{
    type: 'info' | 'warning' | 'error' | 'success'
    message: string
    action?: HeroAction
  }>
  className?: string
}

export function DashboardHero({
  title,
  subtitle,
  breadcrumbs,
  stats,
  actions = [],
  alerts = [],
  className
}: DashboardHeroProps) {
  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800'
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      default: return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-500'
    }
  }

  return (
    <section className={cn('bg-white border-b border-gray-200 py-6', className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav>
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
          )}

          {/* Header with actions */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-lg text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
            
            {actions.length > 0 && (
              <div className="flex gap-3 flex-shrink-0">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                      action.variant === 'primary' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border',
                    getAlertStyles(alert.type)
                  )}
                >
                  <span className="text-sm font-medium">{alert.message}</span>
                  {alert.action && (
                    <button
                      onClick={alert.action.onClick}
                      className="ml-4 text-sm font-medium underline hover:no-underline"
                    >
                      {alert.action.label}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Stats grid */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {stat.icon && (
                      <div className="flex-shrink-0 text-gray-600">
                        {stat.icon}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-600 truncate">
                      {stat.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </span>
                    {stat.change && (
                      <span className={cn('text-sm font-medium', getTrendColor(stat.trend))}>
                        {stat.change}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

interface FeaturePageHeroProps {
  title: string
  subtitle?: string
  description?: string
  status?: {
    label: string
    variant: 'beta' | 'new' | 'updated' | 'deprecated'
  }
  navigation?: Array<{
    label: string
    href: string
    active?: boolean
  }>
  actions?: HeroAction[]
  className?: string
}

export function FeaturePageHero({
  title,
  subtitle,
  description,
  status,
  navigation,
  actions = [],
  className
}: FeaturePageHeroProps) {
  const getStatusStyles = (variant: string) => {
    switch (variant) {
      case 'beta': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'new': return 'bg-green-100 text-green-700 border-green-200'
      case 'updated': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'deprecated': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <section className={cn('bg-gray-50 border-b border-gray-200', className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Status badge */}
          {status && (
            <div className="flex justify-center">
              <span className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
                getStatusStyles(status.variant)
              )}>
                {status.label}
              </span>
            </div>
          )}

          {/* Title and subtitle */}
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xl text-gray-600 font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              {description}
            </p>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex gap-4 justify-center flex-wrap">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={cn(
                    'inline-flex items-center gap-2 px-6 py-3 text-base font-medium rounded-xl transition-colors',
                    action.variant === 'primary' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                      : 'border-2 border-gray-300 text-gray-700 hover:bg-white'
                  )}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Navigation tabs */}
          {navigation && navigation.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <nav className="flex justify-center">
                <div className="flex space-x-8">
                  {navigation.map((item, index) => (
                    <a
                      key={index}
                      href={item.href}
                      className={cn(
                        'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                        item.active
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      )}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

interface EmptyStateHeroProps {
  title: string
  subtitle?: string
  description?: string
  icon?: React.ReactNode
  illustration?: {
    src: string
    alt: string
  }
  primaryAction?: HeroAction
  secondaryAction?: HeroAction
  helpLinks?: Array<{
    label: string
    href: string
  }>
  className?: string
}

export function EmptyStateHero({
  title,
  subtitle,
  description,
  icon,
  illustration,
  primaryAction,
  secondaryAction,
  helpLinks,
  className
}: EmptyStateHeroProps) {
  return (
    <section className={cn('py-16 lg:py-24', className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Icon or illustration */}
          {illustration ? (
            <div className="flex justify-center">
              <img
                src={illustration.src}
                alt={illustration.alt}
                className="w-64 h-64 object-contain"
              />
            </div>
          ) : icon ? (
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="text-gray-400 w-12 h-12">
                  {icon}
                </div>
              </div>
            </div>
          ) : null}

          {/* Content */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xl text-gray-600 font-medium">
                {subtitle}
              </p>
            )}
            {description && (
              <p className="text-base text-gray-600 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {(primaryAction || secondaryAction) && (
              <div className="flex gap-4 justify-center flex-wrap">
                {primaryAction && (
                  <button
                    onClick={primaryAction.onClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    {primaryAction.icon}
                    {primaryAction.label}
                  </button>
                )}
                {secondaryAction && (
                  <button
                    onClick={secondaryAction.onClick}
                    className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {secondaryAction.icon}
                    {secondaryAction.label}
                  </button>
                )}
              </div>
            )}

            {/* Help links */}
            {helpLinks && helpLinks.length > 0 && (
              <div className="pt-4">
                <p className="text-sm text-gray-500 mb-3">Need help getting started?</p>
                <div className="flex gap-6 justify-center flex-wrap">
                  {helpLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

interface ErrorPageHeroProps {
  errorCode?: string
  title: string
  subtitle?: string
  description?: string
  primaryAction?: HeroAction
  secondaryAction?: HeroAction
  supportInfo?: {
    email?: string
    phone?: string
    helpCenter?: string
  }
  className?: string
}

export function ErrorPageHero({
  errorCode,
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
  supportInfo,
  className
}: ErrorPageHeroProps) {
  return (
    <section className={cn('py-16 lg:py-24', className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Error code */}
          {errorCode && (
            <div className="text-8xl font-black text-gray-200">
              {errorCode}
            </div>
          )}

          {/* Content */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xl text-gray-600 font-medium">
                {subtitle}
              </p>
            )}
            {description && (
              <p className="text-base text-gray-600 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <div className="flex gap-4 justify-center flex-wrap">
              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  {primaryAction.icon}
                  {primaryAction.label}
                </button>
              )}
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {secondaryAction.icon}
                  {secondaryAction.label}
                </button>
              )}
            </div>
          )}

          {/* Support info */}
          {supportInfo && (
            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Still need help?</p>
              <div className="flex gap-6 justify-center flex-wrap text-sm">
                {supportInfo.email && (
                  <a
                    href={`mailto:${supportInfo.email}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Email Support
                  </a>
                )}
                {supportInfo.phone && (
                  <a
                    href={`tel:${supportInfo.phone}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Call Support
                  </a>
                )}
                {supportInfo.helpCenter && (
                  <a
                    href={supportInfo.helpCenter}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Help Center
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { HERO_DESIGN_TOKENS as HeroTokens }
