// Export VehicleBodyType for use in API endpoints
export type VehicleBodyType = 
  | 'sedan'
  | 'suv' 
  | 'truck'
  | 'coupe'
  | 'convertible'
  | 'wagon'
  | 'hatchback'
  | 'van'
  | 'motorcycle'
  | 'other'

/**
 * Maps NHTSA body class and other VIN decode data to our SVG body types
 * Handles ambiguous cases with fallback logic
 */

interface VehicleSpecs {
  bodyClass?: string
  bodyStyle?: string
  vehicleType?: string
  doors?: string | number
  make?: string
  model?: string
}

export function mapToBodyType(specs: VehicleSpecs): VehicleBodyType {
  const bodyClass = specs.bodyClass?.toLowerCase() || ''
  const bodyStyle = specs.bodyStyle?.toLowerCase() || ''
  const vehicleType = specs.vehicleType?.toLowerCase() || ''
  const make = specs.make?.toLowerCase() || ''
  const model = specs.model?.toLowerCase() || ''
  const doors = typeof specs.doors === 'string' ? parseInt(specs.doors) : specs.doors

  // Direct NHTSA body class mappings
  if (bodyClass.includes('sedan') || bodyClass.includes('saloon')) {
    return 'sedan'
  }
  
  if (bodyClass.includes('suv') || bodyClass.includes('sport utility')) {
    return 'suv'
  }
  
  if (bodyClass.includes('truck') || bodyClass.includes('pickup')) {
    return 'truck'
  }
  
  if (bodyClass.includes('hatchback') || bodyClass.includes('liftback')) {
    return 'hatchback'
  }
  
  if (bodyClass.includes('coupe') || bodyClass.includes('coupé')) {
    return 'coupe'
  }
  
  if (bodyClass.includes('wagon') || bodyClass.includes('estate')) {
    return 'wagon'
  }
  
  if (bodyClass.includes('van') || bodyClass.includes('minivan')) {
    return 'van'
  }
  
  if (bodyClass.includes('convertible') || bodyClass.includes('cabriolet')) {
    return 'convertible'
  }

  // Body style fallbacks
  if (bodyStyle.includes('hatchback') || bodyStyle.includes('hatch')) {
    return 'hatchback'
  }
  
  if (bodyStyle.includes('suv') || bodyStyle.includes('crossover')) {
    return 'suv'
  }

  // Vehicle type fallbacks
  if (vehicleType.includes('truck')) {
    return 'truck'
  }
  
  if (vehicleType.includes('suv')) {
    return 'suv'
  }

  // Make/model specific overrides for common ambiguous cases
  const makeModel = `${make} ${model}`.toLowerCase()
  
  // Trucks
  if (make === 'ford' && (model.includes('f-') || model.includes('ranger'))) {
    return 'truck'
  }
  
  if (make === 'chevrolet' && (model.includes('silverado') || model.includes('colorado'))) {
    return 'truck'
  }
  
  if (make === 'ram' || (make === 'dodge' && model.includes('ram'))) {
    return 'truck'
  }
  
  // SUVs
  if (makeModel.includes('tahoe') || makeModel.includes('suburban') || 
      makeModel.includes('expedition') || makeModel.includes('navigator') ||
      makeModel.includes('escalade') || makeModel.includes('yukon')) {
    return 'suv'
  }
  
  // Hatchbacks
  if (makeModel.includes('golf') || makeModel.includes('civic hatch') ||
      makeModel.includes('focus hatch') || makeModel.includes('impreza hatch')) {
    return 'hatchback'
  }
  
  // Coupes
  if (makeModel.includes('mustang') || makeModel.includes('camaro') ||
      makeModel.includes('challenger') || makeModel.includes('corvette')) {
    return 'coupe'
  }

  // Door count fallback (if available)
  if (doors === 2) {
    return 'coupe'
  }
  
  if (doors === 4) {
    // Could be sedan or hatchback, default to sedan
    return 'sedan'
  }

  // Final fallback - sedan is most common
  return 'sedan'
}

/**
 * Get a human-readable body type name for display
 */
export function getBodyTypeDisplayName(bodyType: VehicleBodyType): string {
  const displayNames: Record<VehicleBodyType, string> = {
    sedan: 'Sedan',
    suv: 'SUV',
    truck: 'Pickup Truck',
    hatchback: 'Hatchback',
    coupe: 'Coupe',
    wagon: 'Wagon',
    van: 'Van',
    convertible: 'Convertible'
  }
  
  return displayNames[bodyType]
}

/**
 * Validate if a body type is supported
 */
export function isSupportedBodyType(bodyType: string): bodyType is VehicleBodyType {
  const supportedTypes: VehicleBodyType[] = [
    'sedan', 'suv', 'truck', 'hatchback', 'coupe', 'wagon', 'van', 'convertible'
  ]
  
  return supportedTypes.includes(bodyType as VehicleBodyType)
}
