/**
 * Vision Feature - Main Export
 * 
 * Central export point for the vision feature.
 * Organized by layer for clean imports.
 * 
 * Usage:
 *   import { UnifiedCameraCapture } from '@/features/vision' // UI
 *   import { validateImage } from '@/features/vision/domain' // Logic  
 *   import { uploadImage } from '@/features/vision/data' // API
 *   import { useCamera } from '@/features/vision/hooks' // Hooks
 */

// UI Components (Phase 2 - Complete)
export * from './ui'

// Domain Logic (Phase 3 - To be extracted)
export * from './domain'

// Data Layer (Phase 3 - To be extracted)
export * from './data'

// React Hooks (Phase 3 - To be extracted)
export * from './hooks'
