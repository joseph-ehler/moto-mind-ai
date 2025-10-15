import { ArrowRight, Calendar, MapPin, DollarSign } from 'lucide-react'
import { Card, Stack, Text, Flex } from '@/components/design-system'
import Link from 'next/link'

interface RelatedEvent {
  id: string
  date: string
  station_name: string | null
  total_amount: number | null
  gallons: number | null
  miles: number | null
}

interface RelatedEventsProps {
  previousEvent: RelatedEvent | null
  nextEvent: RelatedEvent | null
  daysSincePrevious: number | null
}

export function RelatedEvents({ previousEvent, nextEvent, daysSincePrevious }: RelatedEventsProps) {
  if (!previousEvent && !nextEvent) return null

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getDaysText = (days: number) => {
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return `${Math.floor(days / 30)} months ago`
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">🔗 Related Fill-Ups</h3>
      </div>

      <Stack spacing="sm" className="p-4">
        {/* Previous Event */}
        {previousEvent && (
          <Link href={`/events/${previousEvent.id}`}>
            <div className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors cursor-pointer">
              <Flex className="items-start justify-between mb-2">
                <div>
                  <Text className="text-xs text-gray-500">← Previous Fill-Up</Text>
                  <Text className="text-sm font-semibold text-gray-900 mt-0.5">
                    {previousEvent.station_name || 'Fuel Fill-Up'}
                  </Text>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Flex>

              <Flex className="items-center gap-4 text-xs text-gray-600">
                <Flex className="items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(previousEvent.date)}
                </Flex>
                {previousEvent.total_amount && (
                  <Flex className="items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ${previousEvent.total_amount.toFixed(2)}
                  </Flex>
                )}
                {previousEvent.gallons && (
                  <span>{previousEvent.gallons.toFixed(1)} gal</span>
                )}
              </Flex>

              {daysSincePrevious !== null && (
                <Text className="text-xs text-blue-600 font-medium mt-2">
                  {getDaysText(daysSincePrevious)} • {previousEvent.gallons && previousEvent.total_amount ? 
                    `${(previousEvent.total_amount / previousEvent.gallons).toFixed(2)}/gal` : 
                    'No price data'}
                </Text>
              )}
            </div>
          </Link>
        )}

        {/* Next Event */}
        {nextEvent && (
          <Link href={`/events/${nextEvent.id}`}>
            <div className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors cursor-pointer">
              <Flex className="items-start justify-between mb-2">
                <div>
                  <Text className="text-xs text-gray-500">Next Fill-Up →</Text>
                  <Text className="text-sm font-semibold text-gray-900 mt-0.5">
                    {nextEvent.station_name || 'Unknown Station'}
                  </Text>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Flex>

              <Flex className="items-center gap-4 text-xs text-gray-600">
                <Flex className="items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(nextEvent.date)}
                </Flex>
                {nextEvent.total_amount && (
                  <Flex className="items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ${nextEvent.total_amount.toFixed(2)}
                  </Flex>
                )}
                {nextEvent.gallons && (
                  <span>{nextEvent.gallons.toFixed(1)} gal</span>
                )}
              </Flex>
            </div>
          </Link>
        )}
      </Stack>
    </Card>
  )
}
