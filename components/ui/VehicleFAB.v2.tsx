/**
 * Vehicle Floating Action Button (FAB) v2
 * 
 * Minimal speed dial with 3 core actions:
 * 1. Capture Receipt (primary)
 * 2. Ask AI (secondary)
 * 3. More Actions (opens comprehensive modal)
 * 
 * Activates on both hover (desktop) and tap (mobile)
 * Options appear ABOVE the main FAB button
 */

'use client'

import React, { useState } from 'react'
import { Camera, MessageSquare, Plus } from 'lucide-react'

interface VehicleFABProps {
  onCapture: () => void
  onAskAI: () => void
  onShowMore: () => void
}

export function VehicleFAB({ 
  onCapture, 
  onAskAI,
  onShowMore
}: VehicleFABProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLocked, setIsLocked] = useState(false) // Tap to lock open on mobile

  const handleMainClick = () => {
    setIsLocked(!isLocked)
    setIsExpanded(!isExpanded)
  }

  const handleMouseEnter = () => {
    if (!isLocked) {
      setIsExpanded(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isLocked) {
      setIsExpanded(false)
    }
  }

  const handleActionClick = (action: () => void) => {
    action()
    setIsExpanded(false)
    setIsLocked(false)
  }

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Speed Dial Actions - Appear ABOVE main button */}
      {isExpanded && (
        <>
          {/* More Actions Button */}
          <button
            onClick={() => handleActionClick(onShowMore)}
            className="flex items-center gap-3 bg-gray-700 hover:bg-gray-800 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 group animate-in fade-in slide-in-from-top-2"
            style={{
              animationDelay: '0ms',
              animationDuration: '200ms',
              animationFillMode: 'both'
            }}
            aria-label="More actions"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium text-sm whitespace-nowrap hidden sm:inline">
              More
            </span>
          </button>

          {/* Ask AI Button */}
          <button
            onClick={() => handleActionClick(onAskAI)}
            className="flex items-center gap-3 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 group animate-in fade-in slide-in-from-top-2"
            style={{
              animationDelay: '50ms',
              animationDuration: '200ms',
              animationFillMode: 'both'
            }}
            aria-label="Ask AI assistant"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium text-sm whitespace-nowrap hidden sm:inline">
              Ask AI
            </span>
          </button>

          {/* Capture Receipt Button */}
          <button
            onClick={() => handleActionClick(onCapture)}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 group animate-in fade-in slide-in-from-top-2"
            style={{
              animationDelay: '100ms',
              animationDuration: '200ms',
              animationFillMode: 'both'
            }}
            aria-label="Capture receipt"
          >
            <Camera className="w-5 h-5" />
            <span className="font-medium text-sm whitespace-nowrap hidden sm:inline">
              Capture
            </span>
          </button>
        </>
      )}

      {/* Main FAB Button - Shows + icon, rotates 45° when expanded */}
      <button
        onClick={handleMainClick}
        className={`
          flex items-center justify-center
          bg-black hover:bg-gray-900 text-white
          w-14 h-14 sm:w-16 sm:h-16
          rounded-full
          shadow-lg hover:shadow-xl
          transition-all duration-300
          hover:scale-105 active:scale-95
          ${isExpanded ? 'rotate-45' : 'rotate-0'}
        `}
        aria-label={isExpanded ? 'Close quick actions' : 'Open quick actions'}
        aria-expanded={isExpanded}
      >
        <Plus className="w-7 h-7 sm:w-8 sm:h-8" />
      </button>
    </div>
  )
}
