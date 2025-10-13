/**
 * ERROR LOGGING & TRACKING
 * 
 * Centralized error logging with context and tracking
 * 
 * Features:
 * - Structured logging (JSON)
 * - Error tracking with context
 * - Performance monitoring
 * - User tracking (privacy-safe)
 * - Integration ready (Sentry, LogRocket, etc.)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogContext {
  userId?: string
  vehicleId?: string
  eventId?: string
  requestId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  component?: string
  action?: string
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  performance?: {
    duration?: number
    memory?: number
  }
}

class Logger {
  private sessionId: string
  private userId?: string
  private isProduction: boolean

  constructor() {
    this.sessionId = this.generateSessionId()
    this.isProduction = process.env.NODE_ENV === 'production'
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Set user ID for tracking (call after login)
   */
  setUserId(userId: string) {
    this.userId = userId
  }

  /**
   * Clear user ID (call after logout)
   */
  clearUserId() {
    this.userId = undefined
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        userId: this.userId,
        sessionId: this.sessionId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      }
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack,
        code: (error as any).code
      }
    }

    return entry
  }

  /**
   * Send log to backend/service
   */
  private async sendLog(entry: LogEntry) {
    // In production, send to logging service
    if (this.isProduction) {
      try {
        // Send to backend API
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        })

        // Integration examples:
        // Sentry:
        // if (entry.error) {
        //   Sentry.captureException(entry.error, { contexts: entry.context })
        // }
        
        // LogRocket:
        // LogRocket.log(entry.level, entry.message, entry.context)
        
        // PostHog:
        // posthog.capture('error', { ...entry.context, error: entry.error })
      } catch (err) {
        // Fallback: console log if sending fails
        console.error('Failed to send log:', err)
      }
    } else {
      // Development: console log with colors
      this.consoleLog(entry)
    }
  }

  /**
   * Pretty console logging for development
   */
  private consoleLog(entry: LogEntry) {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[34m',  // Blue
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m'  // Magenta
    }

    const reset = '\x1b[0m'
    const color = colors[entry.level]

    console.log(
      `${color}[${entry.level.toUpperCase()}]${reset}`,
      `${entry.timestamp}`,
      entry.message,
      entry.context || '',
      entry.error || ''
    )
  }

  /**
   * Debug log (development only)
   */
  debug(message: string, context?: LogContext) {
    if (!this.isProduction) {
      const entry = this.createLogEntry('debug', message, context)
      this.consoleLog(entry)
    }
  }

  /**
   * Info log
   */
  info(message: string, context?: LogContext) {
    const entry = this.createLogEntry('info', message, context)
    this.sendLog(entry)
  }

  /**
   * Warning log
   */
  warn(message: string, context?: LogContext) {
    const entry = this.createLogEntry('warn', message, context)
    this.sendLog(entry)
  }

  /**
   * Error log
   */
  error(message: string, error?: Error, context?: LogContext) {
    const entry = this.createLogEntry('error', message, context, error)
    this.sendLog(entry)
  }

  /**
   * Fatal error log (critical system failure)
   */
  fatal(message: string, error?: Error, context?: LogContext) {
    const entry = this.createLogEntry('fatal', message, context, error)
    this.sendLog(entry)
  }

  /**
   * Track user action
   */
  trackAction(action: string, context?: LogContext) {
    this.info(`Action: ${action}`, {
      ...context,
      action
    })
  }

  /**
   * Track page view
   */
  trackPageView(page: string, context?: LogContext) {
    this.info(`Page View: ${page}`, {
      ...context,
      component: 'navigation',
      action: 'page_view'
    })
  }

  /**
   * Track API call
   */
  trackAPICall(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    context?: LogContext
  ) {
    const level = status >= 400 ? 'error' : 'info'
    const message = `API ${method} ${endpoint} - ${status} (${duration}ms)`

    const entry = this.createLogEntry(level, message, {
      ...context,
      component: 'api',
      action: 'api_call',
      endpoint,
      method,
      status
    })

    entry.performance = {
      duration
    }

    this.sendLog(entry)
  }
}

// ==========================================================================
// SINGLETON INSTANCE
// ==========================================================================

export const logger = new Logger()

// ==========================================================================
// GLOBAL ERROR HANDLERS
// ==========================================================================

if (typeof window !== 'undefined') {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    logger.error('Unhandled Error', event.error, {
      component: 'global',
      action: 'unhandled_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', event.reason, {
      component: 'global',
      action: 'unhandled_rejection'
    })
  })
}

// ==========================================================================
// REACT ERROR BOUNDARY HELPER
// ==========================================================================

export function logErrorBoundary(error: Error, errorInfo: any) {
  logger.error('React Error Boundary', error, {
    component: errorInfo.componentStack,
    action: 'component_error'
  })
}
