/**
 * Test Page for AIProposalReview Component
 * Demonstrates the AI proposal validation flow
 */

'use client'

import { useState } from 'react'
import { AIProposalReview, type ExtractedField } from '@/components/capture/AIProposalReview'
import type { DataConflict } from '@/lib/data-conflict-detection'

export default function AIProposalTestPage() {
  const [showProposal, setShowProposal] = useState(true)

  // Mock extracted data from vision API
  const mockFields: ExtractedField[] = [
    {
      name: 'cost',
      label: 'Total Cost',
      value: '$42.50',
      confidence: 'high',
      source: 'vision_ai',
      inputType: 'text',
      required: true,
    },
    {
      name: 'gallons',
      label: 'Gallons',
      value: '13.2',
      confidence: 'high',
      source: 'vision_ai',
      inputType: 'number',
      required: true,
    },
    {
      name: 'station',
      label: 'Gas Station',
      value: 'Shell',
      confidence: 'medium',
      source: 'vision_ai',
      warning: 'Please verify the station name',
      inputType: 'text',
    },
    {
      name: 'fuel_type',
      label: 'Fuel Type',
      value: 'Regular',
      confidence: 'medium',
      source: 'vision_ai',
      inputType: 'text',
    },
    {
      name: 'odometer',
      label: 'Odometer Reading',
      value: null,
      confidence: 'none',
      prompt: 'Add odometer reading for +15% quality score',
      inputType: 'number',
    },
    {
      name: 'notes',
      label: 'Notes',
      value: null,
      confidence: 'none',
      prompt: 'Optional notes about this fill-up',
      inputType: 'text',
    },
  ]

  // Mock supplemental data
  const mockSupplementalData = {
    gps: {
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 15,
      address: 'Shell Station, 123 Main St, New York, NY',
    },
    exif: {
      capture_date: new Date(),
      device: 'iPhone 14 Pro',
      resolution: { width: 4032, height: 3024 },
    },
    weather: {
      temp_f: 72,
      condition: 'Sunny',
    },
  }

  const mockProcessingMetadata = {
    model_version: 'gpt-4o',
    processing_ms: 1247,
    input_tokens: 1523,
    output_tokens: 234,
  }

  // Mock conflicts - Only high severity shown to users
  const mockConflicts: DataConflict[] = [
    {
      type: 'stale_photo',
      severity: 'high',
      title: 'Date Check',
      message: 'This receipt is from 2 weeks ago. Is that when you filled up?',
      affectedFields: ['timestamp'],
      suggestions: [
        'Verify this is the correct date',
        'Change to today if you just filled up',
      ],
      autoResolution: 'require_user_input',
      metadata: {
        daysAgo: 14,
      },
    },
  ]

  const handleAccept = (data: Record<string, any>) => {
    console.log('✅ Event accepted with data:', data)
    alert('Event saved! Check console for data.')
    setShowProposal(false)
  }

  const handleRetake = () => {
    console.log('📷 Retaking photo')
    alert('Would return to camera (not implemented in test)')
  }

  const handleCancel = () => {
    console.log('❌ Cancelled')
    setShowProposal(false)
  }

  if (!showProposal) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Complete</h1>
          <p className="text-gray-600 mb-6">Check the browser console for saved data</p>
          <button
            onClick={() => setShowProposal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Show Proposal Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <AIProposalReview
        fields={mockFields}
        imageUrl="https://placehold.co/800x600/e2e8f0/475569?text=Receipt+Photo"
        processingMetadata={mockProcessingMetadata}
        supplementalData={mockSupplementalData}
        conflicts={mockConflicts}
        eventType="fuel"
        onAccept={handleAccept}
        onRetake={handleRetake}
        onCancel={handleCancel}
      />
    </div>
  )
}
