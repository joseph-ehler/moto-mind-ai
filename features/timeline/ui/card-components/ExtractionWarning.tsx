/**
 * Extraction Warning Component
 * 
 * Inline warnings for missing, estimated, or uncertain data.
 * Transparency builds user trust.
 */

import { AlertCircle, Info, HelpCircle } from 'lucide-react'

type WarningType = 'missing' | 'estimated' | 'low-confidence'

interface ExtractionWarningProps {
  type: WarningType
  message: string
  /** Optional: Suggested action */
  action?: {
    label: string
    onClick: () => void
  }
}

export function ExtractionWarning({ type, message, action }: ExtractionWarningProps) {
  const styles = {
    missing: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: <AlertCircle className="w-4 h-4 text-orange-600" />
    },
    estimated: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: <Info className="w-4 h-4 text-blue-600" />
    },
    'low-confidence': {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: <HelpCircle className="w-4 h-4 text-amber-600" />
    }
  }
  
  const style = styles[type]
  
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border ${style.bg} ${style.border}`}>
      <div className="flex-shrink-0 mt-0.5">
        {style.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-xs ${style.text}`}>
          {message}
        </p>
        
        {action && (
          <button
            onClick={action.onClick}
            className={`text-xs font-semibold mt-1 ${style.text} hover:underline`}
          >
            {action.label} →
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Inline warning for data rows (subtle)
 */
export function InlineWarning({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
      <Info className="w-3 h-3" />
      <span>{message}</span>
    </div>
  )
}
