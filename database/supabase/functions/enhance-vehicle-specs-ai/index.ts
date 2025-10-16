import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const { vehicleId } = await req.json()

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Get vehicle and existing NHTSA data
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('year, make, model, trim, vin')
      .eq('id', vehicleId)
      .single()

    if (!vehicle) {
      return new Response(JSON.stringify({ error: 'Vehicle not found' }), { status: 404 })
    }

    // Get existing NHTSA specs
    const { data: nhtsaSpecs } = await supabase
      .from('vehicle_spec_enhancements')
      .select('category, data')
      .eq('vehicle_id', vehicleId)

    const nhtsaData: any = {}
    nhtsaSpecs?.forEach((spec: any) => {
      nhtsaData[spec.category] = spec.data
    })

    console.log(`🤖 Enhancing specs for ${vehicle.year} ${vehicle.make} ${vehicle.model}`)

    // Build single comprehensive query using NHTSA data
    const vehicleDesc = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`
    const engineDesc = nhtsaData.engine?.displacement 
      ? `${nhtsaData.engine.displacement}L ${nhtsaData.engine.cylinders}-cylinder`
      : 'base engine'

    const prompt = `Search these SPECIFIC sources for the ${vehicleDesc}:

1. ${vehicle.make}.com owner portal - complete maintenance schedule
2. "${vehicle.make} ${vehicle.model} ${vehicle.year} maintenance schedule PDF" - official document
3. "${vehicle.make} ${vehicle.model} severe service schedule" - includes transmission/brake fluid intervals
4. Edmunds.com or RepairPal.com maintenance section for ${vehicleDesc}
5. Owner's manual Appendix - full maintenance intervals

CONFIRMED DATA FROM NHTSA:
${JSON.stringify(nhtsaData, null, 2)}

YOUR TASK: Find the official manufacturer specification sheet AND complete maintenance schedule for this exact vehicle.

CRITICAL FOR MAINTENANCE INTERVALS:
- Search for "severe service schedule" to find transmission/brake fluid/coolant intervals
- Look in owner's manual appendix or supplemental maintenance booklet
- Check manufacturer's online owner portal for complete service schedules
- If not found, return null (DO NOT estimate or use generic intervals)

Return JSON with this EXACT structure (use null for any field you cannot find in official sources):
{
  "engine": {
    "horsepower": number (HP at RPM),
    "torque": number (lb-ft at RPM),
    "configuration": string (e.g., "V8", "Inline-4")
  },
  "drivetrain": {
    "transmission_type": string (e.g., "Automatic", "Manual"),
    "transmission_speeds": string (e.g., "10-Speed Automatic")
  },
  "dimensions": {
    "wheelbase": number (inches),
    "length": number (inches),
    "width": number (inches),
    "height": number (inches),
    "curb_weight": number (pounds)
  },
  "fuel_economy": {
    "city_mpg": number (EPA rating),
    "highway_mpg": number (EPA rating),
    "combined_mpg": number (EPA rating)
  },
  "features": {
    "seats": number,
    "cargo_volume": number (cubic feet)
  },
  "maintenance_intervals": {
    "oil_change_normal": number (miles for normal driving),
    "oil_change_severe": number (miles for severe driving),
    "tire_rotation": number (miles),
    "air_filter": number (miles),
    "cabin_filter": number (miles),
    "spark_plugs": number (miles),
    "transmission_service": number (miles),
    "brake_fluid_flush": number (miles or years),
    "coolant_flush": number (miles or years),
    "differential_service": number (miles, if applicable),
    "brake_inspection": number (miles),
    "serpentine_belt": number (miles),
    "timing_belt": number (miles, if applicable)
  },
  "fluids_capacities": {
    "engine_oil_capacity": number (quarts),
    "engine_oil_grade": string (e.g., "5W-30", "0W-20"),
    "coolant_capacity": number (quarts),
    "transmission_fluid_capacity": number (quarts),
    "fuel_tank_capacity": number (gallons),
    "fuel_grade_required": string (e.g., "87 octane regular", "91 octane premium")
  },
  "tire_specifications": {
    "tire_size_front": string (e.g., "235/55R18"),
    "tire_size_rear": string (e.g., "235/55R18"),
    "tire_pressure_front": number (PSI),
    "tire_pressure_rear": number (PSI),
    "wheel_torque": number (lb-ft)
  }
}

CRITICAL RULES:
- Use OFFICIAL manufacturer data only (${vehicle.make}.com, press releases, certified spec sheets)
- For ${engineDesc}, find the EXACT horsepower and torque ratings
- EPA fuel economy is always on manufacturer spec sheets - do not make estimates
- Return null for any field not found in official sources
- Do NOT duplicate data already in NHTSA (I will merge automatically)
- Return ONLY valid JSON, no explanations`

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a vehicle specification expert. Extract data from official manufacturer sources only. Output valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const completion = await response.json()
    const aiData = JSON.parse(completion.choices[0].message.content || '{}')

    console.log('✅ AI enhancement complete:', aiData)

    // Merge AI data with NHTSA data (NHTSA takes precedence)
    const categories = [
      'engine', 
      'drivetrain', 
      'dimensions', 
      'fuel_economy', 
      'features',
      'maintenance_intervals',
      'fluids_capacities',
      'tire_specifications'
    ]
    
    for (const category of categories) {
      const nhtsaCategory = nhtsaData[category] || {}
      const aiCategory = aiData[category] || {}
      
      // Merge: NHTSA data takes precedence, AI fills gaps
      const merged: any = { ...nhtsaCategory }
      for (const [key, value] of Object.entries(aiCategory)) {
        if (!merged[key] || merged[key] === null) {
          merged[key] = value
        }
      }

      // Skip if no data for this category
      if (Object.keys(merged).length === 0) {
        continue
      }

      // Get existing sources
      const { data: existing } = await supabase
        .from('vehicle_spec_enhancements')
        .select('sources')
        .eq('vehicle_id', vehicleId)
        .eq('category', category)
        .single()

      const sources = existing?.sources || ['openai_web_search']
      if (!sources.includes('openai_web_search')) {
        sources.push('openai_web_search')
      }

      // Upsert category with merged data (create if doesn't exist)
      await supabase
        .from('vehicle_spec_enhancements')
        .upsert({
          vehicle_id: vehicleId,
          category,
          status: 'completed',
          data: merged,
          sources,
          confidence: 'high',
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'vehicle_id,category'
        })
    }

    // Update vehicle status
    await supabase
      .from('vehicles')
      .update({
        specs_enhancement_status: 'completed',
        specs_last_enhanced: new Date().toISOString()
      })
      .eq('id', vehicleId)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'AI enhancement completed',
        enhanced_categories: categories.length
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Enhancement error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
