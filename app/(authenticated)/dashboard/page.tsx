'use client'

/**
 * Home Page - Clean & Minimal Design
 * 
 * Simple dashboard showing:
 * - Personal greeting
 * - Recent notifications
 * - Vehicle quick access
 * - Quick actions
 */

import React from 'react'
import { useRouter } from 'next/navigation'
import { Container, Section, Stack, Card, Heading, Text, Flex } from '@/components/design-system'
import { 
  Car,
  Bell,
  Wrench,
  FileText,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { AppNavigation } from '@/components/app/AppNavigation'
import { useVehicles } from '@/hooks/useVehicles'

export default function HomePage() {
  const { vehicles } = useVehicles()
  const router = useRouter()
  
  const vehicleList = vehicles || []
  const userName = "Joseph" // Replace with actual user data

  //Mock notifications
  const notifications = [
    {
      id: 1,
      icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
      title: "Oil change recommended",
      description: "Your 2015 Honda Accord is due for service",
      time: "2 days ago",
      type: "warning"
    },
    {
      id: 2,
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      title: "Insurance renewed",
      description: "Your policy has been automatically renewed",
      time: "1 week ago",
      type: "success"
    }
  ]

  return (
    <>
      <AppNavigation />
      
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Stack spacing="xl">
            {/* Greeting Card */}
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0">
              <Section spacing="md">
                <Stack spacing="sm">
                  <Heading level="hero">Hi, {userName}</Heading>
                  <Text className="text-gray-600">
                    {vehicleList.length > 0 
                      ? `You have ${vehicleList.length} ${vehicleList.length === 1 ? 'vehicle' : 'vehicles'}`
                      : 'Welcome to MotoMind'}
                  </Text>
                </Stack>
              </Section>
            </Card>

            {/* Recent Notifications */}
            <Stack spacing="sm">
              <Heading level="subtitle">Recent notifications</Heading>
              
              <Stack spacing="sm">
                {notifications.map((notif) => (
                  <Card 
                    key={notif.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push('/alerts')}
                  >
                    <Section spacing="sm">
                      <Flex align="start" gap="md">
                        <div className="flex-shrink-0 mt-0.5">
                          {notif.icon}
                        </div>
                        <Stack spacing="xs" className="flex-1">
                          <Text className="font-medium">{notif.title}</Text>
                          <Text className="text-sm text-gray-600">{notif.description}</Text>
                          <Flex align="center" gap="xs">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <Text className="text-xs text-gray-500">{notif.time}</Text>
                          </Flex>
                        </Stack>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </Flex>
                    </Section>
                  </Card>
                ))}
              </Stack>

              {notifications.length > 0 && (
                <button 
                  onClick={() => router.push('/alerts')}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors self-start"
                >
                  View all notifications
                </button>
              )}
            </Stack>

            {/* Vehicles Quick Access */}
            {vehicleList.length > 0 && (
              <Stack spacing="sm">
                <Heading level="subtitle">Your vehicles</Heading>
                
                <Stack spacing="sm">
                  {vehicleList.slice(0, 3).map((vehicle: any) => {
                    const displayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                    return (
                      <Card
                        key={vehicle.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                      >
                        <Section spacing="sm">
                          <Flex align="center" justify="between">
                            <Flex align="center" gap="md">
                              <Flex align="center" justify="center" className="w-12 h-12 rounded-full bg-blue-100 flex-shrink-0">
                                <Car className="w-6 h-6 text-blue-600" />
                              </Flex>
                              <Stack spacing="xs">
                                <Text className="font-medium">{displayName}</Text>
                                {vehicle.current_mileage && (
                                  <Text className="text-sm text-gray-600">
                                    {vehicle.current_mileage.toLocaleString()} miles
                                  </Text>
                                )}
                              </Stack>
                            </Flex>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </Flex>
                        </Section>
                      </Card>
                    )
                  })}
                </Stack>

                <button 
                  onClick={() => router.push('/garage')}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors self-start"
                >
                  View all vehicles
                </button>
              </Stack>
            )}

            {/* Quick Actions Grid */}
            <Stack spacing="sm">
              <Heading level="subtitle">Quick actions</Heading>
              
              <div className="grid grid-cols-2 gap-3">
                <QuickActionCard
                  icon={<Car className="w-5 h-5" />}
                  label="Add vehicle"
                  onClick={() => router.push('/test/document-scanner')}
                />
                <QuickActionCard
                  icon={<Bell className="w-5 h-5" />}
                  label="Notifications"
                  onClick={() => router.push('/alerts')}
                />
                <QuickActionCard
                  icon={<Wrench className="w-5 h-5" />}
                  label="Service history"
                  onClick={() => router.push('/garage')}
                />
                <QuickActionCard
                  icon={<FileText className="w-5 h-5" />}
                  label="Documents"
                  onClick={() => router.push('/garage')}
                />
              </div>
            </Stack>
          </Stack>
        </Section>
      </Container>

      {/* Add bottom padding for mobile nav */}
      <div className="h-20 md:h-0" />
    </>
  )
}

/**
 * Quick Action Card Component
 */
function QuickActionCard({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <Section spacing="sm">
        <Stack spacing="sm" className="items-center text-center">
          <Flex align="center" justify="center" className="w-10 h-10 rounded-full bg-gray-100">
            <div className="text-gray-700">
              {icon}
            </div>
          </Flex>
          <Text className="text-sm font-medium">{label}</Text>
        </Stack>
      </Section>
    </Card>
  )
}
