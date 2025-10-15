/**
 * Vision Feature - Domain Logic
 * 
 * Pure business logic for vision processing.
 * No React dependencies, fully testable.
 * 
 * This layer addresses the "tight coupling" issue detected by AI analysis.
 * Components now use these pure functions via dependency injection.
 * 
 * Includes:
 * - Image validation logic
 * - OCR processing functions
 * - License plate detection algorithms
 * - Document classification logic
 * - Data transformation functions
 */

// Image Validation
export * from './image-validation'

// OCR Processing
export * from './ocr-processing'

// License Plate Detection
export * from './plate-detection'
