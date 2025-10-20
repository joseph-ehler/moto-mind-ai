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
            'text-gray-600 hover:text-gray-900 h-9 w-9 p-0',
            showSaved && 'text-green-600'
          )}
          aria-label="More options"
        >
          {showSaved ? (
            <Check className="w-4 h-4" />
          ) : (
            <MoreVertical className="w-4 h-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Autosave status */}
        <div className="px-2 py-1.5 text-xs text-gray-500 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {getLastSavedText()}
        </div>
        
        {hasActions && <DropdownMenuSeparator />}
        
        {/* Save & exit */}
        {!hideExit && onExit && (
          <DropdownMenuItem onClick={onExit} disabled={disabled}>
            <Save className="w-4 h-4 mr-2" />
            Save & exit
          </DropdownMenuItem>
        )}
        
        {/* Start over */}
        {!hideStartOver && onStartOver && (
          <DropdownMenuItem
            onClick={onStartOver}
            disabled={disabled}
            className="text-red-600 focus:text-red-600"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start over
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
