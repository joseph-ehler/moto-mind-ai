/**
 * Vision Plugins - Barrel Export
 * 
 * Central export point for Vision plugin system
 */

// Core types and manager
export { VisionPluginManager } from './plugin-manager'
export type {
  VisionPlugin,
  VisionPluginContext,
  VisionPluginHooks,
  VisionPluginFactory,
  VisionPluginRegistration,
  VisionPluginMetadata,
  VisionPluginEvents,
  RetryDecision,
  VINData,
  LicensePlateData,
  OdometerData,
  DocumentData
} from './types'

// Hooks
export { useVisionPluginManager } from './hooks'
export type {
  UseVisionPluginManagerOptions,
  UseVisionPluginManagerReturn
} from './hooks'

// Example Plugins
export {
  vinValidation,
  confidenceScoring,
  vinDecoding
} from './examples'
export type {
  VINValidationOptions,
  VINValidationResult,
  ConfidenceScoringOptions,
  ConfidenceCheckResult,
  VINDecodingOptions,
  DecodedVehicleInfo
} from './examples'
