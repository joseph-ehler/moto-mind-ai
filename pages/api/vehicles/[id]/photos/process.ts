import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Helper to auto-create timeline events from photo AI analysis
async function createTimelineEventFromPhoto({
  supabase,
  vehicleId,
  imageId,
  imageUrl,
  aiData,
  cleanedDetectedText
}: {
  supabase: any
  vehicleId: string
  imageId: string
  imageUrl: string
  aiData: any
  cleanedDetectedText: any
}) {
  try {
    // Get vehicle tenant_id
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('tenant_id')
      .eq('id', vehicleId)
      .single()

    if (!vehicle) return

    const now = new Date().toISOString()
    const eventDate = now.split('T')[0] // YYYY-MM-DD format

    // 1. Odometer reading detected → Create odometer event
    if (cleanedDetectedText.odometer) {
      const miles = parseInt(cleanedDetectedText.odometer.replace(/,/g, ''))
      if (!isNaN(miles)) {
        const { error } = await supabase.from('vehicle_events').insert({
          tenant_id: vehicle.tenant_id,
          vehicle_id: vehicleId,
          type: 'odometer',
          date: eventDate,
          miles,
          image_id: imageId,
          notes: `Odometer reading from photo: ${cleanedDetectedText.odometer} miles`,
          payload: { source: 'photo_ai' }
        })
        if (error) {
          console.error('❌ Odometer event failed:', error)
        } else {
          console.log(`📊 Created odometer event: ${miles} mi`)
        }
      }
    }

    // 2. Damage detected → Create damage report event
    if (aiData.condition?.damage_detected && aiData.condition?.damage_description) {
      const { error } = await supabase.from('vehicle_events').insert({
        tenant_id: vehicle.tenant_id,
        vehicle_id: vehicleId,
        type: 'repair', // Use existing type instead of damage_report
        date: eventDate,
        image_id: imageId,
        notes: aiData.condition.damage_description,
        payload: {
          source: 'photo_ai',
          wear_level: aiData.condition.wear_level,
          ai_confidence: 'high'
        }
      })
      if (error) {
        console.error('❌ Damage event failed:', error)
      } else {
        console.log(`⚠️ Created damage report event`)
      }
    }

    // 3. Engine/Interior photo with parts → Create photo log event (NOT an official inspection)
    if ((aiData.category === 'engine' || aiData.category === 'interior') && aiData.parts_visible?.length > 0) {
      const { error } = await supabase.from('vehicle_events').insert({
        tenant_id: vehicle.tenant_id,
        vehicle_id: vehicleId,
        type: 'document', // Use 'document' type for photo logs, not 'inspection'
        date: eventDate,
        image_id: imageId,
        notes: aiData.description || `${aiData.category === 'interior' ? 'Interior' : 'Engine'} photo with ${aiData.parts_visible.length} visible components`,
        payload: {
          source: 'photo_ai',
          parts_visible: aiData.parts_visible,
          category: aiData.category
        }
      })
      if (error) {
        console.error('❌ Photo log event failed:', error)
      } else {
        console.log(`📸 Created ${aiData.category} photo log event`)
      }
    }

    // 4. Generic vehicle photo (exterior, etc.) → Create photo log event
    if (!cleanedDetectedText.odometer && !aiData.condition?.damage_detected && aiData.category === 'exterior') {
      const { error } = await supabase.from('vehicle_events').insert({
        tenant_id: vehicle.tenant_id,
        vehicle_id: vehicleId,
        type: 'document', // Use existing type instead of 'photo'
        date: eventDate,
        image_id: imageId,
        notes: aiData.description || 'Vehicle photo added to timeline',
        payload: {
          source: 'photo_ai',
          category: aiData.category,
          vehicle_details: aiData.vehicle_details
        }
      })
      if (error) {
        console.error('❌ Photo event failed:', error)
      } else {
        console.log(`📸 Created photo log event`)
      }
    }
  } catch (error) {
    console.error('❌ Error creating timeline event:', error)
    // Don't throw - timeline creation is non-critical
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const vehicleId = req.query.id as string
  const { imageId, imageUrl } = req.body

  if (!vehicleId || !imageId || !imageUrl) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  try {
    // Fetch vehicle details for context
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('year, make, model, trim, vin')
      .eq('id', vehicleId)
      .single()

    if (vehicleError) {
      console.error('❌ Vehicle lookup error:', vehicleError)
    }

    // Update status to processing
    await supabase
      .from('vehicle_images')
      .update({ processing_status: 'processing' })
      .eq('id', imageId)

    console.log(`🔍 Processing image: ${imageId} for ${vehicle?.year} ${vehicle?.make} ${vehicle?.model}`)

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are analyzing a vehicle photo for documentation purposes only. Your observations do NOT constitute a professional inspection, safety assessment, or mechanical evaluation.

${vehicle ? `Context: This photo is labeled as a ${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}.` : ''}

LEGAL REQUIREMENTS:
1. Report ONLY what is directly visible in the image
2. Use qualifying language: "appears", "visible", "observed"
3. NEVER make safety claims or condition assessments you cannot verify
4. NEVER report mechanical function (e.g., "engine runs well")
5. NEVER report hidden/internal conditions (e.g., "fluids normal" from exterior photo)
6. When in doubt, OMIT the field entirely

Return ONLY a JSON object with:
{
  "category": "exterior|interior|engine|damage|document|other",
  "description": "Brief one-line description (max 80 chars)",
  "detected_text": {
    "vin": "17-char VIN if clearly visible",
    "plate": "License plate if visible",
    "odometer": "Mileage number if visible (numbers only)"
  },
  "vehicle_details": {
    "make": "Brand if identifiable from badges/styling",
    "model": "Model if identifiable",
    "color": "Primary exterior color if visible",
    "year_range": "Approximate year range if identifiable (e.g. '2015-2020')"
  },
  "vehicle_match": {
    "matches_expected": true/false,
    "confidence": "high|medium|low",
    "notes": "Explanation if mismatch detected"
  },
  "condition": {
    "damage_detected": true/false,
    "damage_description": "Specific damage if visible (e.g. 'Front bumper dent, 6in diameter')",
    "wear_level": "none|light|moderate|severe",
    "notes": "Notable condition observations"
  },
  "parts_visible": ["ONLY list parts you can clearly see in the image"],
  "maintenance_indicators": {
    "warning_lights": ["ONLY if dashboard is visible and lights are clearly on"],
    "fluid_levels": "ONLY if you can see fluid reservoirs/dipsticks with visible levels",
    "tire_condition": "ONLY if tread wear/damage is clearly visible in close-up"
  },
  "suggested_actions": ["ONLY actionable items based on visible issues - do NOT suggest routine maintenance"]
}

CRITICAL RULES:
- NEVER guess or infer information you cannot directly see
- NEVER report fluid levels, tire condition, or maintenance status from exterior photos
- NEVER suggest "routine maintenance" - only report specific visible issues
- If you cannot see something clearly, OMIT that field entirely
- Examples of what NOT to do:
  * Exterior photo → DO NOT report "fluids: normal" (you can't see fluids)
  * Exterior photo → DO NOT report "tires: good" (unless tread is clearly visible in close-up)
  * Clean photo → DO NOT suggest "perform regular maintenance" (not actionable)
- Examples of what TO do:
  * Dashboard with check engine light → "warning_lights": ["Check Engine"]
  * Close-up of worn brake pads → "suggested_actions": ["Replace worn brake pads"]
  * Visible dent → "damage_description": "Front bumper dent, 6in diameter"
${vehicle ? `- Compare visible vehicle features against expected: ${vehicle.year} ${vehicle.make} ${vehicle.model}
- Set vehicle_match.matches_expected=false if this appears to be a different vehicle
- Use vehicle_match.notes to explain any discrepancies` : ''}`
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 600
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from Vision API')
    }

    // Parse AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const aiData = JSON.parse(jsonMatch[0])

    // Clean up detected_text - only include non-null values
    const detectedText = aiData.detected_text || {}
    const cleanedDetectedText = Object.entries(detectedText)
      .filter(([_, value]) => value && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

    // Clean up vehicle_details
    const vehicleDetails = aiData.vehicle_details || {}
    const cleanedVehicleDetails = Object.entries(vehicleDetails)
      .filter(([_, value]) => value && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

    // Clean up vehicle_match
    const vehicleMatch = aiData.vehicle_match || {}
    const cleanedVehicleMatch = Object.entries(vehicleMatch)
      .filter(([_, value]) => value !== null && value !== '' && value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

    // Clean up condition data
    const conditionData = aiData.condition || {}
    const cleanedCondition = Object.entries(conditionData)
      .filter(([_, value]) => value !== null && value !== '' && value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

    // Clean up maintenance indicators
    const maintenanceIndicators = aiData.maintenance_indicators || {}
    const cleanedMaintenance = Object.entries(maintenanceIndicators)
      .filter(([_, value]) => value && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

    // Save to database
    const { error: updateError } = await supabase
      .from('vehicle_images')
      .update({
        ai_category: aiData.category,
        ai_description: aiData.description,
        detected_text: Object.keys(cleanedDetectedText).length > 0 ? cleanedDetectedText : null,
        vehicle_details: Object.keys(cleanedVehicleDetails).length > 0 ? cleanedVehicleDetails : null,
        vehicle_match: Object.keys(cleanedVehicleMatch).length > 0 ? cleanedVehicleMatch : null,
        parts_visible: aiData.parts_visible?.length > 0 ? aiData.parts_visible : null,
        maintenance_indicators: Object.keys(cleanedMaintenance).length > 0 ? cleanedMaintenance : null,
        suggested_actions: aiData.suggested_actions?.length > 0 ? aiData.suggested_actions : null,
        processing_status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', imageId)

    if (updateError) {
      console.error('❌ Error updating image:', updateError)
      throw updateError
    }

    console.log(`✅ Successfully processed image ${imageId}`)

    // Auto-create timeline event based on AI analysis
    await createTimelineEventFromPhoto({
      supabase,
      vehicleId,
      imageId,
      imageUrl,
      aiData,
      cleanedDetectedText
    })
    
    res.status(200).json({ 
      success: true,
      category: aiData.category,
      description: aiData.description,
      detected_text: cleanedDetectedText
    })
  } catch (error) {
    console.error('❌ Processing error:', error)
    await supabase
      .from('vehicle_images')
      .update({ 
        processing_status: 'failed',
        processed_at: new Date().toISOString()
      })
      .eq('id', imageId)

    return res.status(500).json({ error: 'Failed to process image' })
  }
}
