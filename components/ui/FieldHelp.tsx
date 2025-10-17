/**
 * FieldHelp - Help icon with popover for field explanations
 */

'use client'

import { HelpCircle } from 'lucide-react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { cn } from '@/lib/utils/cn'

interface FieldHelpProps {
  title: string
  description: string
  examples?: string[]
  tips?: string[]
  className?: string
}

export function FieldHelp({
  title,
  description,
  examples,
  tips,
  className
}: FieldHelpProps) {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center justify-center",
            "w-4 h-4 rounded-full",
            "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
            "transition-colors cursor-help",
            className
          )}
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        <div className="space-y-3">
          {/* Title */}
          <h4 className="font-semibold text-sm text-gray-900">
            {title}
          </h4>

          {/* Description */}
          <p className="text-xs text-gray-600 leading-relaxed">
            {description}
          </p>

          {/* Examples */}
          {examples && examples.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-700">Examples:</p>
              <ul className="space-y-1">
                {examples.map((example, index) => (
                  <li
                    key={index}
                    className="text-xs text-gray-600 pl-4 relative before:content-['•'] before:absolute before:left-0"
                  >
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {tips && tips.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-blue-700">💡 Tips:</p>
                <ul className="space-y-1">
                  {tips.map((tip, index) => (
                    <li
                      key={index}
                      className="text-xs text-blue-600 leading-relaxed"
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
