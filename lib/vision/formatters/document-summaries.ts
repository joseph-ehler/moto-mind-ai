// Document-Specific Summary Generators
// ALL type-specific summary generation logic

import { DocumentType } from '../types'
import { formatDate, extractVendor, extractAmount, extractDate } from '../utils/formatting'

/**
 * Generates document type specific summaries
 */
export function generateTypeSpecificSummary(data: any, documentType: DocumentType): string | null {
  switch (documentType) {
    case 'service_invoice':
      return generateServiceSummary(data)
    
    case 'fuel_receipt':
      return generateFuelSummary(data)
    
    case 'dashboard_snapshot':
      return generateDashboardSummary(data)
    
    case 'insurance_card':
      return generateInsuranceSummary(data)
    
    case 'odometer':
      return generateOdometerSummary(data)
    
    case 'accident_report':
      return generateAccidentSummary(data)
    
    case 'inspection_certificate':
      return generateInspectionSummary(data)
    
    default:
      return null
  }
}

/**
 * Service invoice summary
 */
function generateServiceSummary(data: any): string {
  const parts: string[] = []
  
  // Service description
  const service = data.service_description || data.extracted_data?.service_description
  if (service) {
    parts.push(service)
  } else {
    parts.push('Service')
  }
  
  // Vendor
  const vendor = extractVendor(data)
  if (vendor) {
    parts.push(`at ${vendor}`)
  }
  
  // Amount
  const amount = extractAmount(data)
  if (amount) {
    parts.push(`for $${amount.toFixed(2)}`)
  }
  
  return parts.join(' ')
}

/**
 * Fuel receipt summary
 */
function generateFuelSummary(data: any): string {
  const parts: string[] = []
  
  // Amount and gallons
  const amount = extractAmount(data)
  const gallons = data.gallons || data.extracted_data?.gallons
  
  if (amount && gallons) {
    parts.push(`$${amount.toFixed(2)} • ${gallons} gallons`)
  } else if (amount) {
    parts.push(`$${amount.toFixed(2)} fuel`)
  } else {
    parts.push('Fuel purchase')
  }
  
  // Station
  const station = data.station_name || data.extracted_data?.station_name
  if (station) {
    parts.push(`• ${station}`)
  }
  
  // Price per gallon
  const ppg = data.price_per_gallon || data.extracted_data?.price_per_gallon
  if (ppg) {
    parts.push(`• $${ppg.toFixed(2)}/gal`)
  }
  
  return parts.join(' ')
}

/**
 * Dashboard snapshot summary
 */
function generateDashboardSummary(data: any): string {
  const parts: string[] = []
  
  // Odometer
  if (data.odometer_miles) {
    parts.push(`Odometer ${data.odometer_miles.toLocaleString()} mi`)
  }
  
  // Fuel level
  if (data.fuel_level_eighths !== null && data.fuel_level_eighths !== undefined) {
    const fuelDisplay = ['Empty', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞', 'Full'][data.fuel_level_eighths] || 'Unknown'
    parts.push(`Fuel ${fuelDisplay}`)
  }
  
  // Temperature
  if (data.coolant_temp?.status) {
    const tempStatus = data.coolant_temp.status === 'cold' ? 'Cold' :
                      data.coolant_temp.status === 'normal' ? 'Normal' : 'Hot'
    parts.push(`Temp ${tempStatus}`)
  }
  
  // Warning lights
  if (data.warning_lights && data.warning_lights.length > 0) {
    const lightNames = data.warning_lights
      .map((light: string) => light.replace(/_/g, ' '))
      .join(', ')
    parts.push(`Lamps: ${lightNames}`)
  }
  
  return parts.join(' • ') || 'Dashboard snapshot'
}

/**
 * Insurance card summary
 */
function generateInsuranceSummary(data: any): string {
  const parts: string[] = []
  
  // Company
  const company = data.insurance_company || data.extracted_data?.insurance_company
  if (company) {
    parts.push(`${company} insurance`)
  } else {
    parts.push('Insurance card')
  }
  
  // Policy number
  const policy = data.policy_number || data.extracted_data?.policy_number
  if (policy) {
    parts.push(`Policy ${policy}`)
  }
  
  // Expiration
  const expiration = data.expiration_date || data.extracted_data?.expiration_date
  if (expiration) {
    parts.push(`expires ${formatDate(expiration)}`)
  }
  
  return parts.join(' • ')
}

/**
 * Odometer reading summary
 */
function generateOdometerSummary(data: any): string {
  const miles = data.odometer_miles || data.mileage
  if (miles) {
    return `Odometer reading: ${miles.toLocaleString()} miles`
  }
  return 'Odometer reading'
}

/**
 * Accident report summary
 */
function generateAccidentSummary(data: any): string {
  const parts: string[] = []
  
  parts.push('Vehicle accident')
  
  // Location
  const location = data.location || data.extracted_data?.location
  if (location) {
    parts.push(`at ${location}`)
  }
  
  // Date
  const date = data.date || data.accident_date || data.extracted_data?.accident_date
  if (date) {
    parts.push(`on ${formatDate(date)}`)
  }
  
  return parts.join(' ')
}

/**
 * Inspection certificate summary
 */
function generateInspectionSummary(data: any): string {
  const parts: string[] = []
  
  // Result
  const result = data.result || data.extracted_data?.result
  if (result) {
    parts.push(`Vehicle inspection ${result}`)
  } else {
    parts.push('Vehicle inspection')
  }
  
  // Certificate number
  const certNumber = data.certificate_number || data.extracted_data?.certificate_number
  if (certNumber) {
    parts.push(`Certificate ${certNumber}`)
  }
  
  // Expiration
  const expiration = data.expiration_date || data.extracted_data?.expiration_date
  if (expiration) {
    parts.push(`expires ${formatDate(expiration)}`)
  }
  
  return parts.join(' • ')
}
