/**
 * DataSourceBadge
 * Shows where data came from (Vision AI, EXIF, GPS, User)
 */

import { Camera, MapPin, Image, User } from 'lucide-react'

export type DataSource = 'vision_ai' | 'exif' | 'gps' | 'user' | 'api'

interface DataSourceBadgeProps {
  source: DataSource
  className?: string
}

export function DataSourceBadge({ source, className = '' }: DataSourceBadgeProps) {
  const sourceConfig = {
    vision_ai: {
      icon: Camera,
      label: 'AI Extracted',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    exif: {
      icon: Image,
      label: 'From Photo',
      color: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    gps: {
      icon: MapPin,
      label: 'From GPS',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
    user: {
      icon: User,
      label: 'User Entered',
      color: 'bg-gray-100 text-gray-700 border-gray-200',
    },
    api: {
      icon: MapPin,
      label: 'From API',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
  }

  const config = sourceConfig[source]
  const Icon = config.icon

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium
        ${config.color}
        ${className}
      `}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </div>
  )
}
