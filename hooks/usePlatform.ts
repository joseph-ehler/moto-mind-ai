/**
 * Platform Detection Hook
 * 
 * Detects if app is running on native (iOS/Android) or web
 */

'use client'

import { useMemo } from 'react'
import { Capacitor } from '@capacitor/core'

export function usePlatform() {
  const isNative = useMemo(() => Capacitor.isNativePlatform(), [])
  
  return {
    isNative,
    isWeb: !isNative,
    platform: isNative ? 'native' : 'web' as const,
  }
}
