// Response Formatting Module
// Handles human-readable summaries and driver-focused output formatting

export function makeHumanSummary(
  visionData: any, 
  vendor: string, 
  services: string[], 
  mileage: number | null
): string {
  if (!visionData) return 'Service record processed'
  
  // Build service summary
  let summary = ''
  
  if (mileage) {
    summary += `${mileage.toLocaleString()} mile service`
  } else {
    summary += 'Service'
  }
  
  // Add service details
  if (services && services.length > 0) {
    if (services.length === 1) {
      summary += ` • ${services[0]}`
    } else if (services.length === 2) {
      summary += ` • ${services.join(', ')}`
    } else {
      summary += ` • ${services.slice(0, 2).join(', ')} + ${services.length - 2} more`
    }
  }
  
  // Add vendor
  if (vendor && vendor !== 'Unknown Vendor') {
    summary += ` at ${vendor}`
  }
  
  // Add amount if available
  if (visionData.total_amount && typeof visionData.total_amount === 'number') {
    summary += ` • $${visionData.total_amount.toFixed(2)}`
  }
  
  return summary
}

export function generateDriverFocusedSummary(visionData: any): {
  primary: string;
  secondary: string;
  context: string;
  nextAction?: string;
} {
  const docType = classifyDocumentType(visionData)
  
  switch (docType) {
    case 'service':
      return generateServiceSummary(visionData)
    case 'fuel':
      return generateFuelSummary(visionData)
    case 'odometer':
      return generateOdometerSummary(visionData)
    default:
      return generateGenericSummary(visionData)
  }
}

function classifyDocumentType(visionData: any): string {
  if (visionData.fuel_amount || visionData.gallons) return 'fuel'
  if (visionData.odometer_reading && !visionData.service_description) return 'odometer'
  if (visionData.service_description || visionData.work_performed) return 'service'
  return 'generic'
}

function generateServiceSummary(visionData: any) {
  // Extract key service info
  const services = extractServiceList(visionData)
  const vendor = visionData.vendor_name || visionData.business_name || 'Service Center'
  const amount = visionData.total_amount
  const mileage = visionData.odometer_reading
  
  // Primary line: What was done
  let primary = services.length > 0 
    ? services.slice(0, 2).join(' • ')
    : 'Service completed'
  
  if (mileage) {
    primary = `${(mileage / 1000).toFixed(1)}K mile service • ${primary}`
  }
  
  // Secondary line: Where and how much
  let secondary = vendor
  if (amount) {
    secondary += ` • $${amount.toFixed(2)}`
  }
  if (visionData.date) {
    secondary += ` • ${formatDate(visionData.date)}`
  }
  
  // Context: Mileage and next service
  let context = ''
  if (mileage) {
    context = `At ${mileage.toLocaleString()} mi`
    const nextService = calculateNextServiceMileage(mileage, services)
    if (nextService) {
      context += ` • Next ~${(nextService / 1000).toFixed(1)}K mi`
    }
  }
  
  return { primary, secondary, context }
}

function generateFuelSummary(visionData: any) {
  const gallons = visionData.gallons || visionData.fuel_amount
  const totalAmount = visionData.total_amount
  const station = visionData.station_name || visionData.vendor_name || 'Gas Station'
  const pricePerGallon = gallons && totalAmount ? totalAmount / gallons : null
  
  // Primary: Fuel details
  let primary = 'Fuel'
  if (gallons) {
    primary += ` • ${gallons.toFixed(1)} gal`
    if (pricePerGallon) {
      primary += ` @ $${pricePerGallon.toFixed(2)}/gal`
    }
  }
  
  // Secondary: Station and total
  let secondary = station
  if (totalAmount) {
    secondary += ` • $${totalAmount.toFixed(2)}`
  }
  if (visionData.date) {
    secondary += ` • ${formatDate(visionData.date)}`
  }
  
  // Context: Mileage if available
  let context = ''
  if (visionData.odometer_reading) {
    context = `At ${visionData.odometer_reading.toLocaleString()} mi`
  }
  
  return { primary, secondary, context }
}

function generateOdometerSummary(visionData: any) {
  const mileage = visionData.odometer_reading
  
  const primary = `${mileage?.toLocaleString() || 'Unknown'} mi`
  const secondary = `Updated ${formatRelativeTime(new Date())}`
  const context = ''
  
  return { primary, secondary, context }
}

