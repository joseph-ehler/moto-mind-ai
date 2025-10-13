/**
 * React Hook for A/B Testing Variants
 * 
 * Usage:
 * ```tsx
 * const variant = useFeatureVariant('newDesign')
 * 
 * if (variant === 'treatment') {
 *   return <NewDesign />
 * }
 * return <OldDesign />
 * ```
 */

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { getFeatureVariant, features } from '@/lib/config/features'

export type Variant = 'control' | 'treatment' | null

export interface VariantInfo {
  variant: Variant
  featureName: string
  isActive: boolean
}

/**
 * Hook to get A/B test variant for current user
 */
export function useFeatureVariant(featureId: string): VariantInfo {
  const { user } = useUser()
  const [info, setInfo] = useState<VariantInfo>({
    variant: null,
    featureName: features[featureId]?.name || featureId,
    isActive: false
  })

  useEffect(() => {
    if (!user?.id) {
      setInfo(prev => ({
        ...prev,
        variant: null,
        isActive: false
      }))
      return
    }

    const variant = getFeatureVariant(featureId, user.id)
    
    setInfo({
      variant,
      featureName: features[featureId]?.name || featureId,
      isActive: variant !== null
    })

    // Track variant assignment for analytics
    if (variant && typeof window !== 'undefined') {
      // Track in your analytics
      trackVariantAssignment(featureId, variant, user.id)
    }
  }, [featureId, user?.id])

  return info
}

/**
 * Component wrapper for A/B testing
 * 
 * Usage:
 * ```tsx
 * <FeatureVariant
 *   featureId="newDesign"
 *   control={<OldDesign />}
 *   treatment={<NewDesign />}
 * />
 * ```
 */
export function FeatureVariant({
  featureId,
  control,
  treatment
}: {
  featureId: string
  control: React.ReactNode
  treatment: React.ReactNode
}) {
  const { variant } = useFeatureVariant(featureId)

  if (variant === 'treatment') {
    return <>{treatment}</>
  }

  return <>{control}</>
}

/**
 * Track variant assignment in analytics
 */
function trackVariantAssignment(
  featureId: string,
  variant: 'control' | 'treatment',
  userId: string
) {
  // Implement your analytics tracking here
  // Examples:
  // - PostHog: posthog.capture('$feature_flag_called', { feature_flag: featureId, variant })
  // - Google Analytics: gtag('event', 'variant_assigned', { feature: featureId, variant })
  // - Custom: fetch('/api/analytics/variant', { method: 'POST', body: JSON.stringify({ featureId, variant, userId }) })
  
  console.log('[Feature Variant]', {
    feature: featureId,
    variant,
    userId,
    timestamp: new Date().toISOString()
  })
}
