/**
 * Vision Plugin System - Core Types
 * 
 * Type definitions for the Vision plugin architecture
 * Enables extensible, modular scanner features
 * 
 * @module vision/plugins/types
 */

import type { ReactNode } from 'react'
import type {
  CaptureType,
  CaptureState,
  CaptureResult,
  CameraConstraints,
  UnifiedCameraCaptureProps,
  AnalyticsEvent
} from '../types'

// ============================================================================
// PLUGIN CORE
// ============================================================================

/**
 * Vision Plugin Interface
 * 
 * Defines the contract for all Vision plugins
 * 
 * @example
 * ```tsx
 * const vinValidation: VisionPlugin = {
 *   id: '@motomind/vin-validation',
 *   version: '1.0.0',
 *   type: 'validator',
 *   hooks: {
 *     'after-capture': async (result) => {
 *       if (!isValidVIN(result.data.vin)) {
 *         throw new Error('Invalid VIN format')
 *       }
 *       return result
 *     }
 *   }
 * }
 * ```
 */
export interface VisionPlugin<TOptions = any, TData = any> {
  /** Unique plugin identifier (e.g., '@motomind/vin-validation') */
  id: string
  
  /** Plugin version (semantic versioning) */
  version: string
  
  /** Plugin category */
  type: 'validator' | 'enhancer' | 'decoder' | 'ui' | 'analytics'
  
  /** Display name */
  name?: string
  
  /** Plugin configuration options */
  options?: TOptions
  
  /** 
   * Initialize plugin - called when registered
   * Use for setup, API connections, etc.
   */
  init?(context: VisionPluginContext<TData>): void | Promise<void>
  
  /** 
   * Cleanup plugin - called when unregistered
   * Use for cleanup, closing connections, etc.
   */
  destroy?(): void | Promise<void>
  
  /** Lifecycle hooks */
  hooks?: VisionPluginHooks<TData>
}

// ============================================================================
// PLUGIN CONTEXT
// ============================================================================

/**
 * Vision Plugin Context
 * 
 * Provides access to scanner state and capabilities
 * Passed to plugin hooks for interaction with the scanner
 * 
 * @example
 * ```tsx
 * 'before-capture': async (context) => {
 *   if (context.retryCount > 3) {
 *     context.cancel()
 *   }
 *   return true
 * }
 * ```
 */
export interface VisionPluginContext<TData = any> {
  /** Type of capture being performed */
  captureType: CaptureType
  
  /** Current capture state */
  state: CaptureState
  
  /** Camera constraints */
  constraints: CameraConstraints
  
  /** Number of retry attempts */
  retryCount: number
  
  /** Last error that occurred */
  lastError?: Error
  
  /** Active camera stream */
  stream: MediaStream | null
  
  /** Duration of current capture attempt (ms) */
  duration?: number
  
  /** Image quality score (0-100) */
  imageQuality?: number
  
  /** Current result (if available) */
  result?: CaptureResult<TData>
  
  /** Track analytics event */
  trackEvent: (event: AnalyticsEvent) => void
  
  /** Retry capture */
  retry: () => void
  
  /** Cancel capture */
  cancel: () => void
  
  /** Get plugin options */
  getOptions: <T = any>() => T
  
  /** Emit custom event */
  emit: (event: string, data: any) => void
  
  /** Listen to custom event */
  on: (event: string, handler: (data: any) => void) => () => void
  
  /** Scanner component props (read-only) */
  props: Readonly<UnifiedCameraCaptureProps>
}

// ============================================================================
// PLUGIN HOOKS
// ============================================================================

/**
 * Vision Plugin Hooks
 * 
 * Lifecycle hooks for intercepting and extending capture process
 * All hooks support async/await for API calls, validation, etc.
 * 
 * @example
 * ```tsx
 * const hooks: VisionPluginHooks = {
 *   'before-capture': async (context) => {
 *     console.log('Starting capture...')
 *     return true
 *   },
 *   'after-capture': async (result) => {
 *     console.log('Captured:', result.data)
 *     return result
 *   }
 * }
 * ```
 */
export interface VisionPluginHooks<TData = any> {
  // ============================================================================
  // CAPTURE LIFECYCLE
  // ============================================================================
  
  /**
   * Before camera captures image
   * 
   * Use to validate preconditions, modify camera settings
   * Return false or throw error to block capture
   * 
   * @param context - Plugin context with scanner state
   * @returns true to proceed, false to block, or modified context
   * 
   * @example
   * ```tsx
   * 'before-capture': async (context) => {
   *   if (context.imageQuality < 50) {
   *     throw new Error('Image quality too low')
   *   }
   *   return true
   * }
   * ```
   */
  'before-capture'?: (
    context: VisionPluginContext<TData>
  ) => boolean | void | Promise<boolean | void>
  
