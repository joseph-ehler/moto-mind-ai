/**
 * AnimatedCard Component
 * 
 * Individual card animations with scroll-triggered entrance effects
 */

'use client'

import React from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { Card } from './patterns/Card'

type ScrollAnimationType = 
  | 'fade-up'
  | 'fade-scale'
  | 'parallax'
  | 'parallax-fast'
  | 'slide-left'
  | 'slide-right'

interface AnimatedCardProps {
  /** Animation type */
  animation?: ScrollAnimationType
  /** Delay before animation starts (ms) */
  delay?: number
  /** Animation duration (ms) */
  duration?: number
  /** Only animate once */
  once?: boolean
  /** Disable animation */
  disableAnimation?: boolean
  /** Card content */
  children?: React.ReactNode
  /** Additional CSS classes */
  className?: string
  /** Any other props */
  [key: string]: any
}

// Get animation variants with spring physics - VERY DRAMATIC
function getAnimationVariants(type: ScrollAnimationType) {
  const variants = {
    'fade-up': {
      hidden: { opacity: 0, y: 100, scale: 0.9 },
      visible: { opacity: 1, y: 0, scale: 1 }
    },
    'fade-scale': {
      hidden: { opacity: 0, scale: 0.7, rotate: -5 },
      visible: { opacity: 1, scale: 1, rotate: 0 }
    },
    'slide-left': {
      hidden: { opacity: 0, x: 150, rotate: 5 },
      visible: { opacity: 1, x: 0, rotate: 0 }
    },
    'slide-right': {
      hidden: { opacity: 0, x: -150, rotate: -5 },
      visible: { opacity: 1, x: 0, rotate: 0 }
    },
    'parallax': {
      hidden: { opacity: 0, y: 80 },
      visible: { opacity: 1, y: 0 }
    },
    'parallax-fast': {
      hidden: { opacity: 0, y: -80 },
      visible: { opacity: 1, y: 0 }
    }
  }
  return variants[type]
}

export function AnimatedCard({
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  once = true,
  disableAnimation = false,
  children,
  className,
  ...cardProps
}: AnimatedCardProps) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once, amount: 0.2 })
  const prefersReducedMotion = useReducedMotion()
  
  if (disableAnimation || prefersReducedMotion) {
    return (
      <Card className={className} {...cardProps}>
        {children}
      </Card>
    )
  }

  const variants = getAnimationVariants(animation)
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        type: "spring",
        stiffness: 60,
        damping: 12,
        mass: 1.0,
        delay: delay / 1000,
        duration: 1.2
      }}
    >
      <Card className={className} {...cardProps}>
        {children}
      </Card>
    </motion.div>
  )
}

/**
 * AnimatedSection
 * 
 * Wraps content with scroll animation
 * Use for non-card elements that need momentum
 */
interface AnimatedSectionProps {
  children: React.ReactNode
  animation?: ScrollAnimationType
  delay?: number
  duration?: number
  once?: boolean
  className?: string
}

export function AnimatedSection({
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  once = true,
  children,
  className = ''
}: AnimatedSectionProps) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once, amount: 0.2 })
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  const variants = getAnimationVariants(animation)
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        type: "spring",
        stiffness: 60,
        damping: 12,
        mass: 1.0,
        delay: delay / 1000,
        duration: 1.2
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
