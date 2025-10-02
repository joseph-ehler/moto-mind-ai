import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

interface ScrollState {
  scrollTop: number
  timestamp: number
}

const SCROLL_RESTORATION_KEY_PREFIX = 'scroll_state_'
const MAX_AGE_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Hook to restore scroll position when navigating back to a page
 * 
 * @param key - Unique key for this scroll context (usually the route path)
 * @param enabled - Whether scroll restoration is enabled
 */
export function useScrollRestoration(key: string, enabled = true) {
  const router = useRouter()
  const restoredRef = useRef(false)
  const storageKey = `${SCROLL_RESTORATION_KEY_PREFIX}${key}`

  useEffect(() => {
    if (!enabled) return

    // Restore scroll position on mount (only once)
    if (!restoredRef.current) {
      const savedState = sessionStorage.getItem(storageKey)
      
      if (savedState) {
        try {
          const { scrollTop, timestamp }: ScrollState = JSON.parse(savedState)
          
          // Only restore if not too old
          if (Date.now() - timestamp < MAX_AGE_MS) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
              window.scrollTo(0, scrollTop)
              console.log(`📜 Restored scroll position: ${scrollTop}px for ${key}`)
            })
          } else {
            // Clear stale data
            sessionStorage.removeItem(storageKey)
          }
        } catch (e) {
          console.error('Failed to restore scroll position:', e)
          sessionStorage.removeItem(storageKey)
        }
      }
      
      restoredRef.current = true
    }

    // Save scroll position before navigation
    const saveScrollPosition = () => {
      const scrollState: ScrollState = {
        scrollTop: window.scrollY,
        timestamp: Date.now()
      }
      sessionStorage.setItem(storageKey, JSON.stringify(scrollState))
      console.log(`💾 Saved scroll position: ${window.scrollY}px for ${key}`)
    }

    // Save on route change start
    router.events.on('routeChangeStart', saveScrollPosition)

    // Also save on beforeunload (for browser back/forward)
    window.addEventListener('beforeunload', saveScrollPosition)

    return () => {
      router.events.off('routeChangeStart', saveScrollPosition)
      window.removeEventListener('beforeunload', saveScrollPosition)
    }
  }, [enabled, key, router.events, storageKey])

  // Manual save function (useful for programmatic navigation)
  const saveScrollPosition = () => {
    if (!enabled) return
    
    const scrollState: ScrollState = {
      scrollTop: window.scrollY,
      timestamp: Date.now()
    }
    sessionStorage.setItem(storageKey, JSON.stringify(scrollState))
  }

  // Clear saved scroll position
  const clearScrollPosition = () => {
    sessionStorage.removeItem(storageKey)
  }

  return {
    saveScrollPosition,
    clearScrollPosition
  }
}

/**
 * Hook to restore scroll position for a specific element (not window)
 */
export function useElementScrollRestoration(
  elementRef: React.RefObject<HTMLElement>,
  key: string,
  enabled = true
) {
  const restoredRef = useRef(false)
  const storageKey = `${SCROLL_RESTORATION_KEY_PREFIX}element_${key}`

  useEffect(() => {
    if (!enabled || !elementRef.current) return

    const element = elementRef.current

    // Restore on mount
    if (!restoredRef.current) {
      const savedState = sessionStorage.getItem(storageKey)
      
      if (savedState) {
        try {
          const { scrollTop, timestamp }: ScrollState = JSON.parse(savedState)
          
          if (Date.now() - timestamp < MAX_AGE_MS) {
            element.scrollTop = scrollTop
            console.log(`📜 Restored element scroll: ${scrollTop}px for ${key}`)
          } else {
            sessionStorage.removeItem(storageKey)
          }
        } catch (e) {
          console.error('Failed to restore element scroll:', e)
          sessionStorage.removeItem(storageKey)
        }
      }
      
      restoredRef.current = true
    }

    // Save before unmount
    return () => {
      const scrollState: ScrollState = {
        scrollTop: element.scrollTop,
        timestamp: Date.now()
      }
      sessionStorage.setItem(storageKey, JSON.stringify(scrollState))
    }
  }, [enabled, key, elementRef, storageKey])
}
