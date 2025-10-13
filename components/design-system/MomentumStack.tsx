/**
 * MomentumStack Component
 * 
 * Stack that adjusts gap based on scroll velocity
 * Faster scroll = larger gaps (momentum effect)
 */

'use client'

import React from 'react'
import { Stack } from './primitives/Layout'
import { useScrollVelocity, velocityToGap } from '@/hooks/useScrollVelocity'

interface MomentumStackProps {
  baseSpacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  children: React.ReactNode
  className?: string
}

const spacingMap = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48
}

export function MomentumStack({ 
  baseSpacing = 'md', 
  children,
  className 
}: MomentumStackProps) {
  const velocity = useScrollVelocity()
  const additionalGap = velocityToGap(velocity)
  const baseGap = spacingMap[baseSpacing]
  const totalGap = baseGap + additionalGap

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${totalGap}px`,
        transition: 'gap 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        willChange: 'gap'
      }}
    >
      {children}
    </div>
  )
}
