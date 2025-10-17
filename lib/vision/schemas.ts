// Vision Processing Schemas
// Single source of truth for document schemas and extraction rules

import { DocumentType } from './types'

export interface DocumentSchema {
  fields: Record<string, string>
  rules: string[]
  criticalNotes?: string[]
  extractionFocus?: string[]
  fewShotExamples?: Array<{
    scenario: string
    correct: string
    incorrect?: string
  }>
}

export const DOCUMENT_SCHEMAS: Record<DocumentType, DocumentSchema> = {
  service_invoice: {
    fields: {
      vendor_name: 'string|null',
      service_description: 'string|null',
      total_amount: 'number|null',
      date: 'YYYY-MM-DD|null',
      odometer_reading: 'number|null',
      vehicle_info: '{ year: number|null, make: string|null, model: string|null, vin: string|null }',
      line_items: '[{ description: string, amount: number, category: "labor|parts|fluids|other" }]',
      confidence: 'number 0-1'
    },
    rules: [
      'Extract vendor/shop name from header or letterhead',
      'Parse total amount as number (remove $ and commas)',
      'Convert dates to YYYY-MM-DD format',
      'Extract odometer reading if mentioned',
      'Categorize line items as labor, parts, fluids, or other',
      'Return null for fields not clearly visible',
      'Confidence should reflect overall extraction quality'
    ],
    extractionFocus: [
      'Pay attention to vendor names, dates, amounts',
      'Look for itemized charges and labor costs',
      'Note any vehicle information (year, make, model, mileage)',
      'Extract warranty information if present'
    ]
  },

  fuel_receipt: {
    fields: {
      // Core fuel data
      station_name: 'string|null',
      station_address: 'string|null',
      total_amount: 'number|null',
      gallons: 'number|null',
      price_per_gallon: 'number|null',
      fuel_type: 'string|null',
      date: 'YYYY-MM-DD|null',
      time: 'HH:MM|null',
      pump_number: 'string|null',
      
      // Payment details
      payment_method: 'string|null',
      card_last_four: 'string|null',
      entry_method: 'string|null',
      
      // Transaction identifiers (fraud detection)
      transaction_id: 'string|null',
      invoice_number: 'string|null',
      auth_code: 'string|null',
      
      // Merchant details
      site_id: 'string|null',
      trace_id: 'string|null',
      merchant_id: 'string|null',
      
      // Credit card transaction codes (optional advanced)
      aid: 'string|null',
      tvr: 'string|null',
      iad: 'string|null',
      tsi: 'string|null',
      arc: 'string|null',
      
      confidence: 'number 0-1'
    },
    rules: [
      'Extract station name from header (Murphy USA, Shell, Exxon, etc.)',
      'Extract full station address if visible on receipt',
      'Parse amounts as numbers (remove $ and commas)',
      'Extract gallons and calculate price per gallon if not shown',
      'Identify fuel type/grade (Regular, Premium, Diesel, SUPERUN, etc.)',
      'Convert dates to YYYY-MM-DD format',
      'Extract time in HH:MM format',
      'Note payment method (Mastercard, Visa, Cash, etc.) and last 4 digits',
      'Extract pump number if shown',
      'CRITICAL: Extract transaction ID (Tran #, Trans #, Transaction #) - used for duplicate detection',
      'Extract invoice/receipt number - used for expense reconciliation',
      'Extract auth/authorization code - used for dispute resolution',
      'Extract site ID, trace ID, merchant ID if visible - useful for fraud detection',
      'Note entry method (L=chip, S=swipe, C=contactless)',
      'Credit card codes (AID, TVR, etc.) are optional - only extract if clearly visible',
      'Return null for fields not clearly visible'
    ],
    extractionFocus: [
      'PRIMARY: station name, address, date, time, total amount',
      'IMPORTANT: gallons, price per gallon, fuel type, pump number',
      'CRITICAL: transaction ID (prevents duplicate uploads)',
      'USEFUL: payment method, auth code, invoice number',
      'OPTIONAL: site/trace/merchant IDs, credit card codes',
      'Look for transaction identifiers prominently displayed at bottom of receipt'
    ]
  },

  dashboard_snapshot: {
    fields: {
      odometer_miles: 'number|null',
      odometer_raw: '{ value: number, unit: "km"|"mi" }|null',
      trip_meters: '[{ label: "Trip A"|"Trip B"|"Trip", value: number, unit: "km"|"mi" }]|null',
      fuel_level: '{ type: "percent|quarters|eighths", value: number|string }|null',
      coolant_temp: '{ status: "cold|normal|hot", gauge_position: "low|center|high" }|null',
      outside_temp: '{ value: number, unit: "F"|"C", display_location: string }|null',
      warning_lights: '[string]|null',
      oil_life_percent: 'number|null',
      service_message: 'string|null',
      confidence: 'number 0-1'
    },
    rules: [
      'ODOMETER vs TRIP METER - CRITICAL DISTINCTION:',
      'ODOMETER: Main total mileage display - usually labeled "ODO", "ODOMETER", or just shows large number',
      'ODOMETER: Typically 5-6 digits, NON-RESETTABLE, represents total vehicle miles',
      'TRIP METER: Resettable trip mileage - labeled "Trip", "Trip A", "Trip B", or "TRIP"',
      'TRIP METER: Typically 3-4 digits, RESETTABLE, used for tracking individual trips',
      'CRITICAL: If you see "Trip" or "Trip X" label, that is NOT the main odometer!',
      'CRITICAL: Trip meters should go in trip_meters array, NOT odometer_miles',
      'ODOMETER: Read COMPLETE digital display - ALL DIGITS including leading zeros',
      'ODOMETER: Common formats: 85432, 127856, 012847 - read EVERY digit visible',
      'ODOMETER: If km units, convert to miles (km ÷ 1.609), round to nearest whole number',
      'ODOMETER: Look for "ODO" or "ODOMETER" label, or the LARGEST mileage number shown',
      'ODOMETER: Do NOT truncate - read full 5-6 digit number as displayed',
      'FUEL: Trace needle position carefully - E=Empty, F=Full, marks in between',
      'FUEL: If needle points to F, that is FULL (4/4 quarters or 8/8 eighths = 100%)',
      'FUEL: If needle points to E, that is EMPTY (0/4 quarters or 0/8 eighths = 0%)',
      'FUEL: Determine scale type first - quarters (E,1/4,1/2,3/4,F) or eighths (E,1/8,2/8...7/8,F)',
      'COOLANT TEMPERATURE: Trace needle on C-H gauge - C=Cold, H=Hot, center=Normal',
      'COOLANT TEMPERATURE: This is ENGINE coolant, not outside weather temperature',
      'COOLANT TEMPERATURE: Cold=low position, Normal=center position, Hot=high position',
      'OUTSIDE TEMPERATURE: Look for digital display showing weather temp (°F or °C)',
      'OUTSIDE TEMPERATURE: Usually displayed in info center, not as analog gauge',
      'OUTSIDE TEMPERATURE: Record exact value and unit, note display location',
      'CRITICAL: Do NOT confuse outside weather temp with engine coolant temp',
      'List only clearly illuminated warning lights (bright/glowing)',
      'Extract oil life percentage if displayed',
      'Return null if readings are unclear or needle position ambiguous'
    ],
    criticalNotes: [
      'CRITICAL: TRIP METER ≠ ODOMETER - If display says "Trip", "Trip A", "Trip B", that is NOT the main odometer!',
      'CRITICAL: ODOMETER is usually 5-6 digits and non-resettable; TRIP is 3-4 digits and resettable',
      'CRITICAL: If BOTH are visible, extract the MAIN odometer for odometer_miles, put trip in trip_meters array',
      'CRITICAL: If ONLY trip meter visible (Trip X), set odometer_miles to null, extract trip_meters only',
      'CRITICAL: ODOMETER - Read EVERY digit visible, do NOT truncate or read partial numbers',
      'CRITICAL: ODOMETER - Common mistake: reading "85432" as "820" - READ THE COMPLETE NUMBER',
      'CRITICAL: Digital displays are MORE ACCURATE than analog gauges',
      'CRITICAL: FUEL gauge (E-F) is typically on LEFT, TEMPERATURE gauge (C-H) on RIGHT',
      'CRITICAL: Trace needle position precisely - do not guess between positions',
      'CRITICAL: Convert km to miles: divide by 1.609 (e.g., 127856 km = 79446 miles)',
      'CRITICAL: FUEL NEEDLE AT F = COMPLETELY FULL (100%) regardless of scale type',
      'CRITICAL: Count gauge markings to determine quarters vs eighths scale',
      'CRITICAL: COOLANT TEMP = Engine temperature (C-H gauge with needle)',
      'CRITICAL: OUTSIDE TEMP = Weather temperature (digital display with °F/°C)',
      'CRITICAL: These are COMPLETELY DIFFERENT - never confuse them!'
    ],
    fewShotExamples: [
      {
        scenario: 'Display shows "Trip A: 123.4 miles"',
        correct: '{ "odometer_miles": null, "trip_meters": [{ "label": "Trip A", "value": 123.4, "unit": "mi" }] }',
        incorrect: '{ "odometer_miles": 123 } // Wrong - Trip meter is NOT the main odometer!'
      },
      {
        scenario: 'Main odometer "85432" visible, also "Trip: 234.1" shown',
        correct: '{ "odometer_raw": { "value": 85432, "unit": "mi" }, "odometer_miles": 85432, "trip_meters": [{ "label": "Trip", "value": 234.1, "unit": "mi" }] }',
        incorrect: '{ "odometer_miles": 234 } // Wrong - extracted trip instead of main odometer'
      },
      {
        scenario: 'Digital odometer shows "127856 km"',
        correct: '{ "odometer_raw": { "value": 127856, "unit": "km" }, "odometer_miles": 79446 }',
        incorrect: '{ "odometer_miles": 193 } // Wrong - read only partial digits, must read ALL digits'
      },
      {
        scenario: 'Digital odometer shows "85432 miles"',
        correct: '{ "odometer_raw": { "value": 85432, "unit": "mi" }, "odometer_miles": 85432 }',
        incorrect: '{ "odometer_miles": 820 } // Wrong - read only partial digits, must read COMPLETE number'
      },
      {
        scenario: 'Fuel needle pointing to F (Full) on quarters scale',
        correct: '{ "fuel_level": { "type": "quarters", "value": "F" } }',
        incorrect: '{ "fuel_level": { "type": "eighths", "value": 7 } } // Wrong - F means completely full, not 7/8'
      },
      {
        scenario: 'Fuel needle pointing to F (Full) on eighths scale',
        correct: '{ "fuel_level": { "type": "eighths", "value": 8 } }',
        incorrect: '{ "fuel_level": { "type": "quarters", "value": "3/4" } } // Wrong - F means completely full'
      },
      {
        scenario: 'Temperature needle at C (Cold position)',
        correct: '{ "coolant_temp": { "status": "cold", "gauge_position": "low" } }',
        incorrect: '{ "coolant_temp": { "status": "normal", "gauge_position": "center" } } // Wrong - C means cold'
      },
      {
        scenario: 'Fuel gauge at 3/4 position',
        correct: '{ "fuel_level": { "type": "eighths", "value": 6 } }',
        incorrect: '{ "coolant_temp": { "status": "hot" } } // Wrong - this is fuel gauge, not temperature'
      },
      {
        scenario: 'Digital display shows "72°F" in info center',
        correct: '{ "outside_temp": { "value": 72, "unit": "F", "display_location": "info center" } }',
        incorrect: '{ "coolant_temp": { "status": "normal" } } // Wrong - this is outside weather, not coolant'
      },
      {
        scenario: 'Coolant gauge needle at C position AND digital "85°F" visible',
        correct: '{ "coolant_temp": { "status": "cold", "gauge_position": "low" }, "outside_temp": { "value": 85, "unit": "F", "display_location": "dashboard" } }',
        incorrect: '{ "coolant_temp": { "status": "hot" } } // Wrong - confused outside temp with coolant temp'
      }
    ]
  },

  insurance_card: {
    fields: {
      insurance_company: 'string|null',
      policy_number: 'string|null',
      effective_date: 'YYYY-MM-DD|null',
      expiration_date: 'YYYY-MM-DD|null',
      vehicle_info: '{ year: number|null, make: string|null, model: string|null, vin: string|null }',
      coverage_limits: '{ liability: string|null, comprehensive: string|null, collision: string|null }',
      agent_info: '{ name: string|null, phone: string|null }',
      confidence: 'number 0-1'
    },
    rules: [
      'Extract company name from header/logo',
      'Policy number is usually prominent alphanumeric code',
      'Convert all dates to YYYY-MM-DD format',
      'Extract vehicle details if shown',
      'Parse coverage limits (may be abbreviated)',
      'Get agent contact information',
      'Return null for fields not visible'
    ],
    extractionFocus: [
      'Pay attention to policy numbers, dates, company name',
      'Look for coverage details and limits',
      'Note agent information and contact details',
      'Extract vehicle information (VIN, year, make, model)'
    ]
  },

  odometer: {
    fields: {
      odometer_miles: 'number|null',
      display_type: '"digital"|"analog"',
      trip_meters: '{ trip_a: number|null, trip_b: number|null }',
      confidence: 'number 0-1'
    },
    rules: [
      'Read the main odometer display (usually largest numbers)',
      'Distinguish between total miles and trip meters',
      'Digital displays are preferred for accuracy',
      'For analog, read to nearest mile',
      'Extract trip meter readings if visible',
      'Return null if reading is unclear or obscured'
    ],
    extractionFocus: [
      'Look for the main odometer reading (usually 5-6 digits)',
      'Distinguish from trip meters (smaller, resettable)',
      'Read ALL digits including leading zeros',
      'Note if units are in km or miles'
    ]
  },

  fuel_gauge: {
    fields: {
      fuel_level: 'number|null',
      percentage: 'number|null',
      bars_filled: 'number|null',
      total_bars: 'number|null',
      indicator_position: '"empty"|"quarter"|"half"|"three_quarters"|"full"',
      low_fuel_warning: 'boolean',
      confidence: 'number 0-1'
    },
    rules: [
      '═══════════════════════════════════════════════════════════════',
      'STEP 1: IDENTIFY GAUGE TYPE',
      '═══════════════════════════════════════════════════════════════',
      'TYPE A - ANALOG NEEDLE: Physical or digital needle/pointer on circular or arc gauge',
      'TYPE B - BAR/SEGMENT: Discrete blocks/segments that fill from E to F',
      'TYPE C - DIGITAL NUMERIC: Displays exact number like "50%", "1/2", or fraction',
      '',
      '═══════════════════════════════════════════════════════════════',
      'TYPE A: ANALOG NEEDLE GAUGES',
      '═══════════════════════════════════════════════════════════════',
      'NEEDLE APPEARANCE - The needle can be ANY of these:',
      '  • Red needle (most common)',
      '  • White/silver needle',
      '  • Orange needle',
      '  • Blue needle',
      '  • Illuminated/glowing needle (backlit)',
      '  • Non-illuminated dark needle',
      '  • Thin pointer line on digital display',
      'NEEDLE IDENTIFICATION: Look for ANY line/pointer that extends from center pivot to gauge markings',
      'IGNORE gauge background color/lighting - focus on the POINTER itself',
      '',
      'GAUGE ORIENTATION - Two common layouts:',
      'HORIZONTAL: E on LEFT, F on RIGHT (needle sweeps left→right)',
      '  • E typically at 7-8 o\'clock, F at 4-5 o\'clock',
      'VERTICAL: E at BOTTOM, F at TOP (needle sweeps bottom→top)',
      '  • E at 6 o\'clock (bottom), F at 12 o\'clock (top)',
      '',
      'READING STEPS:',
      '1. Locate E and F markers to determine orientation',
      '2. Find the needle (any color, lit or unlit)',
      '3. Trace needle from pivot CENTER to the TIP',
      '4. See where TIP points on the gauge scale',
      '5. Calculate percentage based on position between E and F',
      '',
      'PERCENTAGE RULES:',
      'Needle at F = 90-100% FULL',
      'Needle at 3/4 mark = 70-80%',
      'Needle at 1/2 mark = 45-55%',
      'Needle at 1/4 mark = 20-30%',
      'Needle at E = 0-10% EMPTY',
      '',
      '═══════════════════════════════════════════════════════════════',
      'TYPE B: BAR/SEGMENT GAUGES',
      '═══════════════════════════════════════════════════════════════',
      'APPEARANCE: Discrete blocks/bars that light up or fill in',
      'Example: E [■][■][■][□][□][□][□][□] F  (3 out of 8 filled)',
      '',
      'BAR ORIENTATION:',
      'HORIZONTAL: E on left, F on right - bars fill left to right',
      'VERTICAL: E at bottom, F at top - bars fill bottom to top',
      '',
      'COUNTING RULES:',
      '1. Count TOTAL number of segments/blocks (filled + empty)',
      '2. Count FILLED/LIT segments only',
      '3. Calculate: (filled_segments ÷ total_segments) × 100 = percentage',
      '4. Example: 6 filled out of 8 total = (6÷8)×100 = 75%',
      '',
      'FILLED SEGMENT IDENTIFICATION:',
      '  • Illuminated/bright segments',
      '  • Colored segments (vs dark/empty)',
      '  • Solid blocks vs outline-only blocks',
      '',
      '═══════════════════════════════════════════════════════════════',
      'TYPE C: DIGITAL NUMERIC DISPLAYS',
      '═══════════════════════════════════════════════════════════════',
      'Simply read the displayed value:',
      '  • "75%" → fuel_level: 75',
      '  • "1/2" → fuel_level: 50',
      '  • "3/4" → fuel_level: 75',
      '  • "FULL" → fuel_level: 100',
      '  • "LOW" → fuel_level: 10',
      '',
      '═══════════════════════════════════════════════════════════════',
      'COMMON ISSUES & ACCURACY CHECKS',
      '═══════════════════════════════════════════════════════════════',
      '⚠️ CRITICAL: If needle appears to point to F, verify it is 90-100%, NOT 50%!',
      '⚠️ If needle is hard to see, look for shadow, outline, or slight color difference',
      '⚠️ For bar gauges, count carefully - partial fill of last segment = round down',
      '⚠️ Low fuel warning light (orange) usually means <10-15% fuel remaining',
      '',
      'CONFIDENCE SCORING:',
      'High (0.9): Clear needle position or exact digital reading',
      'Medium (0.7): Needle visible but position ambiguous',
      'Low (0.5): Gauge partially obscured or needle unclear',
      'Return null if gauge completely unreadable'
    ],
    extractionFocus: [
      'Identify gauge type first: analog needle, bar segments, or digital',
      'For analog: Locate E and F markers, determine needle sweep direction',
      'Trace needle from base to tip - where does the tip point?',
      'If needle points to F, gauge is FULL (90-100%)',
      'If needle points to E, gauge is EMPTY (0-10%)',
      'Check for low fuel warning light (usually orange fuel pump icon)',
      'Verify percentage makes sense: needle near F should be 80-100%, not 50%'
    ]
  },

  product_label: {
    fields: {
      brand: 'string|null',
      product_name: 'string|null',
      product_type: 'string|null',
      size: 'string|null',
      quantity: 'string|null',
      purpose: 'string|null',
      ingredients: '[string]|null',
      warnings: '[string]|null',
      confidence: 'number 0-1'
    },
    rules: [
      'Extract brand name prominently displayed on label',
      'Get product name/title (main purpose)',
      'Identify product type (additive, treatment, cleaner, etc.)',
      'Extract size/quantity (20 FL OZ, 16 oz, etc.)',
      'Note primary purpose or use case',
      'List key ingredients if visible',
      'Extract warnings or cautions',
      'Return null for fields not clearly visible'
    ],
    extractionFocus: [
      'Focus on brand name and product name',
      'Look for size/quantity information',
      'Identify product type and purpose',
      'Note any key features or benefits listed'
    ]
  },

  accident_report: {
    fields: {
      report_number: 'string|null',
      date: 'YYYY-MM-DD|null',
      location: 'string|null',
      vehicles_involved: '[{ year: number|null, make: string|null, model: string|null, license_plate: string|null, driver_name: string|null }]',
      damage_description: 'string|null',
      officer_name: 'string|null',
      confidence: 'number 0-1'
    },
    rules: [
      'Extract report/case number from header',
      'Parse accident date and location',
      'List all vehicles with available details',
      'Describe damage in summary form',
      'Note investigating officer if mentioned',
      'Return null for unavailable information'
    ]
  },

  inspection_certificate: {
    fields: {
      certificate_number: 'string|null',
      inspection_date: 'YYYY-MM-DD|null',
      expiration_date: 'YYYY-MM-DD|null',
      result: '"pass"|"fail"|"conditional"',
      inspection_station: 'string|null',
      vehicle_info: '{ year: number|null, make: string|null, model: string|null, vin: string|null, license_plate: string|null }',
      odometer_reading: 'number|null',
      confidence: 'number 0-1'
    },
    rules: [
      'Extract certificate number and dates',
      'Determine pass/fail result',
      'Get inspection station name and location',
      'Extract vehicle identification details',
      'Note odometer reading if recorded',
      'Return null for missing information'
    ]
  },

  license_plate: {
    fields: {
      plate_number: 'string|null',
      state: 'string|null',
      registration_stickers: '[string]|null',
      confidence: 'number 0-1'
    },
    rules: [
      'Extract the license plate number clearly',
      'Note the state/province if visible',
      'Look for registration stickers or dates',
      'Extract any visible vehicle information'
    ]
  },

  vin: {
    fields: {
      vin: 'string|null',
      location: 'string|null',
      clarity: '"clear"|"partial"|"obscured"',
      confidence: 'number 0-1'
    },
    rules: [
      'Look for the 17-character VIN number',
      'VIN is usually on dashboard near windshield or driver door jamb',
      'Extract exactly as shown, maintaining character sequence',
      'Note if any characters are unclear or obscured'
    ]
  }
}

/**
 * Derives OCR extraction focus from document schemas
 * Single source of truth - no duplication
 */
export function getOCRExtractionFocus(documentType: DocumentType): string[] | undefined {
  const schema = DOCUMENT_SCHEMAS[documentType]
  return schema?.extractionFocus
}
