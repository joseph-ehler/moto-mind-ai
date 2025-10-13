/**
 * Vision Scanners
 * 
 * Layer 3: Domain-Specific Scanners
 * High-level components for specific use cases
 */

export { VINScanner } from './VINScanner'
export { OdometerReader } from './OdometerReader'
export { LicensePlateScanner } from './LicensePlateScanner'
export { DocumentScanner } from './DocumentScanner'
export { BatchDocumentScanner } from './BatchDocumentScanner'
export { BatchVisionScanner } from './BatchVisionScanner'
export { DriversLicenseScanner } from './DriversLicenseScanner'
export { InsuranceCardScanner } from './InsuranceCardScanner'

export type { VINData, VINScannerProps } from './VINScanner'
export type { OdometerData, OdometerReaderProps } from './OdometerReader'
export type { LicensePlateData, LicensePlateScannerProps } from './LicensePlateScanner'
export type {
  DocumentData,
  DocumentScannerProps,
  DocumentType
} from './DocumentScanner'
export type { BatchDocumentScannerProps } from './BatchDocumentScanner'
export type { BatchVisionScannerProps } from './BatchVisionScanner'
export type { DriversLicenseScannerProps } from './DriversLicenseScanner'
export type { InsuranceCardScannerProps } from './InsuranceCardScanner'
