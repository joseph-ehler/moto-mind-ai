/**
 * Calendar Component Types
 * 
 * Centralized type definitions for maintenance scheduling and calendar display
 */

import { LucideIcon } from 'lucide-react'
import { 
  Droplet, 
  RotateCw, 
  ClipboardCheck, 
  OctagonX, 
  Battery, 
  Wind, 
  Droplets, 
  Wrench, 
  AlertTriangle, 
  FileText 
} from 'lucide-react'

export type MaintenanceType = 
  | 'oil_change'
  | 'tire_rotation'
  | 'inspection'
  | 'brake_service'
  | 'battery_check'
  | 'filter_replacement'
  | 'fluid_check'
  | 'general_maintenance'
  | 'recall'
  | 'custom'

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

export interface MaintenanceEvent {
  id: string
  title: string
  description?: string
  type: MaintenanceType
  
  // Date & Time
  startDate: Date
  endDate?: Date
  allDay?: boolean
  
  // Vehicle Association
  vehicleId?: string
  vehicleName?: string
  
  // Maintenance Details
  mileage?: number
  estimatedCost?: number
  serviceProvider?: string
  location?: string
  
  // Recurrence (for future phases)
  isRecurring?: boolean
  recurrence?: {
    frequency: RecurrenceFrequency
    interval: number // e.g., every 3 months
    endDate?: Date
  }
  
  // Status
  status: 'scheduled' | 'completed' | 'cancelled' | 'overdue'
  completedAt?: Date
  
  // Notifications
  reminderEnabled?: boolean
  reminderDays?: number // Days before event
  
  // Metadata
  notes?: string
  createdAt: Date
  updatedAt?: Date
}

export interface CalendarViewProps {
  events: MaintenanceEvent[]
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: MaintenanceEvent) => void
  onEventAdd?: (date: Date) => void
  view?: 'month' | 'week' | 'day' | 'agenda'
  className?: string
}

export interface AddToCalendarOptions {
  event: MaintenanceEvent
  format: 'google' | 'apple' | 'outlook' | 'ics'
}

// Maintenance type configuration
export interface MaintenanceTypeConfig {
  type: MaintenanceType
  label: string
  icon: LucideIcon
  color: string
  defaultIntervalMonths?: number
  defaultIntervalMiles?: number
  description?: string
}

export const MAINTENANCE_TYPES: Record<MaintenanceType, MaintenanceTypeConfig> = {
  oil_change: {
    type: 'oil_change',
    label: 'Oil Change',
    icon: Droplet,
    color: 'blue',
    defaultIntervalMonths: 3,
    defaultIntervalMiles: 3000,
    description: 'Regular oil and filter change'
  },
  tire_rotation: {
    type: 'tire_rotation',
    label: 'Tire Rotation',
    icon: RotateCw,
    color: 'purple',
    defaultIntervalMonths: 6,
    defaultIntervalMiles: 6000,
    description: 'Rotate tires for even wear'
  },
  inspection: {
    type: 'inspection',
    label: 'Inspection',
    icon: ClipboardCheck,
    color: 'green',
    defaultIntervalMonths: 12,
    description: 'State safety inspection'
  },
  brake_service: {
    type: 'brake_service',
    label: 'Brake Service',
    icon: OctagonX,
    color: 'red',
    defaultIntervalMonths: 12,
    description: 'Brake pads and rotor inspection'
  },
  battery_check: {
    type: 'battery_check',
    label: 'Battery Check',
    icon: Battery,
    color: 'yellow',
    defaultIntervalMonths: 6,
    description: 'Battery health check'
  },
  filter_replacement: {
    type: 'filter_replacement',
    label: 'Filter Replacement',
    icon: Wind,
    color: 'cyan',
    defaultIntervalMonths: 12,
    description: 'Air and cabin filter replacement'
  },
  fluid_check: {
    type: 'fluid_check',
    label: 'Fluid Check',
    icon: Droplets,
    color: 'indigo',
    defaultIntervalMonths: 3,
    description: 'Check all fluid levels'
  },
  general_maintenance: {
    type: 'general_maintenance',
    label: 'General Maintenance',
    icon: Wrench,
    color: 'slate',
    defaultIntervalMonths: 6,
    description: 'General service appointment'
  },
  recall: {
    type: 'recall',
    label: 'Recall Service',
    icon: AlertTriangle,
    color: 'orange',
    description: 'Manufacturer recall service'
  },
  custom: {
    type: 'custom',
    label: 'Custom',
    icon: FileText,
    color: 'gray',
    description: 'Custom maintenance item'
  }
}
