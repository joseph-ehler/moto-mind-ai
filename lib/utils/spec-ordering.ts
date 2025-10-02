/**
 * Smart ordering system for specification categories
 * Prioritizes filled categories and uses logical importance ordering
 */

export interface SpecCategoryDisplay {
  category: string
  label: string
  data: Record<string, any>
  sources?: string[]
  hasData: boolean
  importance: number // Higher = more important
}

// Define importance hierarchy (1-9, higher is more important)
const CATEGORY_IMPORTANCE = {
  maintenance_intervals: 9,  // Most critical for vehicle care
  fluids_capacities: 8,      // Essential for maintenance
  engine: 7,                 // Core performance specs
  drivetrain: 6,             // Core vehicle function
  fuel_economy: 5,           // Practical daily concern
  tire_specifications: 4,    // Safety and maintenance
  safety: 3,                 // Important but less actionable
  dimensions: 2,             // Reference info
  features: 1                // Nice to know
}

/**
 * Check if category has meaningful data
 */
export function categoryHasData(data: Record<string, any>): boolean {
  if (!data || Object.keys(data).length === 0) {
    return false
  }
  
  // Check if at least one field has a non-null value
  return Object.values(data).some(value => 
    value !== null && 
    value !== undefined && 
    value !== ''
  )
}

/**
 * Sort categories by filled status first, then by importance
 */
export function sortSpecCategories(
  categories: Array<{ category: string; data: Record<string, any>; sources?: string[] }>
): SpecCategoryDisplay[] {
  const categoriesWithMeta = categories.map(cat => ({
    ...cat,
    label: getCategoryLabel(cat.category),
    hasData: categoryHasData(cat.data),
    importance: CATEGORY_IMPORTANCE[cat.category as keyof typeof CATEGORY_IMPORTANCE] || 0
  }))

  // Sort: filled categories first (by importance), then empty categories (by importance)
  return categoriesWithMeta.sort((a, b) => {
    // First sort by filled status (filled first)
    if (a.hasData && !b.hasData) return -1
    if (!a.hasData && b.hasData) return 1
    
    // Then sort by importance (higher first)
    return b.importance - a.importance
  })
}

/**
 * Get display label for category
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    engine: 'Engine Performance',
    drivetrain: 'Drivetrain',
    dimensions: 'Dimensions',
    fuel_economy: 'Fuel Economy',
    safety: 'Safety',
    features: 'Features',
    maintenance_intervals: 'Maintenance Intervals',
    fluids_capacities: 'Fluids & Capacities',
    tire_specifications: 'Tire Specifications'
  }
  return labels[category] || category
}

/**
 * Get field definitions for category editing
 */
export function getCategoryFields(category: string) {
  const fieldDefinitions: Record<string, Array<{
    key: string
    label: string
    type: 'text' | 'number'
    unit?: string
    placeholder?: string
  }>> = {
    engine: [
      { key: 'horsepower', label: 'Horsepower', type: 'number', unit: 'HP', placeholder: 'e.g., 182' },
      { key: 'torque', label: 'Torque', type: 'number', unit: 'lb-ft', placeholder: 'e.g., 176' },
      { key: 'displacement', label: 'Displacement', type: 'text', unit: 'L', placeholder: 'e.g., 2.5' },
      { key: 'cylinders', label: 'Cylinders', type: 'number', placeholder: 'e.g., 4' },
      { key: 'fuel_type', label: 'Fuel Type', type: 'text', placeholder: 'e.g., Gasoline' },
      { key: 'configuration', label: 'Configuration', type: 'text', placeholder: 'e.g., Flat-4' }
    ],
    fuel_economy: [
      { key: 'city_mpg', label: 'City MPG', type: 'number', unit: 'MPG', placeholder: 'e.g., 26' },
      { key: 'highway_mpg', label: 'Highway MPG', type: 'number', unit: 'MPG', placeholder: 'e.g., 33' },
      { key: 'combined_mpg', label: 'Combined MPG', type: 'number', unit: 'MPG', placeholder: 'e.g., 29' }
    ],
    dimensions: [
      { key: 'length', label: 'Length', type: 'number', unit: 'inches', placeholder: 'e.g., 182.7' },
      { key: 'width', label: 'Width', type: 'number', unit: 'inches', placeholder: 'e.g., 71.5' },
      { key: 'height', label: 'Height', type: 'number', unit: 'inches', placeholder: 'e.g., 68.1' },
      { key: 'wheelbase', label: 'Wheelbase', type: 'number', unit: 'inches', placeholder: 'e.g., 105.1' },
      { key: 'curb_weight', label: 'Curb Weight', type: 'number', unit: 'lbs', placeholder: 'e.g., 3552' }
    ],
    features: [
      { key: 'seats', label: 'Seating Capacity', type: 'number', placeholder: 'e.g., 5' },
      { key: 'doors', label: 'Number of Doors', type: 'number', placeholder: 'e.g., 4' },
      { key: 'cargo_volume', label: 'Cargo Volume', type: 'number', unit: 'cu.ft.', placeholder: 'e.g., 26.9' }
    ],
    safety: [
      { key: 'abs', label: 'ABS Brakes', type: 'text', placeholder: 'e.g., 4-Wheel ABS' },
      { key: 'electronic_stability_control', label: 'Stability Control', type: 'text', placeholder: 'e.g., Standard' },
      { key: 'traction_control', label: 'Traction Control', type: 'text', placeholder: 'e.g., Standard' },
      { key: 'airbag_locations', label: 'Airbag Locations', type: 'text', placeholder: 'e.g., Front, Side, Curtain' }
    ],
    fluids_capacities: [
      { key: 'engine_oil_capacity', label: 'Engine Oil Capacity', type: 'number', unit: 'quarts', placeholder: 'e.g., 4.4' },
      { key: 'engine_oil_grade', label: 'Engine Oil Grade', type: 'text', placeholder: 'e.g., 0W-20' },
      { key: 'coolant_capacity', label: 'Coolant Capacity', type: 'number', unit: 'quarts', placeholder: 'e.g., 7.5' },
      { key: 'fuel_tank_capacity', label: 'Fuel Tank Capacity', type: 'number', unit: 'gallons', placeholder: 'e.g., 16.6' },
      { key: 'fuel_grade_required', label: 'Fuel Grade Required', type: 'text', placeholder: 'e.g., 87 octane regular' }
    ],
    tire_specifications: [
      { key: 'tire_size_front', label: 'Tire Size (Front)', type: 'text', placeholder: 'e.g., 225/55R18' },
      { key: 'tire_size_rear', label: 'Tire Size (Rear)', type: 'text', placeholder: 'e.g., 225/55R18' },
      { key: 'tire_pressure_front', label: 'Tire Pressure (Front)', type: 'number', unit: 'PSI', placeholder: 'e.g., 33' },
      { key: 'tire_pressure_rear', label: 'Tire Pressure (Rear)', type: 'number', unit: 'PSI', placeholder: 'e.g., 32' },
      { key: 'wheel_torque', label: 'Wheel Lug Nut Torque', type: 'number', unit: 'lb-ft', placeholder: 'e.g., 89' }
    ]
  }

  return fieldDefinitions[category] || []
}
