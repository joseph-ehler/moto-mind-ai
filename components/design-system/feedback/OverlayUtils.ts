'use client'

/**
 * Overlay Utilities
 * Reusable hooks and utilities for overlay components
 */

import * as React from 'react'

// ============================================================================
// FOCUS TRAP HOOK
// ============================================================================

/**
 * Traps focus within an element (for modals/dialogs)
 */
export function useFocusTrap(isActive: boolean) {
  const elementRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    if (!isActive || !elementRef.current) return

    const element = elementRef.current
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    // Focus first element on mount
    firstFocusable?.focus()

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    element.addEventListener('keydown', handleTabKey)
    return () => element.removeEventListener('keydown', handleTabKey)
  }, [isActive])

  return elementRef
}

// ============================================================================
// FOCUS RESTORATION HOOK
// ============================================================================

/**
 * Saves and restores focus when overlay opens/closes
 */
export function useFocusRestoration(isOpen: boolean) {
  const previousActiveElement = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousActiveElement.current = document.activeElement as HTMLElement
    } else {
      // Restore focus on close
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
        previousActiveElement.current = null
      }
    }
  }, [isOpen])
}

// ============================================================================
// INERT BACKGROUND HOOK
// ============================================================================

/**
 * Makes background content inert (not keyboard accessible) when overlay is open
 */
export function useInertBackground(isOpen: boolean) {
  React.useEffect(() => {
    if (!isOpen) return

    const root = document.getElementById('__next') || document.body

    // Mark background as inert
    root.setAttribute('aria-hidden', 'true')
    root.style.pointerEvents = 'none'

    return () => {
      root.removeAttribute('aria-hidden')
      root.style.pointerEvents = ''
    }
  }, [isOpen])
}

// ============================================================================
// SCROLL LOCK HOOK (Enhanced)
// ============================================================================

/**
 * Locks body scroll and saves/restores scroll position (ENHANCED - ELITE)
 * Prevents scroll chaining and handles nested scrollable content
 */
