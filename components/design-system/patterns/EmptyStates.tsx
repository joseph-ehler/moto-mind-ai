/**
 * Empty States
 * 
 * Premium empty state components for various contexts
 * Based on specs page aesthetic - Apple-inspired, clean, minimal
 * 
 * @keyframes float - Add to globals.css:
 * @keyframes float {
 *   0%, 100% { transform: translateY(0px); }
 *   50% { transform: translateY(-10px); }
 * }
 */

import React from 'react'
import { Stack, Flex } from '../primitives/Layout'

// ============================================================================
// 1. BASIC EMPTY STATE - Simple message with optional action
// ============================================================================

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void | Promise<void>
    loading?: boolean
    disabled?: boolean
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  // Elite features
  iconAnimation?: 'bounce' | 'pulse' | 'float' | 'none'
  keyboardShortcuts?: boolean
  onView?: (stateName: string) => void
}

/**
 * EmptyState - Basic empty state component
 * 
 * Use when there's no data to display
 * Centered layout with icon, title, description, and actions
 * 
 * @example
 * <EmptyState
 *   icon={<Car className="w-12 h-12" />}
 *   title="No vehicles yet"
 *   description="Add your first vehicle to get started"
 *   action={{
 *     label: 'Add Vehicle',
 *     onClick: () => openModal()
 *   }}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  animated = true,
  iconAnimation = 'bounce',
  keyboardShortcuts = false,
  onView
}: EmptyStateProps) {
  // Analytics tracking
  React.useEffect(() => {
    onView?.('EmptyState')
  }, [onView])

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!keyboardShortcuts) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && action && !action.disabled && !action.loading) {
        e.preventDefault()
        action.onClick()
      }
      if (e.key === 'Escape' && secondaryAction) {
        e.preventDefault()
        secondaryAction.onClick()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [keyboardShortcuts, action, secondaryAction])

  const sizeConfig = {
    sm: {
      minHeight: 'min-h-[300px]',
      maxWidth: 'max-w-sm',
      iconSize: 'w-12 h-12',
      iconInner: '[&>svg]:w-6 [&>svg]:h-6',
      titleSize: 'text-lg',
      spacing: 'md' as const
    },
    md: {
      minHeight: 'min-h-[400px]',
      maxWidth: 'max-w-md',
      iconSize: 'w-16 h-16',
      iconInner: '[&>svg]:w-8 [&>svg]:h-8',
      titleSize: 'text-xl',
      spacing: 'lg' as const
    },
    lg: {
      minHeight: 'min-h-[500px]',
      maxWidth: 'max-w-lg',
      iconSize: 'w-20 h-20',
      iconInner: '[&>svg]:w-10 [&>svg]:h-10',
      titleSize: 'text-2xl',
      spacing: 'xl' as const
    }
  }

  const animationClasses = {
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    float: 'animate-[float_3s_ease-in-out_infinite]',
    none: ''
  }

  const config = sizeConfig[size]

  return (
    <div className={`flex items-center justify-center ${config.minHeight} p-8`}>
      <Stack 
        spacing={config.spacing} 
        className={`items-center text-center ${config.maxWidth} w-full ${animated ? 'animate-in fade-in duration-300' : ''}`}
      >
        {icon && (
          <div className={`${config.iconSize} mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-black/40 ${config.iconInner} ${animationClasses[iconAnimation]}`}>
            {icon}
          </div>
        )}
        
        <Stack spacing="sm" className="items-center w-full">
          <h3 className={`${config.titleSize} font-semibold text-black`}>
            {title}
          </h3>
          {description && (
            <p className="text-sm text-black/60 leading-relaxed">
              {description}
            </p>
          )}
        </Stack>

        {(action || secondaryAction) && (
          <Flex gap="md" className="flex-wrap justify-center">
            {action && (
              <button
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <span>{action.loading ? 'Loading...' : action.label}</span>
                {keyboardShortcuts && !action.disabled && !action.loading && (
                  <kbd className="px-1.5 py-0.5 text-xs bg-white/20 rounded font-mono">⏎</kbd>
                )}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="px-6 py-2.5 text-sm font-medium border border-black/10 text-black bg-white rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 inline-flex items-center gap-2"
              >
                <span>{secondaryAction.label}</span>
                {keyboardShortcuts && (
                  <kbd className="px-1.5 py-0.5 text-xs bg-slate-100 rounded font-mono text-black/60">Esc</kbd>
                )}
              </button>
            )}
          </Flex>
        )}
      </Stack>
    </div>
  )
}

// ============================================================================
// 2. SEARCH EMPTY STATE - No search results
// ============================================================================

export interface SearchEmptyStateProps {
  query: string
  suggestions?: string[]
  onClearSearch?: () => void
  onSuggestionClick?: (suggestion: string) => void
}

/**
 * SearchEmptyState - No search results found
 * 
 * Use when search returns no results
 * Shows query, suggestions, and clear option
 * 
 * @example
 * <SearchEmptyState
 *   query="honda covic"
 *   suggestions={['honda civic', 'honda accord', 'toyota corolla']}
 *   onClearSearch={() => setQuery('')}
 *   onSuggestionClick={(s) => setQuery(s)}
 * />
 */
