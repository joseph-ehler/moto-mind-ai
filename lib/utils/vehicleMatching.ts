// Vehicle Association Logic - Handles edge cases and confidence scoring
export interface VehicleMatch {
  vehicle: any
  confidence: number
  reasons: string[]
  explanation: string
}

export interface DocumentData {
  type: string
  vin?: string
  license_plate?: string
  mileage?: number
  make?: string
  model?: string
  year?: number
  location?: string
  service_type?: string
  timestamp?: string
  [key: string]: any
}

export function calculateVehicleMatches(
  document: DocumentData, 
  vehicles: any[], 
  userHistory?: any[]
): VehicleMatch[] {
  console.log('🔍 Vehicle matching - Document data:', {
    type: document.type,
    vehicle_year: document.vehicle_year,
    vehicle_make: document.vehicle_make,
    vehicle_model: document.vehicle_model,
    mileage: document.mileage,
    vin: document.vin,
    license_plate: document.license_plate
  })
  
  return vehicles.map(vehicle => {
    console.log(`🚗 Checking vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`)
    let confidence = 0
    const reasons: string[] = []

    // EXPLICIT IDENTIFIERS (95%+ confidence)
    if (document.vin && document.vin === vehicle.vin) {
      confidence += 95
      reasons.push("VIN match")
    }

    if (document.license_plate && document.license_plate === vehicle.license_plate) {
      confidence += 95
      reasons.push("License plate match")
    }

    // STRONG HEURISTICS (30-50% each)
    if (document.mileage && vehicle.current_mileage) {
      const mileageDiff = Math.abs(document.mileage - vehicle.current_mileage)
      const tolerance = vehicle.current_mileage * 0.1 // 10% tolerance
      
      if (mileageDiff <= tolerance) {
        const mileageConfidence = Math.max(0, 40 - (mileageDiff / tolerance) * 20)
        confidence += mileageConfidence
        reasons.push(`Mileage within range (${mileageDiff.toLocaleString()} miles difference)`)
      }
    }

    // Vehicle make/model/year match - check multiple field names
    const docYear = document.year || document.vehicle_year
    const docMake = document.make || document.vehicle_make
    const docModel = document.model || document.vehicle_model
    
    const documentVehicle = `${docYear || ''} ${docMake || ''} ${docModel || ''}`.trim()
    const actualVehicle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    
    // Exact vehicle match (year + make + model)
    if (docYear && docMake && docModel) {
      console.log(`🔍 Checking exact match:`)
      console.log(`  Document: ${docYear} ${docMake} ${docModel}`)
      console.log(`  Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`)
      console.log(`  Year match: ${docYear} == ${vehicle.year} = ${docYear == vehicle.year}`)
      console.log(`  Make match: ${docMake.toLowerCase()} === ${vehicle.make.toLowerCase()} = ${docMake.toLowerCase() === vehicle.make.toLowerCase()}`)
      console.log(`  Model match: ${docModel.toLowerCase()} === ${vehicle.model.toLowerCase()} = ${docModel.toLowerCase() === vehicle.model.toLowerCase()}`)
      
      if (docYear == vehicle.year && 
          docMake.toLowerCase() === vehicle.make.toLowerCase() && 
          docModel.toLowerCase() === vehicle.model.toLowerCase()) {
        confidence += 90
        reasons.push("Exact vehicle match (year, make, model)")
        console.log(`✅ EXACT MATCH! Adding 90% confidence`)
      }
    }
    
    // Partial matches
    if (documentVehicle && documentVehicle.toLowerCase().includes(actualVehicle.toLowerCase())) {
      confidence += 35
      reasons.push("Vehicle details match")
    } else if (docMake && docMake.toLowerCase() === vehicle.make.toLowerCase()) {
      if (docModel && docModel.toLowerCase() === vehicle.model.toLowerCase()) {
        confidence += 50
        reasons.push("Make and model match")
      } else {
        confidence += 20
        reasons.push("Make matches")
      }
    }

    // PATTERN LEARNING (10-25% each)
    if (document.location && userHistory) {
      const locationPattern = checkLocationPattern(document.location, vehicle, userHistory)
      if (locationPattern.confidence > 0) {
        confidence += locationPattern.confidence
        reasons.push(locationPattern.reason)
      }
    }

    if (document.service_type && userHistory) {
      const servicePattern = checkServicePattern(document.service_type, vehicle, userHistory)
      if (servicePattern.confidence > 0) {
        confidence += servicePattern.confidence
        reasons.push(servicePattern.reason)
      }
    }

    // RECENCY BIAS (5-15%)
    if (vehicle.last_activity) {
      const hoursSinceActivity = (Date.now() - new Date(vehicle.last_activity).getTime()) / (1000 * 60 * 60)
      if (hoursSinceActivity < 24) {
        const recencyBonus = Math.max(0, 15 - hoursSinceActivity)
        confidence += recencyBonus
        reasons.push("Recently active vehicle")
      }
    }

    // Cap confidence at 100%
    confidence = Math.min(confidence, 100)

    // Generate explanation
    const explanation = generateExplanation(confidence, reasons)

    return {
      vehicle,
      confidence: Math.round(confidence),
      reasons,
      explanation
    }
  }).sort((a, b) => b.confidence - a.confidence) // Sort by confidence descending
}

