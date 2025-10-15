'use client'

import React from 'react'
import { Card, Flex, Heading, Text, Stack, Grid } from '@/components/design-system'
import { Activity, TrendingUp } from 'lucide-react'
import { FieldHelp } from '@/components/ui/FieldHelp'
import { AIBadgeWithPopover } from '@/components/ui/AIBadgeWithPopover'

interface VehicleHealthCardProps {
  /** Whether the card should be shown (controlled by parent) */
  show: boolean
  /** Whether to show skeleton loading state */
  isLoading?: boolean
}

// Skeleton component for loading state
function VehicleHealthCardSkeleton() {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm animate-pulse">
      <div className="px-6 py-4 border-b border-gray-100">
        <Flex align="center" gap="sm">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </Flex>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-6 w-16 bg-gray-200 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-6 w-16 bg-gray-200 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-6 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </Card>
  )
}

export function VehicleHealthCard({ show, isLoading = false }: VehicleHealthCardProps) {
  if (!show) return null
  if (isLoading) return <VehicleHealthCardSkeleton />

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <Flex align="center" gap="sm">
          <Activity className="w-4 h-4 text-gray-600" />
          <Text className="text-base font-semibold text-gray-900">
            Vehicle Health
          </Text>
          <FieldHelp
            title="How We Calculate Health Score"
            description="Your score of 92/100 is calculated from multiple factors"
            examples={[
              "Maintenance history: 28/30 points",
              "Diagnostics: 25/25 points",
              "Fuel Efficiency: 18/20 points",
              "Age & Mileage: 12/15 points",
              "Battery Health: 9/10 points"
            ]}
            tips={[
              "Keep up with scheduled maintenance to improve your score"
            ]}
          />
        </Flex>
      </div>

      <div className="p-6">
        <Grid columns={3} gap="lg" className="grid-cols-1 sm:grid-cols-3">
          {/* Metric 1: Overall Score */}
          <Stack spacing="xs">
            <Flex align="center" gap="xs">
              <Text className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Overall Score
              </Text>
              <AIBadgeWithPopover
                confidence={0.94}
                aiType="calculated"
                fieldName="Health Score"
                detectionDetails="Calculated from maintenance history (28/30), diagnostics (25/25), fuel efficiency (18/20), age & mileage (12/15), and battery health (9/10)."
              />
            </Flex>
            <Text className="text-3xl font-bold text-gray-900">92/100</Text>
            <Text className="text-sm text-gray-600">Excellent</Text>
            <Flex align="center" gap="xs">
              <TrendingUp className="w-3 h-3 text-green-600" aria-label="Improving" />
              <Text className="text-xs text-green-600">+3 pts this month</Text>
            </Flex>
            <Text className="text-xs text-gray-500">Top 15% of similar vehicles</Text>
          </Stack>

          {/* Metric 2: Fuel Economy */}
          <Stack spacing="xs">
            <Flex align="center" gap="xs">
              <Text className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Fuel Economy
              </Text>
              <AIBadgeWithPopover
                confidence={0.91}
                aiType="calculated"
                fieldName="Fuel Economy"
                detectionDetails="Based on your last 30 days of driving. Compared against 2,847 similar 2013 Chevrolet Captivas."
              />
            </Flex>
            <Text className="text-3xl font-bold text-gray-900">24.5 MPG</Text>
            <Text className="text-sm text-green-600">Good</Text>
            <Flex align="center" gap="xs">
              <TrendingUp className="w-3 h-3 text-green-600" aria-label="Above average" />
              <Text className="text-xs text-green-600">+2.1 MPG vs avg</Text>
            </Flex>
            <Text className="text-xs text-gray-500">Based on 2,847 Captivas</Text>
          </Stack>

          {/* Metric 3: Battery Health */}
          <Stack spacing="xs">
            <Text className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Battery Health
            </Text>
            <Text className="text-3xl font-bold text-gray-900">94%</Text>
            <Text className="text-sm text-gray-600">Excellent</Text>
            <Flex align="center" gap="xs">
              <div className="w-3 h-3 flex items-center justify-center">
                <div className="w-2 h-0.5 bg-gray-400" />
              </div>
              <Text className="text-xs text-gray-500">Stable</Text>
            </Flex>
          </Stack>
        </Grid>
      </div>
    </Card>
  )
}
