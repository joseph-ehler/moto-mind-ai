'use client'

import { Card, Stack, Heading } from '@/components/design-system'
import { RelatedFillUpCard } from './RelatedFillUpCard'

interface RelatedEvent {
  id: string
  date: string
  vendor: string | null
  total_amount: number | null
  gallons: number | null
  miles: number | null
  display_summary?: string | null
}

interface RelatedEventsV2Props {
  currentEvent: {
    total_amount: number
    gallons: number
    miles?: number | null
    date: string
  }
  previousEvent: RelatedEvent | null
  nextEvent: RelatedEvent | null
}

const calculateDaysBetween = (date1: string, date2: string) => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const calculateMPG = (milesDriven: number, gallons: number) => {
  if (gallons <= 0 || milesDriven <= 0) return undefined
  return milesDriven / gallons
}

export function RelatedEventsV2({ 
  currentEvent, 
  previousEvent, 
  nextEvent 
}: RelatedEventsV2Props) {
  if (!previousEvent && !nextEvent) return null

  // Calculate metrics for previous fill-up
  const previousMilesDriven = previousEvent && currentEvent.miles && previousEvent.miles
    ? currentEvent.miles - previousEvent.miles
    : undefined

  const previousMPG = previousMilesDriven && previousEvent?.gallons
    ? calculateMPG(previousMilesDriven, previousEvent.gallons)
    : undefined

  const daysSincePrevious = previousEvent
    ? calculateDaysBetween(currentEvent.date, previousEvent.date)
    : undefined

  // Calculate metrics for next fill-up
  const nextMilesDriven = nextEvent && nextEvent.miles && currentEvent.miles
    ? nextEvent.miles - currentEvent.miles
    : undefined

  const nextMPG = nextMilesDriven && currentEvent.gallons
    ? calculateMPG(nextMilesDriven, currentEvent.gallons)
    : undefined

  const daysUntilNext = nextEvent
    ? calculateDaysBetween(currentEvent.date, nextEvent.date)
    : undefined

  return (
    <Card className="overflow-hidden border-2 border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          🔗 Related Fill-Ups
        </h3>
      </div>

      <Stack spacing="md" className="p-4">
        {/* Previous Event */}
        {previousEvent && (
          <RelatedFillUpCard
            fillUp={{
              id: previousEvent.id,
              date: previousEvent.date,
              vendor: previousEvent.vendor || 'Station not recorded',
              total_amount: previousEvent.total_amount || 0,
              gallons: previousEvent.gallons || 0,
              miles: previousEvent.miles,
              display_summary: previousEvent.display_summary,
            }}
            currentFillUp={{
              total_amount: currentEvent.total_amount,
              gallons: currentEvent.gallons,
              miles: currentEvent.miles,
            }}
            direction="previous"
            milesDriven={previousMilesDriven}
            calculatedMPG={previousMPG}
            daysBetween={daysSincePrevious}
          />
        )}

        {/* Next Event */}
        {nextEvent && (
          <RelatedFillUpCard
            fillUp={{
              id: nextEvent.id,
              date: nextEvent.date,
              vendor: nextEvent.vendor || 'Station not recorded',
              total_amount: nextEvent.total_amount || 0,
              gallons: nextEvent.gallons || 0,
              miles: nextEvent.miles,
              display_summary: nextEvent.display_summary,
            }}
            currentFillUp={{
              total_amount: currentEvent.total_amount,
              gallons: currentEvent.gallons,
              miles: currentEvent.miles,
            }}
            direction="next"
            milesDriven={nextMilesDriven}
            calculatedMPG={nextMPG}
            daysBetween={daysUntilNext}
          />
        )}
      </Stack>
    </Card>
  )
}
