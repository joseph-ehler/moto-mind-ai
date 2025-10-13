'use client'

/**
 * Alerts Page - Clean & Minimal
 * 
 * List of all notifications and alerts
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Section, Stack, Card, Heading, Text, Flex } from '@/components/design-system'
import { 
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  Clock,
  ChevronRight,
  Bell,
  X
} from 'lucide-react'
import { AppNavigation } from '@/components/app/AppNavigation'

interface Alert {
  id: string
  type: 'warning' | 'success' | 'info' | 'urgent'
  icon: React.ReactNode
  title: string
  description: string
  time: string
  vehicleName?: string
  read: boolean
}

export default function AlertsPage() {
  const router = useRouter()
  
  // Mock alerts data
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'urgent',
      icon: <ShieldAlert className="w-5 h-5 text-red-600" />,
      title: "Airbag recall",
      description: "Your 2015 Honda Accord has an active safety recall",
      time: "2 hours ago",
      vehicleName: "2015 Honda Accord",
      read: false
    },
    {
      id: '2',
      type: 'warning',
      icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
      title: "Oil change recommended",
      description: "Due in 200 miles based on your driving patterns",
      time: "2 days ago",
      vehicleName: "2015 Honda Accord",
      read: false
    },
    {
      id: '3',
      type: 'info',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      title: "Registration expiring soon",
      description: "Your vehicle registration expires in 85 days",
      time: "1 week ago",
      vehicleName: "2015 Honda Accord",
      read: true
    },
    {
      id: '4',
      type: 'success',
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      title: "Insurance renewed",
      description: "Your policy has been automatically renewed",
      time: "2 weeks ago",
      vehicleName: "2015 Honda Accord",
      read: true
    },
    {
      id: '5',
      type: 'info',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      title: "Tire pressure check",
      description: "Time for your monthly tire pressure check",
      time: "3 weeks ago",
      vehicleName: "2015 Honda Accord",
      read: true
    }
  ])

  const unreadCount = alerts.filter(a => !a.read).length
  const hasAlerts = alerts.length > 0

  const handleAlertClick = (alertId: string) => {
    // Mark as read
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a))
    // Navigate to detail
    router.push(`/alerts/${alertId}`)
  }

  const handleDismiss = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-50 border-l-4 border-l-red-500'
      case 'warning': return 'bg-orange-50 border-l-4 border-l-orange-500'
      case 'success': return 'bg-green-50 border-l-4 border-l-green-500'
      case 'info': return 'bg-blue-50 border-l-4 border-l-blue-500'
      default: return 'bg-gray-50'
    }
  }

  return (
    <>
      <AppNavigation />
      
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Stack spacing="xl">
            {/* Header */}
            <Stack spacing="sm">
              <Flex align="center" justify="between">
                <Heading level="hero">Notifications</Heading>
                {unreadCount > 0 && (
                  <Flex align="center" justify="center" className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-medium">
                    {unreadCount}
                  </Flex>
                )}
              </Flex>
              <Text className="text-gray-600">
                {hasAlerts 
                  ? unreadCount > 0 
                    ? `You have ${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}`
                    : 'All caught up!'
                  : 'No notifications yet'}
              </Text>
            </Stack>

            {/* Alerts List or Empty State */}
            {hasAlerts ? (
              <Stack spacing="sm">
                {alerts.map((alert) => (
                  <Card 
                    key={alert.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${getAlertColor(alert.type)} ${!alert.read ? 'shadow-sm' : ''}`}
                    onClick={() => handleAlertClick(alert.id)}
                  >
                    <Section spacing="sm">
                      <Flex align="start" gap="md">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {alert.icon}
                        </div>

                        {/* Content */}
                        <Stack spacing="xs" className="flex-1 min-w-0">
                          <Flex align="start" justify="between" gap="sm">
                            <Text className={`font-medium ${!alert.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {alert.title}
                            </Text>
                            {!alert.read && (
                              <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                            )}
                          </Flex>
                          
                          <Text className="text-sm text-gray-600">
                            {alert.description}
                          </Text>
                          
                          {alert.vehicleName && (
                            <Text className="text-xs text-gray-500">
                              {alert.vehicleName}
                            </Text>
                          )}
                          
                          <Flex align="center" gap="xs">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <Text className="text-xs text-gray-500">{alert.time}</Text>
                          </Flex>
                        </Stack>

                        {/* Actions */}
                        <Flex align="center" gap="xs" className="flex-shrink-0">
                          <button
                            onClick={(e) => handleDismiss(alert.id, e)}
                            className="p-1 hover:bg-white/50 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </button>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </Flex>
                      </Flex>
                    </Section>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Card>
                <Section spacing="xl">
                  <Stack spacing="xl" className="items-center text-center">
                    <Flex align="center" justify="center" className="w-24 h-24 rounded-full bg-gray-100">
                      <Bell className="w-12 h-12 text-gray-400" />
                    </Flex>
                    
                    <Stack spacing="sm" className="max-w-prose">
                      <Heading level="title">No notifications</Heading>
                      <Text className="text-gray-600">
                        You're all caught up! We'll notify you when something needs your attention.
                      </Text>
                    </Stack>
                  </Stack>
                </Section>
              </Card>
            )}
          </Stack>
        </Section>
      </Container>

      {/* Add bottom padding for mobile nav */}
      <div className="h-20 md:h-0" />
    </>
  )
}
