/**
 * VIN Service Types
 * Type definitions for VIN decoding and enrichment
 */

export interface VINDecodeResult {
  vin: string
  vehicle: {
    year: number
    make: string
    model: string
    trim?: string
    displayName: string // "2019 Honda Civic LX Sedan"
  }
  specs: {
    bodyType?: string
    engine?: string
    transmission?: string
    driveType?: string
    fuelType?: string
  }
  extendedSpecs?: {
    // Engine details
    engineCylinders?: string
    engineDisplacement?: string
    engineHP?: string
    transmissionSpeeds?: string
    fuelTypeSecondary?: string
    // Safety features
    absType?: string
    airBagLocations?: string
    electronicStabilityControl?: string
    tractionControl?: string
    blindSpotWarning?: string
    forwardCollisionWarning?: string
    laneDepartureWarning?: string
    parkAssist?: string
    rearVisibilitySystem?: string
    // Vehicle specs
    doors?: string
    seats?: string
    wheelbase?: string
    gvwr?: string
    // Manufacturing
    plantCountry?: string
    plantCity?: string
    plantState?: string
    manufacturer?: string
    location?: string // Formatted: "City, STATE, Country"
  }
  mockData: {
    mpgCity: number
    mpgHighway: number
    maintenanceInterval: number // miles
    annualCost: number // dollars
  }
  aiInsights: {
    summary: string // 2 sentences
    reliabilityScore: number // 0-1
    maintenanceTip: string
    costTip: string
  }
}

export interface NHTSAResult {
  Variable: string
  Value: string
  ValueId: string | null
}

export interface NHTSAResponse {
  Count: number
  Message: string
  SearchCriteria: string
  Results: NHTSAResult[]
}
