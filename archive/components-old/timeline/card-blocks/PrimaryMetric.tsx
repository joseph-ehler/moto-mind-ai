/**
 * Primary Metric Block
 * 
 * Standardized hero metric display for event cards
 * Always centered, always large and bold
 */

import { Text, Flex } from '@/components/design-system'

interface PrimaryMetricProps {
  value: string | number
  label?: string
  suffix?: string
  prefix?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  subtext?: string
}

export function PrimaryMetric({ 
  value, 
  label, 
  suffix, 
  prefix,
  variant = 'default',
  subtext 
}: PrimaryMetricProps) {
  const colorClasses = {
    default: 'text-gray-900',
    success: 'text-green-600',
    warning: 'text-orange-600',
    danger: 'text-red-600',
  }

  return (
    <Flex direction="col" align="center" className="py-4">
      {label && (
        <Text size="sm" className="text-gray-500 mb-2">
          {label}
        </Text>
      )}
      
      <Flex align="baseline" gap="sm">
        {prefix && (
          <Text size="xl" className="text-gray-500 font-medium">
            {prefix}
          </Text>
        )}
        
        <Text className={`text-4xl font-bold leading-none tracking-tight ${colorClasses[variant]}`}>
          {value}
        </Text>
        
        {suffix && (
          <Text size="xl" className="text-gray-500 font-medium">
            {suffix}
          </Text>
        )}
      </Flex>
      
      {subtext && (
        <Text size="sm" className="text-gray-600 mt-2">
          {subtext}
        </Text>
      )}
    </Flex>
  )
}
