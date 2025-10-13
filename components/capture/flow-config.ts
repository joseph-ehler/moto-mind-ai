/**
 * Capture Flow Configuration
 * 
 * Defines all event types and their multi-step capture flows
 * Used by AI to know what to extract and guide users appropriately
 */

export interface CaptureStep {
  id: string
  required: boolean
  recommended?: boolean
  label: string
  hint: string
  aiPrompt: string
  allowMultiple?: boolean
  expectedContent?: string[]
  exampleImageUrl?: string
}

export interface EventTypeConfig {
  id: string
  name: string
  icon: string
  description: string
  quickMode: boolean // Can be done with single photo
  estimatedTime: string // "30 seconds" or "2-3 minutes"
  steps: CaptureStep[]
  aiDetectionKeywords: string[] // For auto-detection
}

export const CAPTURE_FLOWS: Record<string, EventTypeConfig> = {
  fuel: {
    id: 'fuel',
    name: 'Fuel Fill-Up',
    icon: '⛽',
    description: 'Quick: 1 photo • Complete: 3-4 photos',
    quickMode: true,
    estimatedTime: '30 seconds',
    aiDetectionKeywords: ['gas', 'fuel', 'gallon', 'pump', 'shell', 'chevron', 'exxon'],
    steps: [
      {
        id: 'receipt',
        required: true,
        label: 'Receipt or Gas Pump',
        hint: 'Capture price, gallons, and station name',
        aiPrompt: 'Extract fuel transaction details including price, gallons, station name, date, and payment method',
        expectedContent: ['price', 'gallons', 'station', 'date', 'grade']
      },
      {
        id: 'odometer',
        required: false,
        recommended: true,
        label: 'Odometer Reading',
        hint: 'Full dashboard view showing current mileage',
        aiPrompt: 'Extract odometer mileage reading from dashboard display',
        expectedContent: ['mileage']
      },
      {
        id: 'gauge',
        required: false,
        label: 'Fuel Gauge',
        hint: 'Shows fuel level after fill-up',
        aiPrompt: 'Estimate fuel level percentage from gauge indicator',
        expectedContent: ['fuel_level_percent']
      },
      {
        id: 'additives',
        required: false,
        label: 'Fuel Additives',
        hint: 'Products added (Seafoam, octane booster, etc.) - You can add multiple photos!',
        aiPrompt: 'Identify fuel additive products and brands from labels. Can detect multiple products in one photo or across multiple photos.',
        allowMultiple: true,
        expectedContent: ['product_name', 'brand', 'type']
      }
    ]
  },

  service: {
    id: 'service',
    name: 'Service/Maintenance',
    icon: '🔧',
    description: 'Invoice required • Photos optional',
    quickMode: true,
    estimatedTime: '1 minute',
    aiDetectionKeywords: ['invoice', 'service', 'repair', 'maintenance', 'oil', 'labor', 'parts'],
    steps: [
      {
        id: 'invoice',
        required: true,
        label: 'Service Invoice',
        hint: 'Capture work performed, parts, and total cost',
        aiPrompt: 'Extract service details including shop name, services performed, parts used, labor costs, total amount, and date',
        expectedContent: ['shop', 'services', 'parts', 'labor', 'total', 'date']
      },
      {
        id: 'odometer',
        required: false,
        recommended: true,
        label: 'Odometer at Service',
        hint: 'Mileage when service was performed',
        aiPrompt: 'Extract odometer mileage reading',
        expectedContent: ['mileage']
      },
      {
        id: 'damage_before',
        required: false,
        label: 'Before Photos',
        hint: 'Document condition before work',
        aiPrompt: 'Capture visual condition before service',
        allowMultiple: true
      },
      {
        id: 'damage_after',
        required: false,
        label: 'After Photos',
        hint: 'Document condition after work',
        aiPrompt: 'Capture visual condition after service',
        allowMultiple: true
      },
      {
        id: 'parts',
        required: false,
        label: 'Parts/Supplies',
        hint: 'New parts or fluids used',
        aiPrompt: 'Identify parts, brands, and specifications from labels',
        allowMultiple: true
      }
    ]
  },

  tire: {
    id: 'tire',
    name: 'Tire Inspection',
    icon: '🛞',
    description: '4 tread photos required',
    quickMode: false,
    estimatedTime: '2-3 minutes',
    aiDetectionKeywords: ['tire', 'tread', 'penny', 'depth'],
    steps: [
      {
        id: 'fl_tread',
        required: true,
        label: 'Front Left Tread',
        hint: 'Use penny test or tread depth gauge',
        aiPrompt: 'Measure tire tread depth in 32nds of an inch',
        expectedContent: ['depth_32nds']
      },
      {
        id: 'fr_tread',
        required: true,
        label: 'Front Right Tread',
        hint: 'Use penny test or tread depth gauge',
        aiPrompt: 'Measure tire tread depth in 32nds of an inch',
        expectedContent: ['depth_32nds']
      },
      {
        id: 'rl_tread',
        required: true,
        label: 'Rear Left Tread',
        hint: 'Use penny test or tread depth gauge',
        aiPrompt: 'Measure tire tread depth in 32nds of an inch',
        expectedContent: ['depth_32nds']
      },
      {
        id: 'rr_tread',
        required: true,
        label: 'Rear Right Tread',
        hint: 'Use penny test or tread depth gauge',
        aiPrompt: 'Measure tire tread depth in 32nds of an inch',
        expectedContent: ['depth_32nds']
      },
      {
        id: 'tire_label',
        required: false,
        recommended: true,
        label: 'Tire Sidewall Info',
        hint: 'Size, brand, and load rating',
        aiPrompt: 'Extract tire size, brand, model, load rating, and date code from sidewall',
        expectedContent: ['size', 'brand', 'model', 'load_rating', 'date_code']
      }
    ]
  },

  damage: {
    id: 'damage',
    name: 'Damage/Incident',
    icon: '💥',
    description: 'Multiple angles needed',
    quickMode: false,
    estimatedTime: '2-4 minutes',
    aiDetectionKeywords: ['damage', 'scratch', 'dent', 'accident', 'collision'],
    steps: [
      {
        id: 'overview',
        required: true,
        label: 'Overall View',
        hint: 'Wide shot showing damaged area in context',
        aiPrompt: 'Identify location and extent of damage on vehicle',
        allowMultiple: true
      },
      {
        id: 'closeup',
        required: true,
        label: 'Close-Up Detail',
        hint: 'Clear view of specific damage',
        aiPrompt: 'Assess severity and type of damage',
        allowMultiple: true
      },
      {
        id: 'other_party',
        required: false,
        label: 'Other Vehicle (if applicable)',
        hint: 'Document other vehicle and license plate',
        aiPrompt: 'Extract vehicle details and license plate',
        allowMultiple: true
      },
      {
        id: 'scene',
        required: false,
        label: 'Scene Photos',
        hint: 'Surrounding area, traffic signs, conditions',
        aiPrompt: 'Document scene context and conditions',
        allowMultiple: true
      }
    ]
  },

  dashboard_warning: {
    id: 'dashboard_warning',
    name: 'Dashboard Warning',
    icon: '⚠️',
    description: 'Warning lights + odometer',
    quickMode: true,
    estimatedTime: '30 seconds',
    aiDetectionKeywords: ['warning', 'light', 'dashboard', 'check engine', 'abs', 'airbag'],
    steps: [
      {
        id: 'warning_lights',
        required: true,
        label: 'Warning Lights',
        hint: 'Clear view of illuminated indicators',
        aiPrompt: 'Identify all illuminated warning lights and indicators',
        expectedContent: ['warning_types', 'colors']
      },
      {
        id: 'odometer',
        required: true,
        label: 'Odometer Reading',
        hint: 'Mileage when warning appeared',
        aiPrompt: 'Extract current mileage',
        expectedContent: ['mileage']
      }
    ]
  },

  document: {
    id: 'document',
    name: 'Document/Receipt',
    icon: '📄',
    description: 'Single photo capture',
    quickMode: true,
    estimatedTime: '15 seconds',
    aiDetectionKeywords: ['receipt', 'invoice', 'document', 'registration', 'insurance'],
    steps: [
      {
        id: 'document',
        required: true,
        label: 'Document',
        hint: 'Clear, well-lit photo of full document',
        aiPrompt: 'Extract all text and relevant information from document',
        allowMultiple: true
      }
    ]
  }
}

