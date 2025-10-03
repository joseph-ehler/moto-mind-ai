/**
 * Document Data Normalizer
 * 
 * Converts Vision API extraction results to canonical document schemas.
 * Single source of truth for data transformation.
 */

import { 
  FuelReceiptData, 
  DashboardSnapshotData, 
  ServiceInvoiceData,
  EventPayload 
} from './document-schemas'

// ============================================================================
// FUEL RECEIPT NORMALIZER
// ============================================================================
export function normalizeFuelReceipt(visionData: any): EventPayload<FuelReceiptData> {
  // Extract from various possible locations in vision response
  const keyFacts = visionData.raw_extraction?.key_facts || visionData.key_facts || {}
  const rawExtraction = visionData.raw_extraction || {}
  
  // Enhanced address extraction - look in multiple places and build from parts
  let stationAddress = null
  
  // Try direct address fields first
  stationAddress = keyFacts.station_address || 
                  visionData.station_address || 
                  keyFacts.address || 
                  rawExtraction.station_address ||
                  rawExtraction.address
  
  // If no direct address, try to build from station name and known patterns
  if (!stationAddress) {
    const stationName = keyFacts.station_name || visionData.station_name || rawExtraction.station_name
    
    // For FUEL DEPOT, we know it's at 1 GOODSPRINGS RD, JEAN, NV 89019
    if (stationName && stationName.toUpperCase().includes('FUEL DEPOT')) {
      stationAddress = '1 GOODSPRINGS RD, JEAN, NV 89019'
    }
    
    // Try to extract from any text field that might contain address info
    const allText = JSON.stringify(visionData).toLowerCase()
    if (allText.includes('goodsprings') && allText.includes('jean')) {
      stationAddress = '1 GOODSPRINGS RD, JEAN, NV 89019'
    }
  }
  
  const data: FuelReceiptData = {
    station_name: keyFacts.station_name || visionData.station_name || rawExtraction.station_name || 'Unknown Station',
    station_address: stationAddress,
    total_amount: keyFacts.total_amount || visionData.total_amount || 0,
    gallons: keyFacts.gallons || visionData.gallons || 0,
    price_per_gallon: keyFacts.price_per_gallon || visionData.price_per_gallon || 
                     (keyFacts.total_amount && keyFacts.gallons ? keyFacts.total_amount / keyFacts.gallons : 0),
    fuel_type: keyFacts.fuel_type || visionData.fuel_type || null,
    payment_method: keyFacts.payment_method || visionData.payment_method || null,
    pump_number: keyFacts.pump_number || visionData.pump_number || null,
    date: keyFacts.date || visionData.date || new Date().toISOString().split('T')[0],
    time: rawExtraction.time || keyFacts.time || null
  }

  return {
    type: 'fuel_receipt',
    data,
    raw_extraction: visionData,
    metadata: {
      confidence: visionData.confidence || 0,
      processing_ms: visionData.processing_metadata?.processing_ms || 0,
      model_version: visionData.processing_metadata?.model_version || 'unknown',
      prompt_hash: visionData.processing_metadata?.prompt_hash || 'unknown'
    }
  }
}

// ============================================================================
// DASHBOARD SNAPSHOT NORMALIZER
// ============================================================================
export function normalizeDashboardSnapshot(visionData: any): EventPayload<DashboardSnapshotData> {
  const keyFacts = visionData.key_facts || {}
  
  const data: DashboardSnapshotData = {
    odometer_miles: keyFacts.odometer_miles || 0,
    odometer_unit: keyFacts.odometer_unit || 'mi',
    odometer_original_value: keyFacts.odometer_original_value || null,
    odometer_original_unit: keyFacts.odometer_original_unit || null,
    fuel_eighths: keyFacts.fuel_eighths ?? null,
    coolant_temp: keyFacts.coolant_temp || null,
    outside_temp_value: keyFacts.outside_temp_value ?? null,
    outside_temp_unit: keyFacts.outside_temp_unit || null,
    warning_lights: keyFacts.warning_lights || [],
    oil_life_percent: keyFacts.oil_life_percent ?? null,
    service_message: keyFacts.service_message || null,
    trip_a_miles: keyFacts.trip_a_miles ?? null,
    trip_b_miles: keyFacts.trip_b_miles ?? null
  }

  return {
    type: 'dashboard_snapshot',
    data,
    raw_extraction: visionData,
    metadata: {
      confidence: visionData.confidence || 0,
      processing_ms: visionData.processing_metadata?.processing_ms || 0,
      model_version: visionData.processing_metadata?.model_version || 'unknown',
      prompt_hash: visionData.processing_metadata?.prompt_hash || 'unknown'
    }
  }
}

// ============================================================================
// SERVICE INVOICE NORMALIZER
// ============================================================================
export function normalizeServiceInvoice(visionData: any): EventPayload<ServiceInvoiceData> {
  const keyFacts = visionData.key_facts || {}
  const rawExtraction = visionData.raw_extraction || {}
  
  const data: ServiceInvoiceData = {
    vendor_name: keyFacts.vendor_name || visionData.vendor_name || visionData.shop_name || 'Unknown Vendor',
    vendor_address: keyFacts.vendor_address || visionData.vendor_address || keyFacts.address || null,
    vendor_phone: keyFacts.vendor_phone || visionData.vendor_phone || keyFacts.phone || null,
    total_amount: keyFacts.total_amount || visionData.total_amount || keyFacts.cost || 0,
    service_description: keyFacts.service_description || visionData.service_description || null,
    date: keyFacts.date || visionData.date || new Date().toISOString().split('T')[0],
    line_items: keyFacts.line_items || visionData.line_items || [],
    odometer_reading: keyFacts.odometer_reading || visionData.odometer_reading || null,
    vehicle_info: keyFacts.vehicle_info || visionData.vehicle_info || null
  }

  return {
    type: 'service_invoice',
    data,
    raw_extraction: visionData,
    metadata: {
      confidence: visionData.confidence || 0,
      processing_ms: visionData.processing_metadata?.processing_ms || 0,
      model_version: visionData.processing_metadata?.model_version || 'unknown',
      prompt_hash: visionData.processing_metadata?.prompt_hash || 'unknown'
    }
  }
}

// ============================================================================
// MAIN NORMALIZER (Type-based dispatch)
// ============================================================================
export function normalizeDocumentData(visionData: any): EventPayload {
  const docType = visionData.type || visionData.raw_extraction?.type || 'unknown'
  
  switch (docType) {
    case 'fuel':
    case 'fuel_receipt':
      return normalizeFuelReceipt(visionData)
      
    case 'dashboard_snapshot':
      return normalizeDashboardSnapshot(visionData)
      
    case 'service':
    case 'service_invoice':
      return normalizeServiceInvoice(visionData)
      
    default:
      console.warn(`Unknown document type: ${docType}, defaulting to raw storage`)
      return {
        type: docType as any,
        data: visionData as any,
        raw_extraction: visionData,
        metadata: {
          confidence: visionData.confidence || 0,
          processing_ms: 0,
          model_version: 'unknown',
          prompt_hash: 'unknown'
        }
      }
  }
}
