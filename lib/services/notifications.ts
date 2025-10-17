// MotoMind: Roman-Style Notification Engine (Fixed)
// Deterministic, rule-based priority system

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Explicit notification rules (documented, predictable)
export const NOTIFICATION_RULES = {
  urgent: {
    overdueReminderDays: 30,        // due_date < today - 30 days
    overdueMiles: 1000,             // due_miles < currentMiles - 1000
    expiredDocumentDays: 7          // (future) document expired >7 days
  },
  attention: {
    dueSoonDays: 14,                // due_date within 14 days
    dueSoonMiles: 500,              // due_miles within 500 miles
    odoStaleDays: 90                // mileage not updated >90 days
  }
} as const

export type NotificationSeverity = 'urgent' | 'attention' | 'info'

export interface Notification {
  id: string
  vehicleId: string
  vehicleInfo: {
    display_name: string
    make: string
    model: string
  }
  severity: NotificationSeverity
  title: string
  description: string
  ctaLabel: string
  ctaUrl: string
  createdAt: string
  metadata?: Record<string, any>
}

export async function generateNotifications(tenantId: string): Promise<Notification[]> {
  const notifications: Notification[] = []

  try {
    // Get vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, label, make, model')
      .eq('tenant_id', tenantId)

    if (vehiclesError || !vehicles) {
      console.error('Error fetching vehicles:', vehiclesError)
      return []
    }

    // Get current mileage for all vehicles
    const { data: mileageData, error: mileageError } = await supabase
      .from('vehicle_current_mileage')
      .select('vehicle_id, miles, date')
      .in('vehicle_id', vehicles.map(v => v.id))

    if (mileageError) {
      console.error('Error fetching mileage:', mileageError)
    }

    // Get open reminders for all vehicles
    const { data: reminders, error: remindersError } = await supabase
      .from('reminders')
      .select('*')
      .in('vehicle_id', vehicles.map(v => v.id))
      .eq('status', 'open')

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError)
    }

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Create lookup maps
    const mileageMap = new Map(
      (mileageData || []).map(m => [m.vehicle_id, { miles: m.miles, date: m.date }])
    )
    const remindersByVehicle = new Map<string, any[]>()
    ;(reminders || []).forEach(r => {
      if (!remindersByVehicle.has(r.vehicle_id)) {
        remindersByVehicle.set(r.vehicle_id, [])
      }
      remindersByVehicle.get(r.vehicle_id)!.push(r)
    })

    // Process each vehicle
    for (const vehicle of vehicles) {
      const mileageInfo = mileageMap.get(vehicle.id)
      const vehicleReminders = remindersByVehicle.get(vehicle.id) || []

      // Process reminders for this vehicle
      for (const reminder of vehicleReminders) {
        const notification = processReminder(vehicle, reminder, mileageInfo?.miles, todayStr)
        if (notification) {
          notifications.push(notification)
        }
      }

      // Check for stale odometer (attention level)
      if (mileageInfo?.date) {
        const mileageDaysAgo = Math.floor(
          (today.getTime() - new Date(mileageInfo.date).getTime()) / (1000 * 60 * 60 * 24)
        )

        if (mileageDaysAgo > NOTIFICATION_RULES.attention.odoStaleDays) {
          notifications.push({
            id: `stale-odo-${vehicle.id}`,
            vehicleId: vehicle.id,
            vehicleInfo: {
              label: vehicle.display_name,
              make: vehicle.make,
              model: vehicle.model
            },
            severity: 'attention',
            title: `Update odometer for ${getVehicleDisplayName(vehicle)}`,
            description: `Last updated ${mileageDaysAgo} days ago. Update to keep maintenance schedules accurate.`,
            ctaLabel: 'Update odometer',
            ctaUrl: `/vehicles/${vehicle.id}?action=odometer`,
            createdAt: new Date().toISOString(),
            metadata: { type: 'stale_odometer', days_ago: mileageDaysAgo }
          })
        }
      }
    }

    // Sort by severity (urgent first) then by due date
    return notifications.sort((a, b) => {
      const severityOrder = { urgent: 0, attention: 1, info: 2 }
      if (a.severity !== b.severity) {
        return severityOrder[a.severity] - severityOrder[b.severity]
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }).slice(0, 5) // Limit to top 5 notifications (Roman-style)

  } catch (error) {
    console.error('Error generating notifications:', error)
    return []
  }
}

function processReminder(
  vehicle: any, 
  reminder: any, 
  currentMiles: number | undefined, 
  todayStr: string
): Notification | null {
  const today = new Date(todayStr)
  
  // Check date-based urgency
  if (reminder.due_date) {
    const dueDate = new Date(reminder.due_date)
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    // Urgent: overdue by more than threshold
    if (daysUntilDue < -NOTIFICATION_RULES.urgent.overdueReminderDays) {
      return createReminderNotification(vehicle, reminder, 'urgent', 
        `${reminder.title} overdue by ${Math.abs(daysUntilDue)} days`,
        `Complete this ${reminder.category} task to stay compliant.`
      )
    }
    
    // Attention: due soon
    if (daysUntilDue <= NOTIFICATION_RULES.attention.dueSoonDays && daysUntilDue >= 0) {
      return createReminderNotification(vehicle, reminder, 'attention',
        `${reminder.title} due in ${daysUntilDue} days`,
        `Plan ahead to complete this ${reminder.category} task.`
      )
    }
  }

  // Check mileage-based urgency
  if (reminder.due_miles && currentMiles) {
    const milesUntilDue = reminder.due_miles - currentMiles
    
    // Urgent: overdue by mileage
    if (milesUntilDue < -NOTIFICATION_RULES.urgent.overdueMiles) {
      return createReminderNotification(vehicle, reminder, 'urgent',
        `${reminder.title} overdue by ${Math.abs(milesUntilDue).toLocaleString()} miles`,
        `Complete this maintenance to prevent vehicle damage.`
      )
    }
    
    // Attention: due soon by mileage
    if (milesUntilDue <= NOTIFICATION_RULES.attention.dueSoonMiles && milesUntilDue >= 0) {
      return createReminderNotification(vehicle, reminder, 'attention',
        `${reminder.title} due in ${milesUntilDue.toLocaleString()} miles`,
        `Schedule this maintenance soon.`
      )
    }
  }

  return null
}

function createReminderNotification(
  vehicle: any, 
  reminder: any, 
  severity: NotificationSeverity,
  title: string,
  description: string
): Notification {
  return {
    id: `reminder-${reminder.id}`,
    vehicleId: vehicle.id,
    vehicleInfo: {
      label: vehicle.display_name,
      make: vehicle.make,
      model: vehicle.model
    },
    severity,
    title,
    description,
    ctaLabel: getCtaLabel(reminder.category),
    ctaUrl: `/vehicles/${vehicle.id}?reminder=${reminder.id}`,
    createdAt: new Date().toISOString(),
    metadata: { 
      type: 'reminder', 
      reminder_id: reminder.id, 
      category: reminder.category 
    }
  }
}

function getVehicleDisplayName(vehicle: any): string {
  return vehicle.display_name || `${vehicle.make} ${vehicle.model}`
}

function getCtaLabel(category: string): string {
  switch (category) {
    case 'registration':
      return 'Renew registration'
    case 'inspection':
      return 'Schedule inspection'
    case 'emissions':
      return 'Schedule emissions test'
    case 'maintenance':
      return 'Log maintenance'
    default:
      return 'Complete task'
  }
}
