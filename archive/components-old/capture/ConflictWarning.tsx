/**
 * ConflictWarning Component
 * Displays data conflicts with severity-based styling and resolution options
 */

'use client'

import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import type { DataConflict } from '@/lib/data-conflict-detection'

interface ConflictWarningProps {
  conflict: DataConflict
  onResolve?: (resolution: 'accept' | 'edit' | 'dismiss') => void
}

export function ConflictWarning({ conflict, onResolve }: ConflictWarningProps) {
  const { severity, title, message, suggestions } = conflict

  // Use lighter, friendlier colors for high severity
  const containerStyle = 'bg-blue-50 border-blue-200'
  const iconColor = 'text-blue-600'
  const textColor = 'text-blue-900'
  const messageColor = 'text-blue-700'

  return (
    <div className={`p-5 rounded-lg border-2 ${containerStyle}`}>
      {/* Simple question format */}
      <div className="flex items-start gap-3 mb-4">
        <div className={iconColor}>
          {severity === 'high' ? '📅' : 'ℹ️'}
        </div>
        <div className="flex-1">
          <h4 className={`text-lg font-semibold ${textColor} mb-2`}>{title}</h4>
          <p className={`text-base ${messageColor}`}>{message}</p>
        </div>
      </div>

      {/* Action buttons for high severity */}
      {severity === 'high' && onResolve && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => onResolve('accept')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            ✓ Yes, that's right
          </button>
          <button
            onClick={() => onResolve('edit')}
            className="px-4 py-2 border-2 border-blue-300 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-100 transition-colors"
          >
            Change date
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * ConflictSection
 * Container for multiple conflict warnings
 */
interface ConflictSectionProps {
  conflicts: DataConflict[]
  onResolve?: (conflict: DataConflict, resolution: 'accept' | 'edit' | 'dismiss') => void
}

export function ConflictSection({ conflicts, onResolve }: ConflictSectionProps) {
  if (conflicts.length === 0) return null

  // Only show high severity conflicts (critical issues that need user decision)
  const highSeverity = conflicts.filter((c) => c.severity === 'high')
  
  if (highSeverity.length === 0) return null

  return (
    <div className="mb-6">
      {/* No technical header - just show the questions */}
      <div className="space-y-3">
        {highSeverity.map((conflict) => (
          <ConflictWarning
            key={conflict.type}
            conflict={conflict}
            onResolve={
              onResolve ? (resolution) => onResolve(conflict, resolution) : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}
