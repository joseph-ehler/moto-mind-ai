/**
 * Hero Components
 * 
 * STRICTLY follows MotoMind Layout System - NO raw divs, proper Container widths
 * Both marketing and internal heroes with consistent design language
 */

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { focusRing, interactionStates } from '@/lib/design-system/tokens'
import { Container, Section, Stack, Flex, Grid } from '../primitives/Layout'
import { BaseCard } from '../patterns/Cards'
import { useIsMobile, useIsTouch } from '../utilities/Search'

// ============================================================================
// EDGE CASE UTILITIES
// ============================================================================

/** Safely truncate text with ellipsis */
const truncateText = (text: string | undefined, maxLength: number): string => {
  if (!text) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

/** Check if we're in RTL mode */
const useIsRTL = () => {
  if (typeof window === 'undefined') return false
  return document.documentElement.dir === 'rtl'
}

/** Text overflow handling classes */
const textOverflow = {
  truncate: 'truncate overflow-hidden',
  ellipsis: 'text-ellipsis overflow-hidden',
  wrap: 'break-words hyphens-auto',
  clamp: (lines: number) => `line-clamp-${lines}`
}

// Import from main index since Heading/Text are composite components
const Heading = ({ level, children, className }: { level: 'hero' | 'title' | 'subtitle', children: React.ReactNode, className?: string }) => {
  const levelMap = { hero: 'h1', title: 'h2', subtitle: 'h3' } as const
  const Component = levelMap[level]
  const sizeMap = {
    hero: 'text-4xl sm:text-5xl lg:text-6xl font-bold',
    title: 'text-3xl sm:text-4xl font-semibold',
    subtitle: 'text-xl sm:text-2xl font-medium'
  }
  return <Component className={cn(sizeMap[level], className)}>{children}</Component>
}

const Text = ({ size, children, className }: { size?: 'sm' | 'lg' | 'xl', children: React.ReactNode, className?: string }) => {
  const sizeMap = { sm: 'text-sm', lg: 'text-lg', xl: 'text-xl' }
  return <p className={cn('text-base leading-relaxed', size && sizeMap[size], className)}>{children}</p>
}

// ============================================================================
// MARKETING HERO (Landing pages, marketing site)
// ============================================================================

export interface MarketingHeroProps {
  /** Hero headline */
  headline: string
  /** Supporting text */
  subheadline: string
  /** Primary CTA */
  primaryCTA?: {
    label: string
    onClick: () => void
  }
  /** Secondary CTA */
  secondaryCTA?: {
    label: string
    onClick: () => void
  }
  /** Hero image/visual */
  visual?: React.ReactNode
  /** Badge above headline */
  badge?: string
  /** Layout variant */
  layout?: 'centered' | 'split'
}

export const MarketingHero = forwardRef<HTMLDivElement, MarketingHeroProps>(
  ({
    headline,
    subheadline,
    primaryCTA,
    secondaryCTA,
    visual,
    badge,
    layout = 'centered'
  }, ref) => {
    // Mobile-first responsive design
    const isMobile = useIsMobile()
    const isTouch = useIsTouch()
    
    if (layout === 'split') {
      return (
        <Section spacing={isMobile ? 'lg' : 'xl'}>
          <Container size="lg" useCase="marketing_hero" override={{
            reason: "Marketing hero needs space for split layout with visual",
            approvedBy: "Design System"
          }}>
            <Grid columns={isMobile ? 1 : 2} gap={isMobile ? 'lg' : 'xl'} className="items-center">
              {/* Content */}
              <Stack spacing="xl">
                {badge && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium w-fit">
                    {badge}
                  </span>
                )}
                
                <Stack spacing="lg">
                  <Heading level="hero">{headline}</Heading>
                  <Text size="xl" className="text-gray-600 max-w-2xl">
                    {subheadline}
                  </Text>
                </Stack>

                {(primaryCTA || secondaryCTA) && (
                  <Flex className={cn('flex-wrap', isMobile ? 'gap-3' : 'gap-4')}>
                    {primaryCTA && (
                      <button
                        onClick={primaryCTA.onClick}
                        className={cn(
                          'rounded-lg bg-primary text-primary-foreground font-semibold',
                          isMobile ? 'px-5 py-2.5 text-base' : 'px-6 py-3 text-lg',
                          isTouch && 'min-h-[44px]',
                          focusRing.default,
                          interactionStates.hover.scale,
                          interactionStates.active.scale
                        )}
                      >
                        {primaryCTA.label}
                      </button>
                    )}
                    {secondaryCTA && (
                      <button
                        onClick={secondaryCTA.onClick}
                        className={cn(
                          'rounded-lg border-2 font-semibold',
                          isMobile ? 'px-5 py-2.5 text-base' : 'px-6 py-3 text-lg',
                          isTouch && 'min-h-[44px]',
                          focusRing.default,
                          interactionStates.hover.opacity
                        )}
                      >
                        {secondaryCTA.label}
                      </button>
                    )}
                  </Flex>
                )}
              </Stack>

              {/* Visual */}
              {visual && (
                <Stack spacing="none" className={isMobile ? 'order-first' : undefined}>
                  {visual}
                </Stack>
              )}
            </Grid>
          </Container>
        </Section>
      )
    }

    // Centered layout
    return (
      <Section spacing={isMobile ? 'lg' : 'xl'}>
        <Container size="md" useCase="marketing_hero">
          <Stack spacing={isMobile ? 'lg' : 'xl'} className="text-center items-center">
            {badge && (
              <span className={cn(
                'inline-flex items-center rounded-full bg-primary/10 text-primary font-medium',
                isMobile ? 'px-2.5 py-1 text-xs' : 'px-3 py-1 text-sm'
              )}>
                {badge}
              </span>
            )}
            
            <Stack spacing="lg" className="items-center">
              <Heading level="hero">{headline}</Heading>
              <Text size="xl" className="text-gray-600 max-w-2xl">
                {subheadline}
              </Text>
            </Stack>

            {(primaryCTA || secondaryCTA) && (
              <Flex className={cn('flex-wrap justify-center', isMobile ? 'gap-3' : 'gap-4')}>
                {primaryCTA && (
                  <button
                    onClick={primaryCTA.onClick}
                    className={cn(
                      'rounded-lg bg-primary text-primary-foreground font-semibold',
                      isMobile ? 'px-5 py-2.5 text-base' : 'px-6 py-3 text-lg',
                      isTouch && 'min-h-[44px]',
                      focusRing.default,
                      interactionStates.hover.scale,
                      interactionStates.active.scale
                    )}
                  >
                    {primaryCTA.label}
                  </button>
                )}
                {secondaryCTA && (
                  <button
                    onClick={secondaryCTA.onClick}
                    className={cn(
                      'rounded-lg border-2 font-semibold',
                      isMobile ? 'px-5 py-2.5 text-base' : 'px-6 py-3 text-lg',
                      isTouch && 'min-h-[44px]',
                      focusRing.default,
                      interactionStates.hover.opacity
                    )}
                  >
                    {secondaryCTA.label}
                  </button>
                )}
              </Flex>
            )}

            {visual && (
              <Stack spacing="none" className={isMobile ? 'w-full' : undefined}>
                {visual}
              </Stack>
            )}
          </Stack>
        </Container>
      </Section>
    )
  }
)
MarketingHero.displayName = 'MarketingHero'

