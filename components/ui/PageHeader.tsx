/**
 * PageHeader - Based on actual codebase patterns
 * 
 * Standardizes the page header pattern found:
 * text-3xl font-bold text-gray-900 mb-2
 */

import React from 'react'
import { cn } from '@/lib/utils/cn'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, className = '' }: PageHeaderProps) {
  return (
    <div className={cn('flex justify-between items-start mb-6', className)}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        {subtitle && <p className="text-gray-600">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={cn('flex justify-between items-start mb-4', className)}>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
