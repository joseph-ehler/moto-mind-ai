/**
 * Complete Modal System Showcase
 * 
 * Demonstrates all modal types and internal components
 * Built using the mandatory MotoMind Design System foundation
 */

import React, { useState } from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  Grid,
  Heading,
  Text,
  BaseCard,
  SimpleFormModal,
  BlockFormModal,
  FullWidthModal,
  AlertModalSystem,
  ConfirmationModalSystem,
  ModalFormField,
  ModalSectionConfig
} from '@/components/design-system'
import { Layers, Pencil, Car, Camera, Plus } from 'lucide-react'

export default function CompleteModalShowcasePage() {
  const [simpleModalOpen, setSimpleModalOpen] = useState(false)
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [fullWidthModalOpen, setFullWidthModalOpen] = useState(false)
  const [alertModalOpen, setAlertModalOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [dangerousModalOpen, setDangerousModalOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    note: '',
    vin: '',
    year: '',
    make: '',
    model: '',
    garage: ''
  })

  const handleSimpleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    setSimpleModalOpen(false)
    alert('Note saved!')
  }

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    setBlockModalOpen(false)
    alert('Vehicle saved!')
  }

  const handleFullWidthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    setFullWidthModalOpen(false)
    alert('Image processed!')
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setConfirmModalOpen(false)
    alert('Confirmed!')
  }

  const handleDangerous = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setDangerousModalOpen(false)
    alert('Deleted!')
  }

  // Block form sections
  const blockSections: ModalSectionConfig[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Essential vehicle details',
      content: (
        <Stack spacing="md">
          <ModalFormField label="VIN" required>
            <input
              type="text"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="1HGBH41JXMN109186"
            />
          </ModalFormField>
          <Grid columns={3} gap="md">
            <ModalFormField label="Year" required>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="2024"
              />
            </ModalFormField>
            <ModalFormField label="Make" required>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Toyota"
              />
            </ModalFormField>
            <ModalFormField label="Model" required>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Camry"
              />
            </ModalFormField>
          </Grid>
        </Stack>
      )
    },
    {
      id: 'location',
      title: 'Garage Location',
      description: 'Where is this vehicle stored?',
      content: (
        <ModalFormField label="Garage" hint="Select or create a garage">
          <select
            value={formData.garage}
            onChange={(e) => setFormData({ ...formData, garage: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="">Select garage...</option>
            <option value="home">Home Garage</option>
            <option value="work">Work Parking</option>
            <option value="storage">Storage Unit</option>
          </select>
        </ModalFormField>
      )
    }
  ]

  return (
    <>
      <Head>
        <title>Complete Modal System - MotoMind Design System</title>
        <meta name="description" content="Complete modal system with internal components" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Container size="lg" useCase="data_tables" override={{ reason: "Wide showcase", approvedBy: "Design System" }}>
          <Section spacing="xl">
            <Stack spacing="xl">
              
              {/* Hero */}
              <div className="text-center py-16">
                <Layers className="w-16 h-16 mx-auto mb-6 text-primary" />
                <Heading level="hero">Complete Modal System</Heading>
                <Text size="xl" className="mt-6 text-gray-600 max-w-3xl mx-auto">
                  Comprehensive modal system with standardized internal components.
                  Consistent design language across all modal types.
                </Text>
              </div>

              {/* Simple Form Modal */}
              <Stack spacing="lg">
                <Heading level="title">1. Simple Form Modal</Heading>
                <Text>
                  Quick edits, single-purpose forms. Uses ModalFormField for consistency.
                </Text>
                <button
                  onClick={() => setSimpleModalOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium w-fit"
                >
                  Open Simple Form
                </button>
              </Stack>

              {/* Block Form Modal */}
              <Stack spacing="lg">
                <Heading level="title">2. Block Form Modal (Most Common)</Heading>
                <Text>
                  2-5 sections with flat design (no nested cards). Uses ModalSection for structure.
                </Text>
                <button
                  onClick={() => setBlockModalOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium w-fit"
                >
                  Open Block Form (2 sections)
                </button>
              </Stack>

              {/* Full Width Modal */}
              <Stack spacing="lg">
                <Heading level="title">3. Full Width Modal</Heading>
                <Text>
                  Rich content, images, split layouts. Uses ModalContent with custom layouts.
                </Text>
                <button
                  onClick={() => setFullWidthModalOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium w-fit"
                >
                  Open Full Width
                </button>
              </Stack>

              {/* Alert Modal */}
              <Stack spacing="lg">
                <Heading level="title">4. Alert Modal</Heading>
                <Text>
                  Contextual alerts with variants. Uses ModalAlert internally.
                </Text>
                <Grid columns={4} gap="md">
                  <button
                    onClick={() => setAlertModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
                  >
                    Info Alert
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium">
                    Success Alert
                  </button>
                  <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium">
                    Warning Alert
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium">
                    Error Alert
                  </button>
                </Grid>
              </Stack>

              {/* Confirmation Modal */}
              <Stack spacing="lg">
                <Heading level="title">5. Confirmation Modal</Heading>
                <Text>
                  Simple yes/no decisions with dangerous variant.
                </Text>
                <Grid columns={2} gap="md">
                  <button
                    onClick={() => setConfirmModalOpen(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                  >
                    Standard Confirmation
                  </button>
                  <button
                    onClick={() => setDangerousModalOpen(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium"
                  >
                    Dangerous Action
                  </button>
                </Grid>
              </Stack>

              {/* Internal Components */}
              <BaseCard elevation="medium" border="accent" padding="lg">
                <Stack spacing="md">
                  <Heading level="title">📦 Internal Components</Heading>
                  <Text>
                    Standardized building blocks used across all modals:
                  </Text>
                  <Grid columns={2} gap="md">
                    <div>
                      <Text className="font-semibold">ModalHeader</Text>
                      <Text size="sm" className="text-gray-600">Icon + title + description</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">ModalContent</Text>
                      <Text size="sm" className="text-gray-600">Scrollable content area</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">ModalSection</Text>
                      <Text size="sm" className="text-gray-600">Flat section with divider</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">ModalFormField</Text>
                      <Text size="sm" className="text-gray-600">Label + input + error</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">ModalActions</Text>
                      <Text size="sm" className="text-gray-600">Footer buttons</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">ModalAlert</Text>
                      <Text size="sm" className="text-gray-600">Contextual feedback</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">ModalDivider</Text>
                      <Text size="sm" className="text-gray-600">Section separator</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">ModalEmptyState</Text>
                      <Text size="sm" className="text-gray-600">Empty sections</Text>
                    </div>
                  </Grid>
                </Stack>
              </BaseCard>

              {/* Design System Integration */}
              <BaseCard elevation="medium" padding="lg">
                <Stack spacing="md">
                  <Heading level="title">✅ Design System Integration</Heading>
                  <Grid columns={2} gap="md">
                    <div>
                      <Text className="font-semibold">Z-Index</Text>
                      <Text size="sm" className="text-gray-600">Uses zIndex.modal (1300)</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">Focus Ring</Text>
                      <Text size="sm" className="text-gray-600">focusRing.default on modals</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">Interaction States</Text>
                      <Text size="sm" className="text-gray-600">Hover/disabled from tokens</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">Spacing</Text>
                      <Text size="sm" className="text-gray-600">Consistent padding/gaps</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">Typography</Text>
                      <Text size="sm" className="text-gray-600">Heading + Text components</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">Accessibility</Text>
                      <Text size="sm" className="text-gray-600">ESC, focus trap, scroll lock</Text>
                    </div>
                  </Grid>
                </Stack>
              </BaseCard>

            </Stack>
          </Section>
        </Container>
      </div>

      {/* Modal Instances */}
      <SimpleFormModal
        isOpen={simpleModalOpen}
        onClose={() => setSimpleModalOpen(false)}
        onSubmit={handleSimpleSubmit}
        title="Add Note"
        description="Add a quick note to this vehicle"
        icon={<Pencil className="w-6 h-6" />}
        iconColor="blue"
        submitLabel="Save Note"
        isLoading={isLoading}
      >
        <ModalFormField
          label="Note"
          required
          hint="Enter a helpful note for this vehicle"
        >
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            rows={4}
            placeholder="Enter your note..."
          />
        </ModalFormField>
      </SimpleFormModal>

      <BlockFormModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        onSubmit={handleBlockSubmit}
        title="Edit Vehicle"
        description="Update vehicle information"
        icon={<Car className="w-6 h-6" />}
        iconColor="blue"
        sections={blockSections}
        submitLabel="Save Changes"
        isLoading={isLoading}
      />

      <FullWidthModal
        isOpen={fullWidthModalOpen}
        onClose={() => setFullWidthModalOpen(false)}
        onSubmit={handleFullWidthSubmit}
        title="Process Dashboard Image"
        description="Review and confirm extracted data"
        icon={<Camera className="w-6 h-6" />}
        iconColor="purple"
        submitLabel="Confirm & Save"
        secondaryAction={{
          label: "Retry Scan",
          onClick: () => alert('Retrying scan...')
        }}
        isLoading={isLoading}
      >
        <Grid columns={2} gap="lg">
          <div>
            <Text className="font-semibold mb-3">Captured Image</Text>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
          </div>
          <div>
            <Text className="font-semibold mb-3">Extracted Data</Text>
            <Stack spacing="md">
              <ModalFormField label="Mileage">
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="125,432"
                />
              </ModalFormField>
              <ModalFormField label="Fuel Level">
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="3/4 tank"
                />
              </ModalFormField>
            </Stack>
          </div>
        </Grid>
      </FullWidthModal>

      <AlertModalSystem
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onConfirm={() => {
          alert('Alert confirmed!')
          setAlertModalOpen(false)
        }}
        title="Important Information"
        description="This is an informational alert. Please review the details carefully."
        variant="info"
        confirmLabel="Got it"
        isLoading={isLoading}
      />

      <ConfirmationModalSystem
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirm}
        title="Confirm Action"
        description="Are you sure you want to proceed with this action?"
        confirmLabel="Confirm"
        isLoading={isLoading}
      />

      <ConfirmationModalSystem
        isOpen={dangerousModalOpen}
        onClose={() => setDangerousModalOpen(false)}
        onConfirm={handleDangerous}
        title="Delete Vehicle"
        description="This will permanently delete this vehicle and all its history. This action cannot be undone."
        confirmLabel="Delete Vehicle"
        isDangerous
        isLoading={isLoading}
      />
    </>
  )
}
