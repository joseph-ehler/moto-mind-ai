/**
 * Conversation Messages API
 * 
 * GET  - Get all messages in a thread
 * POST - Send new message and get AI response
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'
import { VehicleContextBuilder } from '@/lib/ai/vehicle-context-builder'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { threadId } = req.query

  if (!threadId || typeof threadId !== 'string') {
    return res.status(400).json({ error: 'Thread ID required' })
  }

  // GET - List messages
  if (req.method === 'GET') {
    try {
      const { data: messages, error } = await supabase
        .from('conversation_messages')
        .select('id, thread_id, role, content, metadata, actions, feedback_rating, created_at, tokens_used')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return res.status(200).json({ 
        messages: messages.map(m => ({
          id: m.id,
          threadId: m.thread_id,
          role: m.role,
          content: m.content,
          timestamp: m.created_at,
          tokensUsed: m.tokens_used,
          feedbackRating: m.feedback_rating,
          actions: m.actions || [],
          photoUrls: m.metadata?.photo_urls || [],
          metadata: m.metadata || {}
        }))
      })
    } catch (error) {
      console.error('Failed to load messages:', error)
      return res.status(500).json({ error: 'Failed to load messages' })
    }
  }

  // POST - Send message
  if (req.method === 'POST') {
    try {
      const { message, vehicleContext, photoUrls, dashboardData } = req.body

      if (!message) {
        return res.status(400).json({ error: 'Message required' })
      }

      console.log('📸 Photo URLs received:', photoUrls?.length || 0)
      console.log('📊 Dashboard data received:', dashboardData ? 'Yes' : 'No')

      console.log('📨 Sending message to thread:', threadId)

      // Verify thread exists
      const { data: thread, error: threadError } = await supabase
        .from('conversation_threads')
        .select('*')
        .eq('id', threadId)
        .single()

      if (threadError || !thread) {
        console.error('❌ Thread not found:', threadError)
        return res.status(404).json({ error: 'Thread not found' })
      }

      console.log('✅ Thread found:', thread.id)

      // Build rich vehicle context
      const contextBuilder = new VehicleContextBuilder(supabase)
      let vehicleContextData
      try {
        vehicleContextData = await contextBuilder.buildContext(thread.vehicle_id, {
          includeRecentEvents: true,
          includeSpecs: true,
          includeImages: false,
          eventLimit: 50, // Increased to see more history
          includeAllEvents: true // Include complete history for better Q&A
        })
        console.log('📊 Vehicle context loaded:', {
          events: vehicleContextData.maintenance.recent_events.length,
          cost_ytd: vehicleContextData.costs.total_spent_ytd,
          date_range: vehicleContextData.metadata.date_range
        })
      } catch (error) {
        console.warn('⚠️  Failed to build vehicle context:', error)
        vehicleContextData = null
      }

      // Get conversation history
      const { data: history } = await supabase
        .from('conversation_messages')
        .select('role, content')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

      console.log('📜 History loaded:', history?.length || 0, 'messages')

      // Build system prompt with rich context
      const systemPrompt = buildSystemPrompt(vehicleContextData || vehicleContext || {}, contextBuilder)

      console.log('🤖 Calling OpenAI...')

      // Call OpenAI with streaming
      const stream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(history || []).map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          })),
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: true,
      })

      console.log('🌊 Starting stream...')

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')

      let fullResponse = ''
      let tokenCount = 0

      // Stream the response
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullResponse += content
          tokenCount++
          
          // Send chunk to client
          res.write(`data: ${JSON.stringify({ 
            type: 'chunk', 
            content 
          })}\n\n`)
        }
      }

      console.log('✅ Stream complete:', fullResponse.substring(0, 100) + '...')

      // Now save the messages to database
      const response = fullResponse

      // Detect actionable items in the response (with vehicle context data and user message)
      const actions = detectActions(response, vehicleContext, vehicleContextData, message, photoUrls, dashboardData)

      // Save user message
      const { data: userMessage, error: userError } = await supabase
        .from('conversation_messages')
        .insert({
          thread_id: threadId,
          role: 'user',
          content: message,
          tokens_used: 0,
          metadata: photoUrls && photoUrls.length > 0 ? { photo_urls: photoUrls } : null
        })
        .select()
        .single()

      if (userError) throw userError

      // Build context references for storage
      const contextReferences = vehicleContextData ? {
        events: vehicleContextData.metadata.event_ids,
        event_count: vehicleContextData.maintenance.recent_events.length,
        date_range: vehicleContextData.metadata.date_range,
        summary: {
          last_service_date: vehicleContextData.maintenance.last_service?.date,
          last_service_type: vehicleContextData.maintenance.last_service?.type,
          total_cost_ytd: vehicleContextData.costs.total_spent_ytd,
          current_mileage: vehicleContextData.vehicle.mileage
        }
      } : null

      // Save assistant message with actions and context
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('conversation_messages')
        .insert({
          thread_id: threadId,
          role: 'assistant',
          content: response,
          tokens_used: tokenCount,
          actions: actions,
          model_used: process.env.OPENAI_MODEL || 'gpt-4o',
          context_references: contextReferences
        })
        .select()
        .single()

      if (assistantError) throw assistantError

      // Send completion message with actions
      res.write(`data: ${JSON.stringify({ 
        type: 'complete',
        userMessage: {
          id: userMessage.id,
          threadId: userMessage.thread_id,
          role: userMessage.role,
          content: userMessage.content,
          timestamp: userMessage.created_at,
          photoUrls: photoUrls || []
        },
        assistantMessage: {
          id: assistantMessage.id,
          threadId: assistantMessage.thread_id,
          role: assistantMessage.role,
          content: assistantMessage.content,
          timestamp: assistantMessage.created_at,
          actions
        }
      })}\n\n`)

      res.end()
    } catch (error: any) {
      console.error('❌ Failed to send message:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      })
      return res.status(500).json({ 
        error: 'Failed to send message',
        details: error.message,
        fallback: 'I apologize, but I encountered an error. Please try again.'
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

function buildSystemPrompt(context: any, contextBuilder?: VehicleContextBuilder): string {
  // Check if we have rich vehicle context data
  if (context && context.vehicle && context.maintenance && contextBuilder) {
    const formattedContext = contextBuilder.formatForPrompt(context)
    const vehicleName = `${context.vehicle.year} ${context.vehicle.make} ${context.vehicle.model}`
    const vinLast6 = context.vehicle.vin ? `...${context.vehicle.vin.slice(-6)}` : 'N/A'
    
    return `You are a knowledgeable automotive AI assistant helping the owner of their **${vehicleName}** (VIN: ${vinLast6}).

⚠️ CRITICAL LIMITATION - READ THIS CAREFULLY:
You are ONLY connected to the **${vehicleName}** (VIN: ${vinLast6}). You CANNOT access or update ANY other vehicle.

If the user mentions a DIFFERENT vehicle name (e.g., "Captiva" when you're connected to "Accord"), you MUST respond EXACTLY like this:

"⚠️ **I'm Currently Connected to Your ${vehicleName}**

I noticed you asked about [OTHER VEHICLE NAME]. I can only access and update data for the **${vehicleName}** (VIN: ${vinLast6}) that you're currently viewing.

**To update your [OTHER VEHICLE NAME]:**
1. Click the '🚗 Go to My Vehicles' button below
2. Select your [OTHER VEHICLE NAME] from your garage
3. Open the AI chat on that vehicle's page
4. I'll then be able to help you with that vehicle

This system keeps your data safe by preventing accidental updates to the wrong vehicle.

Is there anything I can help you with for your **${vehicleName}** instead?"

DO NOT give generic "I cannot log mileage" responses. ALWAYS explain WHY (wrong vehicle) and HOW to fix it (switch vehicles).

${formattedContext}

🎯 YOUR CAPABILITIES - YOU CAN ACTUALLY DO THESE THINGS:
✅ **You CAN log maintenance events** - When users ask to log oil changes, services, fuel, etc., I WILL create proposal cards for them to approve
✅ **You CAN record mileage** - When users mention mileage, I WILL extract it and offer to log it
✅ **You CAN track damage** - When users report dings, scratches, accidents, I WILL create damage reports
✅ **You CAN log warnings** - When users mention warning lights or codes, I WILL create warning events

❌ NEVER SAY "I cannot log events" or "Unfortunately, I cannot..." - YOU CAN! Just be confident and tell them you'll help them log it!

YOUR ROLE:
- Provide helpful, accurate information based on THIS SPECIFIC VEHICLE'S ACTUAL DATA
- **When users ask to log something, be CONFIDENT - say "I'll help you log that!" not "I cannot"**
- Reference the real maintenance history, costs, and dates shown above
- **Use weather data when available** - Many events include weather conditions (temperature, condition, wind, humidity)
- Be conversational but concise (2-3 paragraphs max)
- Use specific details from their records when answering
- If you don't know something, be honest and suggest consulting the owner's manual or a mechanic

GUIDELINES:
- Use the owner's perspective (their vehicle, their records)
- Reference specific dates and mileage from their history
- Provide actionable advice based on their actual maintenance patterns
- Warn about safety-critical issues
- Keep responses under 250 words unless asked for detail
- When discussing costs, reference their actual spending patterns
- **IMPORTANT**: If they mention a different vehicle (e.g., "my Captiva" when you're in Honda chat), IMMEDIATELY explain they need to switch vehicles

FORMATTING:
- Use markdown formatting for clarity:
  * **Bold** for important points
  * *Italics* for emphasis
  * Lists (- or 1.) for steps or multiple items
  * \`code\` for part numbers or technical terms
- Structure responses with clear paragraphs
- Use headings (###) for major sections if response is long

Remember: You have access to their REAL maintenance history and costs for the ${vehicleName}. Use this data to provide personalized, accurate advice. If they ask about another vehicle, redirect them politely but firmly.`
  }
  
  // Fallback to basic context
  const year = context?.year || 'your'
  const make = context?.make || ''
  const model = context?.model || 'vehicle'
  const mileage = context?.mileage || 0
  const vehicleName = `${year} ${make} ${model}`
  const vinLast6 = context?.vin ? `...${context.vin.slice(-6)}` : 'N/A'
  
  return `You are a knowledgeable automotive AI assistant helping the owner of their **${vehicleName}** (VIN: ${vinLast6}).

⚠️ CRITICAL LIMITATION - READ THIS CAREFULLY:
You are ONLY connected to the **${vehicleName}** (VIN: ${vinLast6}). You CANNOT access or update ANY other vehicle.

If the user mentions a DIFFERENT vehicle name, you MUST respond EXACTLY like this:

"⚠️ **I'm Currently Connected to Your ${vehicleName}**

I noticed you asked about [OTHER VEHICLE NAME]. I can only access and update data for the **${vehicleName}** (VIN: ${vinLast6}) that you're currently viewing.

**To update your [OTHER VEHICLE NAME]:**
1. Click the '🚗 Go to My Vehicles' button below
2. Select your [OTHER VEHICLE NAME] from your garage
3. Open the AI chat on that vehicle's page
4. I'll then be able to help you with that vehicle

This system keeps your data safe by preventing accidental updates to the wrong vehicle.

Is there anything I can help you with for your **${vehicleName}** instead?"

DO NOT give generic "I cannot log mileage" responses. ALWAYS explain WHY (wrong vehicle) and HOW to fix it (switch vehicles).

VEHICLE CONTEXT:
- Make/Model: ${year} ${make} ${model}
- Current Mileage: ${mileage ? mileage.toLocaleString() : 'Unknown'} miles
${context?.health ? `- Health Score: ${context.health}/100` : ''}
${context?.lastService ? `- Last Service: ${context.lastService}` : ''}
${context?.recentIssues?.length ? `- Recent Issues: ${context.recentIssues.join(', ')}` : ''}

🎯 YOUR CAPABILITIES - YOU CAN ACTUALLY DO THESE THINGS:
✅ **You CAN log maintenance events** - When users ask to log oil changes, services, fuel, etc., I WILL create proposal cards for them to approve
✅ **You CAN record mileage** - When users mention mileage, I WILL extract it and offer to log it
✅ **You CAN track damage** - When users report dings, scratches, accidents, I WILL create damage reports
✅ **You CAN log warnings** - When users mention warning lights or codes, I WILL create warning events

❌ NEVER SAY "I cannot log events" or "Unfortunately, I cannot..." - YOU CAN! Just be confident and tell them you'll help them log it!

YOUR ROLE:
- Provide helpful, accurate information about this specific vehicle
- **When users ask to log something, be CONFIDENT - say "I'll help you log that!" not "I cannot"**
- Answer questions about maintenance schedules, costs, common issues
- Reference the vehicle's current mileage when relevant
- **Use weather data when available** - Many events include weather conditions
- Be conversational but concise (2-3 paragraphs max)
- If you don't know something specific, be honest and suggest consulting the owner's manual or a mechanic
- **IMPORTANT**: If they mention a different vehicle, IMMEDIATELY explain they need to switch vehicles

GUIDELINES:
- Use the owner's perspective (their vehicle, their mileage)
- Provide actionable advice when possible
- Reference manufacturer recommendations when applicable
- Warn about safety-critical issues
- Keep responses under 200 words unless asked for detail
- If they ask about another vehicle, redirect them politely but firmly

FORMATTING:
- Use markdown formatting for clarity:
  * **Bold** for important points
  * *Italics* for emphasis
  * Lists (- or 1.) for steps or multiple items
  * \`code\` for part numbers or technical terms
- Structure responses with clear paragraphs
- Use headings (###) for major sections if response is long

Remember: This is a real vehicle with real maintenance needs. Provide practical, owner-focused guidance.`
}

interface MessageAction {
  type: 'reminder' | 'navigate' | 'export' | 'external' | 'correct_event' | 'add_event' | 'upload_photo' | 'view_event'
  label: string
  data?: any
}

function detectActions(response: string, context: any, vehicleContextData?: any, userMessage?: string, photoUrls?: string[], dashboardData?: any): MessageAction[] {
  const actions: MessageAction[] = []
  
  // DASHBOARD DATA DETECTION - Create proposal if dashboard was analyzed
  if (dashboardData && photoUrls && photoUrls.length > 0) {
    console.log('📊 Creating dashboard proposal from vision data:', JSON.stringify(dashboardData, null, 2))
    
    // Extract from key_facts if it exists, otherwise from root
    const keyFacts = dashboardData.key_facts || dashboardData
    const odometerMiles = keyFacts.odometer_miles || dashboardData.odometer_miles
    const fuelLevelEighths = keyFacts.fuel_level_eighths
    const fuelPercent = fuelLevelEighths ? Math.round((fuelLevelEighths / 8) * 100) : null
    const coolantTemp = keyFacts.coolant_temp || dashboardData.coolant_temp
    const outsideTemp = keyFacts.outside_temp || dashboardData.outside_temp
    const warningLights = keyFacts.warning_lights || dashboardData.warning_lights || []
    const warningCount = Array.isArray(warningLights) ? warningLights.length : 0
    
    actions.push({
      type: 'add_event',
      label: 'Capture Dashboard Snapshot',
      data: {
        event_type: 'dashboard_snapshot',
        suggested_miles: odometerMiles || vehicleContextData?.vehicle?.mileage,
        fuel_level: fuelPercent,
        engine_temp: coolantTemp,
        outside_temp: outsideTemp,
        warning_lights: warningLights,
        photo_urls: photoUrls,
        extracted_from_message: true,
        proposal: {
          type: 'dashboard_snapshot',
          preview: {
            title: '📊 Capture Dashboard Snapshot',
            description: 'I analyzed your dashboard photo and extracted this information',
            fields: [
              ...(odometerMiles ? [{ 
                label: 'Odometer', 
                value: `${odometerMiles.toLocaleString()} miles` 
              }] : []),
              ...(fuelPercent ? [{ 
                label: 'Fuel Level', 
                value: `${fuelPercent}%` 
              }] : []),
              ...(coolantTemp ? [{ 
                label: 'Engine Temp', 
                value: coolantTemp 
              }] : []),
              ...(outsideTemp ? [{ 
                label: 'Outside Temp', 
                value: outsideTemp 
              }] : []),
              ...(warningCount > 0 ? [{ 
                label: 'Warning Lights', 
                value: `${warningCount} detected: ${warningLights.slice(0, 3).join(', ')}${warningCount > 3 ? '...' : ''}` 
              }] : []),
              { label: 'Date', value: new Date().toLocaleDateString() }
            ]
          }
        }
      }
    })
    
    // Return early - don't need other detections if we have dashboard data
    return actions
  }
  
  // Smart mileage extraction from user message
  if (userMessage) {
    // Check if user is mentioning a DIFFERENT vehicle
    const currentVehicle = `${context?.year || ''} ${context?.make || ''} ${context?.model || ''}`.toLowerCase()
    const currentVin = (context?.vin || '').toLowerCase()
    const lowerMessage = userMessage.toLowerCase()
    
    // Check for VIN mentions (most reliable identifier)
    let mentionsDifferentVin = false
    if (currentVin) {
      // Extract potential VIN from message (17 characters, alphanumeric)
      const vinPattern = /\b[A-HJ-NPR-Z0-9]{17}\b/gi
      const vinsInMessage = lowerMessage.match(vinPattern)
      
      if (vinsInMessage && vinsInMessage.length > 0) {
        mentionsDifferentVin = !vinsInMessage.some(vin => vin.toLowerCase() === currentVin)
        if (mentionsDifferentVin) {
          console.warn('⚠️  User mentioned a different VIN - blocking action')
        }
      }
    }
    
    // Common vehicle mentions that indicate a different vehicle
    const otherVehicleMentions = [
      'captiva', 'accord', 'civic', 'camry', 'f-150', 'silverado',
      'my other', 'different vehicle', 'other car', 'other truck'
    ]
    
    const mentionsOtherVehicle = otherVehicleMentions.some(vehicle => 
      lowerMessage.includes(vehicle) && !currentVehicle.includes(vehicle)
    )
    
    const isCrossVehicleAttempt = mentionsDifferentVin || mentionsOtherVehicle
    
    if (isCrossVehicleAttempt) {
      const reason = mentionsDifferentVin 
        ? 'different VIN detected' 
        : 'different vehicle name mentioned'
      console.warn(`⚠️  Cross-vehicle attempt blocked: ${reason}`)
      
      // Don't extract mileage if user is talking about a different vehicle
      // Add a helpful action to switch vehicles instead
      actions.push({
        type: 'navigate',
        label: '🚗 Go to My Vehicles',
        data: { path: '/vehicles' }
      })
      
      // Also add a help action
      actions.push({
        type: 'external',
        label: '❓ Why can\'t I do this?',
        data: { 
          url: '#',
          explanation: 'Each vehicle has its own dedicated chat. To update a different vehicle, please navigate to that vehicle\'s page first.'
        }
      })
    } else {
      // Try multiple patterns to extract mileage
      const patterns = [
        /(\d{1,3})k\s*(?:miles|mi)/i,  // "77k miles"
        /(\d{1,3}(?:,\d{3})+)\s*(?:miles|mi)/i,  // "77,000 miles"
        /(\d{4,6})\s*(?:miles|mi)/i,  // "77000 miles"
      ]
      
      let miles: number | null = null
      
      for (const pattern of patterns) {
        const match = userMessage.match(pattern)
        if (match) {
          let extractedMiles = match[1].replace(/,/g, '')
          
          // If pattern ended with 'k', multiply by 1000
          if (pattern.source.includes('k')) {
            miles = parseInt(extractedMiles) * 1000
          } else {
            miles = parseInt(extractedMiles)
          }
          
          break
        }
      }
      
      if (miles && miles > 0 && miles < 1000000) {
        // Extract additional data from message
        const costMatch = lowerMessage.match(/\$\s*(\d+(?:\.\d{2})?)/i)
        const cost = costMatch ? parseFloat(costMatch[1]) : null
        
        const vendorMatch = lowerMessage.match(/(?:at|from|by)\s+([A-Z][a-zA-Z\s&]+?)(?:\s|,|$)/i)
        const vendor = vendorMatch ? vendorMatch[1].trim() : null
        
        // Check for FUEL events first (higher specificity)
        const fuelKeywords = ['filled up', 'fill up', 'gas', 'fuel', 'gallons', 'gal', 'mpg', 'tank']
        const isFuelEvent = fuelKeywords.some(kw => lowerMessage.includes(kw))
        
        if (isFuelEvent) {
          // Extract fuel-specific data
          const gallonsMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*(?:gallons?|gal)/i)
          const gallons = gallonsMatch ? parseFloat(gallonsMatch[1]) : null
          
          const tripMatch = lowerMessage.match(/(\d+)\s*(?:miles?|mi)(?:\s+on\s+(?:this\s+)?tank)?/i)
          const tripMiles = tripMatch ? parseInt(tripMatch[1]) : null
          
          const stationMatch = lowerMessage.match(/(?:at|from)\s+(Shell|Chevron|BP|Exxon|Mobil|Texaco|Sunoco|Circle K|7-Eleven|Speedway|Wawa)/i)
          const station = stationMatch ? stationMatch[1] : vendor
          
          actions.push({
            type: 'add_event',
            label: 'Approve & Log Fuel',
            data: {
              event_type: 'fuel',
              suggested_miles: miles,
              gallons,
              cost,
              station_name: station,
              trip_miles: tripMiles,
              photo_urls: photoUrls && photoUrls.length > 0 ? photoUrls : undefined,
              extracted_from_message: true,
              proposal: {
                type: 'fuel',
                preview: {
                  title: 'Log Fuel Fill-Up',
                  description: 'I detected you logged a fuel purchase',
                  fields: [
                    ...(gallons ? [{ label: 'Gallons', value: `${gallons} gal` }] : []),
                    ...(cost ? [{ label: 'Cost', value: `$${cost.toFixed(2)}${gallons ? ` ($${(cost/gallons).toFixed(2)}/gal)` : ''}` }] : []),
                    ...(station ? [{ label: 'Station', value: station }] : []),
                    ...(tripMiles ? [{ label: 'Trip Miles', value: `${tripMiles} mi${gallons ? ` (${(tripMiles/gallons).toFixed(1)} MPG)` : ''}` }] : []),
                    { label: 'Mileage', value: `${miles.toLocaleString()} miles` },
                    { label: 'Date', value: new Date().toLocaleDateString() }
                  ]
                }
              }
            }
          })
        } else {
          // Check for SERVICE events
          const servicePatterns = [
            { keywords: ['oil change', 'changed oil', 'change oil', 'oil service'], type: 'Oil Change' },
            { keywords: ['tire rotation', 'rotate tires', 'rotated tires'], type: 'Tire Rotation' },
            { keywords: ['brake pad', 'brake service', 'brakes', 'brake job'], type: 'Brake Service' },
            { keywords: ['air filter', 'cabin filter', 'engine filter'], type: 'Filter Replacement' },
            { keywords: ['tune up', 'tune-up', 'tuneup'], type: 'Tune-Up' },
            { keywords: ['inspection', 'state inspection'], type: 'Inspection' },
            { keywords: ['transmission service', 'transmission fluid'], type: 'Transmission Service' },
            { keywords: ['coolant', 'antifreeze'], type: 'Coolant Service' },
            { keywords: ['battery', 'new battery'], type: 'Battery Replacement' },
            { keywords: ['alignment', 'wheel alignment'], type: 'Wheel Alignment' },
            { keywords: ['service', 'maintenance'], type: 'General Service' }
          ]
          
          let serviceType: string | null = null
          for (const pattern of servicePatterns) {
            if (pattern.keywords.some(keyword => lowerMessage.includes(keyword))) {
              serviceType = pattern.type
              break
            }
          }
        
        if (serviceType) {
          // User wants to log a SERVICE event
          actions.push({
            type: 'add_event',
            label: `Approve & Log ${serviceType}`,
            data: { 
              event_type: 'service',
              service_type: serviceType,
              suggested_miles: miles,
              cost,
              vendor_name: vendor,
              photo_urls: photoUrls && photoUrls.length > 0 ? photoUrls : undefined,
              extracted_from_message: true,
              proposal: {
                type: 'service',
                preview: {
                  title: `Log ${serviceType}`,
                  description: `I detected you want to log a service event`,
                  fields: [
                    { label: 'Service Type', value: serviceType },
                    ...(cost ? [{ label: 'Cost', value: `$${cost.toFixed(2)}` }] : []),
                    ...(vendor ? [{ label: 'Vendor', value: vendor }] : []),
                    { label: 'Mileage', value: `${miles.toLocaleString()} miles` },
                    { label: 'Date', value: new Date().toLocaleDateString() }
                  ]
                }
              }
            }
          })
        } else {
          // Just a mileage update (odometer)
          actions.push({
            type: 'add_event',
            label: 'Approve & Log Mileage',
            data: { 
              event_type: 'dashboard_snapshot',
              suggested_miles: miles,
              extracted_from_message: true,
              proposal: {
                type: 'odometer',
                preview: {
                  title: 'Update Odometer Reading',
                  description: 'I detected you mentioned a mileage update',
                  fields: [
                    { 
                      label: 'Current Reading', 
                      value: `${miles.toLocaleString()} miles`,
                      change: vehicleContextData?.vehicle?.mileage 
                        ? `${vehicleContextData.vehicle.mileage.toLocaleString()} miles`
                        : undefined
                    },
                    { label: 'Date', value: new Date().toLocaleDateString() }
                  ]
                }
              }
            }
          })
        }
        }
      }
    }
  }
  
  // DAMAGE & INCIDENT DETECTION (no mileage required)
  if (userMessage) {
    const lowerMsg = userMessage.toLowerCase()
    
    const damageKeywords = [
      { keywords: ['door ding', 'ding', 'dent'], type: 'Door ding', severity: 'minor' },
      { keywords: ['scratch', 'scratched', 'keyed'], type: 'Scratch', severity: 'minor' },
      { keywords: ['fender bender', 'minor accident'], type: 'Fender bender', severity: 'moderate' },
      { keywords: ['accident', 'collision', 'crash'], type: 'Collision', severity: 'moderate' },
      { keywords: ['hail damage', 'hail'], type: 'Hail damage', severity: 'moderate' },
      { keywords: ['windshield chip', 'windshield crack', 'cracked windshield'], type: 'Windshield damage', severity: 'minor' },
      { keywords: ['bumper damage', 'bumper'], type: 'Bumper damage', severity: 'minor' }
    ]
    
    let damageDetected = null
    for (const pattern of damageKeywords) {
      if (pattern.keywords.some(kw => lowerMsg.includes(kw))) {
        damageDetected = pattern
        break
      }
    }
  
  if (damageDetected) {
    actions.push({
      type: 'add_event',
      label: 'Report Damage',
      data: {
        event_type: 'damage',
        damage_type: damageDetected.type,
        severity: damageDetected.severity,
        suggested_miles: vehicleContextData?.vehicle?.mileage || null,
        photo_urls: photoUrls && photoUrls.length > 0 ? photoUrls : undefined,
        extracted_from_message: true,
        proposal: {
          type: 'damage',
          preview: {
            title: 'Report Damage',
            description: 'I detected you mentioned vehicle damage',
            fields: [
              { label: 'Type', value: damageDetected.type },
              { label: 'Severity', value: damageDetected.severity.charAt(0).toUpperCase() + damageDetected.severity.slice(1) },
              { label: 'Date', value: new Date().toLocaleDateString() }
            ]
          }
        }
      }
    })
  }
  
  // WARNING LIGHT DETECTION
    const warningKeywords = [
      { keywords: ['check engine', 'check engine light', 'cel'], type: 'Check Engine Light' },
      { keywords: ['tpms', 'tire pressure', 'low tire pressure'], type: 'TPMS Warning' },
      { keywords: ['abs light', 'abs warning'], type: 'ABS Warning' },
      { keywords: ['brake light', 'brake warning'], type: 'Brake Warning' },
      { keywords: ['airbag light', 'srs light'], type: 'Airbag Warning' },
      { keywords: ['oil pressure', 'oil light'], type: 'Oil Pressure Warning' },
      { keywords: ['battery light', 'charging system'], type: 'Battery Warning' },
      { keywords: ['coolant', 'temperature warning', 'overheating'], type: 'Temperature Warning' }
    ]
    
    let warningDetected = null
    for (const pattern of warningKeywords) {
      if (pattern.keywords.some(kw => lowerMsg.includes(kw))) {
        warningDetected = pattern
        break
      }
    }
  
  if (warningDetected) {
    // Extract error code if mentioned (e.g., "P0420", "P0171")
    const errorCodeMatch = userMessage?.match(/\b([PC]\d{4})\b/i)
    const errorCode = errorCodeMatch ? errorCodeMatch[1].toUpperCase() : null
    
    actions.push({
      type: 'add_event',
      label: 'Log Warning Light',
      data: {
        event_type: 'dashboard_warning',
        warning_type: warningDetected.type,
        error_codes: errorCode,
        suggested_miles: vehicleContextData?.vehicle?.mileage || null,
        photo_urls: photoUrls && photoUrls.length > 0 ? photoUrls : undefined,
        extracted_from_message: true,
        proposal: {
          type: 'warning',
          preview: {
            title: 'Log Dashboard Warning',
            description: 'I detected a warning light mention',
            fields: [
              { label: 'Warning', value: warningDetected.type },
              ...(errorCode ? [{ label: 'Error Code', value: errorCode }] : []),
              { label: 'Date', value: new Date().toLocaleDateString() }
            ]
          }
        }
      }
    })
  }
  } // End userMessage check for damage/warnings
  
  // Data correction intents
  const lowerResponse = response.toLowerCase()
  if (lowerResponse.includes('warning light') || lowerResponse.includes('dashboard') || lowerResponse.includes('incorrect')) {
    // Find most recent dashboard snapshot event
    const recentDashboard = vehicleContextData?.maintenance?.recent_events?.find(
      (e: any) => e.type === 'dashboard_snapshot'
    )
    
    if (recentDashboard) {
      actions.push({
        type: 'correct_event',
        label: 'Correct Dashboard Data',
        data: { 
          event_id: recentDashboard.id,
          event_type: 'dashboard_snapshot',
          event_date: recentDashboard.date
        }
      })
    }
  }
  
  // Manual odometer update (fallback if not extracted)
  if ((lowerResponse.includes('odometer') || lowerResponse.includes('mileage') || lowerResponse.includes('miles now')) 
      && !actions.find(a => a.type === 'add_event')) {
    actions.push({
      type: 'add_event',
      label: 'Log Current Mileage',
      data: { 
        event_type: 'dashboard_snapshot',
        suggested_miles: vehicleContextData?.vehicle?.mileage
      }
    })
  }
  
  // Photo upload prompts
  if (lowerResponse.includes('photo') || lowerResponse.includes('picture') || lowerResponse.includes('show you') || lowerResponse.includes('upload')) {
    actions.push({
      type: 'upload_photo',
      label: 'Upload Photo',
      data: { 
        context: 'chat_upload',
        vehicle_id: context.id
      }
    })
  }
  
  // Service/maintenance mentions
  if (lowerResponse.includes('service') || lowerResponse.includes('maintenance')) {
    actions.push({
      type: 'navigate',
      label: 'View Service History',
      data: { path: `/vehicles/${context.id}/timeline` }
    })
    
    if (lowerResponse.includes('due') || lowerResponse.includes('overdue') || lowerResponse.includes('schedule')) {
      actions.push({
        type: 'reminder',
        label: 'Set Reminder',
        data: { type: 'service' }
      })
    }
  }
  
  // Cost mentions
  if (lowerResponse.includes('cost') || lowerResponse.includes('price') || lowerResponse.includes('$')) {
    actions.push({
      type: 'navigate',
      label: 'View Cost Breakdown',
      data: { path: `/vehicles/${context.id}/costs` }
    })
  }
  
  // Issues/problems
  if (lowerResponse.includes('issue') || lowerResponse.includes('problem') || lowerResponse.includes('warning')) {
    actions.push({
      type: 'navigate',
      label: 'View Timeline',
      data: { path: `/vehicles/${context.id}/timeline` }
    })
  }
  
  // Documentation/manual mentions
  if (lowerResponse.includes('manual') || lowerResponse.includes('documentation')) {
    actions.push({
      type: 'navigate',
      label: 'View Documents',
      data: { path: `/vehicles/${context.id}/documents` }
    })
  }
  
  // EVENT CARD DISPLAY - Detect when AI references specific events
  if (vehicleContextData?.maintenance?.recent_events) {
    // Check if AI is talking about specific events (fuel, Nevada, recent, etc.)
    const isDiscussingEvents = (
      lowerResponse.includes('fuel') || 
      lowerResponse.includes('fill') ||
      lowerResponse.includes('nevada') ||
      lowerResponse.includes('jean') ||
      lowerResponse.includes('july') ||
      lowerResponse.includes('2020') ||
      lowerResponse.includes('event') ||
      lowerResponse.includes('record')
    )
    
    if (isDiscussingEvents) {
      // Get the most relevant events based on the conversation
      const relevantEvents = vehicleContextData.maintenance.recent_events.filter((e: any) => {
        const eventLower = JSON.stringify(e).toLowerCase()
        
        // Match based on what user asked about
        if (userMessage) {
          const userLower = userMessage.toLowerCase()
          
          // Location matching
          if (userLower.includes('nevada') || userLower.includes('nv')) {
            return e.location?.toLowerCase().includes('nv') || 
                   e.location?.toLowerCase().includes('nevada')
          }
          
          // Date matching
          if (userLower.includes('2020') || userLower.includes('july')) {
            return e.date?.includes('2020')
          }
          
          // Type matching
          if (userLower.includes('fuel') || userLower.includes('gas')) {
            return e.type === 'fuel'
          }
        }
        
        // Default: include fuel events if discussing fuel
        if (lowerResponse.includes('fuel') || lowerResponse.includes('fill')) {
          return e.type === 'fuel'
        }
        
        return false
      })
      
      // Add view event actions for up to 3 most relevant events
      relevantEvents.slice(0, 3).forEach((event: any) => {
        const dateStr = new Date(event.date).toLocaleDateString()
        const location = event.location ? ` in ${event.location.split(',')[0]}` : ''
        const cost = event.cost ? ` ($${event.cost.toFixed(2)})` : ''
        
        actions.push({
          type: 'view_event',
          label: `View ${dateStr}${location}${cost}`,
          data: {
            event_id: event.id,
            event_type: event.type,
            event_date: event.date,
            event_summary: event.display_summary || event.summary,
            event_location: event.location,
            event_cost: event.cost,
            event_gallons: event.gallons,
            event_miles: event.miles,
            event_vendor: event.display_vendor || event.vendor,
            event_weather: event.weather
          }
        })
      })
    }
  }
  
  // Remove duplicates and limit to 5 actions (increased for event cards)
  const unique = actions.filter((action, index, self) =>
    index === self.findIndex(a => a.type === action.type && a.label === action.label)
  )
  
  return unique.slice(0, 4)
}
