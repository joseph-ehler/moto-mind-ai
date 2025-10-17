'use client'

/**
 * Toast Notifications
 * 
 * Premium toast notification system for user feedback
 * Success/error/warning/info variants with auto-dismiss, actions, and stacking
 */

import React from 'react'
import { Stack, Flex } from '../primitives/Layout'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'
export type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  action?: ToastAction
  duration?: number // ms, 0 = no auto-dismiss
  onClose?: () => void
  icon?: React.ReactNode
}

// ============================================================================
// 1. TOAST COMPONENT - Individual toast
// ============================================================================

export interface ToastProps extends Toast {
  onDismiss: (id: string) => void
  position?: ToastPosition
}

/**
 * Toast - Individual toast notification
 * 
 * @example
 * <Toast
 *   id="1"
 *   variant="success"
 *   title="Saved successfully"
 *   description="Your changes have been saved"
 *   onDismiss={(id) => removeToast(id)}
 * />
 */
export function Toast({
  id,
  variant,
  title,
  description,
  action,
  duration = 5000,
  onClose,
  onDismiss,
  icon
}: ToastProps) {
  const [progress, setProgress] = React.useState(100)
  const [isExiting, setIsExiting] = React.useState(false)

  // Auto-dismiss
  React.useEffect(() => {
    if (duration === 0) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)

      if (remaining === 0) {
        handleDismiss()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [duration])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss(id)
      onClose?.()
    }, 200)
  }

  const variantConfig = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      iconBg: 'bg-green-100',
      defaultIcon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      iconBg: 'bg-red-100',
      defaultIcon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      iconBg: 'bg-amber-100',
      defaultIcon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100',
      defaultIcon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  }

  const config = variantConfig[variant]

  return (
    <div
      className={`
        ${config.bg} ${config.border} border
        rounded-xl shadow-lg p-4 min-w-[360px] max-w-md
        ${isExiting ? 'animate-out fade-out slide-out-to-right duration-200' : 'animate-in fade-in slide-in-from-right duration-300'}
        overflow-hidden relative
      `}
      role="alert"
      aria-live="polite"
    >
      <Flex align="start" gap="sm">
        {/* Icon */}
        <div className={`${config.iconBg} ${config.icon} rounded-lg p-2 flex-shrink-0`}>
          {icon || config.defaultIcon}
        </div>

        {/* Content */}
        <Stack spacing="xs" className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-black">{title}</h4>
            <button
              onClick={handleDismiss}
              className="text-black/40 hover:text-black/70 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {description && (
            <p className="text-sm text-black/70">{description}</p>
          )}

          {action && (
            <button
              onClick={() => {
                action.onClick()
                handleDismiss()
              }}
              className="text-sm font-medium text-black hover:underline focus:outline-none focus:ring-2 focus:ring-black/20 rounded px-1 -mx-1 text-left"
            >
              {action.label}
            </button>
          )}
        </Stack>
      </Flex>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
          <div
            className={`h-full ${variant === 'success' ? 'bg-green-500' : variant === 'error' ? 'bg-red-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-blue-500'} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 2. TOAST CONTAINER - Manages multiple toasts
// ============================================================================

export interface ToastContainerProps {
  toasts: Toast[]
  position?: ToastPosition
  onDismiss: (id: string) => void
  maxToasts?: number
}

/**
 * ToastContainer - Container for multiple toasts
 * 
 * @example
 * <ToastContainer
 *   toasts={toasts}
 *   position="top-right"
 *   onDismiss={removeToast}
 * />
 */
export function ToastContainer({
  toasts,
  position = 'top-right',
  onDismiss,
  maxToasts = 5
}: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  }

  const visibleToasts = toasts.slice(0, maxToasts)

  return (
    <div className={`fixed ${positionClasses[position]} z-50 pointer-events-none`}>
      <Stack spacing="md" className="pointer-events-auto">
        {visibleToasts.map((toast) => (
          <Toast key={toast.id} {...toast} position={position} onDismiss={onDismiss} />
        ))}
      </Stack>
    </div>
  )
}

// ============================================================================
// 3. TOAST CONTEXT - Global toast management
// ============================================================================

interface ToastContextValue {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => string
  dismissToast: (id: string) => void
  dismissAll: () => void
  success: (title: string, description?: string, action?: ToastAction) => string
  error: (title: string, description?: string, action?: ToastAction) => string
  warning: (title: string, description?: string, action?: ToastAction) => string
  info: (title: string, description?: string, action?: ToastAction) => string
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export interface ToastProviderProps {
  children: React.ReactNode
  position?: ToastPosition
  maxToasts?: number
  defaultDuration?: number
}

/**
 * ToastProvider - Provides toast context to app
 * 
 * @example
 * <ToastProvider position="top-right">
 *   <App />
 * </ToastProvider>
 */
export function ToastProvider({
  children,
  position = 'top-right',
  maxToasts = 5,
  defaultDuration = 5000
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const showToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? defaultDuration
    }
    setToasts(prev => [...prev, newToast])
    return id
  }, [defaultDuration])

  const dismissToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const dismissAll = React.useCallback(() => {
    setToasts([])
  }, [])

  const success = React.useCallback((title: string, description?: string, action?: ToastAction) => {
    return showToast({ variant: 'success', title, description, action })
  }, [showToast])

  const error = React.useCallback((title: string, description?: string, action?: ToastAction) => {
    return showToast({ variant: 'error', title, description, action })
  }, [showToast])

  const warning = React.useCallback((title: string, description?: string, action?: ToastAction) => {
    return showToast({ variant: 'warning', title, description, action })
  }, [showToast])

  const info = React.useCallback((title: string, description?: string, action?: ToastAction) => {
    return showToast({ variant: 'info', title, description, action })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, dismissAll, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} position={position} onDismiss={dismissToast} maxToasts={maxToasts} />
    </ToastContext.Provider>
  )
}

/**
 * useToast - Hook to access toast context
 * 
 * @example
 * const { success, error } = useToast()
 * success('Saved!', 'Your changes have been saved')
 */
export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

// ============================================================================
// ELITE FEATURES - Advanced Toast Enhancements
// ============================================================================

// 4. PROMISE TOAST - Auto-updates based on promise state
export function usePromiseToast() {
  const { showToast, dismissToast } = useToast()

  return React.useCallback(async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ): Promise<T> => {
    const loadingId = showToast({
      variant: 'info',
      title: messages.loading,
      duration: 0
    })

    try {
      const data = await promise
      dismissToast(loadingId)
      showToast({
        variant: 'success',
        title: typeof messages.success === 'function' ? messages.success(data) : messages.success,
        duration: 3000
      })
      return data
    } catch (error) {
      dismissToast(loadingId)
      showToast({
        variant: 'error',
        title: typeof messages.error === 'function' ? messages.error(error as Error) : messages.error,
        duration: 5000
      })
      throw error
    }
  }, [showToast, dismissToast])
}

// 5. RICH TOAST - Toast with custom content
export interface RichToastProps {
  id: string
  children: React.ReactNode
  onDismiss: (id: string) => void
  duration?: number
}

export function RichToast({ id, children, onDismiss, duration = 5000 }: RichToastProps) {
  const [isExiting, setIsExiting] = React.useState(false)

  React.useEffect(() => {
    if (duration === 0) return
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onDismiss(id), 200)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, id, onDismiss])

  return (
    <div
      className={`
        bg-white border border-black/10 rounded-xl shadow-lg p-4 min-w-[360px] max-w-md
        ${isExiting ? 'animate-out fade-out slide-out-to-right duration-200' : 'animate-in fade-in slide-in-from-right duration-300'}
      `}
      role="alert"
    >
      {children}
    </div>
  )
}

// 6. COMPACT TOAST - Minimal toast for subtle notifications
export interface CompactToastProps {
  message: string
  variant?: ToastVariant
  duration?: number
}

export function CompactToast({ message, variant = 'info', duration = 3000 }: CompactToastProps) {
  const variantColors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-600',
    info: 'bg-blue-600'
  }

  return (
    <div
      className={`${variantColors[variant]} text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-right duration-300`}
      role="status"
    >
      {message}
    </div>
  )
}

// 7. TOAST WITH PROGRESS - Show operation progress
export interface ProgressToastProps extends Omit<ToastProps, 'duration'> {
  progress: number // 0-100
}

export function ProgressToast({ progress, ...props }: ProgressToastProps) {
  return (
    <div className="relative">
      <Toast {...props} duration={0} />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

// 8. PERSISTENT TOAST - Never auto-dismisses
export function usePersistentToast() {
  const { showToast } = useToast()

  return React.useCallback((toast: Omit<Toast, 'id' | 'duration'>) => {
    return showToast({ ...toast, duration: 0 })
  }, [showToast])
}

// 9. GROUPED TOASTS - Group related toasts
export interface ToastGroup {
  id: string
  title: string
  toasts: Array<{ message: string; variant: ToastVariant }>
}

export function GroupedToast({ group, onDismiss }: { group: ToastGroup; onDismiss: (id: string) => void }) {
  return (
    <div className="bg-white border border-black/10 rounded-xl shadow-lg p-4 min-w-[360px] max-w-md animate-in fade-in slide-in-from-right duration-300">
      <Flex align="start" justify="between" className="mb-3">
        <h4 className="text-sm font-semibold text-black">{group.title}</h4>
        <button
          onClick={() => onDismiss(group.id)}
          className="text-black/40 hover:text-black/70 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </Flex>
      <Stack spacing="xs">
        {group.toasts.map((toast, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full mt-1.5 ${
              toast.variant === 'success' ? 'bg-green-500' :
              toast.variant === 'error' ? 'bg-red-500' :
              toast.variant === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
            }`} />
            <span className="text-black/70">{toast.message}</span>
          </div>
        ))}
      </Stack>
    </div>
  )
}

// 10. TOAST QUEUE - Advanced queue management
export function useToastQueue(maxConcurrent = 3) {
  const { showToast, dismissToast } = useToast()
  const queueRef = React.useRef<Array<Omit<Toast, 'id'>>>([])
  const activeRef = React.useRef<Set<string>>(new Set())

  const processQueue = React.useCallback(() => {
    while (activeRef.current.size < maxConcurrent && queueRef.current.length > 0) {
      const toast = queueRef.current.shift()!
      const id = showToast(toast)
      activeRef.current.add(id)

      // Auto-remove from active when dismissed
      const originalOnClose = toast.onClose
      toast.onClose = () => {
        activeRef.current.delete(id)
        originalOnClose?.()
        processQueue() // Process next in queue
      }
    }
  }, [showToast, maxConcurrent])

  const enqueue = React.useCallback((toast: Omit<Toast, 'id'>) => {
    queueRef.current.push(toast)
    processQueue()
  }, [processQueue])

  return { enqueue }
}
