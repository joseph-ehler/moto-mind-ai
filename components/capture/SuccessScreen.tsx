/**
 * SuccessScreen Component
 * Shows success message after saving event
 */

'use client'

import { CheckCircle } from 'lucide-react'

interface SuccessScreenProps {
  onContinue: () => void
  onAddAnother: () => void
}

export function SuccessScreen({ onContinue, onAddAnother }: SuccessScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="text-center max-w-md mx-auto">
        {/* Success animation */}
        <div className="mb-6 relative">
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          {/* Ripple effect */}
          <div className="absolute inset-0 w-24 h-24 mx-auto bg-green-100 rounded-full animate-ping opacity-20"></div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Fill-Up Saved!</h2>

        <p className="text-gray-600 mb-8">
          Your fuel purchase has been added to your timeline
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onContinue}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 transition-colors"
          >
            View Timeline
          </button>

          <button
            onClick={onAddAnother}
            className="w-full px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Add Another Fill-Up
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
