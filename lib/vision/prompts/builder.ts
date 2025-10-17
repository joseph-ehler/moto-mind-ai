/**
 * Vision Prompt Builder
 * Assembles prompts from components: schema + instructions + few-shot
 */

import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { DASHBOARD_SYSTEM_PROMPT, DASHBOARD_FEW_SHOT, DASHBOARD_CRITICAL_RULES } from './dashboard'
import { DASHBOARD_JSON_SCHEMA, FUEL_RECEIPT_JSON_SCHEMA, SERVICE_INVOICE_JSON_SCHEMA } from '../schemas/fields'
import { REFERENCE_IMAGES } from '../config'

export type DocumentType = 'dashboard_snapshot' | 'fuel_receipt' | 'service_invoice'

const SCHEMA_MAP = {
  dashboard_snapshot: DASHBOARD_JSON_SCHEMA,
  fuel_receipt: FUEL_RECEIPT_JSON_SCHEMA,
  service_invoice: SERVICE_INVOICE_JSON_SCHEMA
}

const SYSTEM_PROMPTS = {
  dashboard_snapshot: DASHBOARD_SYSTEM_PROMPT,
  fuel_receipt: `You extract fuel receipt data from photos with precision.

STATION: Extract station name from header/logo (Shell, Exxon, BP, etc.)
AMOUNTS: Parse as numbers - remove $ and commas
GALLONS: Extract fuel quantity
FUEL TYPE: Regular, Premium, Diesel, etc.
DATE/TIME: Convert to YYYY-MM-DD and HH:MM format
PAYMENT: Cash, Credit, Debit, etc.

Return null for unclear fields.`,
  service_invoice: `You extract service invoice data from photos with precision.

VENDOR: Shop name from header/letterhead
AMOUNTS: Parse as numbers - remove $ and commas  
DATE: Convert to YYYY-MM-DD format
ODOMETER: Extract mileage if shown
LINE ITEMS: List each service/part with amount and category (labor/parts/fluids/other)
VEHICLE INFO: Extract year, make, model, VIN if visible

Return null for unclear fields.`
}

const FEW_SHOT_EXAMPLES = {
  dashboard_snapshot: DASHBOARD_FEW_SHOT,
  fuel_receipt: [],
  service_invoice: []
}

/**
 * Build complete prompt for vision extraction
 */
export function buildExtractionPrompt(
  documentType: DocumentType,
  imageBase64: string,
  options?: {
    useReferenceLegend?: boolean
    useGaugeReferences?: boolean
  }
): ChatCompletionMessageParam[] {
  const systemPrompt = SYSTEM_PROMPTS[documentType]
  const fewShot = FEW_SHOT_EXAMPLES[documentType]
  const schema = SCHEMA_MAP[documentType]
  const useReferenceLegend = options?.useReferenceLegend ?? true
  const useGaugeReferences = options?.useGaugeReferences ?? false

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: systemPrompt
    }
  ]

  // Few-shot examples REMOVED after A/B testing showed zero accuracy benefit
  // Test results: 0% accuracy both with and without few-shot, but 40% cheaper without
  // System prompt needs revision, not examples

  // Add reference legend for dashboard warning lights (A/B test)
  if (documentType === 'dashboard_snapshot' && useReferenceLegend) {
    messages.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: REFERENCE_IMAGES.warningLights
          }
        },
        {
          type: 'text',
          text: `📖 REFERENCE GUIDE #1 - WARNING LIGHTS: This image shows common dashboard warning light symbols and their standard names.

Study these symbols carefully - they show what each warning light looks like:
• The SHAPE of each symbol
• The COLOR (red, yellow/amber, green/blue)
• The LABEL/name for each light

Use this as a VISUAL DICTIONARY to identify which warning lights are illuminated on the actual dashboard below.

IMPORTANT: Only report lights that are LIT UP (illuminated/glowing) on the real dashboard. Dark/off indicators should not be reported.`
        }
      ]
    })
  }

  // Add gauge references for fuel/coolant (4 separate examples)
  if (documentType === 'dashboard_snapshot' && useGaugeReferences) {
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: `📊 REFERENCE GUIDE #2 - FUEL & COOLANT GAUGES

The following 4 images show different types of fuel and coolant temperature gauges. Study each type carefully, then identify which type appears on the actual dashboard.`
        },
        {
          type: 'image_url',
          image_url: { url: REFERENCE_IMAGES.fuelAnalog }
        },
        {
          type: 'text',
          text: `FUEL - ANALOG (Needle): Needle moves from E (empty=0/8) to F (full=8/8). Read needle position as eighths.`
        },
        {
          type: 'image_url',
          image_url: { url: REFERENCE_IMAGES.fuelDigital }
        },
        {
          type: 'text',
          text: `FUEL - DIGITAL (Bars/Percentage): Count lit bars or read percentage. Convert to eighths (e.g., 75%=6/8).`
        },
        {
          type: 'image_url',
          image_url: { url: REFERENCE_IMAGES.coolantAnalog }
        },
        {
          type: 'text',
          text: `COOLANT - ANALOG (Needle): Needle moves from C (cold) through center (normal) to H (hot). Read position as "cold", "normal", or "hot".`
        },
        {
          type: 'image_url',
          image_url: { url: REFERENCE_IMAGES.coolantDigital }
        },
        {
          type: 'text',
          text: `COOLANT - DIGITAL (Optional): Numeric temperature display (e.g., "195°F", "90°C") or warning text.

Now compare the ACTUAL dashboard gauges to these reference examples. Identify which TYPE each gauge is, then read the value accurately.`
        }
      ]
    })
  }

  // Add user request with schema and image
  messages.push({
    role: 'user',
    content: [
      {
        type: 'text',
        text: documentType === 'dashboard_snapshot' && useReferenceLegend
          ? `Now analyze THIS actual dashboard photo. Compare any illuminated warning lights to the reference guide above. Extract all data and return JSON matching this schema:\n\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\``
          : `Extract ${documentType.replace('_', ' ')} data. Return JSON matching this schema:\n\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\``
      },
      {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`
        }
      }
    ]
  })

  return messages
}

/**
 * Build structured output schema for OpenAI
 */
export function getStructuredOutputSchema(documentType: DocumentType) {
  return {
    type: 'json_schema',
    json_schema: {
      name: `${documentType}_extraction`,
      schema: SCHEMA_MAP[documentType],
      strict: true
    }
  }
}

/**
 * Simple text-only prompt for testing
 */
export function buildTestPrompt(
  documentType: DocumentType,
  testScenario: string
): ChatCompletionMessageParam[] {
  const systemPrompt = SYSTEM_PROMPTS[documentType]
  const schema = SCHEMA_MAP[documentType]

  return [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: `Extract from: ${testScenario}\n\nReturn JSON matching:\n${JSON.stringify(schema, null, 2)}`
    }
  ]
}
