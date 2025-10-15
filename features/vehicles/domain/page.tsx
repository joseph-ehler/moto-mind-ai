/**
 * Guided Capture Page
 * 
 * Progressive multi-step capture flow for specific event types
 * Route: /vehicles/[id]/capture/[eventType]
 */

'use client'

import { use } from 'react'
import { GuidedCaptureFlow } from '@/features/capture/ui/GuidedCaptureFlow'

export default function GuidedCapturePage({
  params
}: {
  params: Promise<{ id: string; eventType: string }>
}) {
  const { id, eventType } = use(params)

  return <GuidedCaptureFlow vehicleId={id} eventType={eventType} />
}
