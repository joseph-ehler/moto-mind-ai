/**
 * Dashboard Snapshot Extraction Prompts
 * Instructions and few-shot examples - separate from schema
 */

export const DASHBOARD_SYSTEM_PROMPT = `Extract dashboard information. Return JSON exactly like this example:

{
  "odometer_miles": 85432,
  "odometer_unit": "mi",
  "trip_a_miles": 234.1,
  "trip_b_miles": null,
  "fuel_eighths": 6,
  "coolant_temp": "normal",
  "outside_temp_value": 72,
  "outside_temp_unit": "F",
  "warning_lights": ["check_engine", "oil_pressure"],
  "oil_life_percent": 45,
  "service_message": null,
  "confidence": 0.95
}

CRITICAL RULES:
- Odometer: Main mileage display (5-6 digits). Trip meters are separate (labeled "Trip A" or "Trip B")
- Fuel: Count eighths from E (0) to F (8). Needle at F = 8, at E = 0, halfway = 4
- Coolant temp: "cold" (needle at C), "normal" (center), "hot" (needle at H)
- Outside temp: Digital display, not the engine coolant gauge
- Use null for unclear readings

FUEL GAUGE TYPES:
• Analog (needle gauge): Count needle position in eighths. E=0, 1/8=1, 1/4=2, 3/8=3, 1/2=4, 5/8=5, 3/4=6, 7/8=7, F=8
• Digital (numeric): If shows percentage (e.g., "75%"), convert to eighths: 0%=0, 12.5%=1, 25%=2, 37.5%=3, 50%=4, 62.5%=5, 75%=6, 87.5%=7, 100%=8
• Digital (bars): Count visible bars out of 8 total

WARNING LIGHTS TO DETECT (look carefully at instrument cluster for ANY illuminated symbols):

CRITICAL (Red) - Report these:
• check_engine: Yellow/amber engine symbol
• oil_pressure: Red oil can symbol
• brake: Red "BRAKE" text or (!) in circle
• brake_system: Red (!) in circle with "BRAKE"
• airbag: Red person with seatbelt/airbag symbol, or "SRS" or "AIRBAG" text
• battery: Red battery symbol
• coolant_temp: Red thermometer in liquid
• temperature: Red "TEMP" or thermometer symbol
• power_steering: Red steering wheel with (!)

WARNINGS (Yellow/Amber) - Report these:
• abs: Yellow "ABS" text in circle
• tire_pressure: Yellow tire cross-section with (!) or "TPMS"
• tpms: Same as tire_pressure
• low_fuel: Yellow/amber fuel pump symbol
• traction_control: Yellow car with wavy lines or "TCS"
• tcs: Same as traction_control
• esp: Yellow "ESP" text
• brake_pad: Yellow brake pad symbol
• dpf: Yellow filter symbol with dots (diesel vehicles)

INDICATORS (Green/Blue/White) - Usually ignore unless specifically lit:
• seatbelt: Red person with seatbelt (report if lit)
• cruise_control: Green "CRUISE" text
• headlight: Green headlight symbol
• high_beam: Blue headlight symbol
• turn_signal: Green arrow (left or right)

IMPORTANT: Only report warning lights that are ILLUMINATED (lit up). Do not report indicators that are off/dark.`

export const DASHBOARD_FEW_SHOT = [
  {
    scenario: 'Odometer shows 85432 mi, Trip A shows 234.1',
    correct: {
      odometer_miles: 85432,
      odometer_unit: 'mi',
      trip_a_miles: 234.1,
      trip_b_miles: null,
      fuel_eighths: null
    },
    wrong: {
      odometer_miles: 234,  // ❌ Used trip meter instead of main odometer
      trip_a_miles: 85432
    },
    explanation: 'Trip meter is NOT the main odometer - check labels'
  },
  {
    scenario: 'Only Trip A visible: 123.4 miles',
    correct: {
      odometer_miles: null,  // Main odometer not visible
      odometer_unit: null,
      trip_a_miles: 123.4,
      trip_b_miles: null
    },
    wrong: {
      odometer_miles: 123  // ❌ Trip is not main odometer
    },
    explanation: 'If only trip meter shown, odometer_miles must be null'
  },
  {
    scenario: 'Odometer shows 127856 km',
    correct: {
      odometer_miles: 127856,
      odometer_unit: 'km',  // Note the unit, don't convert
      trip_a_miles: null,
      trip_b_miles: null
    },
    wrong: {
      odometer_miles: 79446,  // ❌ Don't convert - that happens in app
      odometer_unit: 'mi'
    },
    explanation: 'Extract raw km value, app will convert if needed'
  },
  {
    scenario: 'Fuel needle pointing at F (full)',
    correct: {
      fuel_eighths: 8  // F = completely full = 8/8
    },
    wrong: {
      fuel_eighths: 7  // ❌ F is 8, not 7
    },
    explanation: 'F means full tank = 8 eighths, not 7'
  },
  {
    scenario: 'Fuel needle at halfway mark',
    correct: {
      fuel_eighths: 4  // Halfway = 4/8 = 1/2
    },
    wrong: {
      fuel_eighths: 0.5  // ❌ Use eighths count, not decimal
    },
    explanation: 'Always count eighths from 0-8, not percentages or decimals'
  },
  {
    scenario: 'Fuel needle at E (empty)',
    correct: {
      fuel_eighths: 0  // E = empty = 0/8
    },
    wrong: {
      fuel_eighths: null  // ❌ E is a valid reading (0), not null
    },
    explanation: 'Empty is 0, not null - null means unclear reading'
  },
  {
    scenario: 'Coolant needle at center, outside temp shows 72°F',
    correct: {
      coolant_temp: 'normal',
      outside_temp_value: 72,
      outside_temp_unit: 'F'
    },
    wrong: {
      coolant_temp: 'hot',  // ❌ Center is normal, not hot
      outside_temp_value: null
    },
    explanation: 'Coolant gauge (C-H needle) vs outside temp (digital) are different'
  }
]

export const DASHBOARD_CRITICAL_RULES = [
  'If display says "Trip", that is NOT the main odometer',
  'Main odometer is 5-6 digits, trip meters are 3-4 digits',
  'Fuel: Always use eighths scale (0-8), never percentages or fractions',
  'F (full) = 8, E (empty) = 0, halfway = 4',
  'Coolant temp (C-H gauge) ≠ Outside temp (digital display)',
  'Keep km as km, mi as mi - don\'t convert units',
  'Return null only when reading is unclear, not when E or 0'
]
