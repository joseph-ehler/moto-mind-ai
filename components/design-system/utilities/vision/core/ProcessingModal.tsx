/**
 * ProcessingModal Component
 * 
 * Shows AI processing state using design system primitives
 * No raw HTML, all design system components
 */

import React from 'react'
import { Stack, Card, Heading, Text, Modal } from '@/components/design-system'
import type { CaptureType } from '../types'

export interface ProcessingModalProps {
  isOpen: boolean
  captureType: CaptureType
}

/**
 * Loading spinner component
 */
function LoadingSpinner() {
  return (
    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  )
}

/**
 * Get user-friendly name for capture type
 */
function getCaptureTypeName(type: CaptureType): string {
  const names: Record<CaptureType, string> = {
    document: 'document',
    vin: 'VIN number',
    license_plate: 'license plate',
    odometer: 'odometer',
    receipt: 'receipt',
    dashboard_snapshot: 'dashboard'
  }
  return names[type]
}

/**
 * Processing modal using design system
 */
export function ProcessingModal({ isOpen, captureType }: ProcessingModalProps) {
  return (
    <Modal isOpen={isOpen} size="sm" onClose={() => {}} showCloseButton={false}>
      <Card elevation="floating" padding="lg">
        <Stack spacing="md" align="center">
          <LoadingSpinner />
          <Heading level="title">Processing Image</Heading>
          <Text className="text-center">
            Please wait while we analyze your {getCaptureTypeName(captureType)}...
          </Text>
        </Stack>
      </Card>
    </Modal>
  )
}
