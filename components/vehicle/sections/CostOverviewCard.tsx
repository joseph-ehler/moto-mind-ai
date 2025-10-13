'use client'

import { Card, Stack, Flex, Grid, Heading, Text, Button } from '@/components/design-system'
import { DollarSign, TrendingUp, TrendingDown, Sparkles } from 'lucide-react'
import { FieldHelp } from '@/components/ui/FieldHelp'

interface CostOverviewCardProps {
  /** Whether the card should be shown (controlled by parent) */
  show: boolean
  /** Callback to switch to service tab */
  onViewBreakdown: () => void
  /** Whether to show skeleton loading state */
  isLoading?: boolean
}

// Skeleton component for loading state
function CostOverviewCardSkeleton() {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm animate-pulse">
      <div className="px-6 py-4 border-b border-gray-100">
        <Flex justify="between" align="center">
          <Flex align="center" gap="sm">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="h-4 w-28 bg-gray-200 rounded" />
          </Flex>
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

export function CostOverviewCard({ show, onViewBreakdown, isLoading = false }: CostOverviewCardProps) {
  if (!show) return null
  if (isLoading) return <CostOverviewCardSkeleton />

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <Flex justify="between" align="center">
          <Flex align="center" gap="sm">
            <DollarSign className="w-4 h-4 text-gray-600" />
            <Text className="text-base font-semibold text-gray-900">
              Cost Overview
            </Text>
            <FieldHelp
              title="How We Compare Your Costs"
              description="We analyzed 2,847 similar 2013 Chevrolet Captiva Sport vehicles (90,000-95,000 miles) to benchmark your costs"
              examples={[
                "Average cost: $1,467/year",
                "Your cost: $1,247/year",
                "Savings: $120 (8% below average)"
              ]}
              tips={[
                "You're doing better than 67% of similar vehicle owners"
              ]}
            />
          </Flex>
          <Button variant="secondary" size="sm" onClick={onViewBreakdown}>
            View Breakdown
          </Button>
        </Flex>
      </div>

      <div className="p-6">
        <Grid columns={3} gap="lg" className="grid-cols-1 sm:grid-cols-3">
          {/* Metric 1: Total YTD */}
          <Stack spacing="xs">
            <Text className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Total YTD
            </Text>
            <Text className="text-3xl font-bold text-gray-900">$1,247</Text>
            <Flex align="center" gap="xs">
              <TrendingUp className="w-4 h-4 text-green-600" aria-label="Increased" />
              <Text className="text-sm text-green-600">+12% vs last year</Text>
            </Flex>
            <Text className="text-xs text-gray-500">As of Oct 12</Text>
          </Stack>

          {/* Metric 2: Fuel */}
          <Stack spacing="xs">
            <Text className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Fuel
            </Text>
            <Text className="text-3xl font-bold text-gray-900">$845</Text>
            <Text className="text-sm text-gray-600">68% of spend</Text>
            <Flex align="center" gap="xs">
              <TrendingDown className="w-4 h-4 text-green-600" aria-label="Below average, saving money" />
              <Text className="text-xs text-green-600">-$0.12/gal vs avg</Text>
            </Flex>
          </Stack>

          {/* Metric 3: Service */}
          <Stack spacing="xs">
            <Text className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Service
            </Text>
            <Text className="text-3xl font-bold text-gray-900">$402</Text>
            <Text className="text-sm text-gray-600">32% of spend</Text>
            <Text className="text-xs text-gray-500">4 services YTD</Text>
          </Stack>
        </Grid>

        {/* AI Insight - Spending Comparison */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <Flex align="center" gap="xs" className="mb-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <Text className="text-sm font-semibold text-gray-900">Cost Efficiency</Text>
          </Flex>
          <Text className="text-sm text-gray-600">
            You're spending 8% less than the average 2013 Chevrolet Captiva owner
          </Text>
        </div>

        {/* Complete Breakdown */}
        <div className="mt-4">
          <Text className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
            Complete Breakdown
          </Text>
          <Stack spacing="xs">
            <Flex justify="between" align="center">
              <Text className="text-sm text-gray-600">Fuel</Text>
              <Text className="text-sm font-medium text-gray-900">$845 (68%)</Text>
            </Flex>
            <Flex justify="between" align="center">
              <Text className="text-sm text-gray-600">Maintenance</Text>
              <Text className="text-sm font-medium text-gray-900">$302 (24%)</Text>
            </Flex>
            <Flex justify="between" align="center">
              <Text className="text-sm text-gray-600">Registration</Text>
              <Text className="text-sm font-medium text-gray-900">$67 (5%)</Text>
            </Flex>
            <Flex justify="between" align="center">
              <Text className="text-sm text-gray-600">Other</Text>
              <Text className="text-sm font-medium text-gray-900">$33 (3%)</Text>
            </Flex>
            <div className="border-t border-gray-200 pt-2 mt-1">
              <Flex justify="between" align="center">
                <Text className="text-sm font-semibold text-gray-900">Total</Text>
                <Text className="text-sm font-semibold text-gray-900">$1,247 (100%)</Text>
              </Flex>
            </div>
          </Stack>
        </div>
      </div>
    </Card>
  )
}
