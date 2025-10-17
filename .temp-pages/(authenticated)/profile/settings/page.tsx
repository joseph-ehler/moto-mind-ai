'use client'

/**
 * Profile Settings Page - Clean & Minimal
 * 
 * Edit personal information and preferences
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Section, Stack, Card, Heading, Text, Button, Flex } from '@/components/design-system'
import { Input } from '@/components/design-system'
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Save
} from 'lucide-react'
import { AppNavigation } from '@/components/app/AppNavigation'

export default function ProfileSettingsPage() {
  const router = useRouter()
  
  // Mock user data
  const [formData, setFormData] = useState({
    firstName: "Joseph",
    lastName: "Ehler",
    email: "joseph@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102"
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    router.push('/profile')
  }

  return (
    <>
      <AppNavigation />
      
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Stack spacing="xl">
            {/* Back Button */}
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to account</span>
            </button>

            {/* Header */}
            <Stack spacing="sm">
              <Heading level="hero">Personal information</Heading>
              <Text className="text-gray-600">
                Update your personal details
              </Text>
            </Stack>

            {/* Personal Details Section */}
            <Stack spacing="sm">
              <Heading level="subtitle">Basic information</Heading>
              
              <Card>
                <Section spacing="md">
                  <Stack spacing="md">
                    {/* First Name */}
                    <Stack spacing="xs">
                      <label className="text-sm font-medium text-gray-700">
                        First name
                      </label>
                      <Input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        placeholder="First name"
                      />
                    </Stack>

                    {/* Last Name */}
                    <Stack spacing="xs">
                      <label className="text-sm font-medium text-gray-700">
                        Last name
                      </label>
                      <Input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        placeholder="Last name"
                      />
                    </Stack>

                    {/* Email */}
                    <Stack spacing="xs">
                      <label className="text-sm font-medium text-gray-700">
                        Email address
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="Email address"
                      />
                    </Stack>

                    {/* Phone */}
                    <Stack spacing="xs">
                      <label className="text-sm font-medium text-gray-700">
                        Phone number
                      </label>
                      <Input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="Phone number"
                      />
                    </Stack>
                  </Stack>
                </Section>
              </Card>
            </Stack>

            {/* Address Section */}
            <Stack spacing="sm">
              <Heading level="subtitle">Address</Heading>
              
              <Card>
                <Section spacing="md">
                  <Stack spacing="md">
                    {/* Street Address */}
                    <Stack spacing="xs">
                      <label className="text-sm font-medium text-gray-700">
                        Street address
                      </label>
                      <Input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="Street address"
                      />
                    </Stack>

                    {/* City */}
                    <Stack spacing="xs">
                      <label className="text-sm font-medium text-gray-700">
                        City
                      </label>
                      <Input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="City"
                      />
                    </Stack>

                    {/* State & Zip */}
                    <div className="grid grid-cols-2 gap-3">
                      <Stack spacing="xs">
                        <label className="text-sm font-medium text-gray-700">
                          State
                        </label>
                        <Input
                          type="text"
                          value={formData.state}
                          onChange={(e) => handleChange('state', e.target.value)}
                          placeholder="State"
                        />
                      </Stack>
                      <Stack spacing="xs">
                        <label className="text-sm font-medium text-gray-700">
                          ZIP code
                        </label>
                        <Input
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => handleChange('zipCode', e.target.value)}
                          placeholder="ZIP code"
                        />
                      </Stack>
                    </div>
                  </Stack>
                </Section>
              </Card>
            </Stack>

            {/* Action Buttons */}
            <Flex gap="sm" className="pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/profile')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1"
              >
                <Flex align="center" justify="center" gap="xs">
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Save changes'}</span>
                </Flex>
              </Button>
            </Flex>
          </Stack>
        </Section>
      </Container>

      {/* Add bottom padding for mobile nav */}
      <div className="h-20 md:h-0" />
    </>
  )
}