function checkLocationPattern(location: string, vehicle: any, userHistory: any[]): { confidence: number, reason: string } {
  // Check if user has historically used this vehicle at this location
  const locationMatches = userHistory.filter(h => 
    h.vehicle_id === vehicle.id && 
    h.location && 
    h.location.toLowerCase().includes(location.toLowerCase())
  )

  if (locationMatches.length >= 3) {
    return { confidence: 20, reason: "Frequently used at this location" }
  } else if (locationMatches.length >= 1) {
    return { confidence: 10, reason: "Previously used at this location" }
  }

  return { confidence: 0, reason: "" }
}

function checkServicePattern(serviceType: string, vehicle: any, userHistory: any[]): { confidence: number, reason: string } {
  // Check if this vehicle typically gets this type of service
  const serviceMatches = userHistory.filter(h => 
    h.vehicle_id === vehicle.id && 
    h.service_type && 
    h.service_type.toLowerCase().includes(serviceType.toLowerCase())
  )

  if (serviceMatches.length >= 2) {
    return { confidence: 15, reason: "Common service for this vehicle" }
  } else if (serviceMatches.length >= 1) {
    return { confidence: 8, reason: "Previous similar service" }
  }

  return { confidence: 0, reason: "" }
}

function generateExplanation(confidence: number, reasons: string[]): string {
  if (confidence >= 85) {
    return `High confidence match: ${reasons.slice(0, 2).join(", ")}`
  } else if (confidence >= 60) {
    return `Possible match: ${reasons.slice(0, 2).join(", ")}`
  } else if (confidence >= 30) {
    return `Weak match: ${reasons.slice(0, 1).join("")}`
  } else {
    return "No clear indicators for this vehicle"
  }
}

export function getAssociationStrategy(matches: VehicleMatch[]): {
  strategy: 'auto' | 'confirm' | 'select' | 'new_vehicle'
  bestMatch?: VehicleMatch
  message: string
} {
  if (matches.length === 0) {
    return {
      strategy: 'new_vehicle',
      message: "No vehicles found. Would you like to add a new vehicle?"
    }
  }

  const bestMatch = matches[0]

  if (bestMatch.confidence >= 85) {
    return {
      strategy: 'auto',
      bestMatch,
      message: `Auto-associated with ${bestMatch.vehicle.year} ${bestMatch.vehicle.make} ${bestMatch.vehicle.model}`
    }
  } else if (bestMatch.confidence >= 60) {
    return {
      strategy: 'confirm',
      bestMatch,
      message: `Is this for your ${bestMatch.vehicle.year} ${bestMatch.vehicle.make} ${bestMatch.vehicle.model}?`
    }
  } else {
    return {
      strategy: 'select',
      message: "Which vehicle is this document for?"
    }
  }
}

// Learning from corrections
export function recordAssociationCorrection(
  document: DocumentData,
  wrongVehicle: any,
  correctVehicle: any,
  userReason?: string
) {
  const correction = {
    timestamp: new Date().toISOString(),
    document_type: document.type,
    location: document.location,
    service_type: document.service_type,
    wrong_vehicle_id: wrongVehicle.id,
    correct_vehicle_id: correctVehicle.id,
    user_reason: userReason,
    // Store pattern for future learning
    pattern: {
      time_of_day: new Date().getHours(),
      day_of_week: new Date().getDay(),
      document_characteristics: {
        has_mileage: !!document.mileage,
        has_location: !!document.location,
        service_type: document.service_type
      }
    }
  }

  // TODO: Store in database for pattern learning
  console.log('Association correction recorded:', correction)
  
  return correction
}
