/**
 * MOTOMIND FEATURE FLAG SYSTEM
 * 
 * This file defines all features across the 18-month roadmap.
 * Features can be:
 * - Enabled/disabled globally
 * - Gated by subscription tier
 * - Rolled out progressively (10% → 50% → 100%)
 * - A/B tested with variants
 * - Targeted to specific users/beta testers
 * 
 * @see docs/architecture/FEATURE_FLAGS.md
 */

import { env } from './env'

// ============================================================================
// TYPES
// ============================================================================

export type Tier = 'free' | 'pro' | 'business' | 'enterprise'
export type FeatureStatus = 'disabled' | 'beta' | 'rollout' | 'enabled'

export interface FeatureFlag {
  id: string
  name: string
  description: string
  status: FeatureStatus
  tier: Tier
  phase: number
  
  // Progressive rollout (0-100)
  rolloutPercentage?: number
  
  // Beta testing
  betaUsers?: string[]
  betaTeams?: string[]
  
  // A/B testing
  variants?: {
    control: string
    treatment: string
    split: number // 0-100 (% getting treatment)
  }
  
  // Dependencies
  requires?: string[] // Other feature IDs that must be enabled
  
  // Metadata
  addedIn?: string // Version/date added
  deprecatedIn?: string // Version/date deprecated
  removedIn?: string // Version/date to remove
}

// ============================================================================
// PHASE 1: FOUNDATION (Months 1-2)
// ============================================================================

const phase1Features: Record<string, FeatureFlag> = {
  // Core features (always enabled)
  smartCamera: {
    id: 'smartCamera',
    name: 'Smart Camera System',
    description: 'Advanced capture with quality checks, preprocessing',
    status: 'enabled',
    tier: 'free',
    phase: 1,
    addedIn: '2024-09-01'
  },
  
  locationIntelligence: {
    id: 'locationIntelligence',
    name: 'Location Intelligence',
    description: 'Time-based trust, multi-source reconciliation',
    status: 'enabled',
    tier: 'free',
    phase: 1,
    addedIn: '2024-10-01'
  },
  
  aiChat: {
    id: 'aiChat',
    name: 'AI Chat Assistant',
    description: 'Conversational AI with vehicle context',
    status: 'enabled',
    tier: 'free',
    phase: 1,
    addedIn: '2024-11-01'
  },
  
  // New Phase 1B features
  offlineMode: {
    id: 'offlineMode',
    name: 'Offline Mode (PWA)',
    description: 'Capture and sync when back online',
    status: 'beta',
    tier: 'pro',
    phase: 1,
    betaUsers: [], // Add user IDs for testing
    addedIn: '2025-01-13'
  },
  
  pushNotifications: {
    id: 'pushNotifications',
    name: 'Push Notifications',
    description: 'Browser push notifications',
    status: 'disabled',
    tier: 'pro',
    phase: 1,
    requires: ['offlineMode'],
    addedIn: '2025-01-13'
  }
}

// ============================================================================
// PHASE 2: INTELLIGENCE LAYER (Months 3-5)
// ============================================================================

const phase2Features: Record<string, FeatureFlag> = {
  patternRecognition: {
    id: 'patternRecognition',
    name: 'Pattern Recognition',
    description: 'Learn user behaviors, predict next actions',
    status: 'disabled',
    tier: 'pro',
    phase: 2,
    rolloutPercentage: 0,
    addedIn: '2025-03-01'
  },
  
  multiModelVision: {
    id: 'multiModelVision',
    name: 'Multi-Model Vision',
    description: 'GPT-4o + Claude + Gemini fallbacks',
    status: 'disabled',
    tier: 'business',
    phase: 2,
    addedIn: '2025-03-15'
  },
  
  autoEnrichment: {
    id: 'autoEnrichment',
    name: 'Auto-Enrichment',
    description: 'Automatic weather, geocoding, price validation',
    status: 'disabled',
    tier: 'pro',
    phase: 2,
    requires: ['patternRecognition'],
    addedIn: '2025-04-01'
  },
  
  proximityIntelligence: {
    id: 'proximityIntelligence',
    name: 'Proximity Intelligence (15 POIs)',
    description: 'Detect 15 vehicle-related locations',
    status: 'disabled',
    tier: 'pro',
    phase: 2,
    addedIn: '2025-04-15'
  },
  
  smartNotifications: {
    id: 'smartNotifications',
    name: 'Smart Notifications',
    description: 'Predictive, location-based, pattern-based alerts',
    status: 'disabled',
    tier: 'pro',
    phase: 2,
    requires: ['pushNotifications', 'patternRecognition', 'proximityIntelligence'],
    addedIn: '2025-05-01'
  }
}

