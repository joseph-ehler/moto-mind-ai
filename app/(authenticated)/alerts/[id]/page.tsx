'use client'

/**
 * Alert Detail Page - Clean & Minimal
 * 
 * Detailed view of a single alert/notification
 */

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Section, Stack, Card, Heading, Text, Button, Flex } from '@/components/design-system'
import { 
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Car,
  ExternalLink,
  Calendar,
  Phone,
  MapPin
} from 'lucide-react'
import { AppNavigation } from '@/components/app/AppNavigation'

export default function AlertDetailPage() {
  const params = useParams()
  const router = useRouter()
  const alertId = (params?.id as string) || '1'

  // Mock alert data - in real app, fetch based on alertId
  const alertData: Record<string, any> = {
    '1': {
      type: 'urgent',
      icon: <ShieldAlert className="w-6 h-6 text-red-600" />,
      title: "Airbag recall",
      description: "Your 2015 Honda Accord has an active safety recall",
      time: "2 hours ago",
      vehicleName: "2015 Honda Accord",
      vehicleId: "123",
      details: {
        recallNumber: "NHTSA Campaign Number: 24V-123",
        manufacturer: "Honda",
        component: "Air Bags",
        summary: "Honda is recalling certain 2014-2016 Accord vehicles. The driver's frontal air bag inflator may explode due to propellant degradation occurring after long-term exposure to high absolute humidity, temperature, and temperature cycling.",
        remedy: "Dealers will replace the driver's frontal air bag inflator, free of charge.",
        affected: "Approximately 3.2 million vehicles"
      },
      actions: [
        { label: "Find a dealer", icon: <MapPin className="w-4 h-4" />, onClick: () => console.log('Find dealer') },
        { label: "Schedule service", icon: <Calendar className="w-4 h-4" />, onClick: () => console.log('Schedule') },
        { label: "Call Honda", icon: <Phone className="w-4 h-4" />, onClick: () => console.log('Call') },
        { label: "View NHTSA details", icon: <ExternalLink className="w-4 h-4" />, onClick: () => console.log('NHTSA') }
      ]
    },
    '2': {
      type: 'warning',
      icon: <AlertTriangle className="w-6 h-6 text-orange-600" />,
      title: "Oil change recommended",
      description: "Due in 200 miles based on your driving patterns",
      time: "2 days ago",
      vehicleName: "2015 Honda Accord",
      vehicleId: "123",
      details: {
        currentMileage: "85,234 miles",
        lastService: "85,034 miles",
        recommendation: "Based on your driving patterns and manufacturer recommendations, an oil change is due within the next 200 miles.",
        why: "Regular oil changes help maintain engine performance and longevity. Your vehicle has traveled approximately 3,200 miles since the last oil change."
      },
      actions: [
        { label: "Log service", icon: <Car className="w-4 h-4" />, onClick: () => console.log('Log service') },
        { label: "Schedule appointment", icon: <Calendar className="w-4 h-4" />, onClick: () => console.log('Schedule') },
        { label: "Find service center", icon: <MapPin className="w-4 h-4" />, onClick: () => console.log('Find center') }
      ]
    }
  }

  const alert = alertData[alertId] || alertData['2'] // Default to oil change alert

  const getBgColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'from-red-50 to-red-100 border-red-200'
      case 'warning': return 'from-orange-50 to-orange-100 border-orange-200'
      case 'success': return 'from-green-50 to-green-100 border-green-200'
      case 'info': return 'from-blue-50 to-blue-100 border-blue-200'
      default: return 'from-gray-50 to-gray-100 border-gray-200'
    }
  }

  return (
    <>
      <AppNavigation />
      
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Stack spacing="xl">
            {/* Back Button */}
            <button
              onClick={() => router.push('/alerts')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to notifications</span>
            </button>

            {/* Alert Header Card */}
            <Card className={`bg-gradient-to-br ${getBgColor(alert.type)} border`}>
              <Section spacing="md">
                <Stack spacing="md">
                  {/* Icon & Title */}
                  <Flex align="start" gap="md">
                    <div className="flex-shrink-0">
                      {alert.icon}
                    </div>
                    <Stack spacing="xs" className="flex-1">
                      <Heading level="hero">{alert.title}</Heading>
                      <Text className="text-gray-700">{alert.description}</Text>
                    </Stack>
                  </Flex>

                  {/* Meta Info */}
                  <Flex align="center" gap="md" className="pt-2 border-t border-current/10">
                    <Flex align="center" gap="xs">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <Text className="text-sm text-gray-600">{alert.time}</Text>
                    </Flex>
                    {alert.vehicleName && (
                      <Flex align="center" gap="xs">
                        <Car className="w-4 h-4 text-gray-600" />
                        <button
                          onClick={() => router.push(`/vehicles/${alert.vehicleId}`)}
                          className="text-sm text-gray-700 hover:text-gray-900 font-medium underline"
                        >
                          {alert.vehicleName}
                        </button>
                      </Flex>
                    )}
                  </Flex>
                </Stack>
              </Section>
            </Card>

            {/* Details Section */}
            <Stack spacing="sm">
              <Heading level="subtitle">Details</Heading>
              
              <Card>
                <Section spacing="md">
                  <Stack spacing="md">
                    {Object.entries(alert.details || {}).map(([key, value]) => (
                      <Stack spacing="xs" key={key}>
                        <Text className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Text>
                        <Text className="text-sm text-gray-600 leading-relaxed">
                          {value as string}
                        </Text>
                      </Stack>
                    ))}
                  </Stack>
                </Section>
              </Card>
            </Stack>

            {/* Actions Section */}
            {alert.actions && alert.actions.length > 0 && (
              <Stack spacing="sm">
                <Heading level="subtitle">Actions</Heading>
                
                <Stack spacing="sm">
                  {alert.actions.map((action: any, index: number) => (
                    <Card 
                      key={index}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={action.onClick}
                    >
                      <Section spacing="sm">
                        <Flex align="center" justify="between">
                          <Flex align="center" gap="md">
                            <Flex align="center" justify="center" className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0">
                              <div className="text-gray-700">
                                {action.icon}
                              </div>
                            </Flex>
                            <Text className="font-medium">{action.label}</Text>
                          </Flex>
                          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </Flex>
                      </Section>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            )}

            {/* Dismiss Button */}
            <Button
              variant="outline"
              onClick={() => router.push('/alerts')}
              className="self-center"
            >
              Mark as resolved
            </Button>
          </Stack>
        </Section>
      </Container>

      {/* Add bottom padding for mobile nav */}
      <div className="h-20 md:h-0" />
    </>
  )
}
