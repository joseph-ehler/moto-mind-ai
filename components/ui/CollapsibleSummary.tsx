/**
 * Collapsible Summary Component
 * 
 * Expandable card that shows key metrics when collapsed, full content when expanded
 */

import React, { useState } from 'react'
import { Card, Stack, Flex, Heading, Text } from '@/components/design-system'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CollapsibleSummaryProps {
  title: string
  icon?: React.ReactNode
  summary: React.ReactNode
  children: React.ReactNode
  defaultExpanded?: boolean
}

export function CollapsibleSummary({
  title,
  icon,
  summary,
  children,
  defaultExpanded = false
}: CollapsibleSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <Stack spacing="md">
        {/* Header - Always Visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
        >
          <Flex align="center" justify="between" gap="md">
            <Flex align="center" gap="md">
              {icon && (
                <Flex align="center" justify="center" className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0">
                  {icon}
                </Flex>
              )}
              <Stack spacing="xs" className="text-left">
                <Heading level="subtitle" className="text-base font-semibold">
                  {title}
                </Heading>
                {!isExpanded && (
                  <div className="text-sm text-gray-600">
                    {summary}
                  </div>
                )}
              </Stack>
            </Flex>
            
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </Flex>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="pt-2 border-t border-gray-200">
            {children}
          </div>
        )}
      </Stack>
    </Card>
  )
}
