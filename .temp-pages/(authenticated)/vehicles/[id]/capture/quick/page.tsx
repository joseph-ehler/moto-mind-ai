/**
 * Quick Capture Page
 * 
 * Fast capture flow - camera opens immediately, AI detects type
 * Route: /vehicles/[id]/capture/quick
 */

'use client'

import { use } from 'react'
import { QuickCapturePath } from '@/components/capture/QuickCapturePath'

export default function QuickCapturePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return <QuickCapturePath vehicleId={id} />
}
