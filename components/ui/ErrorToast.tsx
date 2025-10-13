/**
 * ErrorToast Component
 * Shows error messages with auto-dismiss
 */

'use client'

import { useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'

interface ErrorToastProps {
  message: string
  onDismiss: () => void
  duration?: number
}

export function ErrorToast({ message, onDismiss, duration = 5000 }: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[320px] max-w-md">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-red-700 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translate(-50%, 100px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
