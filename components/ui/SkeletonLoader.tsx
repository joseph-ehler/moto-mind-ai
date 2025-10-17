/**
 * Skeleton Loader Components
 * 
 * Provides smooth loading states with shimmer effects
 */

'use client'

import { Card, Stack, Flex } from '@/components/design-system'

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <Card className="animate-pulse">
      <Stack spacing="md" className="p-6">
        {/* Header */}
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-100 rounded w-full"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6"></div>
          </div>
        ))}
      </Stack>
    </Card>
  )
}

export function SkeletonInsightCard() {
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 animate-pulse">
      <Stack spacing="md" className="p-6">
        {/* Header */}
        <Flex align="center" gap="sm">
          <div className="w-5 h-5 bg-purple-200 rounded"></div>
          <div className="h-5 bg-purple-200 rounded w-32"></div>
        </Flex>

        {/* Insight boxes */}
        <Stack spacing="sm">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-white rounded-lg border border-purple-100">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-full"></div>
            </div>
          ))}
        </Stack>

        {/* Footer */}
        <div className="pt-2 border-t border-purple-100">
          <div className="h-3 bg-purple-100 rounded w-2/3 mx-auto"></div>
        </div>
      </Stack>
    </Card>
  )
}

export function SkeletonAchievementCard() {
  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 animate-pulse">
      <Stack spacing="md" className="p-6">
        {/* Header */}
        <Flex align="center" justify="between">
          <Flex align="center" gap="sm">
            <div className="w-5 h-5 bg-amber-200 rounded"></div>
            <div className="h-5 bg-amber-200 rounded w-32"></div>
          </Flex>
          <div className="w-20 h-6 bg-amber-300 rounded-full"></div>
        </Flex>

        {/* Progress bar */}
        <Stack spacing="xs">
          <Flex justify="between">
            <div className="h-3 bg-amber-200 rounded w-24"></div>
            <div className="h-3 bg-amber-200 rounded w-16"></div>
          </Flex>
          <div className="w-full h-3 bg-gray-200 rounded-full"></div>
        </Stack>

        {/* Achievement box */}
        <div className="p-3 bg-white rounded-lg border border-amber-100">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-full"></div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-amber-100">
          <div className="h-3 bg-amber-100 rounded w-1/2 mx-auto"></div>
        </div>
      </Stack>
    </Card>
  )
}

export function SkeletonDataSection() {
  return (
    <Card className="animate-pulse">
      <div className="p-4 border-b border-gray-100">
        <div className="h-5 bg-gray-200 rounded w-48"></div>
      </div>
      <div className="p-6">
        <Stack spacing="md">
          {[1, 2, 3, 4].map((i) => (
            <Flex key={i} justify="between" align="center">
              <div className="h-4 bg-gray-100 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </Flex>
          ))}
        </Stack>
      </div>
    </Card>
  )
}
