/**
 * Loading States & Skeletons
 * 
 * Premium loading components for various contexts
 * Better than spinners - show content structure while loading
 */

import React from 'react'
import { Stack, Flex } from '../primitives/Layout'

// ============================================================================
// 1. SPINNER - Classic loading spinner
// ============================================================================

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'black' | 'inherit'
  label?: string
}

/**
 * Spinner - Classic circular loading spinner
 * 
 * Use for simple loading states
 * 
 * @example
 * <Spinner size="md" label="Loading..." />
 */
export function Spinner({ size = 'md', color = 'primary', label }: SpinnerProps) {
  const sizeClasses = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-[3px]'
  }

  const colorClasses = {
    primary: 'border-primary border-t-transparent',
    white: 'border-white border-t-transparent',
    black: 'border-black border-t-transparent',
    inherit: 'border-current border-t-transparent'
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div 
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && (
        <span className="text-sm text-black/60">{label}</span>
      )}
    </div>
  )
}

// ============================================================================
// 2. SKELETON - Content placeholder
// ============================================================================

export interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  animation?: 'pulse' | 'wave' | 'none'
}

/**
 * Skeleton - Animated content placeholder
 * 
 * Use to show content structure while loading
 * 
 * @example
 * <Skeleton width="100%" height="20px" />
 * <Skeleton variant="circular" width="40px" height="40px" />
 */
