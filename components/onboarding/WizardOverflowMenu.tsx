/**
 * Wizard Overflow Menu
 * 
 * Dropdown menu for secondary wizard actions.
 * Contains: Save & exit, Start over, Autosave indicator.
 */

'use client'

import { useState, useEffect } from 'react'
import { MoreVertical, Save, RotateCcw, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type WizardOverflowMenuProps = {
  onExit?: () => void
  onStartOver?: () => void
  disabled?: boolean
  hideExit?: boolean
  hideStartOver?: boolean
  lastSaved?: Date | null
}

export function WizardOverflowMenu({
  onExit,
  onStartOver,
  disabled = false,
  hideExit = false,
  hideStartOver = false,
  lastSaved
}: WizardOverflowMenuProps) {
  const [showSaved, setShowSaved] = useState(false)
  
  // Show "Saved" indicator briefly when lastSaved changes
  useEffect(() => {
    if (lastSaved) {
      setShowSaved(true)
      const timeout = setTimeout(() => setShowSaved(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [lastSaved])
  
  // Format last saved time
  const getLastSavedText = () => {
    if (!lastSaved) return 'No changes yet'
    
    const now = new Date()
    const diff = now.getTime() - lastSaved.getTime()
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 5) return 'Saved just now'
    if (seconds < 60) return `Saved ${seconds}s ago`
    
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `Saved ${minutes}m ago`
    
    return 'Saved earlier'
  }
  
  const hasActions = !hideExit || !hideStartOver
  
  if (!hasActions && !lastSaved) {
    return null
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            'text-gray-600 hover:text-gray-900',
            'h-11 w-11 p-0', // 44px touch target (mobile-friendly)
            'active:scale-95 transition-transform', // Touch feedback
            showSaved && 'text-green-600'
          )}
          aria-label="More options"
        >
          {showSaved ? (
            <Check className="w-5 h-5" />
          ) : (
            <MoreVertical className="w-5 h-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 min-w-[14rem]"
        sideOffset={8}
      >
        {/* Autosave status */}
        <div className="px-3 py-2.5 text-sm text-gray-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <span className="truncate">{getLastSavedText()}</span>
        </div>
        
        {hasActions && <DropdownMenuSeparator />}
        
        {/* Save & exit */}
        {!hideExit && onExit && (
          <DropdownMenuItem 
            onClick={onExit} 
            disabled={disabled}
            className="py-3 text-base cursor-pointer"
          >
            <Save className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>Save & exit</span>
          </DropdownMenuItem>
        )}
        
        {/* Start over */}
        {!hideStartOver && onStartOver && (
          <DropdownMenuItem
            onClick={onStartOver}
            disabled={disabled}
            className="py-3 text-base cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <RotateCcw className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>Start over</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
