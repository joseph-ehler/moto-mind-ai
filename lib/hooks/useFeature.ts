/**
 * React Hook for Feature Flags
 * 
 * Usage:
 * ```tsx
 * const hasOfflineMode = useFeature('offlineMode')
 * const variant = useFeatureVariant('newDesign')
 * ```
 */

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import {
  isFeatureEnabled,
  getFeatureVariant,
  isDevOverride,
  features,
  type Tier
} from '@/lib/config/features'

/**
 * Hook to check if a feature is enabled for current user
 */
export function useFeature(featureId: string): boolean {
  const { user, profile } = useUser()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // Dev override via URL param
    if (isDevOverride(featureId)) {
      setEnabled(true)
      return
    }

    // Check feature flag
    const isEnabled = isFeatureEnabled(featureId, {
      userId: user?.id,
      userTier: (profile?.tier as Tier) || 'free',
      teamId: profile?.team_id
    })

    setEnabled(isEnabled)
  }, [featureId, user?.id, profile?.tier, profile?.team_id])

  return enabled
}

/**
 * Hook to get A/B test variant for current user
 */
export function useFeatureVariant(
  featureId: string
): 'control' | 'treatment' | null {
  const { user } = useUser()
  const [variant, setVariant] = useState<'control' | 'treatment' | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setVariant(null)
      return
    }

    const userVariant = getFeatureVariant(featureId, user.id)
    setVariant(userVariant)
  }, [featureId, user?.id])

  return variant
}

/**
 * Hook to get feature metadata
 */
export function useFeatureInfo(featureId: string) {
  return features[featureId] || null
}

/**
 * Hook to check multiple features at once
 */
export function useFeatures(featureIds: string[]): Record<string, boolean> {
  const { user, profile } = useUser()
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const context = {
      userId: user?.id,
      userTier: (profile?.tier as Tier) || 'free',
      teamId: profile?.team_id
    }

    const features = featureIds.reduce((acc, featureId) => {
      acc[featureId] = isDevOverride(featureId) || isFeatureEnabled(featureId, context)
      return acc
    }, {} as Record<string, boolean>)

    setEnabledFeatures(features)
  }, [featureIds, user?.id, profile?.tier, profile?.team_id])

  return enabledFeatures
}
