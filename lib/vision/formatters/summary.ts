// Core Summary Generation
// ONLY entry point - delegates to specialized modules

import { DocumentType } from '../types'
import { generateTypeSpecificSummary } from './document-summaries'
import { extractVendor, extractAmount, extractDate, formatDate } from '../utils/formatting'

/**
 * Main entry point for generating human-readable summaries
 */
export function makeHumanSummary(data: any, documentType?: DocumentType): string {
  if (!data || typeof data !== 'object') {
    return 'Document processed'
  }
  
  // Use document type specific summary if available
  if (documentType) {
    const specificSummary = generateTypeSpecificSummary(data, documentType)
    if (specificSummary) {
      return specificSummary
    }
  }
  
  // Fallback to generic summary
  return generateGenericSummary(data)
}

/**
 * Generic summary for unknown document types
 */
function generateGenericSummary(data: any): string {
  const parts: string[] = []
  
  // Try to find the most important information
  const vendor = extractVendor(data)
  const amount = extractAmount(data)
  const date = extractDate(data)
  
  if (vendor && amount) {
    parts.push(`${vendor} - $${amount.toFixed(2)}`)
  } else if (vendor) {
    parts.push(vendor)
  } else if (amount) {
    parts.push(`$${amount.toFixed(2)}`)
  }
  
  if (date) {
    parts.push(formatDate(date))
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'Document processed'
}

/**
 * Legacy compatibility function
 */
export function generateDriverFocusedSummary(data: any, documentType?: DocumentType): string {
  return makeHumanSummary(data, documentType)
}
