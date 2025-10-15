/**
 * Data Grid Block
 * 
 * Standardized 2-column data display for event cards
 * Consistent spacing and typography
 */

import { Text, Stack, Flex } from '@/components/design-system'
import { ReactNode } from 'react'

export interface DataRow {
  label: string
  value: string | number | ReactNode
  badge?: ReactNode
}

interface DataGridProps {
  rows: DataRow[]
  columns?: 1 | 2
}

export function DataGrid({ rows, columns = 2 }: DataGridProps) {
  return (
    <div 
      className={`grid gap-4 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
    >
      {rows.map((row, index) => (
        <Stack key={index} spacing="xs">
          <Text size="xs" className="text-gray-500 uppercase tracking-wide font-medium">
            {row.label}
          </Text>
          <Flex align="center" gap="xs">
            {typeof row.value === 'string' || typeof row.value === 'number' ? (
              <Text size="sm" className="font-semibold text-gray-900">
                {row.value}
              </Text>
            ) : (
              row.value
            )}
            {row.badge}
          </Flex>
        </Stack>
      ))}
    </div>
  )
}
