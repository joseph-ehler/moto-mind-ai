/**
 * Normalized VIN Data Types
 * Clean, typed interfaces for standardized vehicle data
 */

export type FeatureAvailability = 
  | 'standard'      // Comes with vehicle
  | 'optional'      // Available but costs extra
  | 'not_available' // Not offered
  | 'unknown'       // Not specified

export type YesNo = 'yes' | 'no' | 'unknown'

export interface NormalizedSafetyFeatures {
  // Advanced Driver Assistance
  adaptiveCruiseControl: FeatureAvailability
  blindSpotMonitoring: FeatureAvailability
  laneKeepingAssist: FeatureAvailability
  laneCenteringAssist: FeatureAvailability
  laneDepartureWarning: FeatureAvailability
  
  // Collision Prevention
  forwardCollisionWarning: FeatureAvailability
  automaticEmergencyBraking: FeatureAvailability
  pedestrianDetection: FeatureAvailability
  rearCrossTrafficAlert: FeatureAvailability
  dynamicBrakeSupport: FeatureAvailability
  crashImminentBraking: FeatureAvailability
  
  // Cameras & Sensors
  backupCamera: FeatureAvailability
  parkingAssist: FeatureAvailability
  rearAutoEmergencyBraking: FeatureAvailability
  
  // Core Safety
  abs: FeatureAvailability
  electronicStabilityControl: FeatureAvailability
  tractionControl: FeatureAvailability
  
  // Air Bags
  airBags: {
    front: YesNo
    side: YesNo
    curtain: YesNo
    knee: YesNo
  }
  
  // Monitoring Systems
  tpms: 'direct' | 'indirect' | 'none' | 'unknown'
  eventDataRecorder: YesNo
  automaticCrashNotification: YesNo
  
  // Lights
  daytimeRunningLights: FeatureAvailability
  headlampLightSource: string | null
  adaptiveDrivingBeam: FeatureAvailability
  
  // Other
  keylessIgnition: FeatureAvailability
  autoReverseWindows: FeatureAvailability
  seatBeltPretensioner: YesNo
  
  // Automation
  saeAutomationLevel: string | null
}

export interface NormalizedPerformance {
  engine: {
    cylinders: number | null
    displacement: {
      liters: number | null
      cubicInches: number | null
      cc: number | null
    }
    configuration: string | null
    model: string | null
    manufacturer: string | null
    valveTrain: string | null
    coolingType: string | null
    fuelInjectionType: string | null
    turbo: YesNo
    horsepower: number | null
    horsepowerTo: number | null
    kilowatts: number | null
    topSpeedMph: number | null
  }
  
  drivetrain: {
    type: 'fwd' | 'rwd' | 'awd' | '4wd' | 'unknown'
    transmission: string | null
    transmissionSpeeds: number | null
  }
  
  dimensions: {
    doors: number | null
    seats: number | null
    seatRows: number | null
    curbWeightLbs: number | null
    gvwrLbs: number | null
    gvwrToLbs: number | null
    gcwrLbs: number | null
    wheelbaseInches: number | null
    wheelbaseType: string | null
    trackWidthInches: number | null
    wheelSizeFrontInches: number | null
    wheelSizeRearInches: number | null
    numberOfWheels: number | null
  }
  
  fuel: {
    primaryType: string | null
    secondaryType: string | null
  }
}

export interface NormalizedElectricVehicle {
  electrificationLevel: string | null
  isEV: boolean
  isHybrid: boolean
  isPluginHybrid: boolean
  
  battery: {
    type: string | null
    kwhFrom: number | null
    kwhTo: number | null
    voltageFrom: number | null
    voltageTo: number | null
    currentFrom: number | null
    currentTo: number | null
    modules: number | null
    packs: number | null
  }
  
  charging: {
    level: string | null
    powerKw: number | null
  }
  
  driveUnit: string | null
}

export interface NormalizedTruckFeatures {
  isTruck: boolean
  
  bed: {
    type: string | null
    lengthInches: number | null
  }
  
  cab: {
    type: string | null
  }
  
  axles: {
    count: number | null
    configuration: string | null
  }
}

export interface NormalizedManufacturing {
  manufacturer: string | null
  manufacturerId: string | null
  
  plant: {
    city: string | null
    state: string | null
    country: string | null
    companyName: string | null
    location: string | null // Formatted: "City, STATE, Country"
  }
  
  basePrice: number | null
}

export interface NormalizedVehicleData {
  // Basic (clean)
  vin: string
  year: number
  make: string
  model: string
  trim: string | null
  trim2: string | null
  series: string | null
  series2: string | null
  bodyClass: string | null
  vehicleType: string | null
  
  // Normalized features
  safety: NormalizedSafetyFeatures
  performance: NormalizedPerformance
  electric: NormalizedElectricVehicle
  truck: NormalizedTruckFeatures
  manufacturing: NormalizedManufacturing
  
  // Metadata
  normalization: {
    normalizedAt: Date
    version: string
    fieldsNormalized: number
    dataQuality: {
      safetyFeaturesPopulated: number
      performanceFieldsPopulated: number
      completeness: number // 0-100
    }
  }
}
