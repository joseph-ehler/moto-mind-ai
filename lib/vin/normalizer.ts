/**
 * VIN Data Normalizer
 * Cleans and standardizes NHTSA data for consistent user display
 */

/**
 * Normalize country names to readable format
 */
export function normalizeCountry(country?: string): string | undefined {
  if (!country) return undefined
  
  const normalized = country.toUpperCase().trim()
  
  // Common patterns
  const countryMap: Record<string, string> = {
    'UNITED STATES (USA)': 'USA',
    'UNITED STATES': 'USA',
    'CANADA': 'Canada',
    'MEXICO': 'Mexico',
    'JAPAN': 'Japan',
    'GERMANY': 'Germany',
    'SOUTH KOREA': 'South Korea',
    'UNITED KINGDOM': 'UK',
    'FRANCE': 'France',
    'ITALY': 'Italy',
    'SWEDEN': 'Sweden',
    'CHINA': 'China'
  }
  
  return countryMap[normalized] || titleCase(country)
}

/**
 * Normalize manufacturer names
 */
export function normalizeManufacturer(manufacturer?: string): string | undefined {
  if (!manufacturer) return undefined
  
  // Remove common suffixes
  let normalized = manufacturer
    .replace(/\s+(LLC|INC\.|INC|CORPORATION|CORP\.|CORP|LTD\.|LTD|CO\.|CO)$/i, '')
    .replace(/\s+in\s+.+$/i, '') // Remove "in CITY, STATE"
    .trim()
  
  // Title case
  return titleCase(normalized)
}

/**
 * Normalize drive type
 */
export function normalizeDriveType(driveType?: string): string | undefined {
  if (!driveType) return undefined
  
  const normalized = driveType.toUpperCase().trim()
  
  const driveMap: Record<string, string> = {
    'FWD/FRONT-WHEEL DRIVE': 'FWD',
    'FRONT-WHEEL DRIVE': 'FWD',
    'RWD/REAR-WHEEL DRIVE': 'RWD',
    'REAR-WHEEL DRIVE': 'RWD',
    '4WD/4-WHEEL DRIVE/4X4': '4WD',
    '4-WHEEL DRIVE': '4WD',
    '4X4': '4WD',
    'AWD/ALL-WHEEL DRIVE': 'AWD',
    'ALL-WHEEL DRIVE': 'AWD'
  }
  
  return driveMap[normalized] || driveType
}

/**
 * Normalize body type
 */
export function normalizeBodyType(bodyType?: string): string | undefined {
  if (!bodyType) return undefined
  
  const bodyMap: Record<string, string> = {
    'HATCHBACK/LIFTBACK/NOTCHBACK': 'Hatchback',
    'SPORT UTILITY VEHICLE (SUV)/MULTI-PURPOSE VEHICLE (MPV)': 'SUV/MPV',
    'SPORT UTILITY VEHICLE': 'SUV',
    'PICKUP': 'Pickup Truck',
    'SEDAN/SALOON': 'Sedan',
    'COUPE': 'Coupe',
    'WAGON': 'Wagon',
    'VAN': 'Van',
    'CONVERTIBLE/CABRIOLET': 'Convertible'
  }
  
  const normalized = bodyType.toUpperCase().trim()
  return bodyMap[normalized] || titleCase(bodyType)
}

/**
 * Normalize fuel type
 */
export function normalizeFuelType(fuelType?: string): string | undefined {
  if (!fuelType) return undefined
  
  const fuelMap: Record<string, string> = {
    'GASOLINE': 'Gasoline',
    'DIESEL': 'Diesel',
    'ELECTRIC': 'Electric',
    'FLEXIBLE FUEL VEHICLE (FFV)': 'Flex Fuel',
    'HYBRID': 'Hybrid',
    'PLUG-IN HYBRID': 'Plug-in Hybrid',
    'COMPRESSED NATURAL GAS (CNG)': 'CNG',
    'LIQUEFIED PETROLEUM GAS (LPG)': 'LPG',
    'E85': 'E85 (Ethanol)'
  }
  
  const normalized = fuelType.toUpperCase().trim()
  return fuelMap[normalized] || titleCase(fuelType)
}

