/**
 * Floating Action Button (FAB)
 * 
 * Persistent capture button that follows user on scroll
 */

import React from 'react'
import { Camera } from 'lucide-react'

interface FloatingActionButtonProps {
  onClick: () => void
  label?: string
  className?: string
}

export function FloatingActionButton({ 
  onClick, 
  label = 'Capture',
  className = ''
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center gap-3
        bg-black text-white
        px-5 py-3.5
        rounded-full
        shadow-lg hover:shadow-xl
        transition-all duration-200
        hover:scale-105 active:scale-95
        group
        ${className}
      `}
      aria-label={label}
    >
      <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      <span className="font-medium text-sm hidden sm:inline">{label}</span>
    </button>
  )
}