function generateGenericSummary(visionData: any) {
  const primary = 'Document processed'
  const secondary = visionData.vendor_name || visionData.business_name || 'Unknown source'
  const context = visionData.date ? formatDate(visionData.date) : ''
  
  return { primary, secondary, context }
}

function extractServiceList(visionData: any): string[] {
  const services = []
  
  // Extract from various fields
  if (visionData.service_description) {
    services.push(...parseServicesFromText(visionData.service_description))
  }
  
  if (visionData.work_performed) {
    services.push(...parseServicesFromText(visionData.work_performed))
  }
  
  if (visionData.line_items && Array.isArray(visionData.line_items)) {
    visionData.line_items.forEach(item => {
      if (item.description) {
        services.push(...parseServicesFromText(item.description))
      }
    })
  }
  
  // Deduplicate and clean
  return [...new Set(services)].filter(s => s && s.length > 0)
}

function parseServicesFromText(text: string): string[] {
  if (!text) return []
  
  const services = []
  const lowerText = text.toLowerCase()
  
  // Common service patterns
  const servicePatterns = {
    'oil change': /oil.*change|change.*oil/i,
    'filter replacement': /filter.*replace|replace.*filter|new.*filter/i,
    'tire rotation': /tire.*rotat|rotat.*tire/i,
    'brake service': /brake.*service|brake.*inspect|brake.*repair/i,
    'transmission service': /transmission.*service|trans.*service/i,
    'coolant service': /coolant|antifreeze/i,
    'spark plug replacement': /spark.*plug/i,
    'battery service': /battery.*service|battery.*replace/i,
    'alignment': /alignment|align/i,
    'balancing': /balanc/i
  }
  
  Object.entries(servicePatterns).forEach(([service, pattern]) => {
    if (pattern.test(text)) {
      services.push(service)
    }
  })
  
  return services
}

function calculateNextServiceMileage(currentMileage: number, services: string[]): number | null {
  if (!currentMileage || !services.length) return null
  
  // Service interval mapping
  const intervals = {
    'oil change': 5000,
    'major service': 30000,
    'transmission service': 60000,
    'coolant service': 60000,
    'spark plug replacement': 30000,
    'brake service': 25000,
    'tire rotation': 7500
  }
  
  // Find the shortest interval from current services
  let shortestInterval = 10000 // Default
  
  services.forEach(service => {
    const interval = intervals[service]
    if (interval && interval < shortestInterval) {
      shortestInterval = interval
    }
  })
  
  return currentMileage + shortestInterval
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  } catch {
    return dateStr
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export function generateEnhancedFields(visionData: any, captureType: string) {
  const enhanced = {
    // Driver-focused summary
    summary: generateDriverFocusedSummary(visionData),
    
    // Service-specific enhancements
    services: extractServiceList(visionData),
    
    // Smart predictions
    predictions: {
      nextServiceMileage: null,
      serviceCategory: null,
      costCategory: null
    },
    
    // Validation rollup
    validation: {
      confidence: 0.8,
      issues: [],
      verified_fields: []
    }
  }
  
  // Add service predictions
  if (visionData.odometer_reading) {
    enhanced.predictions.nextServiceMileage = calculateNextServiceMileage(
      visionData.odometer_reading, 
      enhanced.services
    )
  }
  
  // Categorize service
  if (enhanced.services.length > 0) {
    enhanced.predictions.serviceCategory = categorizeServiceType(enhanced.services)
  }
  
  // Categorize cost
  if (visionData.total_amount) {
    enhanced.predictions.costCategory = categorizeCost(visionData.total_amount, enhanced.services)
  }
  
  return enhanced
}

function categorizeServiceType(services: string[]): string {
  if (services.some(s => s.includes('oil'))) return 'routine_maintenance'
  if (services.some(s => s.includes('brake'))) return 'safety_critical'
  if (services.some(s => s.includes('transmission'))) return 'major_service'
  if (services.length >= 3) return 'comprehensive'
  return 'general_maintenance'
}

function categorizeCost(amount: number, services: string[]): string {
  if (amount < 50) return 'low_cost'
  if (amount < 200) return 'routine_cost'
  if (amount < 500) return 'moderate_cost'
  if (amount < 1000) return 'high_cost'
  return 'major_expense'
}