/**
 * Normalize transmission
 */
export function normalizeTransmission(transmission?: string): string | undefined {
  if (!transmission) return undefined
  
  const transMap: Record<string, string> = {
    'AUTOMATIC': 'Automatic',
    'MANUAL': 'Manual',
    'CONTINUOUSLY VARIABLE (CVT)': 'CVT',
    'CVT': 'CVT',
    'DUAL CLUTCH (DCT)': 'Dual-Clutch',
    'AUTOMATED MANUAL': 'Auto-Manual'
  }
  
  const normalized = transmission.toUpperCase().trim()
  return transMap[normalized] || titleCase(transmission)
}

/**
 * Normalize engine string
 */
export function normalizeEngine(engine?: string): string | undefined {
  if (!engine) return undefined
  
  return engine
    .replace(/LL/g, 'L')           // Fix double L (3.6LL → 3.6L)
    .replace(/\s{2,}/g, ' ')        // Multiple spaces → single
    .replace(/L\s+/g, 'L ')         // Normalize space after L
    .trim()
}

/**
 * Normalize safety feature values
 */
export function normalizeSafetyFeature(value?: string): string | undefined {
  if (!value) return undefined
  
  const trimmed = value.trim()
  
  // Remove if "Not Applicable", "(not equipped)", or empty
  const lowerValue = trimmed.toLowerCase()
  if (
    trimmed === '' ||
    lowerValue === 'not applicable' ||
    lowerValue === '(not equipped)' ||
    lowerValue === 'not equipped' ||
    lowerValue === '(n/a)' ||
    lowerValue === 'n/a'
  ) {
    return undefined
  }
  
  // Remove parentheses from valid values
  const cleaned = trimmed.replace(/[()]/g, '').trim()
  
  // Normalize common values
  const safetyMap: Record<string, string> = {
    'STANDARD': 'Yes',
    'OPTIONAL': 'Optional',
    '4-WHEEL ABS': '4-Wheel',
    'REAR ABS': 'Rear Only',
    'FRONT': 'Front Only',
    '1ST ROW (DRIVER AND PASSENGER)': 'Front',
    '1ST AND 2ND ROWS': 'Front & Rear'
  }
  
  const upper = cleaned.toUpperCase()
  const mapped = safetyMap[upper]
  
  return mapped !== undefined ? mapped : titleCase(cleaned)
}

/**
 * Normalize generic NHTSA values
 */
export function normalizeValue(value?: string): string | undefined {
  if (!value) return undefined
  
  const trimmed = value.trim()
  
  // Remove if "Not Applicable" or empty
  if (
    trimmed === '' ||
    trimmed.toLowerCase() === 'not applicable' ||
    trimmed.toLowerCase() === 'n/a'
  ) {
    return undefined
  }
  
  return trimmed
}

/**
 * Format location (city, state, country)
 */
export function formatLocation(
  city?: string,
  state?: string,
  country?: string
): string | undefined {
  const parts: string[] = []
  
  if (city) parts.push(titleCase(city))
  if (state) parts.push(state.toUpperCase())
  if (country) {
    const normalizedCountry = normalizeCountry(country)
    if (normalizedCountry && normalizedCountry !== 'USA') {
      parts.push(normalizedCountry)
    }
  }
  
  return parts.length > 0 ? parts.join(', ') : undefined
}

/**
 * Convert string to title case
 */
function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Don't capitalize certain words
      const lowercase = ['of', 'the', 'and', 'in', 'on', 'at', 'to', 'for']
      if (lowercase.includes(word)) return word
      
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
    .replace(/^./, match => match.toUpperCase()) // Always capitalize first word
}

/**
 * Format numeric values with units
 */
export function formatWithUnit(value?: string, unit?: string): string | undefined {
  if (!value) return undefined
  
  const num = parseFloat(value)
  if (isNaN(num)) return value
  
  // Format number with commas for large numbers
  const formatted = num.toLocaleString('en-US', {
    maximumFractionDigits: 1
  })
  
  return unit ? `${formatted} ${unit}` : formatted
}

