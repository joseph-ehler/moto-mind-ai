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
  // NEW: Complete NHTSA raw data (100% preservation!)
  nhtsaComplete: Record<string, string>
  // NEW: Extraction quality metadata
  extractionMetadata: {
    totalFields: number
    fieldsWithData: number
    fieldsExtracted: number
    extractionRate: number
    missingFields: string[]
  }
  // NEW: Normalized data (clean, typed, queryable!)
  normalized: import('./normalized-types').NormalizedVehicleData
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
    // NEW: Additional high-value safety features (Oct 19, 2025)
    backupCamera?: string
    adaptiveCruiseControl?: string
    brakeSystemType?: string
    tpmsType?: string
    autoReverseSystem?: string
    keylessIgnition?: string
    laneCenteringAssistance?: string
    blindSpotIntervention?: string
    rearCrossTrafficAlert?: string
    pedestrianAEB?: string
    dynamicBrakeSupport?: string
    crashImminentBraking?: string
    // Convenience features
    entertainmentSystem?: string
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
  epaData?: {
    isRealData: true
    annualFuelCost: number
    combinedMPG: number
    co2Emissions: number
  } | null
  recalls?: Array<{
    Component: string
    Summary: string
    Consequence?: string
    Remedy?: string
  }> | null
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