export function useScrollLock(isLocked: boolean) {
  const scrollPosition = React.useRef<number>(0)

  React.useEffect(() => {
    if (isLocked) {
      // Save current scroll position
      scrollPosition.current = window.scrollY

      // Calculate scrollbar width for compensation
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

      // Lock body scroll
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
      
      // Prevent scroll on iOS Safari (touch-action)
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollPosition.current}px`
      document.body.style.width = '100%'

      // Prevent scroll chaining (modern browsers)
      document.body.style.overscrollBehavior = 'contain'

      // Also compensate fixed elements (headers, etc.)
      const fixedElements = document.querySelectorAll('[data-fixed-element]')
      fixedElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.paddingRight = `${scrollbarWidth}px`
        }
      })
    } else {
      // Restore scroll
      const scrollY = scrollPosition.current
      
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overscrollBehavior = ''

      // Restore fixed elements
      const fixedElements = document.querySelectorAll('[data-fixed-element]')
      fixedElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.paddingRight = ''
        }
      })

      // Restore scroll position
      window.scrollTo(0, scrollY)
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overscrollBehavior = ''
    }
  }, [isLocked])
}

// ============================================================================
// PORTAL RENDERING
// ============================================================================

/**
 * Creates a portal div at document root for overlays
 */
export function createPortalRoot(id: string): HTMLDivElement {
  let portalRoot = document.getElementById(id) as HTMLDivElement

  if (!portalRoot) {
    portalRoot = document.createElement('div')
    portalRoot.id = id
    portalRoot.style.position = 'fixed'
    portalRoot.style.top = '0'
    portalRoot.style.left = '0'
    portalRoot.style.width = '100%'
    portalRoot.style.height = '100%'
    portalRoot.style.pointerEvents = 'none'
    document.body.appendChild(portalRoot)
  }

  return portalRoot
}

// ============================================================================
// Z-INDEX MANAGEMENT
// ============================================================================

let overlayStack: string[] = []
const BASE_Z_INDEX = 9000

/**
 * Manages z-index for stacked overlays
 */
export function useOverlayStack(id: string, isOpen: boolean) {
  const [zIndex, setZIndex] = React.useState(BASE_Z_INDEX)

  React.useEffect(() => {
    if (isOpen) {
      // Add to stack
      overlayStack.push(id)
      setZIndex(BASE_Z_INDEX + overlayStack.length)

      return () => {
        // Remove from stack
        overlayStack = overlayStack.filter(item => item !== id)
      }
    }
  }, [isOpen, id])

  return zIndex
}

// ============================================================================
// REDUCE MOTION CHECK
// ============================================================================

/**
 * Checks if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// ============================================================================
// TOUCH GESTURES HOOK
// ============================================================================

interface TouchGestureOptions {
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right') => void
  threshold?: number
}

/**
 * Detects swipe gestures for dismissing overlays
 */
export function useTouchGesture(
  elementRef: React.RefObject<HTMLElement>,
  options: TouchGestureOptions
) {
  const { onSwipe, threshold = 50 } = options

  React.useEffect(() => {
    const element = elementRef.current
    if (!element || !onSwipe) return

    let touchStartX = 0
    let touchStartY = 0
    let touchEndX = 0
    let touchEndY = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX
      touchStartY = e.changedTouches[0].screenY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX
      touchEndY = e.changedTouches[0].screenY
      handleSwipe()
    }

    const handleSwipe = () => {
      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY

      // Determine direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          onSwipe(deltaX > 0 ? 'right' : 'left')
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          onSwipe(deltaY > 0 ? 'down' : 'up')
        }
      }
    }

    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [elementRef, onSwipe, threshold])
}

// ============================================================================
// UNIQUE ID GENERATOR
// ============================================================================

let idCounter = 0

/**
 * Generates unique IDs for ARIA attributes
 */
export function useUniqueId(prefix: string = 'overlay'): string {
  const [id] = React.useState(() => `${prefix}-${++idCounter}`)
  return id
}

// ============================================================================
// RESPONSIVE BREAKPOINTS (ELITE FEATURE)
// ============================================================================

type OverlaySize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ResponsiveBreakpoints {
  mobile?: OverlaySize    // < 640px
  tablet?: OverlaySize    // 640px - 1024px
  desktop?: OverlaySize   // > 1024px
}

/**
 * Adapts overlay size based on screen width
 * Automatically makes modals full-screen on mobile for better UX
 */
export function useResponsiveSize(
  baseSize: OverlaySize,
  breakpoints?: ResponsiveBreakpoints
): OverlaySize {
  const [actualSize, setActualSize] = React.useState(baseSize)

  React.useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth

      if (width < 640) {
        // Mobile: default to full-screen unless specified
        setActualSize(breakpoints?.mobile || 'full')
      } else if (width < 1024) {
        // Tablet: default to medium unless specified
        setActualSize(breakpoints?.tablet || (baseSize === 'xl' || baseSize === 'full' ? 'lg' : baseSize))
      } else {
        // Desktop: use base size
        setActualSize(breakpoints?.desktop || baseSize)
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [baseSize, breakpoints])

  return actualSize
}

/**
 * Detects current breakpoint
 */
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  const [breakpoint, setBreakpoint] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width < 640) setBreakpoint('mobile')
      else if (width < 1024) setBreakpoint('tablet')
      else setBreakpoint('desktop')
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return breakpoint
}

// ============================================================================
// SCREEN READER ANNOUNCEMENTS (ELITE FEATURE)
// ============================================================================

/**
 * Announces messages to screen readers using ARIA live regions
 */
export function useScreenReaderAnnouncement() {
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    if (!message) return

    // Create temporary live region
    const liveRegion = document.createElement('div')
    liveRegion.setAttribute('role', 'status')
    liveRegion.setAttribute('aria-live', 'polite')
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    liveRegion.style.position = 'absolute'
    liveRegion.style.left = '-10000px'
    liveRegion.style.width = '1px'
    liveRegion.style.height = '1px'
    liveRegion.style.overflow = 'hidden'
    liveRegion.textContent = message

    document.body.appendChild(liveRegion)

    // Clean up after announcement
    const timer = setTimeout(() => {
      document.body.removeChild(liveRegion)
      setMessage('')
    }, 1000)

    return () => {
      clearTimeout(timer)
      if (document.body.contains(liveRegion)) {
        document.body.removeChild(liveRegion)
      }
    }
  }, [message])

  return setMessage
}

// ============================================================================
// KEYBOARD SHORTCUTS (ELITE FEATURE)
// ============================================================================

type ModifierKey = 'cmd' | 'ctrl' | 'shift' | 'alt'

interface KeyboardShortcutOptions {
  key: string
  modifiers?: ModifierKey[]
  preventDefault?: boolean
}

/**
 * Global keyboard shortcut hook
 * Example: useKeyboardShortcut({ key: 'k', modifiers: ['cmd'] }, () => openSearch())
 */
export function useKeyboardShortcut(
  options: KeyboardShortcutOptions,
  handler: () => void,
  enabled: boolean = true
) {
  React.useEffect(() => {
    if (!enabled) return

    const { key, modifiers = [], preventDefault = true } = options

    const handleKeyDown = (e: KeyboardEvent) => {
      // SSR-safe: Check if we're in browser environment
      const isMac = typeof navigator !== 'undefined'
        ? navigator.platform.toUpperCase().includes('MAC')
        : false
      
      // Check if all required modifiers are pressed
      const modifiersMatch = modifiers.every((mod) => {
        switch (mod) {
          case 'cmd':
            return isMac ? e.metaKey : e.ctrlKey
          case 'ctrl':
            return e.ctrlKey
          case 'shift':
            return e.shiftKey
          case 'alt':
            return e.altKey
          default:
            return false
        }
      })

      // Check if the key matches (case-insensitive)
      const keyMatch = e.key.toLowerCase() === key.toLowerCase()

      if (modifiersMatch && keyMatch) {
        if (preventDefault) {
          e.preventDefault()
        }
        handler()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [options.key, enabled, handler, options.modifiers, options.preventDefault])
}

/**
 * Format keyboard shortcut for display
 * Example: formatShortcut({ key: 'k', modifiers: ['cmd'] }) => '⌘K' on Mac, 'Ctrl+K' on Windows
 * SSR-safe: Returns generic format during server-side rendering
 */
export function formatShortcut(options: KeyboardShortcutOptions): string {
  const { key, modifiers = [] } = options
  
  // SSR-safe: Check if we're in browser environment
  const isMac = typeof navigator !== 'undefined' 
    ? navigator.platform.toUpperCase().includes('MAC')
    : false

  const symbols: Record<ModifierKey, string> = {
    cmd: isMac ? '⌘' : 'Ctrl',
    ctrl: 'Ctrl',
    shift: isMac ? '⇧' : 'Shift',
    alt: isMac ? '⌥' : 'Alt'
  }

  const parts = modifiers.map((mod) => symbols[mod])
  parts.push(key.toUpperCase())

  return isMac ? parts.join('') : parts.join('+')
}

// ============================================================================
// RESIZE OBSERVER (ELITE FEATURE)
// ============================================================================

interface Size {
  width: number
  height: number
}

/**
 * Observes element size changes
 * Useful for dynamic content in overlays
 */
export function useResizeObserver(ref: React.RefObject<HTMLElement>): Size {
  const [size, setSize] = React.useState<Size>({ width: 0, height: 0 })

  React.useEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [ref])

  return size
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

export const animationVariants = {
  // Spring animations (more natural)
  spring: {
    enter: 'animate-in fade-in zoom-in-95 duration-200',
    exit: 'animate-out fade-out zoom-out-95 duration-150'
  },
  
  // Slide animations
  slideUp: {
    enter: 'animate-in fade-in slide-in-from-bottom-4 duration-200',
    exit: 'animate-out fade-out slide-out-to-bottom-4 duration-150'
  },
  
  slideDown: {
    enter: 'animate-in fade-in slide-in-from-top-4 duration-200',
    exit: 'animate-out fade-out slide-out-to-top-4 duration-150'
  },
  
  slideLeft: {
    enter: 'animate-in fade-in slide-in-from-right-4 duration-200',
    exit: 'animate-out fade-out slide-out-to-right-4 duration-150'
  },
  
  slideRight: {
    enter: 'animate-in fade-in slide-in-from-left-4 duration-200',
    exit: 'animate-out fade-out slide-out-to-left-4 duration-150'
  }
}
