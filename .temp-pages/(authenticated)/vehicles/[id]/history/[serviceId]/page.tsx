'use client'

/**
 * Service Record Detail Page
 * 
 * Detailed view of a single service record with edit, photos, receipts
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
  Edit2,
  Trash2,
  Upload,
  Camera,
  Receipt,
  CheckCircle,
  AlertCircle,
  Save
} from 'lucide-react'
import { AppNavigation } from '@/components/app/AppNavigation'

export default function ServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = (params?.id as string) || '123'
  const serviceId = (params?.serviceId as string) || '1'

  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({
    type: '',
    date: '',
    mileage: '',
    cost: '',
    location: '',
    description: '',
    notes: ''
  })

  // Mock vehicle data
  const vehicle = {
    id: vehicleId,
    year: 2015,
    make: 'Honda',
    model: 'Accord',
    trim: 'EX-L',
    vin: '1HGCR2F3XFA123456'
  }

  // Mock service record - in production, fetch from API
  const serviceRecord = {
    id: serviceId,
    type: 'Oil Change',
    category: 'maintenance',
    date: 'Dec 15, 2024',
    mileage: 85234,
    cost: 45.99,
    location: 'Quick Lube Plus',
    address: '123 Main St, Springfield, IL 62701',
    phone: '(555) 123-4567',
    description: 'Full synthetic oil change with filter replacement',
    notes: 'Technician recommended checking air filter at next service. Vehicle running smoothly.',
    partsUsed: [
      { name: 'Synthetic Oil 5W-30', quantity: '5 quarts', cost: 32.50 },
      { name: 'Oil Filter', quantity: '1', cost: 8.99 },
      { name: 'Labor', quantity: '1', cost: 4.50 }
    ],
    technician: 'Mike Johnson',
    nextServiceDue: {
      mileage: 88234,
      date: 'Mar 15, 2025'
    },
    attachments: [
      { id: '1', type: 'receipt', name: 'receipt.pdf', size: '128 KB' },
      { id: '2', type: 'photo', name: 'before.jpg', size: '2.4 MB' }
    ]
  }

  const displayName = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`

  const getCategoryColor = (category: string) => {
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

  const handleEdit = () => {
    setEditedData({
      type: serviceRecord.type,
      date: serviceRecord.date,
      mileage: serviceRecord.mileage.toString(),
      cost: serviceRecord.cost.toString(),
      location: serviceRecord.location,
      description: serviceRecord.description,
      notes: serviceRecord.notes || ''
    })
    setIsEditing(true)
  }

  const handleSave = () => {
    // In production, save to API
    console.log('Saving:', editedData)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this service record?')) {
      // In production, delete via API
      router.push(`/vehicles/${vehicleId}/history`)
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
              onClick={() => router.push(`/vehicles/${vehicleId}/history`)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to history</span>
            </button>

            {/* Header */}
            <Card className="bg-purple-50 border-purple-100">
              <Section spacing="lg">
                <Flex align="start" justify="between">
                  <Stack spacing="sm">
                    <Flex align="center" gap="sm">
                      <Heading level="hero">{serviceRecord.type}</Heading>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(serviceRecord.category)}`}>
                        {serviceRecord.category}
                      </div>
                    </Flex>
                    <Text className="text-gray-600">{displayName}</Text>
                  </Stack>
                  
                  {!isEditing && (
                    <Flex gap="sm">
                      <Button variant="ghost" size="sm" onClick={handleEdit}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </Flex>
                  )}
                </Flex>
              </Section>
            </Card>

            {/* Main Details */}
            {!isEditing ? (
              <Card>
                <Section spacing="lg">
                  <Stack spacing="lg">
                    {/* Key Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Stack spacing="sm">
                        <Flex align="center" gap="sm">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <Text className="text-sm font-medium text-gray-500">Date</Text>
                        </Flex>
                        <Text className="text-lg font-semibold text-gray-900">{serviceRecord.date}</Text>
                      </Stack>

                      <Stack spacing="sm">
                        <Flex align="center" gap="sm">
                          <DollarSign className="w-5 h-5 text-gray-400" />
                          <Text className="text-sm font-medium text-gray-500">Mileage</Text>
                        </Flex>
                        <Text className="text-lg font-semibold text-gray-900">{serviceRecord.mileage.toLocaleString()} miles</Text>
                      </Stack>

                      <Stack spacing="sm">
                        <Flex align="center" gap="sm">
                          <DollarSign className="w-5 h-5 text-gray-400" />
                          <Text className="text-sm font-medium text-gray-500">Total Cost</Text>
                        </Flex>
                        <Text className="text-lg font-semibold text-gray-900">${serviceRecord.cost.toFixed(2)}</Text>
                      </Stack>

                      <Stack spacing="sm">
                        <Flex align="center" gap="sm">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <Text className="text-sm font-medium text-gray-500">Service Location</Text>
                        </Flex>
                        <Text className="text-lg font-semibold text-gray-900">{serviceRecord.location}</Text>
                        <Text className="text-sm text-gray-600">{serviceRecord.address}</Text>
                        <Text className="text-sm text-gray-600">{serviceRecord.phone}</Text>
                      </Stack>
                    </div>

                    {/* Description */}
                    <Stack spacing="sm">
                      <Heading level="subtitle">Service Description</Heading>
                      <Text className="text-gray-700">{serviceRecord.description}</Text>
                    </Stack>

                    {/* Notes */}
                    {serviceRecord.notes && (
                      <Stack spacing="sm">
                        <Heading level="subtitle">Technician Notes</Heading>
                        <Card className="bg-blue-50 border-blue-200">
                          <Section spacing="sm">
                            <Text className="text-gray-700">{serviceRecord.notes}</Text>
                          </Section>
                        </Card>
                      </Stack>
                    )}

                    {/* Technician */}
                    <Stack spacing="sm">
                      <Text className="text-sm text-gray-500">Performed by</Text>
                      <Text className="font-medium text-gray-900">{serviceRecord.technician}</Text>
                    </Stack>
                  </Stack>
                </Section>
              </Card>
            ) : (
              /* Edit Form */
              <Card>
                <Section spacing="lg">
                  <Stack spacing="lg">
                    <Heading level="subtitle">Edit Service Record</Heading>

                    <Stack spacing="md">
                      <Stack spacing="sm">
                        <Text className="text-sm font-medium text-gray-700">Service Type</Text>
                        <input
                          type="text"
                          value={editedData.type}
                          onChange={(e) => setEditedData({ ...editedData, type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </Stack>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Stack spacing="sm">
                          <Text className="text-sm font-medium text-gray-700">Date</Text>
                          <input
                            type="text"
                            value={editedData.date}
                            onChange={(e) => setEditedData({ ...editedData, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </Stack>

                        <Stack spacing="sm">
                          <Text className="text-sm font-medium text-gray-700">Mileage</Text>
                          <input
                            type="number"
                            value={editedData.mileage}
                            onChange={(e) => setEditedData({ ...editedData, mileage: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </Stack>

                        <Stack spacing="sm">
                          <Text className="text-sm font-medium text-gray-700">Cost</Text>
                          <input
                            type="number"
                            step="0.01"
                            value={editedData.cost}
                            onChange={(e) => setEditedData({ ...editedData, cost: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </Stack>

                        <Stack spacing="sm">
                          <Text className="text-sm font-medium text-gray-700">Location</Text>
                          <input
                            type="text"
                            value={editedData.location}
                            onChange={(e) => setEditedData({ ...editedData, location: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </Stack>
                      </div>

                      <Stack spacing="sm">
                        <Text className="text-sm font-medium text-gray-700">Description</Text>
                        <textarea
                          value={editedData.description}
                          onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                      </Stack>

                      <Stack spacing="sm">
                        <Text className="text-sm font-medium text-gray-700">Notes</Text>
                        <textarea
                          value={editedData.notes}
                          onChange={(e) => setEditedData({ ...editedData, notes: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                      </Stack>
                    </Stack>

                    <Flex gap="sm">
                      <Button variant="primary" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="ghost" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </Flex>
                  </Stack>
                </Section>
              </Card>
            )}

            {/* Parts & Labor Breakdown */}
            {!isEditing && (
              <Card>
                <Section spacing="lg">
                  <Stack spacing="md">
                    <Heading level="subtitle">Parts & Labor</Heading>
                    
                    <Stack spacing="sm">
                      {serviceRecord.partsUsed.map((part, index) => (
                        <Flex key={index} justify="between" align="center" className="py-2 border-b border-gray-100 last:border-0">
                          <Stack spacing="sm">
                            <Text className="font-medium text-gray-900">{part.name}</Text>
                            <Text className="text-sm text-gray-600">{part.quantity}</Text>
                          </Stack>
                          <Text className="font-semibold text-gray-900">${part.cost.toFixed(2)}</Text>
                        </Flex>
                      ))}
                      
                      <Flex justify="between" align="center" className="pt-4 border-t-2 border-gray-200">
                        <Text className="font-bold text-gray-900">Total</Text>
                        <Text className="text-xl font-bold text-gray-900">${serviceRecord.cost.toFixed(2)}</Text>
                      </Flex>
                    </Stack>
                  </Stack>
                </Section>
              </Card>
            )}

            {/* Next Service Reminder */}
            {!isEditing && (
              <Card className="bg-green-50 border-green-200">
                <Section spacing="md">
                  <Flex align="start" gap="md">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <Stack spacing="sm">
                      <Heading level="subtitle">Next Service Due</Heading>
                      <Text className="text-gray-700">
                        Next service recommended at <span className="font-semibold">{serviceRecord.nextServiceDue.mileage.toLocaleString()} miles</span> or by <span className="font-semibold">{serviceRecord.nextServiceDue.date}</span>
                      </Text>
                    </Stack>
                  </Flex>
                </Section>
              </Card>
            )}

            {/* Attachments */}
            {!isEditing && (
              <Card>
                <Section spacing="lg">
                  <Stack spacing="md">
                    <Flex align="center" justify="between">
                      <Heading level="subtitle">Attachments</Heading>
                      <Flex gap="sm">
                        <Button variant="ghost" size="sm">
                          <Camera className="w-4 h-4 mr-2" />
                          Add Photo
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Receipt className="w-4 h-4 mr-2" />
                          Add Receipt
                        </Button>
                      </Flex>
                    </Flex>

                    {serviceRecord.attachments.length > 0 ? (
                      <Stack spacing="sm">
                        {serviceRecord.attachments.map((attachment) => (
                          <Card key={attachment.id} className="bg-gray-50 border-gray-200">
                            <Section spacing="sm">
                              <Flex align="center" justify="between">
                                <Flex align="center" gap="sm">
                                  {attachment.type === 'receipt' ? (
                                    <Receipt className="w-5 h-5 text-gray-600" />
                                  ) : (
                                    <Camera className="w-5 h-5 text-gray-600" />
                                  )}
                                  <Stack spacing="sm">
                                    <Text className="font-medium text-gray-900">{attachment.name}</Text>
                                    <Text className="text-sm text-gray-500">{attachment.size}</Text>
                                  </Stack>
                                </Flex>
                                <Button variant="ghost" size="sm">
                                  View
                                </Button>
                              </Flex>
                            </Section>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      <Card className="bg-gray-50 border-gray-200">
                        <Section spacing="md">
                          <Stack spacing="sm" className="items-center text-center py-4">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <Text className="text-sm text-gray-600">No attachments yet</Text>
                          </Stack>
                        </Section>
                      </Card>
                    )}
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
