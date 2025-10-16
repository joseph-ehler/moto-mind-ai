/**
 * ErrorModal Component
 * 
 * Shows camera/processing errors with smart guidance
 * Uses design system primitives
 */

import React from 'react'
import { AlertTriangle, RotateCcw, X, Lightbulb } from 'lucide-react'
import { Stack, Card, Heading, Text, Button, Modal } from '@/components/design-system'
import { getErrorGuidance } from '../utils/error-messages'
import type { CaptureType } from '../types'

export interface ErrorModalProps {
  isOpen: boolean
  error: string
  captureType?: CaptureType
  onRetry: () => void
  onCancel: () => void
}

/**
 * Error modal with smart guidance
 */
export function ErrorModal({ isOpen, error, captureType, onRetry, onCancel }: ErrorModalProps) {
  const guidance = getErrorGuidance(error, captureType)
  
  return (
    <Modal isOpen={isOpen} size="sm" onClose={onCancel}>
      <Card elevation="floating" padding="lg">
        <Stack spacing="md">
          {/* Error icon */}
          <div className="flex justify-center">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          
          {/* Title */}
          <Heading level="title" className="text-center">
            {guidance.title}
          </Heading>
          
          {/* Error message */}
          <Text className="text-center text-slate-600">
            {guidance.message}
          </Text>
          
          {/* Suggestions */}
          {guidance.suggestions.length > 0 && (
            <Card className="bg-blue-50 border-blue-200" padding="md">
              <Stack spacing="sm">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <Text className="text-sm font-medium text-blue-900">
                    Try these suggestions:
                  </Text>
                </div>
                <Stack spacing="xs">
                  {guidance.suggestions.map((suggestion, i) => (
                    <Text key={i} className="text-sm text-blue-700">
                      • {suggestion}
                    </Text>
                  ))}
                </Stack>
              </Stack>
            </Card>
          )}
          
          {/* Actions */}
          <Stack spacing="sm" className="w-full">
            {guidance.canRetry && (
              <Button onClick={onRetry} className="w-full" size="lg">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button onClick={onCancel} variant="ghost" className="w-full">
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Modal>
  )
}