export function SearchEmptyState({
  query,
  suggestions = [],
  onClearSearch,
  onSuggestionClick
}: SearchEmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[300px] p-8">
      <Stack spacing="lg" className="items-center text-center max-w-md w-full">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-black/40">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <Stack spacing="sm" className="items-center w-full">
          <h3 className="text-xl font-semibold text-black">
            No results for "{query}"
          </h3>
          <p className="text-sm text-black/60">
            Try adjusting your search or clearing filters
          </p>
        </Stack>

        {suggestions.length > 0 && (
          <Stack spacing="sm" className="items-center w-full">
            <p className="text-xs font-medium text-black/60 uppercase tracking-wider">
              Did you mean?
            </p>
            <Flex gap="sm" className="flex-wrap justify-center">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="px-3 py-1.5 text-sm text-black/70 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                >
                  {suggestion}
                </button>
              ))}
            </Flex>
          </Stack>
        )}

        {onClearSearch && (
          <button
            onClick={onClearSearch}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            Clear search
          </button>
        )}
      </Stack>
    </div>
  )
}

// ============================================================================
// 3. ERROR EMPTY STATE - Something went wrong
// ============================================================================

export interface ErrorEmptyStateProps {
  title?: string
  description?: string
  errorCode?: string
  onRetry?: () => void
  onGoBack?: () => void
}

/**
 * ErrorEmptyState - Error state component
 * 
 * Use when an error occurs loading data
 * Shows error message with retry option
 * 
 * @example
 * <ErrorEmptyState
 *   title="Failed to load vehicles"
 *   description="We couldn't fetch your vehicles. Please try again."
 *   errorCode="ERR_NETWORK"
 *   onRetry={() => refetch()}
 *   onGoBack={() => router.back()}
 * />
 */
export function ErrorEmptyState({
  title = 'Something went wrong',
  description = "We couldn't load this content. Please try again.",
  errorCode,
  onRetry,
  onGoBack
}: ErrorEmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Stack spacing="lg" className="items-center text-center max-w-md w-full">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 flex items-center justify-center text-red-600 [&>svg]:w-8 [&>svg]:h-8">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <Stack spacing="sm" className="items-center w-full">
          <h3 className="text-xl font-semibold text-black">
            {title}
          </h3>
          <p className="text-sm text-black/60 leading-relaxed">
            {description}
          </p>
          {errorCode && (
            <p className="text-xs text-black/40 font-mono">
              Error: {errorCode}
            </p>
          )}
        </Stack>

        <Flex gap="md" className="flex-wrap justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Try Again
            </button>
          )}
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="px-6 py-2.5 text-sm font-medium border border-black/10 text-black bg-white rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
            >
              Go Back
            </button>
          )}
        </Flex>
      </Stack>
    </div>
  )
}

// ============================================================================
// 4. FIRST TIME EMPTY STATE - Onboarding/welcome
// ============================================================================

