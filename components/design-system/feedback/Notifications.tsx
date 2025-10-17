'use client'

/**
 * Notifications & Alerts Design System
 * 
 * Comprehensive notification components that work seamlessly with navigation and other design system components
 */

import * as React from 'react'
import { Stack, Flex } from '../primitives/Layout'

// ============================================================================
// ALERT BANNERS - Inline page alerts
// ============================================================================

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps {
  variant?: AlertVariant
  title?: string
  message: string
  icon?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }>
  className?: string
}

export function Alert({
  variant = 'info',
  title,
  message,
  icon,
  dismissible = false,
  onDismiss,
  actions,
  className
}: AlertProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  const variantStyles = {
    info: 'bg-white border-l-4 border-blue-500 shadow-sm',
    success: 'bg-white border-l-4 border-green-500 shadow-sm',
    warning: 'bg-white border-l-4 border-yellow-500 shadow-sm',
    error: 'bg-white border-l-4 border-red-500 shadow-sm'
  }

  const iconBgColors = {
    info: 'bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    error: 'bg-red-50 text-red-600'
  }

  const textColors = {
    info: 'text-blue-900',
    success: 'text-green-900',
    warning: 'text-yellow-900',
    error: 'text-red-900'
  }

  const actionColors = {
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    error: 'bg-red-600 hover:bg-red-700 text-white'
  }

  const defaultIcons = {
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  return (
    <div className={`border border-black/5 rounded-lg p-4 ${variantStyles[variant]} ${className || ''}`}>
      <Flex align="start" gap="md">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${iconBgColors[variant]}`}>
          {icon || defaultIcons[variant]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold text-sm mb-1 ${textColors[variant]}`}>{title}</h4>
          )}
          <p className="text-sm leading-relaxed text-black/70">{message}</p>

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                    ${action.variant === 'primary'
                      ? actionColors[variant]
                      : 'text-black/60 hover:text-black hover:underline'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-black/40 hover:text-black/60 transition-colors p-1 hover:bg-black/5 rounded"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </Flex>
    </div>
  )
}

// ============================================================================
// BADGE INDICATORS - Count & dot badges
// ============================================================================

export interface BadgeProps {
  count?: number
  dot?: boolean
  max?: number
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  pulse?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
}

export function Badge({
  count,
  dot = false,
  max = 99,
  variant = 'primary',
  pulse = false,
  size = 'md',
  className,
  children
}: BadgeProps) {
  const variantStyles = {
    primary: 'bg-primary text-primary-foreground',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    error: 'bg-red-600 text-white',
    neutral: 'bg-slate-600 text-white'
  }

  const sizeStyles = {
    sm: dot ? 'w-1.5 h-1.5' : 'px-1.5 py-0.5 text-[10px] min-w-[16px]',
    md: dot ? 'w-2 h-2' : 'px-2 py-0.5 text-xs min-w-[20px]',
    lg: dot ? 'w-2.5 h-2.5' : 'px-2.5 py-1 text-sm min-w-[24px]'
  }

  const displayCount = count !== undefined && count > max ? `${max}+` : count

  if (children) {
    // Badge wrapping children (e.g., icon with badge)
    return (
      <div className="relative inline-flex">
        {children}
        {(count !== undefined || dot) && (
          <span
            className={`
              absolute -top-1 -right-1 rounded-full flex items-center justify-center font-medium
              ${variantStyles[variant]} ${sizeStyles[size]}
              ${pulse ? 'animate-pulse' : ''}
              ${className || ''}
            `}
          >
            {!dot && displayCount}
          </span>
        )}
      </div>
    )
  }

  // Standalone badge
  return (
    <span
      className={`
        inline-flex items-center justify-center rounded-full font-medium
        ${variantStyles[variant]} ${sizeStyles[size]}
        ${pulse ? 'animate-pulse' : ''}
        ${className || ''}
      `}
    >
      {!dot && displayCount}
    </span>
  )
}

