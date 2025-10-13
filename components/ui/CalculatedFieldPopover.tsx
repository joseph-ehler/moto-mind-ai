/**
 * CalculatedFieldPopover - Shows calculation breakdown
 */

'use client'

import { Calculator } from 'lucide-react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { cn } from '@/lib/utils/cn'

interface CalculationStep {
  label: string
  value: string | number
  formula?: string
}

interface CalculatedFieldPopoverProps {
  title: string
  result: string | number
  steps: CalculationStep[]
  formula: string
  className?: string
}

export function CalculatedFieldPopover({
  title,
  result,
  steps,
  formula,
  className
}: CalculatedFieldPopoverProps) {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded",
            "bg-blue-50 text-blue-600 text-xs font-medium",
            "hover:bg-blue-100 transition-colors cursor-help",
            "flex-shrink-0",
            className
          )}
        >
          <Calculator className="w-3 h-3" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="end">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-gray-900">
                {title}
              </h4>
              <p className="text-xs text-gray-600 mt-0.5">
                Auto-calculated value
              </p>
            </div>
          </div>

          {/* Formula */}
          <div className="p-2 bg-gray-50 rounded-lg">
            <p className="text-xs font-mono text-gray-700">
              {formula}
            </p>
          </div>

          {/* Calculation Steps */}
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{step.label}:</span>
                <span className="font-medium text-gray-900">
                  {step.value}
                  {step.formula && (
                    <span className="ml-1 text-gray-500 font-normal">
                      {step.formula}
                    </span>
                  )}
                </span>
              </div>
            ))}
            
            {/* Result */}
            <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Result:</span>
              <span className="text-sm font-bold text-blue-600">{result}</span>
            </div>
          </div>

          {/* Note */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              💡 This value updates automatically when you edit the source fields
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