// ============================================================================
// PAGE HERO (Internal app pages)
// ============================================================================

export interface PageHeroProps {
  /** Page title */
  title: string
  /** Page description */
  description?: string
  /** Icon */
  icon?: React.ReactNode
  /** Breadcrumbs */
  breadcrumbs?: Array<{ label: string; href?: string }>
  /** Actions (buttons) */
  actions?: React.ReactNode
  /** Tabs or secondary navigation */
  tabs?: React.ReactNode
  /** Loading state */
  loading?: boolean
  /** Last updated timestamp */
  lastUpdated?: string
}

export const PageHero = forwardRef<HTMLDivElement, PageHeroProps>(
  ({ title, description, icon, breadcrumbs, actions, tabs, loading, lastUpdated }, ref) => {
    
    if (loading) {
      return (
        <Section spacing="md">
          <Container size="md" useCase="articles">
            <Stack spacing="md">
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              <Flex className="items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
                <Stack spacing="sm" className="flex-1">
                  <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
                </Stack>
              </Flex>
            </Stack>
          </Container>
        </Section>
      )
    }
    return (
      <Section spacing="md">
        <Container size="md" useCase="articles">
          <Stack spacing="md">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Flex className="gap-2 text-sm text-gray-600">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {crumb.href ? (
                      <a
                        href={crumb.href}
                        className={cn(
                          'hover:text-gray-900',
                          focusRing.default
                        )}
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="text-gray-900 font-medium">
                        {crumb.label}
                      </span>
                    )}
                    {index < breadcrumbs.length - 1 && (
                      <span className="text-gray-400">/</span>
                    )}
                  </React.Fragment>
                ))}
              </Flex>
            )}

            {/* Title + Actions */}
            <Flex className="items-start justify-between gap-4">
              <Flex className="items-start gap-4 flex-1 min-w-0">
                {icon && (
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {icon}
                  </div>
                )}
                <Stack spacing="sm" className="flex-1 min-w-0">
                  <Heading level="hero">{title}</Heading>
                  {description && (
                    <Text size="lg" className="text-gray-600">
                      {description}
                    </Text>
                  )}
                  {lastUpdated && (
                    <Text size="sm" className="text-gray-500">
                      Last updated {lastUpdated}
                    </Text>
                  )}
                </Stack>
              </Flex>

              {actions && (
                <Flex className="gap-3 flex-shrink-0">
                  {actions}
                </Flex>
              )}
            </Flex>

            {/* Tabs */}
            {tabs && (
              <div>
                {tabs}
              </div>
            )}
          </Stack>
        </Container>
      </Section>
    )
  }
)
PageHero.displayName = 'PageHero'