// ============================================================================
// PHASE 3: ANALYTICS & INSIGHTS (Months 6-8)
// ============================================================================

const phase3Features: Record<string, FeatureFlag> = {
  analyticsEngine: {
    id: 'analyticsEngine',
    name: 'Analytics Engine',
    description: 'MPG trends, cost analysis, efficiency scoring',
    status: 'disabled',
    tier: 'pro',
    phase: 3,
    addedIn: '2025-06-01'
  },
  
  predictiveMaintenance: {
    id: 'predictiveMaintenance',
    name: 'Predictive Maintenance',
    description: 'Predict oil changes, tire rotations, issues',
    status: 'disabled',
    tier: 'pro',
    phase: 3,
    requires: ['patternRecognition', 'analyticsEngine'],
    addedIn: '2025-07-01'
  },
  
  aiInsights: {
    id: 'aiInsights',
    name: 'AI Insights Generator',
    description: 'Monthly summaries, Q&A, personalized tips',
    status: 'disabled',
    tier: 'pro',
    phase: 3,
    requires: ['analyticsEngine'],
    addedIn: '2025-08-01'
  }
}

// ============================================================================
// PHASE 4: ENTERPRISE (Months 9-12)
// ============================================================================

const phase4Features: Record<string, FeatureFlag> = {
  smartExports: {
    id: 'smartExports',
    name: 'Smart Export System',
    description: 'IRS logs, QuickBooks CSV, fleet reports',
    status: 'disabled',
    tier: 'business',
    phase: 4,
    addedIn: '2025-09-01'
  },
  
  workflowAutomation: {
    id: 'workflowAutomation',
    name: 'Workflow Automation',
    description: 'Custom triggers, actions, integrations',
    status: 'disabled',
    tier: 'enterprise',
    phase: 4,
    addedIn: '2025-10-01'
  },
  
  benchmarkIntelligence: {
    id: 'benchmarkIntelligence',
    name: 'Benchmark Intelligence',
    description: 'Fleet comparisons, leaderboards, rankings',
    status: 'disabled',
    tier: 'business',
    phase: 4,
    addedIn: '2025-11-01'
  },
  
  fleetAdmin: {
    id: 'fleetAdmin',
    name: 'Fleet Admin Dashboard',
    description: 'Multi-tenant management, policies, reports',
    status: 'disabled',
    tier: 'business',
    phase: 4,
    addedIn: '2025-12-01'
  }
}

// ============================================================================
// PHASE 5: PREMIUM (Months 13-15)
// ============================================================================

const phase5Features: Record<string, FeatureFlag> = {
  voiceInput: {
    id: 'voiceInput',
    name: 'Voice Input/Output',
    description: 'Whisper transcription, TTS, voice commands',
    status: 'disabled',
    tier: 'premium',
    phase: 5,
    addedIn: '2026-01-01'
  },
  
  motionIntelligence: {
    id: 'motionIntelligence',
    name: 'Motion Intelligence',
    description: 'Driving score, accident detection, safety',
    status: 'disabled',
    tier: 'business',
    phase: 5,
    addedIn: '2026-02-01'
  },
  
  priceIntelligence: {
    id: 'priceIntelligence',
    name: 'Price Intelligence',
    description: 'Price percentile, savings calculator, alerts',
    status: 'disabled',
    tier: 'pro',
    phase: 5,
    addedIn: '2026-03-01'
  }
}

// ============================================================================
// PHASE 6: SCALE (Months 16-18)
// ============================================================================

const phase6Features: Record<string, FeatureFlag> = {
  advancedCaching: {
    id: 'advancedCaching',
    name: 'Advanced Caching',
    description: 'CDN, edge caching, optimized delivery',
    status: 'disabled',
    tier: 'free',
    phase: 6,
    addedIn: '2026-04-01'
  },
  
  rateProtection: {
    id: 'rateProtection',
    name: 'Rate Limiting & DDoS Protection',
    description: 'Enterprise-grade security',
    status: 'disabled',
    tier: 'free',
    phase: 6,
    addedIn: '2026-05-01'
  },
  
  international: {
    id: 'international',
    name: 'International Support',
    description: 'Multi-language, currency, regional pricing',
    status: 'disabled',
    tier: 'free',
    phase: 6,
    addedIn: '2026-06-01'
  }
}