// Helper function to detect event type from image analysis
export function detectEventType(aiAnalysis: {
  text: string[]
  labels: string[]
  objects: string[]
}): { type: string; confidence: number } | null {
  const allContent = [
    ...aiAnalysis.text,
    ...aiAnalysis.labels,
    ...aiAnalysis.objects
  ].join(' ').toLowerCase()

  for (const [eventType, config] of Object.entries(CAPTURE_FLOWS)) {
    const matches = config.aiDetectionKeywords.filter(keyword =>
      allContent.includes(keyword.toLowerCase())
    )
    
    if (matches.length > 0) {
      const confidence = matches.length / config.aiDetectionKeywords.length
      return { type: eventType, confidence }
    }
  }

  return null
}

// Get user-friendly time estimate
export function getEstimatedTime(eventType: string, includeOptional: boolean = false): string {
  const config = CAPTURE_FLOWS[eventType]
  if (!config) return 'Unknown'
  
  if (config.quickMode && !includeOptional) {
    return config.estimatedTime
  }
  
  const totalSteps = config.steps.length
  const requiredSteps = config.steps.filter(s => s.required).length
  
  if (includeOptional) {
    return `${totalSteps * 20}-${totalSteps * 30} seconds`
  }
  
  return `${requiredSteps * 20}-${requiredSteps * 30} seconds`
}
