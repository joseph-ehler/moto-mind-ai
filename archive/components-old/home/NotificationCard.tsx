import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, Info, X } from 'lucide-react'
import type { Notification } from '@/lib/services/notifications'

interface NotificationCardProps {
  notification: Notification
  onDismiss?: (id: string) => void
}

export function NotificationCard({ notification, onDismiss }: NotificationCardProps) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'urgent':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
          badgeVariant: 'destructive' as const
        }
      case 'attention':
        return {
          icon: Clock,
          bgColor: 'bg-amber-50 border-amber-200',
          iconColor: 'text-amber-600',
          badgeVariant: 'secondary' as const
        }
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
          badgeVariant: 'outline' as const
        }
    }
  }

  const config = getSeverityConfig(notification.severity)
  const Icon = config.icon

  const vehicleDisplayName = notification.vehicleInfo.nickname || 
    `${notification.vehicleInfo.year} ${notification.vehicleInfo.make} ${notification.vehicleInfo.model}`

  return (
    <Card className={`${config.bgColor} transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Severity Icon */}
          <div className={`flex-shrink-0 p-2 rounded-full bg-white/80`}>
            <Icon className={`h-4 w-4 ${config.iconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-medium text-gray-900 leading-tight">
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.description}
                </p>
              </div>

              {/* Dismiss Button */}
              {onDismiss && (
                <button
                  onClick={() => onDismiss(notification.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Vehicle Badge */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={config.badgeVariant} className="text-xs">
                {vehicleDisplayName}
              </Badge>
            </div>

            {/* Action Button */}
            <Link href={notification.ctaUrl}>
              <Button 
                size="sm" 
                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white"
              >
                {notification.ctaLabel}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