  /**
   * After Vision API returns result
   * 
   * Use to validate, transform, or enrich captured data
   * Throw error to trigger retry flow
   * 
   * @param result - Capture result from Vision API
   * @param context - Plugin context
   * @returns Modified result or original
   * 
   * @example
   * ```tsx
   * 'after-capture': async (result, context) => {
   *   if (!isValidVIN(result.data.vin)) {
   *     throw new Error('Invalid VIN format')
   *   }
   *   
   *   // Enrich with decoded data
   *   const decoded = await decodeVIN(result.data.vin)
   *   result.data.make = decoded.make
   *   
   *   return result
   * }
   * ```
   */
  'after-capture'?: (
    result: CaptureResult<TData>,
    context: VisionPluginContext<TData>
  ) => CaptureResult<TData> | Promise<CaptureResult<TData>>
  
  /**
   * When capture or processing fails
   * 
   * Use to handle errors, decide retry strategy
   * First plugin that returns retry decision wins
   * 
   * @param error - Error that occurred
   * @param context - Plugin context
   * @returns Retry decision with optional message
   * 
   * @example
   * ```tsx
   * 'on-error': async (error, context) => {
   *   if (error.message.includes('blur')) {
   *     return {
   *       retry: true,
   *       message: 'Image too blurry. Hold steady and try again.'
   *     }
   *   }
   *   
   *   if (context.retryCount >= 3) {
   *     return { retry: false }
   *   }
   *   
   *   return { retry: true }
   * }
   * ```
   */
  'on-error'?: (
    error: Error,
    context: VisionPluginContext<TData>
  ) => RetryDecision | Promise<RetryDecision>
  
  /**
   * When user retries capture
   * 
   * Use to track attempts, modify behavior on retry
   * 
   * @param retryCount - Current retry attempt number
   * @param context - Plugin context
   * 
   * @example
   * ```tsx
   * 'on-retry': async (retryCount, context) => {
   *   analytics.track('capture_retry', { attempt: retryCount })
   *   
   *   // Adjust quality on multiple retries
   *   if (retryCount > 2) {
   *     context.constraints.resolution = 'ultra'
   *   }
   * }
   * ```
   */
  'on-retry'?: (
    retryCount: number,
    context: VisionPluginContext<TData>
  ) => void | Promise<void>
  
  // ============================================================================
  // DATA PROCESSING
  // ============================================================================
  
  /**
   * Transform captured data format
   * 
   * Use to normalize, clean, or reformat data
   * Executed before validation
   * 
   * @param result - Raw capture result
   * @returns Transformed result
   * 
   * @example
   * ```tsx
   * 'transform-result': async (result) => {
   *   // Normalize VIN (uppercase, trim, remove spaces)
   *   if (result.data?.vin) {
   *     result.data.vin = result.data.vin
   *       .toUpperCase()
   *       .trim()
   *       .replace(/\s+/g, '')
   *   }
   *   return result
   * }
   * ```
   */
  'transform-result'?: (
    result: CaptureResult<TData>
  ) => CaptureResult<TData> | Promise<CaptureResult<TData>>
  
  /**
   * Validate captured data
   * 
   * Use to verify data quality, format, constraints
   * Throw error or return false to fail validation
   * 
   * @param result - Capture result to validate
   * @returns true if valid, false if invalid
   * 
   * @example
   * ```tsx
   * 'validate-result': async (result) => {
   *   const vin = result.data?.vin
   *   
   *   if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
   *     throw new Error('VIN must be 17 characters')
   *   }
   *   
   *   return true
   * }
   * ```
   */
  'validate-result'?: (
    result: CaptureResult<TData>
  ) => boolean | Promise<boolean>
  
  /**
   * Enrich result with additional data
   * 
   * Use to add decoded info, lookups, calculations
   * Executed after validation
   * 
   * @param result - Validated capture result
   * @returns Enriched result
   * 
   * @example
   * ```tsx
   * 'enrich-result': async (result) => {
   *   const decoded = await decodeVIN(result.data.vin)
   *   
   *   result.data.vehicleInfo = {
   *     make: decoded.make,
   *     model: decoded.model,
   *     year: decoded.year
   *   }
   *   
   *   return result
   * }
   * ```
   */
  'enrich-result'?: (
    result: CaptureResult<TData>
  ) => CaptureResult<TData> | Promise<CaptureResult<TData>>
  
  // ============================================================================
  // UI RENDERING
  // ============================================================================
  
  /**
   * Render custom overlay during camera view
   * 
   * Use to add guidance, indicators, controls
   * 
   * @param context - Plugin context
   * @returns React node to render
   * 
   * @example
   * ```tsx
   * 'render-overlay': (context) => (
   *   <div className="absolute top-4 right-4">
   *     <Badge>Quality: {context.imageQuality}%</Badge>
   *   </div>
   * )
   * ```
   */
  'render-overlay'?: (
    context: VisionPluginContext<TData>
  ) => ReactNode
  
  /**
   * Render custom toolbar buttons
   * 
   * Use to add actions, controls
   * 
   * @param result - Capture result (if available)
   * @param context - Plugin context
   * @returns React node to render
   * 
   * @example
   * ```tsx
   * 'render-toolbar': (result) => (
   *   <Button onClick={() => copyToClipboard(result.data.vin)}>
   *     Copy VIN
   *   </Button>
   * )
   * ```
   */
  'render-toolbar'?: (
    result: CaptureResult<TData> | null,
    context: VisionPluginContext<TData>
  ) => ReactNode
  