export interface FirstTimeEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  features?: Array<{
    icon: React.ReactNode
    text: string
  }>
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * FirstTimeEmptyState - Welcome/onboarding state
 * 
 * Use for first-time users or new features
 * Shows benefits/features with primary action
 * 
 * @example
 * <FirstTimeEmptyState
 *   icon={<Sparkles className="w-12 h-12" />}
 *   title="Welcome to MotoMind"
 *   description="Track your vehicles, manage maintenance, and more"
 *   features={[
 *     { icon: <Car />, text: 'Track unlimited vehicles' },
 *     { icon: <Calendar />, text: 'Schedule maintenance' }
 *   ]}
 *   action={{
 *     label: 'Add Your First Vehicle',
 *     onClick: () => openModal()
 *   }}
 * />
 */
export function FirstTimeEmptyState({
  icon,
  title,
  description,
  features = [],
  action
}: FirstTimeEmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[500px] p-8">
      <Stack spacing="xl" className="items-center text-center max-w-lg w-full">
        {icon && (
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center text-primary [&>svg]:w-10 [&>svg]:h-10">
            {icon}
          </div>
        )}
        
        <Stack spacing="md" className="items-center">
          <h2 className="text-2xl font-bold text-black">
            {title}
          </h2>
          {description && (
            <p className="text-base text-black/60 leading-relaxed">
              {description}
            </p>
          )}
        </Stack>

        {features.length > 0 && (
          <Stack spacing="md" className="w-full">
            {features.map((feature, index) => (
              <Flex
                key={index}
                align="center"
                gap="md"
                className="text-left p-4 rounded-xl bg-slate-50"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white flex items-center justify-center text-primary [&>svg]:w-5 [&>svg]:h-5">
                  {feature.icon}
                </div>
                <p className="text-sm font-medium text-black">
                  {feature.text}
                </p>
              </Flex>
            ))}
          </Stack>
        )}

        {action && (
          <button
            onClick={action.onClick}
            className="px-8 py-3 text-base font-medium bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-lg"
          >
            {action.label}
          </button>
        )}
      </Stack>
    </div>
  )
}

// ============================================================================
// 5. COMPACT EMPTY STATE - For smaller spaces (cards, sections)
// ============================================================================

export interface CompactEmptyStateProps {
  icon?: React.ReactNode
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * CompactEmptyState - Minimal empty state for cards
 * 
 * Use in smaller spaces like cards or list sections
 * Condensed layout with essential info only
 * 
 * @example
 * <CompactEmptyState
 *   icon={<FileText className="w-5 h-5" />}
 *   message="No documents yet"
 *   action={{
 *     label: 'Upload',
 *     onClick: () => openUpload()
 *   }}
 * />
 */
export function CompactEmptyState({
  icon,
  message,
  action
}: CompactEmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-12 px-6">
      <Stack spacing="md" className="items-center text-center max-w-xs w-full">
        {icon && (
          <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-black/40 [&>svg]:w-5 [&>svg]:h-5">
            {icon}
          </div>
        )}
        
        <p className="text-sm font-medium text-black/60">
          {message}
        </p>

        {action && (
          <button
            onClick={action.onClick}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            {action.label}
          </button>
        )}
      </Stack>
    </div>
  )
}

// ============================================================================
// 6. PERMISSION DENIED EMPTY STATE - Access restricted
// ============================================================================

export interface PermissionDeniedEmptyStateProps {
  title?: string
  description?: string
  requiredPermission?: string
  onRequestAccess?: () => void
  onGoBack?: () => void
}

/**
 * PermissionDeniedEmptyState - Access denied/restricted content
 * 
 * Use when user lacks permissions to view content
 * Shows lock icon, permission required, request access option
 * 
 * @example
 * <PermissionDeniedEmptyState
 *   title="Access Restricted"
 *   description="You don't have permission to view this vehicle"
 *   requiredPermission="vehicle:read"
 *   onRequestAccess={() => requestAccess()}
 *   onGoBack={() => router.back()}
 * />
 */
