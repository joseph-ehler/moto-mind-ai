/**
 * Hero Metric Component - LOCKED SPECIFICATION
 * 
 * ONLY use when there's a PRIMARY NUMERIC VALUE
 * 
 * Use for:
 * ✅ Cost (Fuel, Service, Damage)
 * ✅ Reading (Odometer, Tire Tread)
 * ✅ Count (Warning count, if single number)
 * 
 * DO NOT use for:
 * ❌ Status words (Checked, Pending, Pass/Fail)
 * ❌ Multiple equal-importance values
 */

import { ReactNode } from 'react'

interface HeroMetricProps {
  /** The primary value - ALWAYS text-4xl */
  value: string | ReactNode
  
  /** Context text below - ALWAYS text-sm */
  context?: string
  
  /** Background color override (default: gray-50) */
  bgColor?: string
}

export function HeroMetric({ 
  value, 
  context,
  bgColor = 'bg-gray-50'
}: HeroMetricProps) {
  return (
    <div className={`text-center py-6 -mx-6 px-6 ${bgColor}`}>
      <div className="text-4xl font-bold text-gray-900">
        {value}
      </div>
      {context && (
        <div className="text-sm text-gray-500 mt-2">
          {context}
        </div>
      )}
    </div>
  )
}