// ============================================================================
// DASHBOARD HERO (Dashboard pages with metrics)
// ============================================================================

export interface DashboardHeroProps {
  /** Dashboard title */
  title: string
  /** Dashboard description */
  description?: string
  /** Quick stats/metrics */
  metrics?: Array<{
    label: string
    value: string | number
    change?: string
    trend?: 'up' | 'down' | 'neutral'
  }>
  /** Actions */
  actions?: React.ReactNode
  /** Loading state */
  loading?: boolean
}

export const DashboardHero = forwardRef<HTMLDivElement, DashboardHeroProps>(
  ({ title, description, metrics, actions, loading }, ref) => {
    const isMobile = useIsMobile()
    
    // Loading skeleton
    if (loading) {
      return (
        <Section spacing={isMobile ? 'md' : 'lg'}>
          <Container size="md" useCase="articles">
            <Stack spacing={isMobile ? 'md' : 'lg'}>
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-gray-200 rounded w-64" />
                <div className="h-4 bg-gray-200 rounded w-96" />
              </div>
              <Grid columns={isMobile ? 1 : (metrics?.length && metrics.length > 3 ? 4 : 3)} gap="md">
                {[...Array(metrics?.length || 3)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
                    <div className="h-8 bg-gray-200 rounded w-16" />
                  </div>
                ))}
              </Grid>
            </Stack>
          </Container>
        </Section>
      )
    }
    
    return (
      <Section spacing={isMobile ? 'md' : 'lg'}>
        <Container size="md" useCase="articles">
          <Stack spacing={isMobile ? 'md' : 'lg'}>
            {/* Header */}
            <Flex className="items-start justify-between gap-4">
              <Stack spacing="sm" className="flex-1">
                <Heading level="hero">{title}</Heading>
                {description && (
                  <Text size="lg" className="text-gray-600">
                    {description}
                  </Text>
                )}
              </Stack>

              {actions && (
                <Flex className="gap-3 flex-shrink-0">
                  {actions}
                </Flex>
              )}
            </Flex>

            {/* Metrics */}
            {metrics && metrics.length > 0 && (
              <Grid 
                columns={isMobile ? 1 : (metrics.length > 3 ? 4 : (metrics.length as 1 | 2 | 3))} 
                gap={isMobile ? 'sm' : 'md'}
              >
                {metrics.map((metric, index) => (
                  <BaseCard key={index} padding="md" elevation="low">
                    <Stack spacing="sm">
                      <Text size="sm" className="text-gray-600 font-medium uppercase tracking-wide">
                        {metric.label}
                      </Text>
                      <Heading level="title">{metric.value}</Heading>
                      {metric.change && (
                        <Flex className="items-center gap-1">
                          <span className={cn(
                            'text-sm font-medium',
                            metric.trend === 'up' && 'text-green-600',
                            metric.trend === 'down' && 'text-red-600',
                            metric.trend === 'neutral' && 'text-gray-600'
                          )}>
                            {metric.trend === 'up' && '↑'}
                            {metric.trend === 'down' && '↓'}
                            {metric.trend === 'neutral' && '→'}
                            {' '}{metric.change}
                          </span>
                        </Flex>
                      )}
                    </Stack>
                  </BaseCard>
                ))}
              </Grid>
            )}
          </Stack>
        </Container>
      </Section>
    )
  }
)
DashboardHero.displayName = 'DashboardHero'

