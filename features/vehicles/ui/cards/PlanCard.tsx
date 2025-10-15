import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Wrench, 
  Gauge, 
  Fuel, 
  Camera, 
  Plus,
  Calendar,
  MapPin
} from 'lucide-react'

interface Reminder {
  id: string
  title: string
  description?: string
  category: string
  priority: string
  due_date?: string
  due_miles?: number
  status: string
}

interface PlanCardProps {
  vehicleId: string
  vehicleName: string
  currentMileage?: number
  mileageDate?: string
  lastService?: {
    type: string
    date: string
    miles: number
  }
  upcomingReminders: Reminder[]
  onAction: (action: string) => void
}

export function PlanCard({
  vehicleId,
  vehicleName,
  currentMileage,
  mileageDate,
  lastService,
  upcomingReminders,
  onAction
}: PlanCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'log-maintenance':
        return Wrench
      case 'update-odometer':
        return Gauge
      case 'add-fuel':
        return Fuel
      case 'add-photos':
        return Camera
      default:
        return Plus
    }
  }

  const quickActions = [
    { key: 'log-maintenance', label: 'Log maintenance', icon: Wrench },
    { key: 'add-fuel', label: 'Add fuel', icon: Fuel },
    { key: 'update-odometer', label: 'Update odo', icon: Gauge },
    { key: 'add-photos', label: 'Upload doc', icon: Camera }
  ]

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium text-gray-900">
          Here's the plan for {vehicleName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Status Facts */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Facts</h3>
          
          <div className="space-y-2 text-sm">
            {/* Current Mileage */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Current odometer</span>
              <span className="font-medium">
                {currentMileage ? `${currentMileage.toLocaleString()} mi` : 'Not set'}
                {mileageDate && (
                  <span className="text-gray-500 ml-1">
                    ({formatDate(mileageDate)})
                  </span>
                )}
              </span>
            </div>

            {/* Last Service */}
            {lastService && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last service</span>
                <span className="font-medium">
                  {lastService.type} · {formatDate(lastService.date)} @ {lastService.miles.toLocaleString()} mi
                </span>
              </div>
            )}

            {/* Pending Reminders */}
            {upcomingReminders.length > 0 && (
              <div className="flex items-start justify-between">
                <span className="text-gray-600">Pending reminders</span>
                <div className="text-right space-y-1">
                  {upcomingReminders.slice(0, 2).map(reminder => (
                    <div key={reminder.id} className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getPriorityColor(reminder.priority)}`}
                      >
                        {reminder.priority}
                      </Badge>
                      <span className="font-medium text-sm">
                        {reminder.title}
                        {reminder.due_date && (
                          <span className="text-gray-500 ml-1">
                            · {formatDate(reminder.due_date)}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                  {upcomingReminders.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{upcomingReminders.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions (Roman: CTA Strip) */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick actions</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickActions.map(action => {
              const Icon = action.icon
              return (
                <Button
                  key={action.key}
                  variant="outline"
                  size="sm"
                  onClick={() => onAction(action.key)}
                  className="flex flex-col items-center gap-1 h-auto py-3 text-xs"
                >
                  <Icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Roman-style Guidance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-1 bg-blue-100 rounded-full">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-sm">
              <p className="text-blue-900 font-medium mb-1">
                Stay on track
              </p>
              <p className="text-blue-800">
                {upcomingReminders.length > 0 
                  ? "You have reminders coming up. Complete them to keep your vehicle running smoothly."
                  : currentMileage 
                    ? "Create reminders for your preferred maintenance intervals to stay ahead of issues."
                    : "Update your odometer first, then create reminders to track maintenance."
                }
              </p>
              {upcomingReminders.length === 0 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => onAction('create-reminder')}
                  className="text-blue-600 hover:text-blue-800 p-0 h-auto mt-1"
                >
                  Create your first reminder →
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
