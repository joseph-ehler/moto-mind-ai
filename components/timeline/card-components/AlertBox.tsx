/**
 * Alert Box Component - LOCKED SPECIFICATION
 * 
 * Use for:
 * - Dashboard warnings (error variant)
 * - Recall notices (error variant)
 * - Important notices (warning variant)
 * 
 * NEVER use for:
 * - Regular status (use StatusBadge instead)
 * - Data display (use DataGrid/DataList)
 */

import { ReactNode } from 'react'

type AlertVariant = 'error' | 'warning' | 'info'

interface AlertBoxProps {
  variant: AlertVariant
  icon: ReactNode
  title: string
  description?: string
}

export function AlertBox({ variant, icon, title, description }: AlertBoxProps) {
  const variants = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      descColor: 'text-red-700'
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      iconColor: 'text-orange-600',
      titleColor: 'text-orange-900',
      descColor: 'text-orange-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      descColor: 'text-blue-700'
    }
  }

  const style = variants[variant]

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${style.bg} ${style.border}`}>
      <div className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.iconColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${style.titleColor}`}>
          {title}
        </div>
        {description && (
          <div className={`text-xs mt-1 ${style.descColor}`}>
            {description}
          </div>
        )}
      </div>
    </div>
  )
}
