// Service Processing Module
// Handles service extraction, categorization, and scheduling logic

// Helper functions for driver-focused service processing
export function extractServices(serviceText: string): string[] {
  if (!serviceText) return []
  
  const text = serviceText.toLowerCase()
  const services = []
  
  // Handle interval maintenance services
  if (text.includes('mile') && (text.includes('interval') || text.includes('maintenance'))) {
    services.push('oil change')
    services.push('filter replacement')
    if (text.includes('52.5k') || text.includes('52500')) {
      services.push('transmission service')
    }
  }
  
  // Common service patterns
  if (text.includes('oil') && (text.includes('change') || text.includes('service'))) {
    services.push('oil change')
  }
  if (text.includes('filter') && !services.includes('filter replacement')) {
    services.push('filter replacement')
  }
  if (text.includes('tire') && text.includes('rotat')) {
    services.push('tire rotation')
  }
  if (text.includes('brake')) {
    services.push('brake service')
  }
  if (text.includes('transmission')) {
    services.push('transmission service')
  }
  if (text.includes('coolant') || text.includes('antifreeze')) {
    services.push('coolant service')
  }
  if (text.includes('spark plug')) {
    services.push('spark plug replacement')
  }
  if (text.includes('air filter')) {
    services.push('air filter replacement')
  }
  if (text.includes('cabin filter')) {
    services.push('cabin filter replacement')
  }
  if (text.includes('battery')) {
    services.push('battery service')
  }
  if (text.includes('alignment')) {
    services.push('wheel alignment')
  }
  if (text.includes('balance')) {
    services.push('wheel balancing')
  }
  
  return [...new Set(services)] // Remove duplicates
}

export function categorizeService(services: string[], serviceText: string): string {
  const text = serviceText.toLowerCase()
  
  // Check for major service indicators
  if (text.includes('major') || text.includes('comprehensive') || services.length >= 4) {
    return 'major_service'
  }
  
  // Check for specific service types
  if (services.some(s => s.includes('oil'))) {
    return 'oil_change'
  }
  
  if (services.some(s => s.includes('brake'))) {
    return 'brake_service'
  }
  
  if (services.some(s => s.includes('tire'))) {
    return 'tire_service'
  }
  
  return 'general_maintenance'
}

export function calculateNextService(services: string[], currentMiles: number | null, category: string): number | null {
  if (!currentMiles) return null
  
  // Service interval mapping
  const intervals = {
    'oil_change': 5000,
    'major_service': 30000,
    'brake_service': 25000,
    'tire_service': 15000,
    'general_maintenance': 10000
  }
  
  const interval = intervals[category] || 10000
  return currentMiles + interval
}

export function normalizeServices(serviceText: string, lineItems: any[]): string[] {
  const extractedServices = extractServices(serviceText)
  
  // Also check line items for additional services
  const lineItemServices = []
  
  if (lineItems && Array.isArray(lineItems)) {
    lineItems.forEach(item => {
      if (item.description) {
        const itemServices = extractServices(item.description)
        lineItemServices.push(...itemServices)
      }
    })
  }
  
  // Combine and deduplicate
  const allServices = [...extractedServices, ...lineItemServices]
  return [...new Set(allServices)]
}

export function tagServicesV1(visionData: any): string[] {
  const services = []
  
  try {
    // Extract from main service description
    if (visionData.service_description) {
      services.push(...extractServices(visionData.service_description))
    }
    
    // Extract from work performed
    if (visionData.work_performed) {
      services.push(...extractServices(visionData.work_performed))
    }
    
    // Extract from line items
    if (visionData.line_items && Array.isArray(visionData.line_items)) {
      visionData.line_items.forEach(item => {
        if (item.description) {
          services.push(...extractServices(item.description))
        }
        if (item.service_type) {
          services.push(...extractServices(item.service_type))
        }
      })
    }
    
    // Extract from parts list
    if (visionData.parts && Array.isArray(visionData.parts)) {
      visionData.parts.forEach(part => {
        if (part.description) {
          // Infer service from parts
          const partDesc = part.description.toLowerCase()
          if (partDesc.includes('oil filter')) services.push('oil change')
          if (partDesc.includes('air filter')) services.push('air filter replacement')
          if (partDesc.includes('brake pad')) services.push('brake service')
          if (partDesc.includes('spark plug')) services.push('spark plug replacement')
        }
      })
    }
    
    // Extract from recommendations
    if (visionData.recommendations && Array.isArray(visionData.recommendations)) {
      visionData.recommendations.forEach(rec => {
        if (rec.service) {
          services.push(...extractServices(rec.service))
        }
      })
    }
    
  } catch (error) {
    console.warn('Error extracting services:', error)
  }
  
  // Clean and deduplicate
  return [...new Set(services.filter(s => s && s.trim().length > 0))]
}
