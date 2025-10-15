'use client'

import { Card, Stack, Flex, Heading, Text, Button } from '@/components/design-system'
import { Calendar, Camera, DollarSign, Wrench, StickyNote, ChevronRight } from 'lucide-react'
import { AIBadgeWithPopover } from '@/components/ui/AIBadgeWithPopover'

interface RecentActivityCardProps {
  /** Whether the card should be shown (controlled by parent) */
  show: boolean
  /** Whether events are still loading */
  isLoading: boolean
  /** Array of timeline events */
  events: any[]
  /** Vehicle ID for navigation */
  vehicleId: string
  /** Navigation callback */
  onNavigate: (path: string) => void
  /** Callback to view full timeline */
  onViewTimeline: () => void
}

// Skeleton component for loading state
function RecentActivityCardSkeleton() {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm animate-pulse">
      <div className="px-6 py-4 border-b border-gray-100">
        <Flex justify="between" align="center">
          <Flex align="center" gap="sm">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </Flex>
        </Flex>
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function RecentActivityCard({
  show,
  isLoading,
  events,
  vehicleId,
  onNavigate,
  onViewTimeline
}: RecentActivityCardProps) {
  if (!show) return null
  if (isLoading) return <RecentActivityCardSkeleton />

  // Filter out system events
  const userFacingEvents = events.filter((e: any) => 
    e.type !== 'dashboard_snapshot' && e.type !== 'odometer'
  )

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <Flex justify="between" align="center">
          <Flex align="center" gap="sm">
            <Calendar className="w-4 h-4 text-gray-600" />
            <Text className="text-base font-semibold text-gray-900">
              Recent Activity
            </Text>
          </Flex>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onViewTimeline}
            className="focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            View Timeline
          </Button>
        </Flex>
      </div>

      {isLoading ? (
        <div className="p-6">
          <Flex justify="center" className="py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </Flex>
        </div>
      ) : userFacingEvents.length === 0 ? (
        <div className="p-6">
          <div className="text-center py-8">
            <Stack spacing="sm" className="items-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Camera className="w-6 h-6 text-gray-400" />
              </div>
              <Text className="text-gray-600">No fuel or service events yet</Text>
              <Button
                size="sm"
                onClick={() => onNavigate(`/vehicles/${vehicleId}/capture`)}
              >
                <Camera className="w-4 h-4 mr-2" />
                Add First Event
              </Button>
            </Stack>
          </div>
        </div>
      ) : (
        <>
          {userFacingEvents.slice(0, 5).map((event: any, index: number) => {
            const isFuel = event.type === 'fuel'
            const isService = event.type === 'service'
            
            const gallons = event.extracted_data?.gallons || event.metadata?.gallons
            const mpg = event.extracted_data?.mpg || event.metadata?.mpg
            const vendor = event.display_vendor || event.extracted_data?.station_name || 
                          event.extracted_data?.vendor_name || event.metadata?.vendor
            const cost = event.display_amount || 
                        (event.cost ? `$${event.cost.toFixed(2)}` : 
                         event.metadata?.total_amount ? `$${event.metadata.total_amount.toFixed(2)}` : null)
            
            const displayTitle = event.display_summary || event.title || 'Event'
            const displayDate = event.date || event.timestamp || event.metadata?.date
            
            return (
              <div 
                key={event.id}
                className={`p-6 ${index < 4 ? 'border-b border-gray-200' : ''} hover:bg-gray-50 cursor-pointer transition-colors group`}
                onClick={() => onNavigate(`/events/${event.id}`)}
              >
                <Flex align="start" gap="sm">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isFuel ? 'bg-green-50' : isService ? 'bg-blue-50' : 'bg-yellow-50'
                  }`}>
                    {isFuel && <DollarSign className="w-5 h-5 text-green-600" />}
                    {isService && <Wrench className="w-5 h-5 text-blue-600" />}
                    {!isFuel && !isService && <StickyNote className="w-5 h-5 text-yellow-600" />}
                  </div>
                  
                  {/* Content */}
                  <Stack spacing="xs" className="flex-1 min-w-0">
                    <Flex justify="between" align="start">
                      <Stack spacing="xs" className="flex-1 min-w-0">
                        {/* Title/Amount Row */}
                        <Flex align="center" gap="xs">
                          {cost ? (
                            <Text className="text-base font-semibold text-gray-900">{cost}</Text>
                          ) : displayTitle ? (
                            <Text className="text-sm font-semibold text-gray-900">{displayTitle}</Text>
                          ) : (
                            <Text className="text-sm font-medium text-gray-900">
                              {isFuel ? 'Fuel Purchase' : isService ? 'Service' : 'Event'}
                            </Text>
                          )}
                          {event.extracted_data?.ai_generated && (
                            <AIBadgeWithPopover
                              confidence={event.extracted_data?.confidence || 0.95}
                              aiType="detected"
                              fieldName={isFuel ? "Fuel Purchase" : "Service"}
                              detectionDetails="Automatically detected from receipt image using AI"
                            />
                          )}
                        </Flex>
                        
                        {/* Date/Vendor Row */}
                        {displayDate && (
                          <Text className="text-sm text-gray-600">
                            {new Date(displayDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                            {vendor && ` • ${vendor}`}
                          </Text>
                        )}
                        
                        {/* Details Row (Fuel) */}
                        {isFuel && (gallons || mpg) && (
                          <Text className="text-xs text-gray-500">
                            {gallons && `${gallons.toFixed(1)} gal`}
                            {gallons && mpg && ' • '}
                            {mpg && `${mpg.toFixed(1)} MPG`}
                          </Text>
                        )}
                        
                        {/* Details Row (Service) */}
                        {isService && event.display_summary && (
                          <Text className="text-xs text-gray-500">{event.display_summary}</Text>
                        )}
                      </Stack>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                    </Flex>
                  </Stack>
                </Flex>
              </div>
            )
          })}
          
          {/* View All Button */}
          {userFacingEvents.length > 5 && (
            <div className="p-4 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={onViewTimeline}
              >
                View Full Timeline ({userFacingEvents.length} events)
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
