import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Helper function to parse OpenAI responses (you'll need to import this from process.ts)
function parseOpenAIResponse(content: string) {
  try {
    // Remove any markdown code block formatting
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleanContent)
  } catch (error) {
    console.error('❌ Failed to parse OpenAI response:', content)
    throw new Error('Invalid JSON response from OpenAI Vision')
  }
}

// Repair Processing
export async function processRepair(base64Image: string) {
  console.log('🔧 Processing repair invoice with OpenAI Vision...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract repair information from this invoice/receipt:
            {
              "type": "repair",
              "problem_description": "string (what was wrong)",
              "repair_performed": "string (what was done)",
              "parts_replaced": ["array of parts"],
              "total_amount": number,
              "shop_name": "string",
              "date": "YYYY-MM-DD",
              "mileage": number,
              "warranty_period": "string (if mentioned)",
              "confidence": number (0-100)
            }
            
            CRITICAL: Focus on repair-specific data. Look for diagnostic codes, problem descriptions, parts replaced, and warranty information.`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI Vision')
  }

  return parseOpenAIResponse(content)
}

// Insurance Processing
export async function processInsurance(base64Image: string) {
  console.log('🛡️ Processing insurance document with OpenAI Vision...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract insurance information from this document:
            {
              "type": "insurance",
              "insurance_company": "string",
              "policy_number": "string",
              "coverage_type": "string (liability, full, comprehensive)",
              "premium_amount": number,
              "effective_date": "YYYY-MM-DD",
              "expiration_date": "YYYY-MM-DD",
              "claim_number": "string (if claim document)",
              "confidence": number (0-100)
            }
            
            CRITICAL: Focus on policy numbers, coverage details, dates, and claim information if present.`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI Vision')
  }

  return parseOpenAIResponse(content)
}

// Accident Processing
export async function processAccident(base64Image: string) {
  console.log('🚗 Processing accident document with OpenAI Vision...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract accident information from this document/photo:
            {
              "type": "accident",
              "accident_date": "YYYY-MM-DD",
              "location": "string (intersection, address)",
              "damage_description": "string",
              "police_report_number": "string",
              "claim_number": "string",
              "estimated_damage": number,
              "confidence": number (0-100)
            }
            
            CRITICAL: Focus on damage assessment, claim numbers, and location information.`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI Vision')
  }

  return parseOpenAIResponse(content)
}