  /**
   * Render custom result display
   * 
   * Use to show decoded info, formatted data
   * 
   * @param result - Capture result
   * @returns React node to render
   * 
   * @example
   * ```tsx
   * 'render-result': (result) => (
   *   <Card>
   *     <Heading>Vehicle Info</Heading>
   *     <Text>Make: {result.data.make}</Text>
   *     <Text>Model: {result.data.model}</Text>
   *   </Card>
   * )
   * ```
   */
  'render-result'?: (
    result: CaptureResult<TData>
  ) => ReactNode
  
  /**
   * Render confidence indicator
   * 
   * Use to show confidence score, quality
   * 
   * @param result - Capture result with confidence
   * @returns React node to render
   * 
   * @example
   * ```tsx
   * 'render-confidence': (result) => {
   *   const percentage = Math.round(result.confidence * 100)
   *   return <Badge variant="success">{percentage}%</Badge>
   * }
   * ```
   */
  'render-confidence'?: (
    result: CaptureResult<TData>
  ) => ReactNode
  
  // ============================================================================
  // EVENTS
  // ============================================================================
  
  /**
   * When capture succeeds
   * 
   * Use for analytics, side effects, notifications
   * 
   * @param result - Successful capture result
   * @param context - Plugin context
   * 
   * @example
   * ```tsx
   * 'on-success': async (result, context) => {
   *   analytics.track('vin_scan_success', {
   *     confidence: result.confidence,
   *     retries: context.retryCount
   *   })
   * }
   * ```
   */
  'on-success'?: (
    result: CaptureResult<TData>,
    context: VisionPluginContext<TData>
  ) => void | Promise<void>
  
  /**
   * When user cancels capture
   * 
   * Use for cleanup, analytics
   * 
   * @param context - Plugin context
   * 
   * @example
   * ```tsx
   * 'on-cancel': async (context) => {
   *   analytics.track('capture_cancelled', {
   *     stage: context.state,
   *     retries: context.retryCount
   *   })
   * }
   * ```
   */
  'on-cancel'?: (
    context: VisionPluginContext<TData>
  ) => void | Promise<void>
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Retry decision from error handler
 */
export interface RetryDecision {
  /** Whether to retry capture */
  retry: boolean
  
  /** Optional message to show user */
  message?: string
  
  /** Optional delay before retry (ms) */
  delay?: number
}

/**
 * Plugin factory function type
 * 
 * Convenience type for creating typed plugin factories
 * 
 * @example
 * ```tsx
 * export const vinValidation: VisionPluginFactory<VinValidationOptions> = (options) => ({
 *   id: '@motomind/vin-validation',
 *   version: '1.0.0',
 *   type: 'validator',
 *   options,
 *   hooks: { ... }
 * })
 * ```
 */
export type VisionPluginFactory<TOptions = any, TData = any> = (
  options?: TOptions
) => VisionPlugin<TOptions, TData>

/**
 * Plugin registration result
 */
export interface VisionPluginRegistration {
  /** Plugin ID */
  id: string
  
  /** Unregister function */
  unregister: () => Promise<void>
}

/**
 * Plugin metadata for introspection
 */
export interface VisionPluginMetadata {
  id: string
  version: string
  type: 'validator' | 'enhancer' | 'decoder' | 'ui' | 'analytics'
  name?: string
  description?: string
  author?: string
  homepage?: string
}

// ============================================================================
// PLUGIN EVENTS
// ============================================================================

/**
 * Plugin system events
 */
export interface VisionPluginEvents<TData = any> {
  /** Plugin registered */
  'plugin-registered': { pluginId: string }
  
  /** Plugin unregistered */
  'plugin-unregistered': { pluginId: string }
  
  /** Capture started */
  'capture-started': { captureType: CaptureType }
  
  /** Capture completed */
  'capture-completed': { result: CaptureResult<TData> }
  
  /** Capture failed */
  'capture-failed': { error: Error }
  
  /** Validation passed */
  'validation-passed': { result: CaptureResult<TData> }
  
  /** Validation failed */
  'validation-failed': { error: Error }
  
  /** Result enriched */
  'result-enriched': { result: CaptureResult<TData> }
  
  /** Custom plugin events */
  [key: string]: any
}

// ============================================================================
// SCANNER-SPECIFIC DATA TYPES
// ============================================================================

/**
 * VIN Scanner Data
 */
export interface VINData {
  vin: string
  make?: string
  model?: string
  year?: number
  manufacturer?: string
  [key: string]: any
}

/**
 * License Plate Data
 */
export interface LicensePlateData {
  plate: string
  state?: string
  country?: string
  [key: string]: any
}

/**
 * Odometer Data
 */
export interface OdometerData {
  value: number
  unit: 'miles' | 'kilometers'
  [key: string]: any
}

/**
 * Document Data
 */
export interface DocumentData {
  text: string
  structuredData?: Record<string, any>
  [key: string]: any
}
