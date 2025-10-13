'use client'

/**
 * Vehicles Page - Clean & Minimal
 * 
 * Simple list of vehicles with quick access
 */

import React from 'react'
import { useRouter } from 'next/navigation'
import { Container, Section, Stack, Card, Heading, Text, Button, Flex } from '@/components/design-system'
import { Car, Plus, ChevronRight, AlertCircle } from 'lucide-react'
import { useVehicles } from '@/hooks/useVehicles'
import { AppNavigation } from '@/components/app/AppNavigation'

export default function VehiclesPage() {
  const { vehicles, isLoading, error } = useVehicles()
  const router = useRouter()

  if (isLoading) {
    return (
      <>
        <AppNavigation />
        <Container size="md" useCase="articles">
          <Section spacing="lg">
            <Stack spacing="lg">
              <Heading level="hero">Vehicles</Heading>
              <Text>Loading your vehicles...</Text>
            </Stack>
          </Section>
        </Container>
      </>
    )
  }

  if (error) {
    return (
      <>
        <AppNavigation />
        <Container size="md" useCase="articles">
          <Section spacing="lg">
            <Stack spacing="lg">
              <Heading level="hero">Vehicles</Heading>
              <Card>
                <Section spacing="md">
                  <Flex align="center" gap="md" justify="center" className="text-center">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <Text>Error loading vehicles. Please try again.</Text>
                  </Flex>
                </Section>
              </Card>
            </Stack>
          </Section>
        </Container>
      </>
    )
  }

  const vehicleList = vehicles || []
  const hasVehicles = vehicleList.length > 0

  return (
    <>
      <AppNavigation />
      
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Stack spacing="xl">
            {/* Header */}
            <Flex justify="between" align="center">
              <Heading level="hero">Vehicles</Heading>
              <Button 
                variant="primary"
                size="sm"
                onClick={() => router.push('/test/document-scanner')}
              >
                <Flex align="center" gap="xs">
                  <Plus className="w-4 h-4" />
                  <span>Add vehicle</span>
                </Flex>
              </Button>
            </Flex>

            {/* Vehicle List or Empty State */}
            {hasVehicles ? (
              <Stack spacing="sm">
                {vehicleList.map((vehicle: any) => {
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
                            {/* Vehicle Icon/Image */}
                            {vehicle.hero_image_url ? (
                              <img 
                                src={vehicle.hero_image_url} 
                                alt={displayName}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <Flex align="center" justify="center" className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0">
                                <Car className="w-8 h-8 text-white" />
                              </Flex>
                            )}
                            
                            {/* Vehicle Info */}
                            <Stack spacing="xs">
                              <Text className="font-medium text-lg">{displayName}</Text>
                              {vehicle.trim && (
                                <Text className="text-sm text-gray-600">
                                  {vehicle.trim}
                                </Text>
                              )}
                              {vehicle.current_mileage && (
                                <Text className="text-sm text-gray-500">
                                  {vehicle.current_mileage.toLocaleString()} miles
                                </Text>
                              )}
                            </Stack>
                          </Flex>
                          
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        </Flex>
                      </Section>
                    </Card>
                  )
                })}
              </Stack>
            ) : (
              <EmptyState router={router} />
            )}
          </Stack>
        </Section>
      </Container>

      {/* Add bottom padding for mobile nav */}
      <div className="h-20 md:h-0" />
    </>
  )
}

/**
 * Empty State Component
 */
function EmptyState({ router }: { router: any }) {
  return (
    <Card>
      <Section spacing="xl">
        <Stack spacing="xl" className="items-center text-center">
          <Flex align="center" justify="center" className="w-24 h-24 rounded-full bg-gray-100">
            <Car className="w-12 h-12 text-gray-400" />
          </Flex>
          
          <Stack spacing="sm" className="max-w-prose">
            <Heading level="title">No vehicles yet</Heading>
            <Text className="text-gray-600">
              Add your first vehicle to get started with maintenance tracking and AI insights.
            </Text>
          </Stack>

          <Button 
            variant="primary"
            onClick={() => router.push('/test/document-scanner')}
          >
            <Flex align="center" gap="xs">
              <Plus className="w-4 h-4" />
              <span>Add your first vehicle</span>
            </Flex>
          </Button>
        </Stack>
      </Section>
    </Card>
  )
}