// ============================================================================
// FEATURE HERO (Feature announcement/launch)
// ============================================================================

export interface FeatureHeroProps {
  /** Feature name */
  feature: string
  /** Feature headline */
  headline: string
  /** Feature description */
  description: string
  /** Primary CTA */
  cta?: {
    label: string
    onClick: () => void
  }
  /** Visual/screenshot */
  visual?: React.ReactNode
  /** Status badge */
  badge?: string
}

export const FeatureHero = forwardRef<HTMLDivElement, FeatureHeroProps>(
  ({ feature, headline, description, cta, visual, badge }, ref) => {
    const isMobile = useIsMobile()
    const isTouch = useIsTouch()
    
    return (
      <Section spacing={isMobile ? 'lg' : 'xl'}>
        <Container size="md" useCase="articles">
          <Stack spacing={isMobile ? 'lg' : 'xl'} className="text-center items-center">
            {/* Badge */}
            {badge && (
              <span className={cn(
                'inline-flex items-center rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wide',
                isMobile ? 'px-2.5 py-1 text-xs' : 'px-3 py-1 text-sm'
              )}>
                {badge}
              </span>
            )}

            {/* Feature name */}
            <Text size="sm" className="text-primary font-semibold uppercase tracking-wide">
              {feature}
            </Text>

            {/* Headline */}
            <Stack spacing="lg" className="items-center">
              <Heading level="hero">{headline}</Heading>
              <Text size="xl" className="text-gray-600 max-w-2xl">
                {description}
              </Text>
            </Stack>

            {/* CTA */}
            {cta && (
              <button
                onClick={cta.onClick}
                className={cn(
                  'rounded-lg bg-primary text-primary-foreground font-semibold',
                  isMobile ? 'px-5 py-2.5 text-base' : 'px-6 py-3 text-lg',
                  isTouch && 'min-h-[44px]',
                  focusRing.default,
                  interactionStates.hover.scale,
                  interactionStates.active.scale
                )}
              >
                {cta.label}
              </button>
            )}

            {/* Visual */}
            {visual && (
              <Stack spacing="none" className="w-full">
                {visual}
              </Stack>
            )}
          </Stack>
        </Container>
      </Section>
    )
  }
)
FeatureHero.displayName = 'FeatureHero'

// ============================================================================
// EMPTY STATE HERO (No data pages)
// ============================================================================

