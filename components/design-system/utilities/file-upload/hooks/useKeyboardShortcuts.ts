/**
 * useKeyboardShortcuts Hook
 * Manages keyboard shortcuts and focus trap for camera modal
 */

import { useEffect, useRef } from 'react'

export interface UseKeyboardShortcutsOptions {
  isOpen: boolean
  onCapture: () => void
  onClose: () => void
  capturedImageUrl: string | null
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcuts for camera modal
  useEffect(() => {
    if (!options.isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close camera
      if (e.key === 'Escape') {
        e.preventDefault()
        options.onClose()
      }
      
      // Space or Enter to capture (when not showing preview)
      if ((e.key === ' ' || e.key === 'Enter') && !options.capturedImageUrl) {
        e.preventDefault()
        options.onCapture()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [options.isOpen, options.onClose, options.onCapture, options.capturedImageUrl])

  // Focus trap in camera modal
  useEffect(() => {
    if (!options.isOpen || !modalRef.current) return

    const modal = modalRef.current
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    // Focus first element on open
    firstElement?.focus()

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [options.isOpen])

  return { modalRef }
}
