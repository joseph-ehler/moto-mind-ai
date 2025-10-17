import { cn } from '@/lib/utils'
import { AIProcessingStatus } from '../types'

interface AIStatusBadgeProps {
  status: AIProcessingStatus
}

export function AIStatusBadge({ status }: AIStatusBadgeProps) {
  const badges = {
    pending: {
      icon: '⏳',
      text: 'AI Pending',
      className: 'bg-gray-100 text-gray-700 border-gray-300'
    },
    processing: {
      icon: '🔄',
      text: 'AI Processing',
      className: 'bg-blue-100 text-blue-700 border-blue-300 animate-pulse'
    },
    completed: {
      icon: '✨',
      text: 'AI Enhanced',
      className: 'bg-green-100 text-green-700 border-green-300'
    },
    failed: {
      icon: '⚠️',
      text: 'AI Failed',
      className: 'bg-red-100 text-red-700 border-red-300'
    },
    none: {
      icon: '',
      text: '',
      className: 'hidden'
    }
  }

  const badge = badges[status]

  return (
    <div className={cn(
      "inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border whitespace-nowrap",
      badge.className
    )}>
      <span className="text-xs sm:text-sm">{badge.icon}</span>
      <span className="hidden xs:inline sm:inline">{badge.text}</span>
      <span className="xs:hidden sm:hidden">{badge.icon}</span>
    </div>
  )
}
