/**
 * useScrollVelocity Hook
 * 
 * Tracks scroll velocity and applies dynamic spacing to elements
 * Creates momentum-based gap changes between cards
 */

'use client'

import { useEffect, useState, useRef } from 'react'

export function useScrollVelocity() {
  const [velocity, setVelocity] = useState(0)
  const lastScrollY = useRef(0)
  const lastTimestamp = useRef(Date.now())
  const rafId = useRef<number>()

  useEffect(() => {
    let ticking = false

    const updateVelocity = () => {
      const now = Date.now()
      const currentScrollY = window.scrollY
      const timeDelta = now - lastTimestamp.current
      const scrollDelta = currentScrollY - lastScrollY.current

      if (timeDelta > 0) {
        // Calculate velocity in pixels per millisecond
        const currentVelocity = Math.abs(scrollDelta / timeDelta)
        
        // Smooth the velocity MORE to reduce jitter
        setVelocity(prev => {
          const smoothed = prev * 0.85 + currentVelocity * 0.15 // More smoothing
          // Add threshold to prevent micro-jitters
          return smoothed < 0.05 ? 0 : smoothed
        })
      }

      lastScrollY.current = currentScrollY
      lastTimestamp.current = now
      ticking = false
    }

    const handleScroll = () => {
      if (!ticking) {
        rafId.current = window.requestAnimationFrame(updateVelocity)
        ticking = true
      }
    }

    // Decay velocity when not scrolling (smoother decay)
    const decayInterval = setInterval(() => {
      setVelocity(prev => {
        const decayed = prev * 0.92 // Slower decay (was 0.9)
        return decayed < 0.05 ? 0 : decayed // Snap to 0 when very small
      })
    }, 30) // More frequent updates (was 50ms)

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearInterval(decayInterval)
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [])

  return velocity
}

/**
 * Convert velocity to gap adjustment in pixels
 * velocity is in pixels/ms
 * Returns additional spacing to add between cards (0-48px)
 */
export function velocityToGap(velocity: number): number {
  // Clamp and scale velocity
  // Typical scroll velocity: 0-4 px/ms
  // Map to 0-96px additional gap (DOUBLED for more visible effect)
  const clampedVelocity = Math.min(velocity, 4)
  const additionalGap = clampedVelocity * 24 // 0-96px (was 12, now 24!)
  
  return Math.round(additionalGap)
}
