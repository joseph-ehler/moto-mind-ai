/**
 * Modals Showcase
 * 
 * Built using the mandatory MotoMind Design System foundation
 * Demonstrates all modal variants with live examples
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
  BaseModal,
  ContentModal,
  AlertModal,
  FormModal,
  ConfirmationModal,
  Drawer
} from '@/components/design-system'
import { Layers, AlertCircle } from 'lucide-react'

export default function ModalsShowcasePage() {
  const [baseModalOpen, setBaseModalOpen] = useState(false)
  const [contentModalOpen, setContentModalOpen] = useState(false)
  const [alertModalOpen, setAlertModalOpen] = useState(false)
  const [alertVariant, setAlertVariant] = useState<'info' | 'success' | 'warning' | 'error'>('info')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [dangerousConfirmOpen, setDangerousConfirmOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerPosition, setDrawerPosition] = useState<'left' | 'right'>('right')

  const [formData, setFormData] = useState({ name: '', email: '' })
  const [isLoading, setIsLoading] = useState(false)

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    setFormModalOpen(false)
    alert('Form submitted!')
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setConfirmModalOpen(false)
    alert('Confirmed!')
  }

  const handleDangerousAction = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setDangerousConfirmOpen(false)
    alert('Deleted!')
  }

  return (
    <>
      <Head>
        <title>Modals Showcase - MotoMind Design System</title>
        <meta name="description" content="Comprehensive modal system built on cards and accessibility foundation" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Container size="lg" useCase="data_tables" override={{ reason: "Wide showcase needs space", approvedBy: "Design System" }}>
          <Section spacing="xl">
            <Stack spacing="xl">
              
              {/* Hero */}
              <div className="text-center py-16">
                <Layers className="w-16 h-16 mx-auto mb-6 text-primary" />
                <Heading level="hero">Modals System</Heading>
                <Text size="xl" className="mt-6 text-gray-600 max-w-3xl mx-auto">
                  Comprehensive modal components with z-index management,
                  focus trapping, and keyboard navigation built-in.
                </Text>
              </div>

              {/* Base Modal */}
              <Stack spacing="lg">
                <Heading level="title">Base Modal</Heading>
                <Text>
                  Foundation for all modals. Handles overlay, ESC key, focus trap, and scroll lock.
                </Text>
                
                <Grid columns={3} gap="md">
                  <button
                    onClick={() => setBaseModalOpen(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                  >
                    Open Small Modal (sm)
                  </button>
                  <button
                    onClick={() => setBaseModalOpen(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                  >
                    Open Medium Modal (md)
                  </button>
                  <button
                    onClick={() => setBaseModalOpen(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                  >
                    Open Large Modal (lg)
                  </button>
                </Grid>
              </Stack>

              {/* Content Modal */}
              <Stack spacing="lg">
                <Heading level="title">Content Modal</Heading>
                <Text>
                  Modal with structured header, content, and optional footer.
                </Text>
                
                <button
                  onClick={() => setContentModalOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium w-fit"
                >
                  Open Content Modal
                </button>
              </Stack>

              {/* Alert Modal */}
              <Stack spacing="lg">
                <Heading level="title">Alert Modal</Heading>
                <Text>
                  Uses AlertCard component for contextual feedback.
                </Text>
                
                <Grid columns={2} gap="md" className="lg:grid-cols-4">
                  <button
                    onClick={() => {
                      setAlertVariant('info')
                      setAlertModalOpen(true)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
                  >
                    Info Alert
                  </button>
                  <button
                    onClick={() => {
                      setAlertVariant('success')
                      setAlertModalOpen(true)
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium"
                  >
                    Success Alert
                  </button>
                  <button
                    onClick={() => {
                      setAlertVariant('warning')
                      setAlertModalOpen(true)
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium"
                  >
                    Warning Alert
                  </button>
                  <button
                    onClick={() => {
                      setAlertVariant('error')
                      setAlertModalOpen(true)
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium"
                  >
                    Error Alert
                  </button>
                </Grid>
              </Stack>

              {/* Form Modal */}
              <Stack spacing="lg">
                <Heading level="title">Form Modal</Heading>
                <Text>
                  Form submission with loading states and error handling.
                </Text>
                
                <button
                  onClick={() => setFormModalOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium w-fit"
                >
                  Open Form Modal
                </button>
              </Stack>

              {/* Confirmation Modal */}
              <Stack spacing="lg">
                <Heading level="title">Confirmation Modal</Heading>
                <Text>
                  Simple confirmation dialogs with dangerous action variant.
                </Text>
                
                <Grid columns={2} gap="md">
                  <button
                    onClick={() => setConfirmModalOpen(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                  >
                    Standard Confirmation
                  </button>
                  <button
                    onClick={() => setDangerousConfirmOpen(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium"
                  >
                    Dangerous Action
                  </button>
                </Grid>
              </Stack>

              {/* Drawer */}
              <Stack spacing="lg">
                <Heading level="title">Drawer (Side Panel)</Heading>
                <Text>
                  Slide-in panel from left or right side.
                </Text>
                
                <Grid columns={2} gap="md">
                  <button
                    onClick={() => {
                      setDrawerPosition('left')
                      setDrawerOpen(true)
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                  >
                    Open Left Drawer
                  </button>
                  <button
                    onClick={() => {
                      setDrawerPosition('right')
                      setDrawerOpen(true)
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                  >
                    Open Right Drawer
                  </button>
                </Grid>
              </Stack>

              {/* Features */}
              <BaseCard elevation="medium" border="accent" padding="lg">
                <Stack spacing="md">
                  <Heading level="title">✅ Built-in Features</Heading>
                  <Grid columns={2} gap="md">
                    <div>
                      <Text className="font-semibold">Z-Index Management</Text>
                      <Text size="sm" className="text-gray-600">Uses zIndex.modal (1300) from tokens</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">Scroll Lock</Text>
                      <Text size="sm" className="text-gray-600">Body scroll disabled when modal open</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">ESC Key</Text>
                      <Text size="sm" className="text-gray-600">Close with Escape key</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">Overlay Click</Text>
                      <Text size="sm" className="text-gray-600">Optional click-outside-to-close</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">Focus Ring</Text>
                      <Text size="sm" className="text-gray-600">WCAG-compliant focus indicators</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">Animations</Text>
                      <Text size="sm" className="text-gray-600">Smooth fade + zoom transitions</Text>
                    </div>
                  </Grid>
                </Stack>
              </BaseCard>

            </Stack>
          </Section>
        </Container>
      </div>

      {/* Modal Instances */}
      <BaseModal
        isOpen={baseModalOpen}
        onClose={() => setBaseModalOpen(false)}
        size="md"
      >
        <div className="p-6">
          <Heading level="title">Base Modal</Heading>
          <Text className="mt-4">
            This is a basic modal with no predefined structure.
            You can put anything inside here.
          </Text>
          <Text className="mt-4 text-gray-600">
            Try pressing ESC or clicking outside to close.
          </Text>
        </div>
      </BaseModal>

      <ContentModal
        isOpen={contentModalOpen}
        onClose={() => setContentModalOpen(false)}
        title="Content Modal"
        description="Modal with structured header, content, and footer"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setContentModalOpen(false)}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert('Action triggered')
                setContentModalOpen(false)
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Confirm
            </button>
          </div>
        }
      >
        <Stack spacing="md">
          <Text>
            This modal includes a header with title and description,
            a content area (this section), and an optional footer with actions.
          </Text>
          <BaseCard padding="sm">
            <Text size="sm" className="text-gray-600">
              You can nest cards inside modals for better visual hierarchy.
            </Text>
          </BaseCard>
        </Stack>
      </ContentModal>

      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        variant={alertVariant}
        title={`${alertVariant.charAt(0).toUpperCase() + alertVariant.slice(1)} Alert`}
        description={`This is a ${alertVariant} alert message. It uses the AlertCard component for consistent styling.`}
        onConfirm={() => {
          alert(`${alertVariant} confirmed!`)
          setAlertModalOpen(false)
        }}
        isLoading={isLoading}
      />

      <FormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title="Create Account"
        description="Fill in your details to get started"
        onSubmit={handleFormSubmit}
        submitLabel="Create Account"
        isLoading={isLoading}
      >
        <Stack spacing="md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </Stack>
      </FormModal>

      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Action"
        description="Are you sure you want to proceed with this action?"
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />

      <ConfirmationModal
        isOpen={dangerousConfirmOpen}
        onClose={() => setDangerousConfirmOpen(false)}
        title="Delete Account"
        description="This action cannot be undone. All your data will be permanently deleted."
        confirmLabel="Delete Account"
        onConfirm={handleDangerousAction}
        isLoading={isLoading}
        isDangerous
      />

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Drawer Panel"
        description="Side panel for additional content"
        position={drawerPosition}
        width="md"
      >
        <Stack spacing="md">
          <Text>
            Drawers slide in from the left or right side of the screen.
            Perfect for filters, settings, or secondary navigation.
          </Text>
          <BaseCard padding="md">
            <Heading level="subtitle">Section 1</Heading>
            <Text size="sm" className="text-gray-600 mt-2">
              Content goes here
            </Text>
          </BaseCard>
          <BaseCard padding="md">
            <Heading level="subtitle">Section 2</Heading>
            <Text size="sm" className="text-gray-600 mt-2">
              More content
            </Text>
          </BaseCard>
        </Stack>
      </Drawer>
    </>
  )
}
