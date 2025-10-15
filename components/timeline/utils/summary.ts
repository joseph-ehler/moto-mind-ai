// Timeline Event Summary Generation Utilities
// Pure functions for creating human-readable event summaries

import { TimelineEvent } from '../VehicleTimeline'
import { resolveVendor } from './vendor'

// Generate human-readable summary for any event type
export function makeHumanSummary(event: TimelineEvent): string {
  const vendor = resolveVendor(event)
  const amount = extractAmount(event)
  
  switch (event.type) {
    case 'service':
    case 'maintenance':
      return makeServiceSummary(event, vendor, amount)
    
    case 'fuel':
      return makeFuelSummary(event, vendor, amount)
    
    case 'odometer':
      return makeOdometerSummary(event)
    
    case 'dashboard_snapshot':
      return makeDashboardSummary(event)
    
    case 'repair':
      return makeRepairSummary(event, vendor, amount)
    
    case 'inspection':
      return makeInspectionSummary(event, vendor)
    
    case 'insurance':
      return makeInsuranceSummary(event)
    
    case 'accident':
      return makeAccidentSummary(event)
    
    case 'document':
      return makeDocumentSummary(event)
    
    default:
      return `${event.type} event${vendor ? ` at ${vendor}` : ''}${amount ? ` - ${amount}` : ''}`
  }
}

// Extract monetary amount from various payload structures
function extractAmount(event: TimelineEvent): string | null {
  const payload = event.payload
  if (!payload) return null
  
  const amount = payload.total_amount || 
                payload.extracted_data?.total_amount ||
                payload.amount ||
                payload.extracted_data?.amount
  
  if (typeof amount === 'number') {
    return `$${amount.toFixed(2)}`
  }
  
  return null
}

// Service/Maintenance summary
function makeServiceSummary(event: TimelineEvent, vendor: string | null, amount: string | null): string {
  const service = event.payload?.service_description || 
                 event.payload?.extracted_data?.service_description ||
                 'Service'
  
  let summary = service
  if (vendor) summary += ` at ${vendor}`
  if (amount) summary += ` - ${amount}`
  
  return summary
}

// Fuel summary
function makeFuelSummary(event: TimelineEvent, vendor: string | null, amount: string | null): string {
  const gallons = event.payload?.gallons || event.payload?.extracted_data?.gallons
  const pricePerGallon = event.payload?.price_per_gallon || event.payload?.extracted_data?.price_per_gallon
  
  let summary = 'Fuel'
  if (gallons) summary += ` ${gallons} gal`
  if (vendor) summary += ` at ${vendor}`
  if (pricePerGallon) summary += ` @ $${pricePerGallon}/gal`
  if (amount) summary += ` - ${amount}`
  
  return summary
}

// Odometer summary
function makeOdometerSummary(event: TimelineEvent): string {
  const miles = event.miles || event.payload?.miles || event.payload?.odometer_miles
  return miles ? `Odometer reading: ${miles.toLocaleString()} miles` : 'Odometer reading'
}

// Dashboard snapshot summary
function makeDashboardSummary(event: TimelineEvent): string {
  return event.payload?.data?.summary || 'Dashboard snapshot'
}

// Repair summary
function makeRepairSummary(event: TimelineEvent, vendor: string | null, amount: string | null): string {
  const description = event.payload?.repair_description || 
                     event.payload?.extracted_data?.repair_description ||
                     'Repair'
  
  let summary = description
  if (vendor) summary += ` at ${vendor}`
  if (amount) summary += ` - ${amount}`
  
  return summary
}

// Inspection summary
function makeInspectionSummary(event: TimelineEvent, vendor: string | null): string {
  const result = event.payload?.result || event.payload?.extracted_data?.result
  const type = event.payload?.inspection_type || event.payload?.extracted_data?.inspection_type || 'Inspection'
  
  let summary = type
  if (result) summary += ` - ${result.toUpperCase()}`
  if (vendor) summary += ` at ${vendor}`
  
  return summary
}

// Insurance summary
function makeInsuranceSummary(event: TimelineEvent): string {
  const company = event.payload?.insurance_company || event.payload?.extracted_data?.insurance_company
  const policyNumber = event.payload?.policy_number || event.payload?.extracted_data?.policy_number
  
  let summary = 'Insurance'
  if (company) summary += ` - ${company}`
  if (policyNumber) summary += ` (${policyNumber})`
  
  return summary
}

// Accident summary
function makeAccidentSummary(event: TimelineEvent): string {
  const description = event.payload?.description || event.payload?.extracted_data?.description
  const severity = event.payload?.severity || event.payload?.extracted_data?.severity
  
  let summary = 'Accident'
  if (severity) summary += ` - ${severity}`
  if (description) summary += `: ${description}`
  
  return summary
}

// Document summary
function makeDocumentSummary(event: TimelineEvent): string {
  const docType = event.payload?.document_type || event.payload?.extracted_data?.document_type
  return docType ? `${docType.replace('_', ' ')} document` : 'Document'
}