export function Skeleton({ 
  width = '100%', 
  height = '1rem', 
  className = '',
  variant = 'rectangular',
  animation = 'pulse'
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-[shimmer_2s_infinite]',
    none: ''
  }

  const widthStyle = typeof width === 'number' ? `${width}px` : width
  const heightStyle = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`bg-slate-200 ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={{ width: widthStyle, height: heightStyle }}
      aria-hidden="true"
    />
  )
}

// ============================================================================
// 3. CARD SKELETON - Loading card structure
// ============================================================================

export interface CardSkeletonProps {
  showImage?: boolean
  showActions?: boolean
  lines?: number
}

/**
 * CardSkeleton - Loading state for card components
 * 
 * Use when loading card-based content
 * 
 * @example
 * <CardSkeleton showImage lines={3} showActions />
 */
export function CardSkeleton({ 
  showImage = true, 
  showActions = false,
  lines = 2 
}: CardSkeletonProps) {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 animate-in fade-in duration-300">
      <Stack spacing="md">
        {showImage && (
          <Skeleton height="200px" variant="rectangular" />
        )}
        
        <Stack spacing="sm">
          <Skeleton width="60%" height="24px" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton 
              key={i} 
              width={i === lines - 1 ? '80%' : '100%'} 
              height="16px" 
            />
          ))}
        </Stack>

        {showActions && (
          <Flex gap="md">
            <Skeleton width="100px" height="36px" variant="rectangular" />
            <Skeleton width="80px" height="36px" variant="rectangular" />
          </Flex>
        )}
      </Stack>
    </div>
  )
}

// ============================================================================
// 4. LIST SKELETON - Loading state for lists
// ============================================================================

export interface ListSkeletonProps {
  items?: number
  showAvatar?: boolean
  showIcon?: boolean
}

/**
 * ListSkeleton - Loading state for list items
 * 
 * Use when loading list-based content
 * 
 * @example
 * <ListSkeleton items={5} showAvatar />
 */
export function ListSkeleton({ 
  items = 3, 
  showAvatar = false,
  showIcon = false 
}: ListSkeletonProps) {
  return (
    <Stack spacing="sm">
      {Array.from({ length: items }).map((_, i) => (
        <div 
          key={i}
          className="bg-white border border-black/5 rounded-xl p-4 animate-in fade-in duration-300"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <Flex align="center" gap="md">
            {showAvatar && (
              <Skeleton variant="circular" width="40px" height="40px" />
            )}
            {showIcon && (
              <Skeleton variant="rectangular" width="24px" height="24px" />
            )}
            <Stack spacing="xs" className="flex-1">
              <Skeleton width="40%" height="16px" />
              <Skeleton width="70%" height="14px" />
            </Stack>
            <Skeleton width="60px" height="20px" variant="rectangular" />
          </Flex>
        </div>
      ))}
    </Stack>
  )
}

// ============================================================================
// 5. TABLE SKELETON - Loading state for tables
// ============================================================================

export interface TableSkeletonProps {
  rows?: number
  columns?: number
}

/**
 * TableSkeleton - Loading state for table data
 * 
 * Use when loading tabular data
 * 
 * @example
 * <TableSkeleton rows={5} columns={4} />
 */
export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-black/5 bg-slate-50 px-6 py-4">
        <Flex gap="lg">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width="100px" height="16px" />
          ))}
        </Flex>
      </div>

      {/* Rows */}
      <Stack spacing="none">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={rowIndex}
            className="border-b border-black/5 last:border-b-0 px-6 py-4 animate-in fade-in duration-300"
            style={{ animationDelay: `${rowIndex * 50}ms` }}
          >
            <Flex gap="lg">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  width={colIndex === 0 ? '120px' : '80px'} 
                  height="14px" 
                />
              ))}
            </Flex>
          </div>
        ))}
      </Stack>
    </div>
  )
}

// ============================================================================
// 6. INLINE LOADER - Small inline loading indicator
// ============================================================================

export interface InlineLoaderProps {
  text?: string
  size?: 'sm' | 'md'
}

/**
 * InlineLoader - Small inline loading indicator
 * 
 * Use for inline loading states (e.g., "Loading more...")
 * 
 * @example
 * <InlineLoader text="Loading more..." />
 */
export function InlineLoader({ text = 'Loading...', size = 'sm' }: InlineLoaderProps) {
  return (
    <Flex align="center" justify="center" gap="sm" className="py-4">
      <Spinner size={size} color="inherit" />
      <span className={`${size === 'sm' ? 'text-sm' : 'text-base'} text-black/60`}>
        {text}
      </span>
    </Flex>
  )
}

// ============================================================================
// 7. LOADING OVERLAY - Full-screen or container loading overlay
// ============================================================================

export interface LoadingOverlayProps {
  visible: boolean
  text?: string
  blur?: boolean
  fullscreen?: boolean
}

/**
 * LoadingOverlay - Overlay loading state
 * 
 * Use to block interaction while loading
 * 
 * @example
 * <LoadingOverlay visible={isLoading} text="Saving..." />
 */
export function LoadingOverlay({ 
  visible, 
  text = 'Loading...', 
  blur = true,
  fullscreen = false 
}: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div 
      className={`${fullscreen ? 'fixed inset-0' : 'absolute inset-0'} z-50 flex items-center justify-center ${blur ? 'backdrop-blur-sm bg-white/80' : 'bg-white/90'} animate-in fade-in duration-200`}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <Stack spacing="md" className="items-center">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-black/70">{text}</p>
      </Stack>
    </div>
  )
}

// ============================================================================
// 8. PROGRESS BAR - Linear progress indicator
// ============================================================================

export interface ProgressBarProps {
  value?: number // 0-100
  indeterminate?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
  showPercentage?: boolean
}

/**
 * ProgressBar - Linear progress indicator
 * 
 * Use to show determinate or indeterminate progress
 * 
 * @example
 * <ProgressBar value={75} showPercentage />
 * <ProgressBar indeterminate label="Processing..." />
 */
export function ProgressBar({ 
  value = 0, 
  indeterminate = false,
  size = 'md',
  label,
  showPercentage = false
}: ProgressBarProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const clampedValue = Math.min(Math.max(value, 0), 100)

  return (
    <Stack spacing="xs" className="w-full">
      {(label || showPercentage) && (
        <Flex justify="between" align="center">
          {label && <span className="text-sm text-black/70">{label}</span>}
          {showPercentage && !indeterminate && (
            <span className="text-sm font-medium text-black/70">{clampedValue}%</span>
          )}
        </Flex>
      )}
      
      <div 
        className={`w-full bg-slate-200 rounded-full overflow-hidden ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full bg-primary transition-all duration-300 ${indeterminate ? 'animate-[progress_1.5s_ease-in-out_infinite]' : ''}`}
          style={{ 
            width: indeterminate ? '40%' : `${clampedValue}%`,
            ...(indeterminate && { 
              transformOrigin: 'left',
              animation: 'progress 1.5s ease-in-out infinite'
            })
          }}
        />
      </div>
    </Stack>
  )
}

// ============================================================================
// 9. DOTS LOADER - Three dots animation
// ============================================================================

export interface DotsLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'black' | 'white'
}

/**
 * DotsLoader - Three dots loading animation
 * 
 * Use for minimal loading states
 * 
 * @example
 * <DotsLoader size="md" />
 */
export function DotsLoader({ size = 'md', color = 'primary' }: DotsLoaderProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  const colorClasses = {
    primary: 'bg-primary',
    black: 'bg-black',
    white: 'bg-white'
  }

  return (
    <div className="inline-flex items-center gap-1" role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-[bounce_1.4s_ease-in-out_infinite]`}
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  )
}

// ============================================================================
// 10. PULSE LOADER - Pulsing circle
// ============================================================================

export interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg'
}

/**
 * PulseLoader - Pulsing circle animation
 * 
 * Use for ambient loading states
 * 
 * @example
 * <PulseLoader size="md" />
 */
