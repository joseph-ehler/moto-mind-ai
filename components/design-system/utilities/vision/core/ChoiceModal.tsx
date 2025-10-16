/**
 * ChoiceModal Component
 * 
 * Initial choice: Camera or File Upload
 * Mobile-native: Bottom sheet on mobile, modal on desktop
 * Uses design system primitives only
 */

import React from 'react'
import { Camera, Upload } from 'lucide-react'
import { Stack, Flex, Heading, Text, Button, Modal, Drawer } from '@/components/design-system'
import type { CaptureType } from '../types'

export interface ChoiceModalProps {
  isOpen: boolean
  captureType: CaptureType
  title?: string
  allowFileUpload: boolean
  isMobile: boolean
  onStartCamera: () => void
  onFileSelect: (file: File) => void
  onCancel: () => void
  onUploadClick?: () => void  // Close modal then trigger external file input
}

/**
 * Get user-friendly title
 */
function getDefaultTitle(type: CaptureType): string {
  const titles: Record<CaptureType, string> = {
    document: 'Capture Document',
    vin: 'Scan VIN Number',
    license_plate: 'Scan License Plate',
    odometer: 'Read Odometer',
    receipt: 'Scan Receipt',
    dashboard_snapshot: 'Capture Dashboard'
  }
  return titles[type]
}

/**
 * Choice modal/sheet using design system
 * Mobile: Bottom sheet with swipe-to-dismiss
 * Desktop: Centered modal
 */
export function ChoiceModal({
  isOpen,
  captureType,
  title,
  allowFileUpload,
  isMobile,
  onStartCamera,
  onFileSelect,
  onCancel,
  onUploadClick
}: ChoiceModalProps) {
  
  // Mobile: Sheet content with pull indicator (iOS/Android best practices)
  const sheetContent = (
    <>
      {/* Pull indicator - iOS/Android standard */}
      <Flex justify="center" className="py-3">
        <div 
          className="w-10 h-1 bg-slate-300 rounded-full"
          aria-hidden="true"
        />
      </Flex>
      
      <Stack spacing="lg">
        {/* Header */}
        <Stack spacing="sm" align="center">
          <Camera className="w-16 h-16 text-blue-600" />
          <Heading level="title">
            {title || getDefaultTitle(captureType)}
          </Heading>
          <Text className="text-center text-slate-600">
            Choose how to capture
          </Text>
        </Stack>

        {/* Actions */}
        <Stack spacing="sm">
          {/* Camera button */}
          <Button
            onClick={onStartCamera}
            size="lg"
          >
            <Camera className="w-5 h-5 mr-3" />
            Take Photo
          </Button>

          {/* File upload button */}
          {allowFileUpload && (
            <Button
              onClick={onUploadClick}
              size="lg"
              variant="outline"
              className="w-full h-14 text-lg"
            >
              <Upload className="w-5 h-5 mr-3" />
              Upload Photo
            </Button>
          )}

          {/* Cancel button */}
          <Button
            onClick={onCancel}
            variant="ghost"
            className="w-full"
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </>
  )
  
  // Desktop: Modal content (no pull indicator)
  const modalContent = (
    <Stack spacing="lg">
      {/* Header */}
      <Stack spacing="sm" align="center">
        <Camera className="w-16 h-16 text-blue-600" />
        <Heading level="title">
          {title || getDefaultTitle(captureType)}
        </Heading>
        <Text className="text-center text-slate-600">
          Take a photo or choose from files
        </Text>
      </Stack>

      {/* Actions */}
      <Stack spacing="sm">
        {/* Camera button */}
        <Button
          onClick={onStartCamera}
          size="lg"
          className="w-full h-14 text-lg"
        >
          <Camera className="w-5 h-5 mr-3" />
          Take Photo
        </Button>

        {/* File upload button */}
        {allowFileUpload && (
          <Button
            onClick={onUploadClick}
            size="lg"
            variant="outline"
            className="w-full h-14 text-lg"
          >
            <Upload className="w-5 h-5 mr-3" />
            Upload Photo
          </Button>
        )}

        {/* Cancel button */}
        <Button
          onClick={onCancel}
          variant="ghost"
          className="w-full"
        >
          Cancel
        </Button>
      </Stack>
    </Stack>
  )
  
  // Mobile: Bottom sheet with rounded top corners and pull indicator
  if (isMobile) {
    return (
      <Drawer
        isOpen={isOpen}
        onClose={onCancel}
        position="bottom"
        closeOnOverlayClick={true}
        closeOnEscape={true}
        showCloseButton={false}
      >
        <div 
          style={{
            marginLeft: '-1.5rem',
            marginRight: '-1.5rem',
            marginTop: '-1rem',
            marginBottom: '-1rem',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            paddingTop: '0',
            paddingBottom: '1rem',
            borderTopLeftRadius: '1.5rem',
            borderTopRightRadius: '1.5rem',
            backgroundColor: 'white',
            overflow: 'hidden'
          }}
        >
          {sheetContent}
        </div>
      </Drawer>
    )
  }
  
  // Desktop: Centered modal
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      closeOnOverlayClick={true}
      closeOnEscape={true}
      showCloseButton={false}
    >
      {modalContent}
    </Modal>
  )
}