export function PermissionDeniedEmptyState({
  title = 'Access Restricted',
  description = "You don't have permission to view this content.",
  requiredPermission,
  onRequestAccess,
  onGoBack
}: PermissionDeniedEmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Stack spacing="lg" className="items-center text-center max-w-md w-full">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <Stack spacing="sm" className="items-center w-full">
          <h3 className="text-xl font-semibold text-black">
            {title}
          </h3>
          <p className="text-sm text-black/60 leading-relaxed">
            {description}
          </p>
          {requiredPermission && (
            <p className="text-xs text-black/40 font-mono bg-slate-100 px-3 py-1.5 rounded-lg">
              Required: {requiredPermission}
            </p>
          )}
        </Stack>

        <Flex gap="md" className="flex-wrap justify-center">
          {onRequestAccess && (
            <button
              onClick={onRequestAccess}
              className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Request Access
            </button>
          )}
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="px-6 py-2.5 text-sm font-medium border border-black/10 text-black bg-white rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
            >
              Go Back
            </button>
          )}
        </Flex>
      </Stack>
    </div>
  )
}

// ============================================================================
// 7. OFFLINE EMPTY STATE - Network connectivity issues
// ============================================================================

export interface OfflineEmptyStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

/**
 * OfflineEmptyState - Network connectivity issues
 * 
 * Use when device is offline or network request failed
 * Shows wifi icon, offline message, retry option
 * 
 * @example
 * <OfflineEmptyState
 *   title="You're Offline"
 *   description="Check your internet connection and try again"
 *   onRetry={() => refetch()}
 * />
 */
export function OfflineEmptyState({
  title = "You're Offline",
  description = 'Check your internet connection and try again.',
  onRetry
}: OfflineEmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Stack spacing="lg" className="items-center text-center max-w-md w-full animate-in fade-in duration-300">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-black/40">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        </div>
        
        <Stack spacing="sm" className="items-center w-full">
          <h3 className="text-xl font-semibold text-black">
            {title}
          </h3>
          <p className="text-sm text-black/60 leading-relaxed">
            {description}
          </p>
        </Stack>

        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Try Again
          </button>
        )}
      </Stack>
    </div>
  )
}

// ============================================================================
// 8. ILLUSTRATION EMPTY STATE - Premium with custom illustration
// ============================================================================

export interface IllustrationEmptyStateProps {
  illustration: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    loading?: boolean
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

/**
 * IllustrationEmptyState - Premium empty state with custom illustration
 * 
 * Use for high-impact empty states with custom SVG illustrations
 * More prominent than basic empty state
 * 
 * @example
 * <IllustrationEmptyState
 *   illustration={<CustomSVGIllustration />}
 *   title="Build Your Fleet"
 *   description="Start tracking vehicles, maintenance, and more"
 *   action={{
 *     label: 'Add First Vehicle',
 *     onClick: () => openModal()
 *   }}
 * />
 */
export function IllustrationEmptyState({
  illustration,
  title,
  description,
  action,
  secondaryAction
}: IllustrationEmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[500px] p-8">
      <Stack spacing="xl" className="items-center text-center max-w-xl w-full animate-in fade-in duration-500">
        {/* Illustration */}
        <div className="w-full max-w-sm mx-auto">
          {illustration}
        </div>
        
        <Stack spacing="md" className="items-center w-full">
          <h2 className="text-3xl font-bold text-black">
            {title}
          </h2>
          {description && (
            <p className="text-base text-black/60 leading-relaxed max-w-md">
              {description}
            </p>
          )}
        </Stack>

        {(action || secondaryAction) && (
          <Flex gap="md" className="flex-wrap justify-center">
            {action && (
              <button
                onClick={action.onClick}
                disabled={action.loading}
                className="px-8 py-3 text-base font-medium bg-primary text-primary-foreground rounded-xl hover:opacity-90 hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {action.loading ? 'Loading...' : action.label}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="px-8 py-3 text-base font-medium border border-black/10 text-black bg-white rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
              >
                {secondaryAction.label}
              </button>
            )}
          </Flex>
        )}
      </Stack>
    </div>
  )
}

// ============================================================================
// ELITE FEATURES - Advanced Empty State Enhancements
// ============================================================================

