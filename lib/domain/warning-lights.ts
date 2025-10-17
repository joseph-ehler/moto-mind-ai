/**
 * Comprehensive Warning Light System
 * Based on common automotive dashboard indicators
 */

export type WarningLightCode = 
  // Critical Warnings (Red)
  | 'check_engine'
  | 'oil_pressure'
  | 'brake'
  | 'brake_system'
  | 'airbag'
  | 'battery'
  | 'coolant_temp'
  | 'temperature'
  | 'power_steering'
  | 'oil_warning'
  
  // Important Warnings (Yellow/Amber)
  | 'abs'
  | 'tire_pressure'
  | 'tpms'
  | 'low_fuel'
  | 'service_engine'
  | 'traction_control'
  | 'tcs'
  | 'esp'
  | 'brake_pad'
  | 'dpf'
  | 'check_emission'
  
  // Indicators (Green/Blue)
  | 'seatbelt'
  | 'washer_fluid'
  | 'cruise_control'
  | 'headlight'
  | 'high_beam'
  | 'fog_light'
  | 'security'
  | 'turn_signal'
  | 'turn_signal_left'
  | 'turn_signal_right'
  | 'parking_brake'

export interface WarningLight {
  code: WarningLightCode
  label: string
  severity: 'critical' | 'warning' | 'info'
  description: string
  category: 'engine' | 'brakes' | 'safety' | 'tire' | 'fluid' | 'indicator' | 'other'
}

/**
 * Comprehensive warning light database
 */
export const WARNING_LIGHTS: Record<WarningLightCode, WarningLight> = {
  // Critical Warnings (Red) - Immediate attention required
  'check_engine': {
    code: 'check_engine',
    label: 'Check Engine',
    severity: 'critical',
    description: 'Engine malfunction detected',
    category: 'engine'
  },
  'oil_pressure': {
    code: 'oil_pressure',
    label: 'Oil Pressure',
    severity: 'critical',
    description: 'Low oil pressure - stop immediately',
    category: 'engine'
  },
  'brake': {
    code: 'brake',
    label: 'Brake Warning',
    severity: 'critical',
    description: 'Brake system issue',
    category: 'brakes'
  },
  'brake_system': {
    code: 'brake_system',
    label: 'Brake System',
    severity: 'critical',
    description: 'Brake system malfunction',
    category: 'brakes'
  },
  'airbag': {
    code: 'airbag',
    label: 'Airbag',
    severity: 'critical',
    description: 'Airbag system fault',
    category: 'safety'
  },
  'battery': {
    code: 'battery',
    label: 'Battery',
    severity: 'critical',
    description: 'Charging system problem',
    category: 'other'
  },
  'coolant_temp': {
    code: 'coolant_temp',
    label: 'Coolant Temperature',
    severity: 'critical',
    description: 'Engine overheating',
    category: 'engine'
  },
  'temperature': {
    code: 'temperature',
    label: 'Temperature Warning',
    severity: 'critical',
    description: 'High engine temperature',
    category: 'engine'
  },
  'power_steering': {
    code: 'power_steering',
    label: 'Power Steering',
    severity: 'critical',
    description: 'Power steering fault',
    category: 'other'
  },
  'oil_warning': {
    code: 'oil_warning',
    label: 'Oil Warning',
    severity: 'critical',
    description: 'Low oil level',
    category: 'fluid'
  },
  
  // Important Warnings (Yellow/Amber) - Service soon
  'abs': {
    code: 'abs',
    label: 'ABS',
    severity: 'warning',
    description: 'Anti-lock braking system issue',
    category: 'brakes'
  },
  'tire_pressure': {
    code: 'tire_pressure',
    label: 'Tire Pressure',
    severity: 'warning',
    description: 'Low tire pressure detected',
    category: 'tire'
  },
  'tpms': {
    code: 'tpms',
    label: 'TPMS',
    severity: 'warning',
    description: 'Tire pressure monitoring system',
    category: 'tire'
  },
  'low_fuel': {
    code: 'low_fuel',
    label: 'Low Fuel',
    severity: 'warning',
    description: 'Fuel level low',
    category: 'fluid'
  },
  'service_engine': {
    code: 'service_engine',
    label: 'Service Engine',
    severity: 'warning',
    description: 'Maintenance required',
    category: 'engine'
  },
  'traction_control': {
    code: 'traction_control',
    label: 'Traction Control',
    severity: 'warning',
    description: 'Traction control active or disabled',
    category: 'safety'
  },
  'tcs': {
    code: 'tcs',
    label: 'TCS',
    severity: 'warning',
    description: 'Traction control system',
    category: 'safety'
  },
  'esp': {
    code: 'esp',
    label: 'ESP',
    severity: 'warning',
    description: 'Electronic stability program',
    category: 'safety'
  },
  'brake_pad': {
    code: 'brake_pad',
    label: 'Brake Pad',
    severity: 'warning',
    description: 'Brake pads worn',
    category: 'brakes'
  },
  'dpf': {
    code: 'dpf',
    label: 'DPF',
    severity: 'warning',
    description: 'Diesel particulate filter',
    category: 'engine'
  },
  'check_emission': {
    code: 'check_emission',
    label: 'Check Emission',
    severity: 'warning',
    description: 'Emission system issue',
    category: 'engine'
  },
  
  // Indicators (Green/Blue) - Informational
  'seatbelt': {
    code: 'seatbelt',
    label: 'Seatbelt',
    severity: 'info',
    description: 'Seatbelt not fastened',
    category: 'safety'
  },
  'washer_fluid': {
    code: 'washer_fluid',
    label: 'Washer Fluid',
    severity: 'info',
    description: 'Windshield washer fluid low',
    category: 'fluid'
  },
  'cruise_control': {
    code: 'cruise_control',
    label: 'Cruise Control',
    severity: 'info',
    description: 'Cruise control active',
    category: 'indicator'
  },
  'headlight': {
    code: 'headlight',
    label: 'Headlights',
    severity: 'info',
    description: 'Headlights on',
    category: 'indicator'
  },
  'high_beam': {
    code: 'high_beam',
    label: 'High Beam',
    severity: 'info',
    description: 'High beam headlights active',
    category: 'indicator'
  },
  'fog_light': {
    code: 'fog_light',
    label: 'Fog Lights',
    severity: 'info',
    description: 'Fog lights on',
    category: 'indicator'
  },
  'security': {
    code: 'security',
    label: 'Security',
    severity: 'info',
    description: 'Security system active',
    category: 'indicator'
  },
  'turn_signal': {
    code: 'turn_signal',
    label: 'Turn Signal',
    severity: 'info',
    description: 'Turn signal active',
    category: 'indicator'
  },
  'turn_signal_left': {
    code: 'turn_signal_left',
    label: 'Left Turn Signal',
    severity: 'info',
    description: 'Left turn signal',
    category: 'indicator'
  },
  'turn_signal_right': {
    code: 'turn_signal_right',
    label: 'Right Turn Signal',
    severity: 'info',
    description: 'Right turn signal',
    category: 'indicator'
  },
  'parking_brake': {
    code: 'parking_brake',
    label: 'Parking Brake',
    severity: 'info',
    description: 'Parking brake engaged',
    category: 'brakes'
  }
}

