'use client'

import React, { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Edit3, 
  Plus, 
  Download, 
  Settings, 
  Trash2, 
  X 
} from 'lucide-react'

interface OverflowMenuProps {
  isOpen: boolean
  onClose: () => void
  onEditVehicle: () => void
  onManualEntry: () => void
  onExportData: () => void
  onDeleteVehicle: () => void
}

export function OverflowMenu({
  isOpen,
  onClose,
  onEditVehicle,
  onManualEntry,
  onExportData,
  onDeleteVehicle
}: OverflowMenuProps) {
  const popoverRef = useRef<HTMLDivElement>(null)

  // Handle click outside for desktop popover
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    // Only add listener for desktop (when popover is visible)
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    if (mediaQuery.matches) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const menuItems = [
    {
      icon: Edit3,
      label: 'Edit Vehicle Details',
      onClick: onEditVehicle,
      variant: 'default' as const
    },
    {
      icon: Plus,
      label: 'Manual Entry',
      onClick: onManualEntry,
      variant: 'default' as const
    },
    {
      icon: Download,
      label: 'Export History',
      onClick: onExportData,
      variant: 'default' as const
    },
    {
      icon: Settings,
      label: 'Vehicle Settings',
      onClick: () => {}, // TODO: Implement
      variant: 'default' as const
    },
    {
      icon: Trash2,
      label: 'Delete Vehicle',
      onClick: onDeleteVehicle,
      variant: 'destructive' as const
    }
  ]

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 md:hidden"
        onClick={onClose}
      />
      
      {/* Mobile Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl border-t border-black/5 
                      animate-in slide-in-from-bottom duration-300 md:hidden shadow-xl">
        
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-10 h-1 bg-black/20 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <h3 className="text-xl font-semibold text-black">Vehicle Actions</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors">
            <X className="h-5 w-5 text-black/70" />
          </button>
        </div>
        
        {/* Menu Items */}
        <div className="px-6 py-4 space-y-2 pb-safe">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={`mobile-${item.label}`}
                onClick={() => {
                  item.onClick()
                  onClose()
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors text-left ${
                  item.variant === 'destructive' 
                    ? 'text-red-600 hover:bg-red-50' 
                    : 'text-black hover:bg-black/5'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
        
        {/* Safe area padding for mobile */}
        <div className="pb-safe" />
      </div>

      {/* Desktop Popover */}
      <div 
        ref={popoverRef}
        className="hidden md:block absolute right-0 top-12 z-50 bg-white rounded-2xl border border-black/5 shadow-lg min-w-[220px]"
      >
        <div className="p-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={`desktop-${item.label}`}
                onClick={() => {
                  item.onClick()
                  onClose()
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                  item.variant === 'destructive' 
                    ? 'text-red-600 hover:bg-red-50' 
                    : 'text-black hover:bg-black/5'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