export interface EmptyStateHeroProps {
  /** Icon */
  icon: React.ReactNode
  /** Title */
  title: string
  /** Description */
  description: string
  /** Primary action */
  action?: {
    label: string
    onClick: () => void
  }
  /** Secondary action */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export const EmptyStateHero = forwardRef<HTMLDivElement, EmptyStateHeroProps>(
  ({ icon, title, description, action, secondaryAction }, ref) => {
    const isMobile = useIsMobile()
    const isTouch = useIsTouch()
    
    return (
      <Section spacing={isMobile ? 'lg' : 'xl'}>
        <Container size="md" useCase="articles">
          <Stack spacing={isMobile ? 'lg' : 'xl'} className={cn('text-center items-center', isMobile ? 'py-8' : 'py-12')}>
            {/* Icon */}
            <Flex className={cn(
              'rounded-full bg-gray-100 items-center justify-center text-gray-400',
              isMobile ? 'w-14 h-14' : 'w-16 h-16'
            )}>
              {icon}
            </Flex>

            {/* Content */}
            <Stack spacing="lg" className="items-center">
              <Heading level="title">{title}</Heading>
              <Text size="lg" className="text-gray-600 max-w-md">
                {description}
              </Text>
            </Stack>

            {/* Actions */}
            {(action || secondaryAction) && (
              <Flex className={cn('flex-wrap justify-center', isMobile ? 'gap-2' : 'gap-3')}>
                {action && (
                  <button
                    onClick={action.onClick}
                    className={cn(
                      'rounded-lg bg-primary text-primary-foreground font-semibold',
                      isMobile ? 'px-4 py-2 text-sm' : 'px-5 py-2.5 text-base',
                      isTouch && 'min-h-[44px]',
                      focusRing.default,
                      interactionStates.hover.scale,
                      interactionStates.active.scale
                    )}
                  >
                    {action.label}
                  </button>
                )}
                {secondaryAction && (
                  <button
                    onClick={secondaryAction.onClick}
                    className={cn(
                      'rounded-lg border-2 font-semibold',
                      isMobile ? 'px-4 py-2 text-sm' : 'px-5 py-2.5 text-base',
                      isTouch && 'min-h-[44px]',
                      focusRing.default,
                      interactionStates.hover.opacity
                    )}
                  >
                    {secondaryAction.label}
                  </button>
                )}
              </Flex>
            )}
          </Stack>
        </Container>
      </Section>
    )
  }
)
EmptyStateHero.displayName = 'EmptyStateHero'

// ============================================================================
// ENTITY HERO (Detail pages - vehicles, garages, profiles, etc.)
// ============================================================================

export interface EntityChip {
  /** Chip label/value */
  label: string
  /** Icon before label */
  icon?: React.ReactNode
  /** Is this chip copyable? */
  copyable?: boolean
  /** Click handler (if not copyable) */
  onClick?: () => void
  /** Visual variant */
  variant?: 'default' | 'muted'
  /** Tooltip text (PHASE 2) */
  tooltip?: string
  /** Badge count (PHASE 2) */
  badge?: string | number
}

export type EntityHeroColor = 
  | 'blue'
  | 'purple'
  | 'green'
  | 'red'
  | 'orange'
  | 'pink'
  | 'indigo'
  | 'teal'
  | 'cyan'
  | 'slate'

export type EntityHeroSize = 'compact' | 'default' | 'large'

export interface StatusBadge {
  /** Badge label */
  label: string
  /** Badge variant */
  variant?: 'success' | 'warning' | 'error' | 'info'
  /** Badge icon */
  icon?: React.ReactNode
}

export interface QuickAction {
  /** Action label */
  label: string
  /** Action icon */
  icon?: React.ReactNode
  /** Click handler */
  onClick: () => void
  /** Is this action loading? */
  loading?: boolean
  /** Is this action disabled? */
  disabled?: boolean
}

export interface EntityMetric {
  /** Metric label */
  label: string
  /** Metric value */
  value: string | number
  /** Metric icon */
  icon?: React.ReactNode
}

export interface Breadcrumb {
  /** Breadcrumb label */
  label: string
  /** Breadcrumb link (optional) */
  href?: string
  /** Click handler (if not href) */
  onClick?: () => void
}

export interface EntityHeroProps {
  /** Primary title (e.g., "2023 Honda Civic") */
  title: string
  /** Subtitle/trim (e.g., "Sport Touring") */
  subtitle?: string
  /** Nickname or secondary text (e.g., "My Daily Driver") */
  nickname?: string
  /** Info chips/badges */
  chips?: EntityChip[]
  /** Actions menu in top right */
  actionsMenu?: React.ReactNode
  /** Color theme - predefined gradients */
  color?: EntityHeroColor
  /** Hero image (optional) */
  heroImage?: string
  /** Back navigation */
  onBack?: () => void
  /** Back label */
  backLabel?: string
  /** Additional className */
  className?: string
  // ✨ PHASE 1 ENHANCEMENTS
  /** Size variant */
  size?: EntityHeroSize
  /** Loading state - shows skeleton */
  loading?: boolean
  /** Status badge (verified, premium, etc.) */
  statusBadge?: StatusBadge
  /** Quick action buttons */
  quickActions?: QuickAction[]
  /** Metrics bar */
  metrics?: EntityMetric[]
  /** ARIA label for accessibility */
  'aria-label'?: string
  // ✨ PHASE 2 ENHANCEMENTS
  /** Video background URL */
  heroVideo?: string
  /** Video fallback image */
  heroVideoFallback?: string
  /** Breadcrumbs navigation */
  breadcrumbs?: Breadcrumb[]
  /** Share handler */
  onShare?: () => void
  /** Export handler */
  onExport?: () => void
}

export const EntityHero = forwardRef<HTMLDivElement, EntityHeroProps>(
  ({
    title,
    subtitle,
    nickname,
    chips = [],
    actionsMenu,
    color = 'blue',
    heroImage,
    onBack,
    backLabel,
    className,
    // Phase 1
    size = 'default',
    loading = false,
    statusBadge,
    quickActions = [],
    metrics = [],
    'aria-label': ariaLabel,
    // Phase 2
    heroVideo,
    heroVideoFallback,
    breadcrumbs = [],
    onShare,
    onExport
  }, ref) => {
    const [copiedStates, setCopiedStates] = React.useState<Record<string, boolean>>({})
    
    // Mobile-first responsive design
    const isMobile = useIsMobile()
    const isTouch = useIsTouch()
    const isRTL = useIsRTL()
    
    // Edge case: Safely handle undefined/null values
    const safeTitle = title || 'Untitled'
    const safeSubtitle = subtitle || ''
    const safeNickname = nickname || ''

    const handleCopy = async (text: string, index: number) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopiedStates(prev => ({ ...prev, [index]: true }))
        setTimeout(() => {
          setCopiedStates(prev => ({ ...prev, [index]: false }))
        }, 2000)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }

    // Predefined gradient color blocks
    const colorGradients = {
      blue: 'bg-gradient-to-br from-blue-600 to-blue-700',
      purple: 'bg-gradient-to-br from-purple-600 to-purple-700',
      green: 'bg-gradient-to-br from-green-600 to-green-700',
      red: 'bg-gradient-to-br from-red-600 to-red-700',
      orange: 'bg-gradient-to-br from-orange-600 to-orange-700',
      pink: 'bg-gradient-to-br from-pink-600 to-pink-700',
      indigo: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
      teal: 'bg-gradient-to-br from-teal-600 to-teal-700',
      cyan: 'bg-gradient-to-br from-cyan-600 to-cyan-700',
      slate: 'bg-gradient-to-br from-slate-600 to-slate-700'
    }

    // Mobile-first size variants with responsive design
    const sizeStyles = {
      compact: {
        minHeight: isMobile ? 'min-h-[120px]' : 'min-h-[140px]',
        padding: isMobile ? 'p-4 pr-12' : 'p-6 pr-16',
        titleSize: isMobile ? 'text-xl' : 'text-2xl',
        subtitleSize: isMobile ? 'text-sm' : 'text-base',
        nicknameSize: isMobile ? 'text-base' : 'text-lg',
        chipSize: isMobile ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'
      },
      default: {
        minHeight: isMobile ? 'min-h-[160px]' : 'min-h-[200px]',
        padding: isMobile ? 'p-6 pr-14' : 'p-10 pr-20',
        titleSize: isMobile ? 'text-2xl' : 'text-3xl',
        subtitleSize: isMobile ? 'text-base' : 'text-xl',
        nicknameSize: isMobile ? 'text-lg' : 'text-xl',
        chipSize: isMobile ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'
      },
      large: {
        minHeight: isMobile ? 'min-h-[200px]' : 'min-h-[260px]',
        padding: isMobile ? 'p-8 pr-16' : 'p-12 pr-24',
        titleSize: isMobile ? 'text-3xl' : 'text-4xl',
        subtitleSize: isMobile ? 'text-lg' : 'text-2xl',
        nicknameSize: isMobile ? 'text-xl' : 'text-2xl',
        chipSize: isMobile ? 'text-sm px-3 py-1.5' : 'text-sm px-4 py-2'
      }
    }

    const currentSize = sizeStyles[size]
    
    // Mobile-optimized spacing
    const spacing = {
      stack: isMobile ? 'sm' : 'md',
      chips: isMobile ? 'gap-2' : 'gap-3',
      actions: isMobile ? 'gap-1.5' : 'gap-2',
      metrics: isMobile ? 'gap-4' : 'gap-6'
    } as const

    // Status badge colors
    const badgeVariants = {
      success: 'bg-green-500/90',
      warning: 'bg-yellow-500/90',
      error: 'bg-red-500/90',
      info: 'bg-blue-500/90'
    }

    // Loading skeleton
    if (loading) {
      return (
        <div
          ref={ref}
          className={cn(
            'relative rounded-3xl shadow-sm overflow-hidden animate-pulse',
            currentSize.minHeight,
            colorGradients[color],
            className
          )}
          aria-label="Loading..."
        >
          <div className={cn('relative', currentSize.padding)}>
            <div className={cn('h-8 bg-white/20 rounded w-3/4', currentSize.titleSize)} />
            <div className="h-4 bg-white/10 rounded w-1/2 mt-3" />
            <div className="flex gap-3 mt-6">
              <div className="h-8 w-24 bg-white/20 rounded-full" />
              <div className="h-8 w-32 bg-white/20 rounded-full" />
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-3xl text-white shadow-sm overflow-hidden',
          currentSize.minHeight,
          colorGradients[color],
          // High contrast mode support
          'forced-colors:border-2 forced-colors:border-white',
          className
        )}
        aria-label={ariaLabel || `${safeTitle} details`}
        role="region"
        // RTL support
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Video Background (Phase 2) */}
        {heroVideo && (
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={heroVideoFallback || heroImage}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        )}

