/**
 * useScrollAnimation Hook
 * 
 * Creates scroll-based momentum animations for elements
 * Provides that iOS/Android app-like dynamic feel
 * 
 * Usage:
 * const ref = useScrollAnimation({ type: 'fade-up' })
 * <div ref={ref}>Content</div>
 */

import { useEffect, useRef } from 'react'

export type ScrollAnimationType = 
  | 'fade-up'        // Fade in while sliding up
  | 'fade-scale'     // Fade in while scaling
  | 'parallax'       // Move slower than scroll
  | 'parallax-fast'  // Move faster than scroll
  | 'slide-left'     // Slide in from right
  | 'slide-right'    // Slide in from left

interface ScrollAnimationOptions {
  type?: ScrollAnimationType
  delay?: number      // Delay in ms before animation starts
  duration?: number   // Duration in ms
  threshold?: number  // Intersection threshold (0-1)
  once?: boolean      // Animate only once
}

export function useScrollAnimation(options: ScrollAnimationOptions = {}) {
  const {
    type = 'fade-up',
    delay = 0,
    duration = 600,
    threshold = 0.1,
    once = true
  } = options

  const ref = useRef<HTMLElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Set initial state - MORE DRAMATIC
    element.style.opacity = '0'
    element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`
    
    // Apply initial transform based on type - INCREASED DISTANCES
    switch (type) {
      case 'fade-up':
        element.style.transform = 'translateY(50px)'  // Was 20px
        break
      case 'fade-scale':
        element.style.transform = 'scale(0.9)'  // Was 0.95
        break
      case 'parallax':
        element.style.transform = 'translateY(30px)'  // Was 10px
        break
      case 'parallax-fast':
        element.style.transform = 'translateY(-30px)'  // Was -10px
        break
      case 'slide-left':
        element.style.transform = 'translateX(60px)'  // Was 30px
        break
      case 'slide-right':
        element.style.transform = 'translateX(-60px)'  // Was -30px
        break
    }

    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate in
            if (!once || !hasAnimated.current) {
              setTimeout(() => {
                element.style.opacity = '1'
                element.style.transform = type === 'fade-scale' 
                  ? 'scale(1)' 
                  : 'translateY(0) translateX(0)'
              }, delay)
              hasAnimated.current = true
            }
          } else if (!once) {
            // Animate out when scrolling away - MORE DRAMATIC
            element.style.opacity = '0'
            switch (type) {
              case 'fade-up':
                element.style.transform = 'translateY(50px)'  // Increased
                break
              case 'fade-scale':
                element.style.transform = 'scale(0.9)'  // More dramatic
                break
              case 'slide-left':
                element.style.transform = 'translateX(60px)'  // Increased
                break
              case 'slide-right':
                element.style.transform = 'translateX(-60px)'  // Increased
                break
            }
          }
        })
      },
      { threshold }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [type, delay, duration, threshold, once])

  return ref
}

/**
 * Stagger Animation Hook
 * Animates multiple children with sequential delays
 */
export function useStaggerAnimation(itemCount: number, baseDelay: number = 100) {
  const refs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    refs.current.forEach((element, index) => {
      if (!element) return

      element.style.opacity = '0'
      element.style.transform = 'translateY(20px)'
      element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                element.style.opacity = '1'
                element.style.transform = 'translateY(0)'
              }, index * baseDelay)
            }
          })
        },
        { threshold: 0.1 }
      )

      observer.observe(element)
    })
  }, [itemCount, baseDelay])

  return refs
}

/**
 * Parallax Scroll Hook
 * Creates smooth parallax effect as user scrolls
 */
export function useParallaxScroll(speed: number = 0.5) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = element.getBoundingClientRect()
          const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
          
          if (scrollProgress >= 0 && scrollProgress <= 1) {
            const translateY = (scrollProgress - 0.5) * 100 * speed
            element.style.transform = `translateY(${translateY}px)`
          }
          
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call

    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  return ref
}
