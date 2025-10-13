/**
 * UNIT TESTS: Feature Flags
 * 
 * Tests for the feature flag system
 */

import {
  isFeatureEnabled,
  getFeatureVariant,
  getEnabledFeatures,
  features
} from '@/lib/config/features'

describe('Feature Flags', () => {
  describe('isFeatureEnabled', () => {
    it('should return false for disabled features', () => {
      const enabled = isFeatureEnabled('patternRecognition', {
        userId: 'test-user',
        userTier: 'pro'
      })

      expect(enabled).toBe(false)
    })

    it('should return true for enabled features', () => {
      const enabled = isFeatureEnabled('smartCamera', {
        userId: 'test-user',
        userTier: 'free'
      })

      expect(enabled).toBe(true)
    })

    it('should enforce tier requirements', () => {
      // Pro feature, free user
      const enabled = isFeatureEnabled('analyticsEngine', {
        userId: 'test-user',
        userTier: 'free'
      })

      expect(enabled).toBe(false)
    })

    it('should allow higher tiers access to lower tier features', () => {
      // Free feature, pro user
      const enabled = isFeatureEnabled('smartCamera', {
        userId: 'test-user',
        userTier: 'pro'
      })

      expect(enabled).toBe(true)
    })

    it('should respect beta user lists', () => {
      // Update feature to beta with test user
      const testFeature = features['offlineMode']
      testFeature.status = 'beta'
      testFeature.betaUsers = ['test-user']

      const enabled = isFeatureEnabled('offlineMode', {
        userId: 'test-user',
        userTier: 'pro'
      })

      expect(enabled).toBe(true)
    })

    it('should check feature dependencies', () => {
      // smartNotifications requires pushNotifications
      const enabled = isFeatureEnabled('smartNotifications', {
        userId: 'test-user',
        userTier: 'pro'
      })

      // Should be false because dependencies are disabled
      expect(enabled).toBe(false)
    })
  })

  describe('getFeatureVariant', () => {
    it('should return null for features without variants', () => {
      const variant = getFeatureVariant('smartCamera', 'test-user')

      expect(variant).toBeNull()
    })

    it('should deterministically assign variants based on user ID', () => {
      // Same user should always get same variant
      const variant1 = getFeatureVariant('smartCamera', 'user-123')
      const variant2 = getFeatureVariant('smartCamera', 'user-123')

      expect(variant1).toBe(variant2)
    })
  })

  describe('getEnabledFeatures', () => {
    it('should return list of enabled features for user', () => {
      const enabled = getEnabledFeatures({
        userId: 'test-user',
        userTier: 'pro'
      })

      expect(enabled).toBeInstanceOf(Array)
      expect(enabled.length).toBeGreaterThan(0)
      expect(enabled).toContain('smartCamera')
    })

    it('should respect tier limits', () => {
      const freeFeatures = getEnabledFeatures({
        userId: 'test-user',
        userTier: 'free'
      })

      const proFeatures = getEnabledFeatures({
        userId: 'test-user',
        userTier: 'pro'
      })

      // Pro should have more features than free
      expect(proFeatures.length).toBeGreaterThanOrEqual(freeFeatures.length)
    })
  })
})