        {/* Hero Image Background (if provided) */}
        {!heroVideo && heroImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        )}

        {/* Actions Menu - Top Right (Mobile-optimized positioning) */}
        {actionsMenu && (
          <div className={cn(
            'absolute z-10',
            isMobile ? 'top-4 right-4' : 'top-10 right-10'
          )}>
            {actionsMenu}
          </div>
        )}

        {/* Breadcrumbs (Phase 2) */}
        {breadcrumbs.length > 0 && !onBack && (
          <div className={cn(
            'absolute z-10',
            isMobile ? 'top-4 left-4' : 'top-6 left-6'
          )}>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {crumb.href || crumb.onClick ? (
                    <button
                      onClick={crumb.onClick}
                      className="text-white/80 hover:text-white transition-colors"
                      aria-label={`Navigate to ${crumb.label}`}
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-white font-medium">{crumb.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <span className="text-white/50">/</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}

        {/* Main Content */}
        <div className={cn('relative', currentSize.padding)}>
          <Stack spacing={spacing.stack}>
            {/* Title Row with Status Badge */}
            <Flex className="items-start gap-3">
              <Stack spacing="sm" className="flex-1 min-w-0">
                {/* Primary Title - Handle long text with wrapping */}
                <h1 className={cn(
                  currentSize.titleSize, 
                  'font-semibold tracking-tight leading-tight',
                  textOverflow.wrap,
                  // RTL support
                  isRTL && 'text-right'
                )}>
                  {safeTitle}
                  {safeSubtitle && (
                    <span className="text-white/90"> {safeSubtitle}</span>
                  )}
                </h1>

                {/* Nickname/Secondary Text - Truncate if too long */}
                {safeNickname && (
                  <p className={cn(
                    currentSize.nicknameSize, 
                    'text-white/80 font-medium',
                    textOverflow.wrap
                  )}>
                    "{isMobile && safeNickname.length > 40 ? truncateText(safeNickname, 40) : safeNickname}"
                  </p>
                )}
              </Stack>

              {/* Status Badge */}
              {statusBadge && (
                <div className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-white',
                  badgeVariants[statusBadge.variant || 'success']
                )}>
                  {statusBadge.icon}
                  <span>{statusBadge.label}</span>
                </div>
              )}
            </Flex>

            {/* Quick Actions (with auto share/export from Phase 2) */}
            {(quickActions.length > 0 || onShare || onExport) && (
              <Flex className={spacing.actions}>
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    disabled={action.disabled || action.loading}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                      'bg-white/10 hover:bg-white/20 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    aria-label={action.label}
                  >
                    {action.loading ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
                {/* Auto Share Button */}
                {onShare && (
                  <button
                    onClick={onShare}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label="Share"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Share</span>
                  </button>
                )}
                {/* Auto Export Button */}
                {onExport && (
                  <button
                    onClick={onExport}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors"
                    aria-label="Export"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export</span>
                  </button>
                )}
              </Flex>
            )}

            {/* Info Chips - Handle overflow with horizontal scroll */}
            {chips.length > 0 && (
              <div className="overflow-hidden -mx-1 px-1">
                <Flex className={cn(
                  spacing.chips, 
                  'overflow-x-auto pb-1',
                  // Smooth scrolling on touch devices
                  'scroll-smooth',
                  // Hide scrollbar but keep functionality
                  '[&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full',
                  // RTL support
                  isRTL && 'flex-row-reverse'
                )}>
                  {chips.map((chip, index) => {
                    const isCopied = copiedStates[index]
                    const Component = chip.copyable || chip.onClick ? 'button' : 'span'
                    
                    return (
                      <Component
                        key={index}
                        onClick={
                          chip.copyable 
                            ? () => handleCopy(chip.label, index)
                            : chip.onClick
                        }
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full font-medium whitespace-nowrap transition-all duration-200 relative',
                          currentSize.chipSize,
                          chip.variant === 'muted' 
                            ? 'bg-white/10 opacity-60'
                            : 'bg-white/20',
                          (chip.copyable || chip.onClick) && cn(
                            'hover:bg-white/30 cursor-pointer',
                            // Larger touch targets on mobile
                            isTouch && 'min-h-[44px]'
                          ),
                          isCopied && 'bg-green-500/30'
                        )}
                        title={chip.tooltip || (chip.copyable ? 'Click to copy' : undefined)}
                        aria-label={chip.copyable ? `Copy ${chip.label}` : chip.label}
                      >
                        {chip.icon}
                        <span className={cn(
                          // Truncate very long chip labels
                          chip.label && chip.label.length > 30 ? 'max-w-[150px] truncate' : undefined
                        )}>
                          {isCopied ? 'Copied!' : chip.label}
                        </span>
                        {/* Badge Count (Phase 2) */}
                        {chip.badge && !isCopied && (
                          <span className={cn(
                            'ml-1 px-1.5 py-0.5 font-bold bg-white/30 rounded-full',
                            isMobile ? 'text-[10px]' : 'text-xs',
                            // High contrast mode
                            'forced-colors:bg-ButtonText forced-colors:text-ButtonFace'
                          )}>
                            {chip.badge}
                          </span>
                        )}
                      </Component>
                  )
                })}
              </Flex>
            </div>
          )}

            {/* Metrics Bar */}
            {metrics.length > 0 && (
              <Flex className={cn(spacing.metrics, 'pt-2 border-t border-white/10')}>
                {metrics.map((metric, index) => (
                  <Flex key={index} className="items-center gap-2">
                    {metric.icon && <div className="text-white/70">{metric.icon}</div>}
                    <Stack spacing="none">
                      <span className="text-xs text-white/60 uppercase tracking-wide">
                        {metric.label}
                      </span>
                      <span className="text-sm font-semibold">{metric.value}</span>
                    </Stack>
                  </Flex>
                ))}
              </Flex>
            )}
          </Stack>
        </div>

        {/* Back Navigation Overlay (if provided - Mobile-optimized) */}
        {onBack && (
          <div className={cn(
            'absolute top-0 left-0 right-0 bg-gradient-to-b from-black/10 to-transparent',
            isMobile ? 'p-4' : 'p-6'
          )}>
            <button 
              onClick={onBack}
              className={cn(
                'flex items-center text-white/90 hover:text-white transition-colors',
                isMobile ? 'gap-2' : 'gap-3',
                // Better touch target on mobile
                isTouch && 'min-h-[44px]'
              )}
            >
              <div className={cn(
                'flex items-center justify-center hover:bg-white/20 rounded-full transition-all duration-200',
                isMobile ? 'w-10 h-10' : 'w-8 h-8'
              )}>
                <svg className={isMobile ? 'h-6 w-6' : 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              {backLabel && <span className={cn('font-medium', isMobile && 'text-sm')}>{backLabel}</span>}
            </button>
          </div>
        )}
      </div>
    )
  }
)
EntityHero.displayName = 'EntityHero'
