/**
 * Timeline Stats Component
 * 
 * Quick overview stats above timeline feed
 */

import React from 'react'
import { Card, Flex, Text, Grid, Stack } from '@/components/design-system'
import { Camera, Calendar, TrendingUp, Activity } from 'lucide-react'
import { TimelineItem } from '@/types/timeline'
import { formatDistance } from 'date-fns'

interface TimelineStatsProps {
  items: TimelineItem[]
}

export function TimelineStats({ items }: TimelineStatsProps) {
  // Calculate stats
  const totalCaptures = items.length
  const lastCapture = items.length > 0 
    ? formatDistance(new Date(items[0].timestamp), new Date(), { addSuffix: true })
    : 'Never'
  
  // Count by type
  const serviceCount = items.filter(i => i.type === 'service').length
  const odometerCount = items.filter(i => i.type === 'odometer').length
  
  // Calculate captures this month
  const now = new Date()
  const thisMonth = items.filter(i => {
    const itemDate = new Date(i.timestamp)
    return itemDate.getMonth() === now.getMonth() && 
           itemDate.getFullYear() === now.getFullYear()
  }).length

  return (
    <Grid columns="auto" gap="sm" className="grid-cols-2 sm:grid-cols-4">
      {/* Total Captures */}
      <Card className="p-3 bg-blue-50 border border-blue-100">
        <Stack spacing="xs">
          <Flex align="center" gap="xs">
            <Camera className="w-4 h-4 text-blue-600" />
            <Text className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              Total
            </Text>
          </Flex>
          <Text className="text-2xl font-bold text-blue-900">
            {totalCaptures}
          </Text>
          <Text className="text-xs text-blue-700">
            captures
          </Text>
        </Stack>
      </Card>

      {/* This Month */}
      <Card className="p-3 bg-green-50 border border-green-100">
        <Stack spacing="xs">
          <Flex align="center" gap="xs">
            <Calendar className="w-4 h-4 text-green-600" />
            <Text className="text-xs font-medium text-green-600 uppercase tracking-wide">
              This Month
            </Text>
          </Flex>
          <Text className="text-2xl font-bold text-green-900">
            {thisMonth}
          </Text>
          <Text className="text-xs text-green-700">
            new items
          </Text>
        </Stack>
      </Card>

      {/* Service Records */}
      <Card className="p-3 bg-purple-50 border border-purple-100">
        <Stack spacing="xs">
          <Flex align="center" gap="xs">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <Text className="text-xs font-medium text-purple-600 uppercase tracking-wide">
              Services
            </Text>
          </Flex>
          <Text className="text-2xl font-bold text-purple-900">
            {serviceCount}
          </Text>
          <Text className="text-xs text-purple-700">
            recorded
          </Text>
        </Stack>
      </Card>

      {/* Last Capture */}
      <Card className="p-3 bg-orange-50 border border-orange-100">
        <Stack spacing="xs">
          <Flex align="center" gap="xs">
            <Activity className="w-4 h-4 text-orange-600" />
            <Text className="text-xs font-medium text-orange-600 uppercase tracking-wide">
              Last Capture
            </Text>
          </Flex>
          <Text className="text-lg font-bold text-orange-900 leading-tight">
            {lastCapture}
          </Text>
          <Text className="text-xs text-orange-700">
            {odometerCount} odometer
          </Text>
        </Stack>
      </Card>
    </Grid>
  )
}
