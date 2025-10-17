/**
 * Vehicle Floating Action Button (FAB)
 * 
 * Expandable FAB with vehicle-specific quick actions
 * Activates on both hover and tap/click
 */

'use client'

import React, { useState } from 'react'
import { Camera, MessageSquare, Wrench, FileText, Plus, X } from 'lucide-react'

interface FABAction {
  icon: React.ReactNode
  label: string
  onClick: () => void
  color: string
}

interface VehicleFABProps {
  onCapture: () => void
  onAIChat: () => void
  onScheduleMaintenance: () => void
  onAddDocument: () => void
}

export function VehicleFAB({ 
  onCapture, 
  onAIChat,
  onScheduleMaintenance,
  onAddDocument
}: VehicleFABProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTapped, setIsTapped] = useState(false)

  const actions: FABAction[] = [
    {
      icon: <Camera className="w-5 h-5" />,
      label: 'Capture Receipt',
      onClick: onCapture,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: 'Ask AI',
      onClick: onAIChat,
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      icon: <Wrench className="w-5 h-5" />,
      label: 'Schedule Service',
      onClick: onScheduleMaintenance,
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Add Document',
      onClick: onAddDocument,
      color: 'bg-green-600 hover:bg-green-700'
    }
  ]

  const handleMainButtonClick = () => {
    setIsTapped(!isTapped)
    setIsExpanded(!isExpanded)
  }

  const handleMouseEnter = () => {
    if (!isTapped) {
      setIsExpanded(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isTapped) {
      setIsExpanded(false)
    }
  }

  const handleActionClick = (action: FABAction) => {
    action.onClick()
    setIsExpanded(false)
    setIsTapped(false)
  }

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Action Buttons */}
      {isExpanded && actions.map((action, index) => (
        <button
          key={action.label}
          onClick={() => handleActionClick(action)}
          className={`
            flex items-center gap-3
            ${action.color}
            text-white
            px-4 py-3
            rounded-full
            shadow-lg hover:shadow-xl
            transition-all duration-200
            hover:scale-105 active:scale-95
            animate-in fade-in slide-in-from-bottom-2
            group
          `}
          style={{
            animationDelay: `${index * 50}ms`,
            animationDuration: '200ms',
            animationFillMode: 'both'
          }}
          aria-label={action.label}
        >
          {action.icon}
          <span className="font-medium text-sm whitespace-nowrap">
            {action.label}
          </span>
        </button>
      ))}

      {/* Main FAB Button */}
      <button
        onClick={handleMainButtonClick}
        className={`
          flex items-center justify-center
          bg-black text-white
          w-14 h-14
          rounded-full
          shadow-lg hover:shadow-xl
          transition-all duration-200
          hover:scale-105 active:scale-95
          ${isExpanded ? 'rotate-45' : 'rotate-0'}
        `}
        aria-label={isExpanded ? 'Close menu' : 'Open quick actions'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>
    </div>
  )
}