// ============================================================================
// ALL FEATURES
// ============================================================================

export const features = {
  ...phase1Features,
  ...phase2Features,
  ...phase3Features,
  ...phase4Features,
  ...phase5Features,
  ...phase6Features
}

// ============================================================================
// FEATURE CHECKS
// ============================================================================

/**
 * Check if a feature is enabled for a user
 */
export function isFeatureEnabled(
  featureId: string,
  context: {
    userId?: string
    userTier?: Tier
    teamId?: string
  } = {}
): boolean {
  const feature = features[featureId]
  
  if (!feature) {
    console.warn(`Feature "${featureId}" not found`)
    return false
  }
  
  // Disabled = always off
  if (feature.status === 'disabled') {
    return false
  }
  
  // Check tier requirements
  const tierOrder: Tier[] = ['free', 'pro', 'business', 'enterprise']
  const requiredTierIndex = tierOrder.indexOf(feature.tier)
  const userTierIndex = tierOrder.indexOf(context.userTier || 'free')
  
  if (userTierIndex < requiredTierIndex) {
    return false
  }
  
  // Check dependencies
  if (feature.requires) {
    const allDependenciesMet = feature.requires.every(depId =>
      isFeatureEnabled(depId, context)
    )
    if (!allDependenciesMet) {
      return false
    }
  }
  
  // Beta = only for beta users/teams
  if (feature.status === 'beta') {
    const isBetaUser = feature.betaUsers?.includes(context.userId || '')
    const isBetaTeam = feature.betaTeams?.includes(context.teamId || '')
    return isBetaUser || isBetaTeam || false
  }
  
  // Rollout = percentage-based
  if (feature.status === 'rollout' && feature.rolloutPercentage !== undefined) {
    // Deterministic rollout based on user ID
    if (!context.userId) return false
    
    const hash = hashString(context.userId)
    const bucket = hash % 100
    return bucket < feature.rolloutPercentage
  }
  
  // Enabled = on for everyone (with tier check)
  return feature.status === 'enabled'
}

/**
 * Get feature variant for A/B testing
 */
export function getFeatureVariant(
  featureId: string,
  userId: string
): 'control' | 'treatment' | null {
  const feature = features[featureId]
  
  if (!feature?.variants || !isFeatureEnabled(featureId, { userId })) {
    return null
  }
  
  const hash = hashString(userId + featureId)
  const bucket = hash % 100
  
  return bucket < feature.variants.split ? 'treatment' : 'control'
}

/**
 * Get all enabled features for a user
 */
export function getEnabledFeatures(context: {
  userId?: string
  userTier?: Tier
  teamId?: string
}): string[] {
  return Object.keys(features).filter(featureId =>
    isFeatureEnabled(featureId, context)
  )
}

/**
 * Get features by phase
 */
export function getFeaturesByPhase(phase: number): FeatureFlag[] {
  return Object.values(features).filter(f => f.phase === phase)
}

/**
 * Get features by tier
 */
export function getFeaturesByTier(tier: Tier): FeatureFlag[] {
  const tierOrder: Tier[] = ['free', 'pro', 'business', 'enterprise']
  const tierIndex = tierOrder.indexOf(tier)
  
  return Object.values(features).filter(f => {
    const featureTierIndex = tierOrder.indexOf(f.tier)
    return featureTierIndex <= tierIndex
  })
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Simple string hash function (DJB2)
 */
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return Math.abs(hash)
}

// ============================================================================
// DEVELOPMENT OVERRIDES
// ============================================================================

/**
 * Override features in development
 * Add ?features=featureId1,featureId2 to URL
 */
export function getDevOverrides(): string[] {
  if (typeof window === 'undefined' || env.app.environment === 'production') {
    return []
  }
  
  const params = new URLSearchParams(window.location.search)
  const featuresParam = params.get('features')
  
  return featuresParam ? featuresParam.split(',') : []
}

/**
 * Check if feature is dev-overridden
 */
export function isDevOverride(featureId: string): boolean {
  return getDevOverrides().includes(featureId)
}