/**
 * Get warning light info by code
 */
export function getWarningLight(code: string): WarningLight | null {
  // Normalize code (replace spaces/hyphens with underscores, lowercase)
  const normalizedCode = code.toLowerCase().replace(/[\s-]/g, '_') as WarningLightCode
  return WARNING_LIGHTS[normalizedCode] || null
}

/**
 * Get display label for warning light
 */
export function getWarningLightLabel(code: string): string {
  const light = getWarningLight(code)
  if (light) return light.label
  
  // Fallback: capitalize and format
  return code
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get severity color for warning light
 */
export function getWarningLightColor(code: string): {
  bg: string
  border: string
  text: string
  dot: string
} {
  const light = getWarningLight(code)
  const severity = light?.severity || 'warning'
  
  switch (severity) {
    case 'critical':
      return {
        bg: 'from-red-50 to-orange-50',
        border: 'border-red-300',
        text: 'text-red-900',
        dot: 'bg-red-500'
      }
    case 'warning':
      return {
        bg: 'from-amber-50 to-yellow-50',
        border: 'border-amber-300',
        text: 'text-amber-900',
        dot: 'bg-amber-500'
      }
    case 'info':
      return {
        bg: 'from-blue-50 to-sky-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        dot: 'bg-blue-500'
      }
  }
}

/**
 * Group warning lights by severity
 */
export function groupWarningLightsBySeverity(codes: string[]): {
  critical: string[]
  warning: string[]
  info: string[]
} {
  const groups = {
    critical: [] as string[],
    warning: [] as string[],
    info: [] as string[]
  }
  
  codes.forEach(code => {
    const light = getWarningLight(code)
    const severity = light?.severity || 'warning'
    groups[severity].push(code)
  })
  
  return groups
}

/**
 * Normalize warning lights from raw extraction
 * Maps variations to standard codes
 */
export function normalizeWarningLights(rawLights: string[]): string[] {
  if (!rawLights || rawLights.length === 0) return []
  
  const normalized: string[] = []
  const seen = new Set<string>()
  
  for (const raw of rawLights) {
    if (!raw) continue
    
    // Normalize input
    const cleaned = raw.toLowerCase()
      .trim()
      .replace(/[\s-]/g, '_')
      .replace(/[^a-z_]/g, '')
    
    // Try exact match first
    if (WARNING_LIGHTS[cleaned as WarningLightCode]) {
      if (!seen.has(cleaned)) {
        normalized.push(cleaned)
        seen.add(cleaned)
      }
      continue
    }
    
    // Try fuzzy matching
    let matched = false
    for (const [code, light] of Object.entries(WARNING_LIGHTS)) {
      // Check if label matches
      const labelNormalized = light.label.toLowerCase().replace(/[\s-]/g, '_')
      if (cleaned === labelNormalized || cleaned.includes(labelNormalized) || labelNormalized.includes(cleaned)) {
        if (!seen.has(code)) {
          normalized.push(code)
          seen.add(code)
          matched = true
          break
        }
      }
      
      // Check for common aliases
      if (
        (cleaned.includes('check') && cleaned.includes('engine') && code === 'check_engine') ||
        (cleaned.includes('tire') && cleaned.includes('pressure') && code === 'tire_pressure') ||
        (cleaned.includes('oil') && cleaned.includes('pressure') && code === 'oil_pressure') ||
        (cleaned === 'tpms' && code === 'tire_pressure') ||
        (cleaned === 'abs' && code === 'abs') ||
        (cleaned === 'tcs' && code === 'traction_control') ||
        (cleaned === 'esp' && code === 'traction_control')
      ) {
        if (!seen.has(code)) {
          normalized.push(code)
          seen.add(code)
          matched = true
          break
        }
      }
    }
    
    // If no match found, keep original (unknown light)
    if (!matched && !seen.has(cleaned)) {
      normalized.push(cleaned)
      seen.add(cleaned)
    }
  }
  
  return normalized
}
