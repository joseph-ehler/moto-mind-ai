/**
 * VIN Service Public API
 * Clean exports for VIN decoding functionality
 */

export { decodeVIN } from './decoder'
export { isValidVIN, isValidVINFormat, sanitizeVIN } from './validator'
export type { VINDecodeResult } from './types'
