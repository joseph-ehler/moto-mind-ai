/**
 * Status Badges Block
 * 
 * Standardized badge display for event cards
 */

import { Flex } from '@/components/design-system'
import { ReactNode } from 'react'

export interface StatusBadge {
  label: string
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  icon?: ReactNode
}

interface StatusBadgesProps {
  badges: StatusBadge[]
}

export function StatusBadges({ badges }: StatusBadgesProps) {
  const variantClasses = {
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-gray-50 text-gray-700 border-gray-200',
  }

  return (
    <Flex wrap="wrap" gap="sm">
      {badges.map((badge, index) => (
        <Flex
          key={index}
          align="center"
          gap="xs"
          className={`
            px-3 py-1.5 rounded-lg border text-sm font-semibold
            ${variantClasses[badge.variant]}
          `}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </Flex>
      ))}
    </Flex>
  )
}
