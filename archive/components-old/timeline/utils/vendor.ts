// Timeline Event Vendor Resolution Utilities
// Pure functions for extracting and cleaning vendor information

import { TimelineEvent } from '../VehicleTimeline'

// Resolve vendor name with precedence and cleanup
export function resolveVendor(event: TimelineEvent): string | null {
  // Try multiple sources in order of preference
  const sources = [
    event.payload?.vendor_name,
    event.payload?.extracted_data?.vendor_name,
    event.payload?.station_name,
    event.payload?.extracted_data?.station_name,
    event.payload?.business_name,
    event.payload?.extracted_data?.business_name
  ]
  
  for (const source of sources) {
    if (source && typeof source === 'string') {
      const cleaned = cleanVendorName(source)
      if (cleaned) return cleaned
    }
  }
  
  return null
}

// Clean vendor name by removing common suffixes and normalizing
function cleanVendorName(vendor: string): string {
  if (!vendor || typeof vendor !== 'string') return ''
  
  // Remove common business suffixes and role labels
  const cleaned = vendor
    .replace(/\b(LLC|Inc|Corp|Corporation|Ltd|Limited|Co|Company)\b\.?/gi, '')
    .replace(/\b(Automotive|Auto|Service|Services|Repair|Shop|Center|Station)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  return cleaned || vendor // Return original if cleaning resulted in empty string
}

// Extract vendor from various payload structures
export function extractVendorWithPrecedence(payload: any): string | null {
  if (!payload) return null
  
  // Direct vendor fields
  if (payload.vendor_name) return cleanVendorName(payload.vendor_name)
  if (payload.station_name) return cleanVendorName(payload.station_name)
  if (payload.business_name) return cleanVendorName(payload.business_name)
  
  // Nested in extracted_data
  if (payload.extracted_data) {
    if (payload.extracted_data.vendor_name) return cleanVendorName(payload.extracted_data.vendor_name)
    if (payload.extracted_data.station_name) return cleanVendorName(payload.extracted_data.station_name)
    if (payload.extracted_data.business_name) return cleanVendorName(payload.extracted_data.business_name)
  }
  
  return null
}
