/**
 * Platform-Aware Component
 * 
 * Conditionally renders different content based on platform
 */

'use client'

import { usePlatform } from '@/hooks/usePlatform'

interface PlatformViewProps {
  web: React.ReactNode
  native: React.ReactNode
}

export function PlatformView({ web, native }: PlatformViewProps) {
  const { isNative } = usePlatform()
  return <>{isNative ? native : web}</>
}
