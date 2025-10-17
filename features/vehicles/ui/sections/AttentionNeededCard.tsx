'use client'

import { Card, Stack, Flex, Heading, Text, Button } from '@/components/design-system'
import { AlertTriangle } from 'lucide-react'

interface AttentionNeededCardProps {
  /** Whether the card should be shown (controlled by parent) */
  show: boolean
  /** Whether to show skeleton loading state */
  isLoading?: boolean
}

// Skeleton component for loading state
function AttentionNeededCardSkeleton() {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm animate-pulse">
      <div className="px-6 py-4 border-b border-gray-100">
        <Flex align="center" gap="sm">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="h-4 w-36 bg-gray-200 rounded" />
        </Flex>
      </div>
      <div className="p-6 space-y-4">
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 rounded" />
        <div className="h-4 w-4/6 bg-gray-200 rounded" />
      </div>
    </Card>
  )
}

export function AttentionNeededCard({ show, isLoading = false }: AttentionNeededCardProps) {
  if (!show) return null
  if (isLoading) return <AttentionNeededCardSkeleton />

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <Flex align="center" gap="sm">
          <AlertTriangle className="w-4 h-4 text-gray-600" />
          <Text className="text-base font-semibold text-gray-900">
            Attention Needed
          </Text>
        </Flex>
      </div>

      {/* Alert: Registration (URGENT) */}
      <div className="p-6">
        <Stack spacing="sm">
          <Flex justify="between" align="start">
            <Stack spacing="xs" className="flex-1">
              <Flex align="center" gap="sm">
                <div className="px-2 py-0.5 bg-red-100 rounded-full">
                  <Text className="text-xs font-semibold text-red-700">URGENT</Text>
                </div>
                <Text className="text-sm font-medium text-gray-900">Registration Expiring</Text>
              </Flex>
              <Text className="text-sm text-gray-600">Nov 16, 2025 • 34 days remaining</Text>
              <Flex align="center" gap="xs">
                <AlertTriangle className="w-3 h-3 text-red-600" aria-hidden="true" />
                <Text className="text-xs text-red-600">
                  Cannot legally drive without valid registration
                </Text>
              </Flex>
            </Stack>
          </Flex>
          <Flex gap="sm">
            <Button size="sm">Update Registration</Button>
            <Button size="sm" variant="secondary">Set Reminder</Button>
            <Button size="sm" variant="ghost">Learn More</Button>
          </Flex>
        </Stack>
      </div>
    </Card>
  )
}