export function PulseLoader({ size = 'md' }: PulseLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className="relative inline-flex items-center justify-center" role="status" aria-label="Loading">
      <div className={`${sizeClasses[size]} rounded-full bg-primary/20 animate-ping absolute`} />
      <div className={`${sizeClasses[size]} rounded-full bg-primary/40 animate-pulse`} />
    </div>
  )
}

// ============================================================================
// ELITE FEATURES - Advanced Loading State Enhancements
// ============================================================================

// 11. SMART LOADER - Auto-selects appropriate loader
export interface SmartLoaderProps {
  isLoading: boolean
  type?: 'card' | 'list' | 'table' | 'content'
  children: React.ReactNode
}

export function SmartLoader({ isLoading, type = 'content', children }: SmartLoaderProps) {
  if (!isLoading) return <>{children}</>
  
  switch (type) {
    case 'card': return <CardSkeleton />
    case 'list': return <ListSkeleton />
    case 'table': return <TableSkeleton />
    default: return <CardSkeleton showImage={false} lines={3} />
  }
}

// 12. SKELETON TRANSITION - Smooth crossfade
export interface SkeletonTransitionProps {
  isLoading: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
}

export function SkeletonTransition({ isLoading, skeleton, children }: SkeletonTransitionProps) {
  return (
    <div className="relative">
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
        {skeleton}
      </div>
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  )
}

// 13. DELAYED SPINNER - Only shows after delay, stays for minimum duration
export interface DelayedSpinnerProps extends SpinnerProps {
  delay?: number // ms before showing
  minDuration?: number // ms to show minimum
}

export function DelayedSpinner({ delay = 300, minDuration = 500, ...props }: DelayedSpinnerProps) {
  const [show, setShow] = React.useState(false)
  const [shouldRender, setShouldRender] = React.useState(true)
  const showTimeRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    // Delay showing
    const showTimer = setTimeout(() => {
      setShow(true)
      showTimeRef.current = Date.now()
    }, delay)

    return () => {
      clearTimeout(showTimer)
      
      // Enforce minimum duration
      if (showTimeRef.current) {
        const elapsed = Date.now() - showTimeRef.current
        if (elapsed < minDuration) {
          setTimeout(() => setShouldRender(false), minDuration - elapsed)
        } else {
          setShouldRender(false)
        }
      }
    }
  }, [delay, minDuration])

  if (!show || !shouldRender) return null
  return <Spinner {...props} />
}

// 14. LOADING WITH RETRY - Overlay with error state and retry
export interface LoadingWithRetryProps {
  visible: boolean
  error?: Error | null
  onRetry?: () => void
  retryCount?: number
  maxRetries?: number
  text?: string
}

export function LoadingWithRetry({ 
  visible, 
  error, 
  onRetry, 
  retryCount = 0,
  maxRetries = 3,
  text = 'Loading...' 
}: LoadingWithRetryProps) {
  if (!visible && !error) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/80 animate-in fade-in duration-200">
      <Stack spacing="lg" className="items-center max-w-sm text-center">
        {error ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <Stack spacing="sm" className="items-center">
              <h3 className="text-lg font-semibold text-black">Failed to load</h3>
              <p className="text-sm text-black/60">{error.message}</p>
              {retryCount > 0 && (
                <p className="text-xs text-black/40">Attempt {retryCount} of {maxRetries}</p>
              )}
            </Stack>
            {onRetry && retryCount < maxRetries && (
              <button
                onClick={onRetry}
                className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
            )}
          </>
        ) : (
          <>
            <Spinner size="lg" />
            <p className="text-sm font-medium text-black/70">{text}</p>
          </>
        )}
      </Stack>
    </div>
  )
}

// 15. MORE SKELETON PRESETS
export function ProfileSkeleton() {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6">
      <Stack spacing="lg">
        <Flex align="center" gap="lg">
          <Skeleton variant="circular" width="80px" height="80px" />
          <Stack spacing="sm" className="flex-1">
            <Skeleton width="150px" height="24px" />
            <Skeleton width="200px" height="16px" />
          </Stack>
        </Flex>
        <Stack spacing="md">
          <Skeleton width="100%" height="16px" />
          <Skeleton width="90%" height="16px" />
          <Skeleton width="80%" height="16px" />
        </Stack>
      </Stack>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <Stack spacing="lg">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-black/5 rounded-xl p-4">
            <Stack spacing="sm">
              <Skeleton width="60%" height="14px" />
              <Skeleton width="100px" height="32px" />
            </Stack>
          </div>
        ))}
      </div>
      <CardSkeleton showImage lines={2} />
    </Stack>
  )
}

