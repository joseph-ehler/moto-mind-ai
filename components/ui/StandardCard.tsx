/**
 * StandardCard - Based on actual codebase patterns
 * 
 * Standardizes the most common card pattern found:
 * bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden
 */

import React from 'react'
import { cn } from '@/lib/utils/cn'

interface StandardCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'standard' | 'premium'
}

export function StandardCard({ children, className = '', variant = 'standard' }: StandardCardProps) {
  const variants = {
    // Most common pattern (15+ uses)
    standard: 'bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden',
    // Premium pattern (8+ uses in vehicle specs)
    premium: 'bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden'
  }
  
  return (
    <div className={cn(variants[variant], className)}>
      {children}
    </div>
  )
}

interface StandardCardHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
}

export function StandardCardHeader({ title, subtitle, children, className = '' }: StandardCardHeaderProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

interface StandardCardContentProps {
  children: React.ReactNode
  className?: string
}

export function StandardCardContent({ children, className = '' }: StandardCardContentProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  )
}
