'use client'

/**
 * Vehicle Service History Page - Complete Timeline
 * 
 * Comprehensive view of all service records, maintenance, and repairs
 */

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Section, Stack, Card, Heading, Text, Flex, Button } from '@/components/design-system'
import { 
  ArrowLeft,
  Wrench,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  Filter,
  Download,
  Search
} from 'lucide-react'
import { AppNavigation } from '@/components/app/AppNavigation'

type ServiceRecord = {
  id: string
  type: string
  category: 'maintenance' | 'repair' | 'inspection' | 'modification'
  date: string
  mileage: number
  cost: number
  location: string
  description: string
  notes?: string
}

export default function VehicleHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = (params?.id as string) || '123'

  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock vehicle data
  const vehicle = {
    id: vehicleId,
    year: 2015,
    make: 'Honda',
    model: 'Accord',
    trim: 'EX-L',
    vin: '1HGCR2F3XFA123456'
  }

  const displayName = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`

  // Mock service history - in production, fetch from API
  const serviceHistory: ServiceRecord[] = [
    {
      id: '1',
      type: 'Oil Change',
      category: 'maintenance',
      date: 'Dec 15, 2024',
      mileage: 85234,
      cost: 45.99,
      location: 'Quick Lube Plus',
      description: 'Full synthetic oil change with filter replacement'
    },
    {
      id: '2',
      type: 'Tire Rotation',
      category: 'maintenance',
      date: 'Nov 3, 2024',
      mileage: 82100,
      cost: 35.00,
      location: 'Honda Service Center',
      description: 'Standard tire rotation and balance check',
      notes: 'Front tires showing slight wear'
    },
    {
      id: '3',
      type: 'Brake Pad Replacement',
      category: 'repair',
      date: 'Sep 20, 2024',
      mileage: 78500,
      cost: 425.00,
      location: 'Brake Masters',
      description: 'Replaced front brake pads and resurfaced rotors',
      notes: 'Rear brakes still have 40% life remaining'
    },
    {
      id: '4',
      type: 'Annual Inspection',
      category: 'inspection',
      date: 'Aug 5, 2024',
      mileage: 75200,
      cost: 29.99,
      location: 'State Inspection Station',
      description: 'Annual safety and emissions inspection - PASSED'
    },
    {
      id: '5',
      type: 'Air Filter Replacement',
      category: 'maintenance',
      date: 'Jun 12, 2024',
      mileage: 72000,
      cost: 52.50,
      location: 'Honda Service Center',
      description: 'Replaced engine air filter and cabin air filter'
    },
    {
      id: '6',
      type: 'Battery Replacement',
      category: 'repair',
      date: 'Apr 8, 2024',
      mileage: 68900,
      cost: 189.99,
      location: 'AutoZone',
      description: 'Replaced dead battery with new Honda OEM battery',
      notes: 'Old battery was 5 years old'
    },
    {
      id: '7',
      type: 'Transmission Service',
      category: 'maintenance',
      date: 'Feb 22, 2024',
      mileage: 65000,
      cost: 198.00,
      location: 'Honda Service Center',
      description: 'CVT transmission fluid change and filter replacement',
      notes: 'Recommended every 30,000 miles'
    },
    {
      id: '8',
      type: 'Coolant Flush',
      category: 'maintenance',
      date: 'Dec 10, 2023',
      mileage: 60000,
      cost: 125.00,
      location: 'Honda Service Center',
      description: 'Complete coolant system flush and refill'
    }
  ]

  const filteredHistory = serviceHistory.filter(record => {
    const matchesCategory = filterCategory === 'all' || record.category === filterCategory
    const matchesSearch = record.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const totalSpent = serviceHistory.reduce((sum, record) => sum + record.cost, 0)
  const categories = [
    { id: 'all', label: 'All Records', count: serviceHistory.length },
    { id: 'maintenance', label: 'Maintenance', count: serviceHistory.filter(r => r.category === 'maintenance').length },
    { id: 'repair', label: 'Repairs', count: serviceHistory.filter(r => r.category === 'repair').length },
    { id: 'inspection', label: 'Inspections', count: serviceHistory.filter(r => r.category === 'inspection').length }
  ]

  const getCategoryColor = (category: ServiceRecord['category']) => {
    switch (category) {
      case 'maintenance':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'repair':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'inspection':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'modification':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
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
              onClick={() => router.push(`/vehicles/${vehicleId}`)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to vehicle</span>
            </button>

            {/* Hero Section */}
            <Card className="bg-purple-50 border-purple-100">
              <Section spacing="lg">
                <Stack spacing="md">
                  <Stack spacing="sm">
                    <Heading level="hero">Service History</Heading>
                    <Text className="text-gray-600">{displayName}</Text>
                  </Stack>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-white border-gray-200">
                      <Section spacing="sm">
                        <Stack spacing="sm">
                          <Text className="text-sm text-gray-600">Total Records</Text>
                          <Text className="text-2xl font-bold text-gray-900">{serviceHistory.length}</Text>
                        </Stack>
                      </Section>
                    </Card>
                    <Card className="bg-white border-gray-200">
                      <Section spacing="sm">
                        <Stack spacing="sm">
                          <Text className="text-sm text-gray-600">Total Spent</Text>
                          <Text className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(2)}</Text>
                        </Stack>
                      </Section>
                    </Card>
                    <Card className="bg-white border-gray-200">
                      <Section spacing="sm">
                        <Stack spacing="sm">
                          <Text className="text-sm text-gray-600">Last Service</Text>
                          <Text className="text-2xl font-bold text-gray-900">{serviceHistory[0]?.date}</Text>
                        </Stack>
                      </Section>
                    </Card>
                  </div>
                </Stack>
              </Section>
            </Card>

            {/* Filters & Search */}
            <Card>
              <Section spacing="md">
                <Stack spacing="md">
                  {/* Category Filter Tabs */}
                  <Flex align="center" gap="sm" className="overflow-x-auto pb-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setFilterCategory(cat.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                          filterCategory === cat.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cat.label} ({cat.count})
                      </button>
                    ))}
                  </Flex>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search service records..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </Stack>
              </Section>
            </Card>

            {/* Service Timeline */}
            <Stack spacing="md">
              <Flex align="center" justify="between">
                <Heading level="subtitle">Complete Timeline</Heading>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </Flex>

              {filteredHistory.length === 0 ? (
                <Card className="bg-gray-50">
                  <Section spacing="md">
                    <Stack spacing="sm" className="items-center text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400" />
                      <Text className="text-gray-600">No service records found</Text>
                      <Text className="text-sm text-gray-500">Try adjusting your filters or search query</Text>
                    </Stack>
                  </Section>
                </Card>
              ) : (
                <Stack spacing="sm">
                  {filteredHistory.map((record, index) => (
                    <Card 
                      key={record.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/vehicles/${vehicleId}/history/${record.id}`)}
                    >
                      <Section spacing="md">
                        <Stack spacing="md">
                          {/* Header */}
                          <Flex align="start" justify="between">
                            <Flex align="start" gap="md">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-purple-600" />
                              </div>
                              <Stack spacing="sm">
                                <Flex align="center" gap="sm">
                                  <Heading level="subtitle">{record.type}</Heading>
                                  <div className={`px-2 py-0.5 rounded text-xs font-medium border ${getCategoryColor(record.category)}`}>
                                    {record.category}
                                  </div>
                                </Flex>
                                <Text className="text-sm text-gray-600">{record.description}</Text>
                              </Stack>
                            </Flex>
                            <Text className="text-lg font-bold text-gray-900 flex-shrink-0">${record.cost.toFixed(2)}</Text>
                          </Flex>

                          {/* Details */}
                          <Flex gap="lg" className="flex-wrap">
                            <Flex align="center" gap="sm">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <Text className="text-sm text-gray-600">{record.date}</Text>
                            </Flex>
                            <Flex align="center" gap="sm">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <Text className="text-sm text-gray-600">{record.mileage.toLocaleString()} miles</Text>
                            </Flex>
                            <Flex align="center" gap="sm">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <Text className="text-sm text-gray-600">{record.location}</Text>
                            </Flex>
                          </Flex>

                          {/* Notes */}
                          {record.notes && (
                            <Card className="bg-gray-50 border-gray-200">
                              <Section spacing="sm">
                                <Text className="text-sm text-gray-700">
                                  <span className="font-medium">Notes: </span>
                                  {record.notes}
                                </Text>
                              </Section>
                            </Card>
                          )}
                        </Stack>
                      </Section>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>

            {/* Add Record Button */}
            <Button variant="primary" className="self-start">
              <FileText className="w-4 h-4 mr-2" />
              Add Service Record
            </Button>
          </Stack>
        </Section>
      </Container>

      {/* Add bottom padding for mobile nav */}
      <div className="h-20 md:h-0" />
    </>
  )
}
