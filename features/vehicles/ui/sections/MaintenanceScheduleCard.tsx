'use client'

import { Card, Stack, Flex, Heading, Text, Button } from '@/components/design-system'
import { Wrench, Clock, Settings, Lightbulb } from 'lucide-react'
import { FieldHelp } from '@/components/ui/FieldHelp'
import { AIBadgeWithPopover } from '@/components/ui/AIBadgeWithPopover'

interface MaintenanceScheduleCardProps {
  /** Whether the card should be shown (controlled by parent) */
  show: boolean
  /** Callback to switch to service tab */
  onViewFullSchedule: () => void
  /** Whether to show skeleton loading state */
  isLoading?: boolean
}

// Skeleton component for loading state
function MaintenanceScheduleCardSkeleton() {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm animate-pulse">
      <div className="px-6 py-4 border-b border-gray-100">
        <Flex justify="between" align="center">
          <Flex align="center" gap="sm">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="h-4 w-40 bg-gray-200 rounded" />
          </Flex>
        </Flex>
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-3 w-5/6 bg-gray-200 rounded" />
          <div className="h-3 w-4/6 bg-gray-200 rounded" />
        </div>
        <div className="border-t pt-4 space-y-3">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-3 w-5/6 bg-gray-200 rounded" />
        </div>
      </div>
    </Card>
  )
}

export function MaintenanceScheduleCard({ show, onViewFullSchedule, isLoading = false }: MaintenanceScheduleCardProps) {
  if (!show) return null
  if (isLoading) return <MaintenanceScheduleCardSkeleton />

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <Flex justify="between" align="center">
          <Flex align="center" gap="sm">
            <Wrench className="w-4 h-4 text-gray-600" />
            <Text className="text-base font-semibold text-gray-900">
              Maintenance Schedule
            </Text>
            <FieldHelp
              title="How Your Schedule is Personalized"
              description="Your maintenance schedule is tailored to your specific driving conditions and vehicle health"
              examples={[
                "Manufacturer recommendations for 2013 Captiva",
                "Your driving patterns (65% highway, 35% city)",
                "Your climate conditions (affects service frequency)",
                "Current vehicle health metrics"
              ]}
              tips={[
                "Service intervals can be customized in Settings if you prefer different timing"
              ]}
            />
          </Flex>
          <Button variant="secondary" size="sm" onClick={onViewFullSchedule}>
            Full Schedule
          </Button>
        </Flex>
      </div>

      {/* Next Service: Oil Change */}
      <div className="p-6 border-b border-gray-200">
        <Flex justify="between" align="start">
          <Stack spacing="xs" className="flex-1">
            <Flex align="center" gap="xs">
              <Text className="text-sm font-medium text-gray-900">Next: Oil Change</Text>
              <AIBadgeWithPopover
                confidence={0.92}
                aiType="calculated"
                fieldName="Maintenance Prediction"
                detectionDetails="Based on your driving patterns (65% highway), current oil age (3,200 miles), and synthetic oil intervals (3,000-5,000 mi)."
              />
            </Flex>
            <Text className="text-sm text-gray-600">Jan 1, 2026 • in 234 mi • ~$89</Text>
            <Flex align="center" gap="xs">
              <Clock className="w-3 h-3 text-gray-400" aria-hidden="true" />
              <Text className="text-xs text-gray-500">Last done: Oct 1, 2025 (3,000 mi ago)</Text>
            </Flex>
            <Flex align="center" gap="xs">
              <Settings className="w-3 h-3 text-gray-400" aria-hidden="true" />
              <Text className="text-xs text-gray-500">
                Type: Synthetic 5W-30 • Interval: 3,000-5,000 mi
              </Text>
            </Flex>
          </Stack>
          <Button size="sm" variant="secondary">Schedule</Button>
        </Flex>
      </div>

      {/* Upcoming Service: Tire Rotation */}
      <div className="p-6">
        <Flex justify="between" align="start">
          <Stack spacing="xs" className="flex-1">
            <Flex align="center" gap="xs">
              <Text className="text-sm font-medium text-gray-900">Tire Rotation</Text>
              <AIBadgeWithPopover
                confidence={0.78}
                aiType="calculated"
                fieldName="Service Recommendation"
                detectionDetails="Based on current mileage and typical rotation intervals. Medium confidence due to variable driving conditions."
              />
            </Flex>
            <Text className="text-sm text-gray-600">Feb 15, 2026 • in 1,200 mi • ~$25</Text>
            <Flex align="center" gap="xs">
              <Clock className="w-3 h-3 text-gray-400" aria-hidden="true" />
              <Text className="text-xs text-gray-500">Last done: Aug 15, 2025 (5,000 mi ago)</Text>
            </Flex>
            <Flex align="center" gap="xs">
              <Lightbulb className="w-3 h-3 text-gray-400" aria-hidden="true" />
              <Text className="text-xs text-gray-500">Extends tire life by up to 30%</Text>
            </Flex>
          </Stack>
          <Button size="sm" variant="secondary">Schedule</Button>
        </Flex>
      </div>
    </Card>
  )
}
