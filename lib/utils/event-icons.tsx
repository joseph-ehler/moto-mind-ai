/**
 * Event Type Icons
 * 
 * Visual indicators for different timeline event types
 */

import { 
  Droplet,  // More distinctive than Fuel
  Wrench, 
  Gauge, 
  AlertTriangle, 
  Camera, 
  CircleSlash, 
  Circle,  // For tires
  FileText,
  StickyNote,
  Activity,
  ClipboardCheck,  // For inspections
  Bell  // For recalls
} from 'lucide-react'

export function getEventIcon(type: string) {
  switch (type) {
    case 'fuel':
      return <Droplet className="w-6 h-6" />
    case 'service':
    case 'maintenance':
      return <Wrench className="w-6 h-6" />
    case 'odometer':
      return <Gauge className="w-6 h-6" />
    case 'dashboard_warning':
      return <AlertTriangle className="w-6 h-6" />
    case 'dashboard_snapshot':
      return <Activity className="w-6 h-6" />
    case 'tire_tread':
    case 'tire_pressure':
      return <Circle className="w-6 h-6" />
    case 'damage':
      return <CircleSlash className="w-6 h-6" />
    case 'document':
      return <FileText className="w-6 h-6" />
    case 'inspection':
      return <ClipboardCheck className="w-6 h-6" />
    case 'recall':
      return <Bell className="w-6 h-6" />
    case 'manual':
      return <StickyNote className="w-6 h-6" />
    case 'parking':
      return <Camera className="w-6 h-6" />
    default:
      return <Camera className="w-6 h-6" />
  }
}

export function getEventColor(type: string): string {
  // All icons are neutral gray - color is only used for status, not event type
  return 'text-gray-700 bg-gray-100'
}