export function CommentSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Stack spacing="md">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton variant="circular" width="32px" height="32px" />
          <Stack spacing="xs" className="flex-1">
            <Skeleton width="120px" height="14px" />
            <Skeleton width="100%" height="16px" />
            <Skeleton width="80%" height="16px" />
          </Stack>
        </div>
      ))}
    </Stack>
  )
}

export function GallerySkeleton({ items = 6 }: { items?: number }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton key={i} height="150px" variant="rectangular" />
      ))}
    </div>
  )
}

// 16. APP-SPECIFIC SKELETONS
export function VehicleCardSkeleton() {
  return (
    <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
      <Skeleton height="200px" variant="rectangular" animation="wave" />
      <div className="p-6">
        <Stack spacing="md">
          <Skeleton width="70%" height="24px" />
          <Skeleton width="50%" height="16px" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Skeleton height="60px" variant="rectangular" />
            <Skeleton height="60px" variant="rectangular" />
          </div>
        </Stack>
      </div>
    </div>
  )
}

export function MaintenanceListSkeleton() {
  return (
    <Stack spacing="sm">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-black/5 rounded-xl p-4">
          <Flex align="center" gap="md">
            <Skeleton variant="rectangular" width="40px" height="40px" />
            <Stack spacing="xs" className="flex-1">
              <Skeleton width="60%" height="18px" />
              <Skeleton width="40%" height="14px" />
            </Stack>
            <Skeleton width="80px" height="28px" variant="rectangular" />
          </Flex>
        </div>
      ))}
    </Stack>
  )
}

export function EventTimelineSkeleton() {
  return (
    <Stack spacing="md">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton variant="circular" width="12px" height="12px" />
            {i < 4 && <div className="w-px h-full bg-slate-200 mt-2" />}
          </div>
          <Stack spacing="xs" className="flex-1 pb-4">
            <Skeleton width="40%" height="16px" />
            <Skeleton width="100%" height="14px" />
            <Skeleton width="80%" height="14px" />
          </Stack>
        </div>
      ))}
    </Stack>
  )
}

// 17. SKELETON COMPOSER - Build custom skeletons
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: '32px', md: '40px', lg: '48px' }
  return <Skeleton variant="circular" width={sizes[size]} height={sizes[size]} />
}

export function SkeletonText({ lines = 1, width }: { lines?: number; width?: string }) {
  return (
    <Stack spacing="xs">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={width || (i === lines - 1 ? '80%' : '100%')} 
          height="14px" 
        />
      ))}
    </Stack>
  )
}

export function SkeletonButton({ width = '100px' }: { width?: string }) {
  return <Skeleton width={width} height="36px" variant="rectangular" />
}

// 18. LOADING CONTEXT (React Context for global loading state)
interface LoadingContextValue {
  operations: Record<string, boolean>
  startLoading: (key: string) => void
  stopLoading: (key: string) => void
  isLoading: (key?: string) => boolean
}

const LoadingContext = React.createContext<LoadingContextValue | null>(null)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = React.useState<Record<string, boolean>>({})

  const startLoading = React.useCallback((key: string) => {
    setOperations(prev => ({ ...prev, [key]: true }))
  }, [])

  const stopLoading = React.useCallback((key: string) => {
    setOperations(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const isLoading = React.useCallback((key?: string) => {
    if (key) return operations[key] || false
    return Object.keys(operations).length > 0
  }, [operations])

  return (
    <LoadingContext.Provider value={{ operations, startLoading, stopLoading, isLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading(key: string) {
  const context = React.useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider')
  }

  return {
    startLoading: () => context.startLoading(key),
    stopLoading: () => context.stopLoading(key),
    isLoading: context.isLoading(key)
  }
}

// 19. SUSPENSE FALLBACK - For React Suspense integration
export function SuspenseFallback({ type = 'card' }: { type?: 'card' | 'list' | 'table' }) {
  return <SmartLoader isLoading={true} type={type}>{null}</SmartLoader>
}

// 20. PERFORMANCE TRACKING
export interface TrackedSkeletonProps extends SkeletonProps {
  onLoadStart?: () => void
  onLoadEnd?: (duration: number) => void
}

export function TrackedSkeleton({ onLoadStart, onLoadEnd, ...props }: TrackedSkeletonProps) {
  const startTimeRef = React.useRef<number>(Date.now())

  React.useEffect(() => {
    onLoadStart?.()
    startTimeRef.current = Date.now()

    return () => {
      const duration = Date.now() - startTimeRef.current
      onLoadEnd?.(duration)
    }
  }, [onLoadStart, onLoadEnd])

  return <Skeleton {...props} />
}

