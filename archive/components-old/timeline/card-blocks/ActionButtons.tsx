/**
 * Action Buttons Block
 * 
 * Standardized action button display
 */

import { Flex, Button } from '@/components/design-system'
import { ReactNode } from 'react'

export interface Action {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: ReactNode
}

interface ActionButtonsProps {
  actions: Action[]
}

export function ActionButtons({ actions }: ActionButtonsProps) {
  return (
    <Flex wrap="wrap" gap="sm" className="pt-4 border-t border-gray-100">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'ghost'}
          size="sm"
          onClick={action.onClick}
          className="inline-flex items-center gap-2"
        >
          {action.icon}
          <span>{action.label}</span>
        </Button>
      ))}
    </Flex>
  )
}