/**
 * Normalize displacement (L)
 */
export function normalizeDisplacement(displacement?: string): string | undefined {
  if (!displacement) return undefined
  
  const num = parseFloat(displacement)
  if (isNaN(num)) return displacement
  
  return `${num.toFixed(1)}L`
}

/**
 * Normalize horsepower
 */
export function normalizeHorsepower(hp?: string): string | undefined {
  if (!hp) return undefined
  
  const num = parseInt(hp)
  if (isNaN(num)) return undefined
  
  return `${num} HP`
}

/**
 * Normalize doors (remove "Doors" suffix if present)
 */
export function normalizeDoors(doors?: string): string | undefined {
  if (!doors) return undefined
  
  const num = parseInt(doors)
  if (isNaN(num)) return doors
  
  return `${num}`
}

/**
 * Normalize transmission speeds
 */
export function normalizeTransmissionSpeeds(speeds?: string): string | undefined {
  if (!speeds) return undefined
  
  const num = parseInt(speeds)
  if (isNaN(num)) return speeds
  
  return `${num}-Speed`
}

/**
 * Comprehensive normalization for all VIN data
 */
export function normalizeVINData(data: Record<string, any>): Record<string, any> {
  return {
    ...data,
    // Apply all normalizations
    manufacturer: normalizeManufacturer(data.manufacturer),
    plantCountry: normalizeCountry(data.plantCountry),
    driveType: normalizeDriveType(data.driveType),
    bodyType: normalizeBodyType(data.bodyType),
    fuelType: normalizeFuelType(data.fuelType),
    transmission: normalizeTransmission(data.transmission),
    engineDisplacement: normalizeDisplacement(data.engineDisplacement),
    engineHP: normalizeHorsepower(data.engineHP),
    doors: normalizeDoors(data.doors),
    transmissionSpeeds: normalizeTransmissionSpeeds(data.transmissionSpeeds),
    
    // Safety features
    absType: normalizeSafetyFeature(data.absType),
    electronicStabilityControl: normalizeSafetyFeature(data.electronicStabilityControl),
    tractionControl: normalizeSafetyFeature(data.tractionControl),
    airBagLocations: normalizeSafetyFeature(data.airBagLocations),
    blindSpotWarning: normalizeSafetyFeature(data.blindSpotWarning),
    forwardCollisionWarning: normalizeSafetyFeature(data.forwardCollisionWarning),
    laneDepartureWarning: normalizeSafetyFeature(data.laneDepartureWarning),
    parkAssist: normalizeSafetyFeature(data.parkAssist),
    rearVisibilitySystem: normalizeSafetyFeature(data.rearVisibilitySystem),
    
    // Format location
    location: formatLocation(data.plantCity, data.plantState, data.plantCountry)
  }
}

// ============================================================================
// COMPREHENSIVE NORMALIZER CLASS
// ============================================================================

import type {
  NormalizedVehicleData,
  NormalizedSafetyFeatures,
  NormalizedPerformance,
  NormalizedElectricVehicle,
  NormalizedTruckFeatures,
  NormalizedManufacturing,
  FeatureAvailability,
  YesNo
} from './normalized-types'

/**
 * Comprehensive Vehicle Data Normalizer
 * Transforms raw NHTSA data into clean, typed structure
 */
