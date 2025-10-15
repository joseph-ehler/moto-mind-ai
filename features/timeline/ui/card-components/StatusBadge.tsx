/**
 * Status Badge Component - LOCKED SPECIFICATION
 * 
 * Placement: ALWAYS at bottom of card
 * NEVER in header
 * NEVER floating in middle
 */

import { ReactNode } from 'react'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info'

interface StatusBadgeProps {
  variant: BadgeVariant
  icon?: ReactNode
  children: string
}

export function StatusBadge({ variant, icon, children }: StatusBadgeProps) {
  const variants = {
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-orange-50 border-orange-200 text-orange-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  }
  
  const iconColors = {
    success: 'text-green-600',
    warning: 'text-orange-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold ${variants[variant]}`}>
      {icon && <div className={iconColors[variant]}>{icon}</div>}
      <span>{children}</span>
    </div>
  )
}