// Illustration Presets
export const EmptyStateIllustrations = {
  NoVehicles: () => (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-auto">
      <rect x="40" y="80" width="120" height="60" rx="8" fill="#F1F5F9" />
      <circle cx="65" cy="140" r="15" fill="#CBD5E1" />
      <circle cx="135" cy="140" r="15" fill="#CBD5E1" />
      <path d="M50 80L70 50H130L150 80" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
      <rect x="80" y="55" width="40" height="25" rx="4" fill="#E2E8F0" />
    </svg>
  ),
  NoDocuments: () => (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-auto">
      <rect x="60" y="30" width="80" height="100" rx="8" fill="#F1F5F9" />
      <line x1="75" y1="50" x2="125" y2="50" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="70" x2="125" y2="70" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="90" x2="110" y2="90" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  NoEvents: () => (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-auto">
      <rect x="50" y="40" width="100" height="90" rx="8" fill="#F1F5F9" />
      <rect x="50" y="40" width="100" height="25" rx="8" fill="#E2E8F0" />
      <circle cx="70" cy="52.5" r="4" fill="#94A3B8" />
      <circle cx="130" cy="52.5" r="4" fill="#94A3B8" />
      <line x1="65" y1="80" x2="85" y2="80" stroke="#CBD5E1" strokeWidth="2" />
      <line x1="95" y1="80" x2="115" y2="80" stroke="#CBD5E1" strokeWidth="2" />
    </svg>
  ),
  Success: () => (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-auto">
      <circle cx="100" cy="80" r="40" fill="#DCFCE7" />
      <path d="M80 80L95 95L120 70" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="60" cy="40" r="8" fill="#FDE047" className="animate-pulse" />
      <circle cx="140" cy="120" r="6" fill="#FDE047" className="animate-pulse" />
    </svg>
  )
}

// Smart Empty State Helper
export interface SmartEmptyStateProps {
  error?: Error | null
  isOffline?: boolean
  query?: string
  suggestions?: string[]
  title?: string
  description?: string
  onRetry?: () => void
  onAction?: () => void
  actionLabel?: string
}

export function SmartEmptyState(props: SmartEmptyStateProps) {
  if (props.isOffline) {
    return <OfflineEmptyState onRetry={props.onRetry} title={props.title} description={props.description} />
  }
  if (props.error) {
    return <ErrorEmptyState title={props.title || props.error.message} description={props.description} errorCode={props.error.name} onRetry={props.onRetry} />
  }
  if (props.query) {
    return <SearchEmptyState query={props.query} suggestions={props.suggestions} onClearSearch={props.onRetry} />
  }
  return <EmptyState title={props.title || 'No data yet'} description={props.description} action={props.onAction ? { label: props.actionLabel || 'Get Started', onClick: props.onAction } : undefined} />
}

// Enhanced Error with Copy
export interface EnhancedErrorProps extends ErrorEmptyStateProps {
  retryCount?: number
  onContactSupport?: () => void
}

export function EnhancedErrorEmptyState({ title = 'Something went wrong', description = "We couldn't load this content.", errorCode, onRetry, onGoBack, retryCount = 0, onContactSupport }: EnhancedErrorProps) {
  const [copied, setCopied] = React.useState(false)
  
  const copyErrorCode = async () => {
    if (!errorCode) return
    try {
      await navigator.clipboard.writeText(errorCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Stack spacing="lg" className="items-center text-center max-w-md w-full">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 flex items-center justify-center text-red-600 [&>svg]:w-8 [&>svg]:h-8">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <Stack spacing="sm" className="items-center w-full">
          <h3 className="text-xl font-semibold text-black">{title}</h3>
          <p className="text-sm text-black/60 leading-relaxed">{description}</p>
          {errorCode && (
            <button onClick={copyErrorCode} className="group flex items-center gap-2 text-xs text-black/40 font-mono bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" title="Click to copy">
              <span>Error: {errorCode}</span>
              {copied ? (
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          )}
        </Stack>
        <Stack spacing="sm" className="items-center">
          <Flex gap="md" className="flex-wrap justify-center">
            {onRetry && (
              <button onClick={onRetry} className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                Try Again
              </button>
            )}
            {onGoBack && (
              <button onClick={onGoBack} className="px-6 py-2.5 text-sm font-medium border border-black/10 text-black bg-white rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2">
                Go Back
              </button>
            )}
          </Flex>
          {retryCount >= 3 && onContactSupport && (
            <>
              <div className="text-xs text-black/40">or</div>
              <button onClick={onContactSupport} className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                Contact Support →
              </button>
            </>
          )}
        </Stack>
      </Stack>
    </div>
  )
}