export class VehicleDataNormalizer {
  /**
   * Main normalization entry point
   */
  static normalize(raw: Record<string, string>): NormalizedVehicleData {
    const fieldsNormalized = Object.keys(raw).filter(k => raw[k] && raw[k].trim()).length
    
    const safety = this.normalizeSafety(raw)
    const performance = this.normalizePerformance(raw)
    const electric = this.normalizeElectric(raw)
    const truck = this.normalizeTruck(raw)
    const manufacturing = this.normalizeManufacturing(raw)
    
    // Calculate data quality
    const safetyPopulated = Object.values(safety).filter(v => 
      v !== 'unknown' && v !== 'not_available' && v !== null
    ).length
    
    const perfPopulated = [
      performance.engine.cylinders,
      performance.engine.displacement.liters,
      performance.engine.horsepower,
      performance.drivetrain.type !== 'unknown' ? 1 : 0,
      performance.dimensions.doors
    ].filter(Boolean).length
    
    const completeness = Math.round((fieldsNormalized / 154) * 100)
    
    return {
      vin: raw.VIN || '',
      year: parseInt(raw.ModelYear) || 0,
      make: raw.Make || '',
      model: raw.Model || '',
      trim: raw.Trim || null,
      trim2: raw.Trim2 || null,
      series: raw.Series || null,
      series2: raw.Series2 || null,
      bodyClass: raw.BodyClass || null,
      vehicleType: raw.VehicleType || null,
      
      safety,
      performance,
      electric,
      truck,
      manufacturing,
      
      normalization: {
        normalizedAt: new Date(),
        version: '1.0.0',
        fieldsNormalized,
        dataQuality: {
          safetyFeaturesPopulated: safetyPopulated,
          performanceFieldsPopulated: perfPopulated,
          completeness
        }
      }
    }
  }
  
  /**
   * Normalize safety features
   */
  private static normalizeSafety(raw: Record<string, string>): NormalizedSafetyFeatures {
    return {
      // ADAS
      adaptiveCruiseControl: this.normalizeAvailability(raw.AdaptiveCruiseControl),
      blindSpotMonitoring: this.normalizeAvailability(raw.BlindSpotMon),
      laneKeepingAssist: this.normalizeAvailability(raw.LaneKeepSystem),
      laneCenteringAssist: this.normalizeAvailability(raw.LaneCenteringAssistance),
      laneDepartureWarning: this.normalizeAvailability(raw.LaneDepartureWarning),
      
      // Collision
      forwardCollisionWarning: this.normalizeAvailability(raw.ForwardCollisionWarning),
      automaticEmergencyBraking: this.normalizeAvailability(raw.CIB),
      pedestrianDetection: this.normalizeAvailability(raw.PedestrianAutomaticEmergencyBraking),
      rearCrossTrafficAlert: this.normalizeAvailability(raw.RearCrossTrafficAlert),
      dynamicBrakeSupport: this.normalizeAvailability(raw.DynamicBrakeSupport),
      crashImminentBraking: this.normalizeAvailability(raw.CIB),
      
      // Cameras
      backupCamera: this.normalizeAvailability(raw.BackupCamera || raw.RearVisibilitySystem),
      parkingAssist: this.normalizeAvailability(raw.ParkAssist),
      rearAutoEmergencyBraking: this.normalizeAvailability(raw.RearAutomaticEmergencyBraking),
      
      // Core
      abs: this.normalizeAvailability(raw.ABS),
      electronicStabilityControl: this.normalizeAvailability(raw.ESC),
      tractionControl: this.normalizeAvailability(raw.TractionControl),
      
      // Air Bags
      airBags: {
        front: this.normalizeYesNoAirBag(raw.AirBagLocFront),
        side: this.normalizeYesNoAirBag(raw.AirBagLocSide),
        curtain: this.normalizeYesNoAirBag(raw.AirBagLocCurtain),
        knee: this.normalizeYesNoAirBag(raw.AirBagLocKnee)
      },
      
      // Monitoring
      tpms: this.normalizeTPMSType(raw.TPMS),
      eventDataRecorder: this.normalizeYesNoValue(raw.EDR),
      automaticCrashNotification: this.normalizeYesNoValue(raw.CAN_AACN),
      
      // Lights
      daytimeRunningLights: this.normalizeAvailability(raw.DaytimeRunningLight),
      headlampLightSource: raw.LowerBeamHeadlampLightSource || null,
      adaptiveDrivingBeam: this.normalizeAvailability(raw.AdaptiveDrivingBeam),
      
      // Other
      keylessIgnition: this.normalizeAvailability(raw.KeylessIgnition),
      autoReverseWindows: this.normalizeAvailability(raw.AutoReverseSystem),
      seatBeltPretensioner: this.normalizeYesNoValue(raw.Pretensioner),
      
      // Automation
      saeAutomationLevel: raw.SAEAutomationLevel || null
    }
  }
  
