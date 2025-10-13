/**
 * EventCard Component
 * 
 * Display a single maintenance event with all relevant details
 */

import { Calendar, Clock, MapPin, DollarSign, Car, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../../primitives/Layout'
import { Button } from '@/components/ui/button'
import { MaintenanceEvent, MAINTENANCE_TYPES } from '../types'
import { formatDate, formatTime, getRelativeTime } from '../utils/dateUtils'

interface EventCardProps {
  event: MaintenanceEvent
  onClick?: () => void
  showActions?: boolean
  compact?: boolean
  className?: string
}

export function EventCard({ 
  event, 
  onClick, 
  showActions = false,
  compact = false,
  className 
}: EventCardProps) {
  const config = MAINTENANCE_TYPES[event.type]
  const IconComponent = config.icon
  
  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left p-3 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-colors",
          className
        )}
      >
        <Flex align="center" gap="sm" className="w-full">
          <IconComponent className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-900">{event.title}</p>
            <p className="text-xs text-blue-700">
              {formatDate(event.startDate, 'short')}
            </p>
          </div>
        </Flex>
      </button>
    )
  }
  
  return (
    <button
      className={cn(
        "w-full text-left border-2 border-blue-200 rounded-lg p-5 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <Stack spacing="md">
        <Flex align="center" gap="md">
          <IconComponent className="w-8 h-8 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-blue-900">{event.title}</h3>
            <p className="text-sm text-blue-700">{config.label}</p>
          </div>
        </Flex>
        
        {/* Details */}
        <Stack spacing="xs" className="text-sm">
          {/* Date & Time */}
          <Flex align="center" gap="xs" className="text-slate-600">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>
              {formatDate(event.startDate, 'long')}
              {!event.allDay && ` at ${formatTime(event.startDate)}`}
            </span>
            <span className="text-xs text-slate-400">
              • {getRelativeTime(event.startDate)}
            </span>
          </Flex>
          
          {/* Vehicle */}
          {event.vehicleName && (
            <Flex align="center" gap="xs" className="text-slate-600">
              <Car className="h-4 w-4 flex-shrink-0" />
              <span>{event.vehicleName}</span>
            </Flex>
          )}
          
          {/* Location */}
          {(event.location || event.serviceProvider) && (
            <Flex align="center" gap="xs" className="text-slate-600">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{event.serviceProvider || event.location}</span>
            </Flex>
          )}
          
          {/* Cost */}
          {event.estimatedCost && (
            <Flex align="center" gap="xs" className="text-slate-600">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span>${event.estimatedCost.toFixed(2)} estimated</span>
            </Flex>
          )}
        </Stack>
        
        {/* Description */}
        {event.description && (
          <p className="text-sm text-slate-600 leading-relaxed">
            {event.description}
          </p>
        )}
        
        {/* Actions */}
        {showActions && (
          <Flex gap="sm" className="pt-2 border-t">
            <Button size="sm" variant="outline">
              View Details
            </Button>
            {event.status === 'scheduled' && (
              <Button size="sm">
                Mark Complete
              </Button>
            )}
          </Flex>
        )}
      </Stack>
    </button>
  )
}

// Import Check and X icons
function Check({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