// ============================================================================
// NOTIFICATION CENTER - Dropdown with notification list
// ============================================================================

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Notification {
  id: string
  title: string
  message: string
  timestamp: Date
  read?: boolean
  avatar?: string
  icon?: React.ReactNode
  variant?: 'info' | 'success' | 'warning' | 'error'
  priority?: NotificationPriority
  group?: string // For grouping similar notifications
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }>
  onClick?: () => void
}

export interface NotificationCenterProps {
  notifications: Notification[]
  onNotificationClick?: (notification: Notification) => void
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onClearAll?: () => void
  maxHeight?: string
  enableGrouping?: boolean
  enableKeyboardNav?: boolean
  showAnimations?: boolean
}

export function NotificationCenter({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  maxHeight = '400px',
  enableGrouping = true,
  enableKeyboardNav = true,
  showAnimations = true
}: NotificationCenterProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set())
  const containerRef = React.useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  // Priority sorting and grouping
  const processedNotifications = React.useMemo(() => {
    // Sort by priority first (urgent > high > normal > low), then timestamp
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
    const sorted = [...notifications].sort((a, b) => {
      const priorityA = priorityOrder[a.priority || 'normal']
      const priorityB = priorityOrder[b.priority || 'normal']
      if (priorityA !== priorityB) return priorityA - priorityB
      return b.timestamp.getTime() - a.timestamp.getTime()
    })

    if (!enableGrouping) return sorted

    // Group similar notifications
    const groups: Record<string, Notification[]> = {}
    const ungrouped: Notification[] = []

    sorted.forEach(notification => {
      if (notification.group) {
        if (!groups[notification.group]) {
          groups[notification.group] = []
        }
        groups[notification.group].push(notification)
      } else {
        ungrouped.push(notification)
      }
    })

    return { groups, ungrouped }
  }, [notifications, enableGrouping])

  const allNotifications = enableGrouping
    ? [
        ...Object.values((processedNotifications as any).groups).flat(),
        ...(processedNotifications as any).ungrouped
      ]
    : (processedNotifications as Notification[])

  // Keyboard navigation
  React.useEffect(() => {
    if (!enableKeyboardNav || allNotifications.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, allNotifications.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const notification = allNotifications[selectedIndex]
        if (notification) {
          onNotificationClick?.(notification)
          if (!notification.read) {
            onMarkAsRead?.(notification.id)
          }
        }
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown)
      return () => container.removeEventListener('keydown', handleKeyDown)
    }
  }, [enableKeyboardNav, allNotifications, selectedIndex, onNotificationClick, onMarkAsRead])

  // Auto-scroll selected item into view
  React.useEffect(() => {
    if (!enableKeyboardNav) return
    const selected = containerRef.current?.querySelector(`[data-notification-index="${selectedIndex}"]`)
    selected?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedIndex, enableKeyboardNav])

  const priorityIndicators = {
    urgent: { color: 'bg-red-500', label: 'Urgent' },
    high: { color: 'bg-orange-500', label: 'High' },
    normal: { color: 'bg-blue-500', label: 'Normal' },
    low: { color: 'bg-slate-400', label: 'Low' }
  }

  const variantColors = {
    info: 'bg-blue-100 text-blue-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    error: 'bg-red-100 text-red-600'
  }

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-xl border border-black/10 overflow-hidden min-w-[380px]">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-black/5 bg-slate-50/50">
        <Flex align="center" justify="between">
          <div>
            <h3 className="font-semibold text-black text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-black/50 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          <Flex align="center" gap="md">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-black/50 hover:text-black/70 transition-colors"
              >
                Clear all
              </button>
            )}
          </Flex>
        </Flex>
      </div>

      {/* Notifications List */}
      <div 
        ref={containerRef}
        className="overflow-y-auto focus:outline-none" 
        style={{ maxHeight }}
        tabIndex={enableKeyboardNav ? 0 : -1}
      >
        {allNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm text-black/40">No notifications</p>
          </div>
        ) : (
          <div>
            {/* Render groups if enabled */}
            {enableGrouping && typeof processedNotifications === 'object' && 'groups' in processedNotifications ? (
              <>
                {Object.entries((processedNotifications as { groups: Record<string, Notification[]>, ungrouped: Notification[] }).groups).map(([groupName, groupNotifs]) => {
                  const typedGroupNotifs = groupNotifs as Notification[]
                  const isExpanded = expandedGroups.has(groupName)
                  const unreadInGroup = typedGroupNotifs.filter(n => !n.read).length

                  return (
                    <div key={groupName}>
                      {/* Group Header */}
                      <button
                        onClick={() => toggleGroup(groupName)}
                        className="w-full px-4 py-2.5 bg-slate-50/50 border-b border-black/5 flex items-center justify-between hover:bg-slate-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg 
                            className={`w-4 h-4 text-black/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="text-sm font-medium text-black/70">
                            {groupName} ({typedGroupNotifs.length})
                          </span>
                        </div>
                        {unreadInGroup > 0 && (
                          <Badge count={unreadInGroup} variant="primary" size="sm" />
                        )}
                      </button>

                      {/* Group Items */}
                      {isExpanded && typedGroupNotifs.map((notification, idx) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          index={allNotifications.indexOf(notification)}
                          selected={enableKeyboardNav && selectedIndex === allNotifications.indexOf(notification)}
                          onNotificationClick={onNotificationClick}
                          onMarkAsRead={onMarkAsRead}
                          formatTimestamp={formatTimestamp}
                          variantColors={variantColors}
                          priorityIndicators={priorityIndicators}
                          showAnimations={showAnimations}
                        />
                      ))}
                    </div>
                  )
                })}

                {/* Ungrouped notifications */}
                {(processedNotifications as any).ungrouped.map((notification: Notification, idx: number) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    index={allNotifications.indexOf(notification)}
                    selected={enableKeyboardNav && selectedIndex === allNotifications.indexOf(notification)}
                    onNotificationClick={onNotificationClick}
                    onMarkAsRead={onMarkAsRead}
                    formatTimestamp={formatTimestamp}
                    variantColors={variantColors}
                    priorityIndicators={priorityIndicators}
                    showAnimations={showAnimations}
                  />
                ))}
              </>
            ) : (
              /* No grouping - render all notifications */
              (processedNotifications as Notification[]).map((notification, idx) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  index={idx}
                  selected={enableKeyboardNav && selectedIndex === idx}
                  onNotificationClick={onNotificationClick}
                  onMarkAsRead={onMarkAsRead}
                  formatTimestamp={formatTimestamp}
                  variantColors={variantColors}
                  priorityIndicators={priorityIndicators}
                  showAnimations={showAnimations}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Notification Item Component (used internally by NotificationCenter)
interface NotificationItemProps {
  notification: Notification
  index: number
  selected: boolean
  onNotificationClick?: (notification: Notification) => void
  onMarkAsRead?: (id: string) => void
  formatTimestamp: (date: Date) => string
  variantColors: Record<string, string>
  priorityIndicators: Record<string, { color: string; label: string }>
  showAnimations: boolean
}

function NotificationItem({
  notification,
  index,
  selected,
  onNotificationClick,
  onMarkAsRead,
  formatTimestamp,
  variantColors,
  priorityIndicators,
  showAnimations
}: NotificationItemProps) {
  const priority = notification.priority || 'normal'
  const hasPriority = priority === 'urgent' || priority === 'high'

  return (
    <button
      data-notification-index={index}
      onClick={() => {
        onNotificationClick?.(notification)
        if (!notification.read) {
          onMarkAsRead?.(notification.id)
        }
      }}
      className={`
        w-full text-left px-4 py-3 border-b border-black/5 transition-all
        hover:bg-slate-50/80 active:bg-slate-100/50
        ${!notification.read ? 'bg-blue-50/40' : ''}
        ${selected ? 'ring-2 ring-inset ring-primary/50 bg-primary/5' : ''}
        ${showAnimations ? 'animate-in fade-in slide-in-from-right-4 duration-200' : ''}
      `}
    >
      <Flex align="start" gap="sm">
        {/* Avatar or Icon */}
        <div className="flex-shrink-0">
          {notification.avatar ? (
            <img
              src={notification.avatar}
              alt=""
              className="w-10 h-10 rounded-full"
            />
          ) : notification.icon ? (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 ${notification.variant ? variantColors[notification.variant] : 'bg-slate-100 text-slate-600'}`}>
              {notification.icon}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <Flex align="center" gap="xs" className="flex-1">
              <p className="font-medium text-sm text-black line-clamp-1">
                {notification.title}
              </p>
              {hasPriority && (
                <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-white rounded ${priorityIndicators[priority].color}`}>
                  {priorityIndicators[priority].label}
                </span>
              )}
            </Flex>
            {!notification.read && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-black/60 line-clamp-2 mb-1">
            {notification.message}
          </p>
          <p className="text-xs text-black/40">
            {formatTimestamp(notification.timestamp)}
          </p>

          {/* Inline Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              {notification.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    action.onClick()
                  }}
                  className={`
                    px-2.5 py-1 rounded text-xs font-medium transition-colors
                    ${action.variant === 'primary'
                      ? 'bg-primary text-primary-foreground hover:opacity-90'
                      : 'bg-slate-100 text-black/70 hover:bg-slate-200'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </Flex>
    </button>
  )
}

// ============================================================================
// NOTIFICATION BELL - Trigger button for notification center
// ============================================================================

export interface NotificationBellProps {
  count?: number
  onClick?: () => void
  showDot?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function NotificationBell({
  count,
  onClick,
  showDot = false,
  size = 'md'
}: NotificationBellProps) {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeStyles[size]}
        relative flex items-center justify-center
        hover:bg-slate-100 rounded-lg transition-colors
      `}
      aria-label={count ? `${count} notifications` : 'Notifications'}
    >
      <svg
        className={`${iconSizes[size]} text-black/70`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Badge or Dot */}
      {count && count > 0 ? (
        <Badge count={count} variant="error" size="sm" className="absolute -top-1 -right-1" />
      ) : showDot ? (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
      ) : null}
    </button>
  )
}

// ============================================================================
// SYSTEM BANNER - Full-width announcement banner
// ============================================================================

export interface SystemBannerProps {
  variant?: 'info' | 'success' | 'warning' | 'error' | 'neutral'
  message: string
  icon?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  action?: {
    label: string
    onClick: () => void
  }
  position?: 'top' | 'bottom'
  sticky?: boolean
}

export function SystemBanner({
  variant = 'info',
  message,
  icon,
  dismissible = true,
  onDismiss,
  action,
  position = 'top',
  sticky = false
}: SystemBannerProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  const variantStyles = {
    info: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    error: 'bg-red-600 text-white',
    neutral: 'bg-slate-800 text-white'
  }

  return (
    <div
      className={`
        ${variantStyles[variant]}
        ${sticky ? `sticky ${position === 'top' ? 'top-0' : 'bottom-0'} z-50` : ''}
        w-full
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Flex align="center" justify="center" gap="md">
          {icon && (
            <div className="flex-shrink-0 [&>svg]:w-5 [&>svg]:h-5">
              {icon}
            </div>
          )}
          <p className="text-sm font-medium flex-1 text-center sm:text-left">
            {message}
          </p>
          <Flex align="center" gap="sm" className="flex-shrink-0">
            {action && (
              <button
                onClick={action.onClick}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
              >
                {action.label}
              </button>
            )}
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </Flex>
        </Flex>
      </div>
    </div>
  )
}