  /**
   * Normalize performance data
   */
  private static normalizePerformance(raw: Record<string, string>): NormalizedPerformance {
    return {
      engine: {
        cylinders: this.parseNumber(raw.EngineCylinders),
        displacement: {
          liters: this.parseNumber(raw.DisplacementL),
          cubicInches: this.parseNumber(raw.DisplacementCI),
          cc: this.parseNumber(raw.DisplacementCC)
        },
        configuration: raw.EngineConfiguration || null,
        model: raw.EngineModel || null,
        manufacturer: raw.EngineManufacturer || null,
        valveTrain: raw.ValveTrainDesign || null,
        coolingType: raw.CoolingType || null,
        fuelInjectionType: raw.FuelInjectionType || null,
        turbo: this.normalizeYesNoValue(raw.Turbo),
        horsepower: this.parseNumber(raw.EngineHP),
        horsepowerTo: this.parseNumber(raw.EngineHP_to),
        kilowatts: this.parseNumber(raw.EngineKW),
        topSpeedMph: this.parseNumber(raw.TopSpeedMPH)
      },
      
      drivetrain: {
        type: this.normalizeDriveTypeValue(raw.DriveType),
        transmission: raw.TransmissionStyle || null,
        transmissionSpeeds: this.parseNumber(raw.TransmissionSpeeds)
      },
      
      dimensions: {
        doors: this.parseNumber(raw.Doors),
        seats: this.parseNumber(raw.Seats),
        seatRows: this.parseNumber(raw.SeatRows),
        curbWeightLbs: this.parseNumber(raw.CurbWeightLB),
        gvwrLbs: this.parseGVWR(raw.GVWR),
        gvwrToLbs: this.parseNumber(raw.GVWR_to),
        gcwrLbs: this.parseNumber(raw.GCWR),
        wheelbaseInches: this.parseNumber(raw.WheelBaseShort || raw.WheelBaseLong),
        wheelbaseType: raw.WheelBaseType || null,
        trackWidthInches: this.parseNumber(raw.TrackWidth),
        wheelSizeFrontInches: this.parseNumber(raw.WheelSizeFront),
        wheelSizeRearInches: this.parseNumber(raw.WheelSizeRear),
        numberOfWheels: this.parseNumber(raw.Wheels)
      },
      
      fuel: {
        primaryType: raw.FuelTypePrimary || null,
        secondaryType: raw.FuelTypeSecondary || null
      }
    }
  }
  
  /**
   * Normalize EV data
   */
  private static normalizeElectric(raw: Record<string, string>): NormalizedElectricVehicle {
    const electLevel = (raw.ElectrificationLevel || '').toLowerCase()
    
    return {
      electrificationLevel: raw.ElectrificationLevel || null,
      isEV: electLevel.includes('bev') || electLevel.includes('battery electric'),
      isHybrid: electLevel.includes('hev') || electLevel.includes('hybrid'),
      isPluginHybrid: electLevel.includes('phev') || electLevel.includes('plug-in'),
      
      battery: {
        type: raw.BatteryType || null,
        kwhFrom: this.parseNumber(raw.BatteryKWh),
        kwhTo: this.parseNumber(raw.BatteryKWh_to),
        voltageFrom: this.parseNumber(raw.BatteryV),
        voltageTo: this.parseNumber(raw.BatteryV_to),
        currentFrom: this.parseNumber(raw.BatteryA),
        currentTo: this.parseNumber(raw.BatteryA_to),
        modules: this.parseNumber(raw.BatteryModules),
        packs: this.parseNumber(raw.BatteryPacks)
      },
      
      charging: {
        level: raw.ChargerLevel || null,
        powerKw: this.parseNumber(raw.ChargerPowerKW)
      },
      
      driveUnit: raw.EVDriveUnit || null
    }
  }
  
