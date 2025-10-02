/**
 * Vision System Configuration
 */

/**
 * Reference images for vision AI
 * Shows GPT-4o what different dashboard elements look like
 */
const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/reference-images`
  : '/reference-images'

export const REFERENCE_IMAGES = {
  warningLights: `${baseUrl}/warning-lights-legend.jpg`,
  
  // Individual gauge references (simpler than composite)
  fuelAnalog: `${baseUrl}/fuel-analog.jpg`,      // E→F needle gauge
  fuelDigital: `${baseUrl}/fuel-digital.jpg`,    // Bar/percentage display
  coolantAnalog: `${baseUrl}/coolant-analog.jpg`, // C→H needle gauge
  coolantDigital: `${baseUrl}/coolant-digital.jpg` // Numeric temp display (optional)
}

// Backward compatibility
export const REFERENCE_LEGEND_URL = REFERENCE_IMAGES.warningLights

/**
 * Feature flags for A/B testing
 */
export const VISION_FEATURES = {
  // Use reference legend for warning light detection
  // A/B test this to measure accuracy improvement vs cost
  useReferenceLegend: process.env.VISION_USE_REFERENCE_LEGEND === 'true' || true,  // Default true
  
  // Use gauge reference images (analog vs digital fuel/coolant)
  // Helps distinguish analog needle gauges from digital displays
  useGaugeReferences: process.env.VISION_USE_GAUGE_REFERENCES === 'true' || false,  // Default false (pending images)
  
  // Future features
  useFewShotExamples: false,
  useStructuredOutput: false
}

/**
 * Cost tracking
 */
export const VISION_COSTS = {
  // Approximate token counts for cost calculation
  dashboardBase: 1800,                         // ~$0.03 (single dashboard image)
  dashboardWithWarningLights: 2300,            // ~$0.04-0.05 (+1 image)
  dashboardWithGauges: 3800,                   // ~$0.06-0.07 (+4 images)
  dashboardWithAllReferences: 4300,            // ~$0.07-0.09 (+5 images total)
  
  // GPT-4o vision pricing (per 1M tokens)
  inputCostPer1M: 2.50,   // $2.50 per 1M input tokens
  outputCostPer1M: 10.00, // $10.00 per 1M output tokens
  
  // Cost per reference image (approximate)
  perImageTokens: 500,    // ~500 tokens per small reference image
  perImageCost: 0.00125   // ~$0.00125 per reference image
}
