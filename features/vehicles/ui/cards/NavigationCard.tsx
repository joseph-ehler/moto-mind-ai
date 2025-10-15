'use client'

import React from 'react'
import { ChevronRight, LucideIcon } from 'lucide-react'

interface NavigationCardProps {
  title: string
  summary: string
  icon?: LucideIcon
  onClick: () => void
  disabled?: boolean
  badge?: string | number
}

export function NavigationCard({ 
  title, 
  summary, 
  icon: Icon, 
  onClick, 
  disabled = false,
  badge
}: NavigationCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full bg-white rounded-3xl border border-black/5 p-6 shadow-sm
        flex items-center justify-between gap-4
        transition-all duration-200
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:shadow-md hover:border-black/10 active:scale-[0.99]'
        }
      `}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-black/70" />
          </div>
        )}
        
        <div className="text-left flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-black">{title}</h3>
            {badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                {badge}
              </span>
            )}
            {disabled && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-sm text-black/60 truncate">{summary}</p>
        </div>
      </div>
      
      <ChevronRight className={`w-5 h-5 flex-shrink-0 ${disabled ? 'text-black/20' : 'text-black/40'}`} />
    </button>
  )
}