  /**
   * Normalize truck features
   */
  private static normalizeTruck(raw: Record<string, string>): NormalizedTruckFeatures {
    const bodyClass = (raw.BodyClass || '').toLowerCase()
    
    return {
      isTruck: bodyClass.includes('pickup') || bodyClass.includes('truck'),
      
      bed: {
        type: raw.BedType || null,
        lengthInches: this.parseNumber(raw.BedLengthIN)
      },
      
      cab: {
        type: raw.BodyCabType || null
      },
      
      axles: {
        count: this.parseNumber(raw.Axles),
        configuration: raw.AxleConfiguration || null
      }
    }
  }
  
  /**
   * Normalize manufacturing data
   */
  private static normalizeManufacturing(raw: Record<string, string>): NormalizedManufacturing {
    return {
      manufacturer: raw.Manufacturer || null,
      manufacturerId: raw.ManufacturerId || null,
      
      plant: {
        city: raw.PlantCity || null,
        state: raw.PlantState || null,
        country: raw.PlantCountry || null,
        companyName: raw.PlantCompanyName || null,
        location: formatLocation(raw.PlantCity, raw.PlantState, raw.PlantCountry) || null
      },
      
      basePrice: this.parseNumber(raw.BasePrice)
    }
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  /**
   * Normalize availability values
   */
  private static normalizeAvailability(value: string | undefined): FeatureAvailability {
    if (!value || value.trim() === '') return 'unknown'
    
    const v = value.toLowerCase().trim()
    
    if (v === 'standard' || v === 'yes') return 'standard'
    if (v === 'optional') return 'optional'
    if (v === 'not available' || v === 'no' || v === 'not applicable') return 'not_available'
    
    return 'unknown'
  }
  
  /**
   * Normalize yes/no values
   */
  private static normalizeYesNoValue(value: string | undefined): YesNo {
    if (!value || value.trim() === '') return 'unknown'
    
    const v = value.toLowerCase().trim()
    
    if (v === 'yes' || v === 'standard' || v === 'true') return 'yes'
    if (v === 'no' || v === 'not applicable' || v === 'false') return 'no'
    
    return 'unknown'
  }
  
  /**
   * Normalize air bag yes/no (handles "1st Row" format)
   */
  private static normalizeYesNoAirBag(value: string | undefined): YesNo {
    if (!value || value.trim() === '') return 'unknown'
    
    const v = value.toLowerCase().trim()
    
    if (v.includes('row') || v.includes('driver') || v.includes('passenger')) return 'yes'
    if (v === 'no' || v === 'not applicable') return 'no'
    
    return 'unknown'
  }
  
  /**
   * Normalize TPMS type
   */
  private static normalizeTPMSType(value: string | undefined): 'direct' | 'indirect' | 'none' | 'unknown' {
    if (!value || value.trim() === '') return 'unknown'
    
    const v = value.toLowerCase().trim()
    
    if (v.includes('direct')) return 'direct'
    if (v.includes('indirect')) return 'indirect'
    if (v === 'none' || v === 'not applicable') return 'none'
    
    return 'unknown'
  }
  
  /**
   * Normalize drive type
   */
  private static normalizeDriveTypeValue(value: string | undefined): 'fwd' | 'rwd' | 'awd' | '4wd' | 'unknown' {
    if (!value) return 'unknown'
    
    const v = value.toLowerCase().trim()
    
    if (v.includes('fwd') || v.includes('front')) return 'fwd'
    if (v.includes('rwd') || v.includes('rear')) return 'rwd'
    if (v.includes('awd') || v.includes('all wheel')) return 'awd'
    if (v.includes('4wd') || v.includes('4x4') || v.includes('four wheel')) return '4wd'
    
    return 'unknown'
  }
  
  /**
   * Parse number from string
   */
  private static parseNumber(value: string | undefined): number | null {
    if (!value || value.trim() === '') return null
    
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''))
    return isNaN(parsed) ? null : parsed
  }
  
  /**
   * Parse GVWR (handles ranges like "7,001 - 8,000 lb")
   */
  private static parseGVWR(value: string | undefined): number | null {
    if (!value) return null
    
    // Extract first number from range
    const match = value.match(/[\d,]+/)
    if (!match) return null
    
    return this.parseNumber(match[0])
  }
}
