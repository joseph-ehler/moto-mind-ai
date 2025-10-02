// Process Image API - OpenAI Vision integration
import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Disable default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 Process image API called:', { method: req.method })
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check OpenAI API key first
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Missing OPENAI_API_KEY')
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }
    
    console.log('📝 Parsing multipart form data...')
    
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(req)
    console.log('📋 Form parsed:', { 
      fieldKeys: Object.keys(fields), 
      fileKeys: Object.keys(files) 
    })
    
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image
    const imageType = Array.isArray(fields.type) ? fields.type[0] : fields.type

    if (!imageFile || !imageType) {
      console.error('❌ Missing image or type')
      return res.status(400).json({ error: 'Missing image or type' })
    }

    console.log('📷 Processing image:', { 
      type: imageType, 
      size: imageFile.size,
      filepath: imageFile.filepath 
    })

    // Read and encode image for OpenAI Vision
    const imageBuffer = fs.readFileSync(imageFile.filepath)
    const base64Image = imageBuffer.toString('base64')
    console.log('📊 Image converted to base64, length:', base64Image.length)

    // First, classify the document automatically
    console.log('🔍 Classifying document type...')
    const documentType = await classifyDocument(base64Image)
    console.log('📋 Document classified as:', documentType)

    // Process based on classified type
    let result
    console.log('🤖 Processing document...')
    
    try {
      switch (documentType) {
        case 'fuel_receipt':
          result = await processFuelReceipt(base64Image)
          break
        case 'service_invoice':
          result = await processServiceInvoice(base64Image)
          break
        case 'insurance_document':
          result = await processInsuranceDocument(base64Image)
          break
        case 'parking_ticket':
          result = await processParkingTicket(base64Image)
          break
        case 'registration':
          result = await processRegistration(base64Image)
          break
        case 'inspection_certificate':
          result = await processInspectionCertificate(base64Image)
          break
        case 'odometer':
          result = await processOdometerWithOpenAI(base64Image)
          break
        case 'unknown':
          result = await processUnknownDocument(base64Image)
          break
        default:
          console.error('❌ Unhandled document type:', documentType)
          return res.status(400).json({ error: 'Unhandled document type' })
      }
    } catch (openaiError) {
      console.error('❌ OpenAI Vision error:', openaiError)
      console.error('❌ OpenAI error details:', {
        message: openaiError instanceof Error ? openaiError.message : 'Unknown error',
        stack: openaiError instanceof Error ? openaiError.stack : 'No stack',
        name: openaiError instanceof Error ? openaiError.name : 'Unknown',
        cause: (openaiError as any)?.cause || 'No cause'
      })
      return res.status(500).json({ 
        error: 'OpenAI Vision processing failed',
        details: openaiError instanceof Error ? openaiError.message : 'Unknown OpenAI error',
        type: 'openai_error'
      })
    }

    console.log('✅ OpenAI Vision result:', result)

    // Clean up temp file
    fs.unlinkSync(imageFile.filepath)

    return res.status(200).json({
      success: true,
      data: result,
      processed_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error processing image:', error)
    return res.status(500).json({ 
      error: 'Failed to process image',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Document Classification Function
async function classifyDocument(base64Image: string): Promise<string> {
  console.log('🔍 Classifying document with OpenAI Vision...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this image and classify what type of vehicle-related document it is. 
            
            Return ONLY one of these exact classifications:
            - fuel_receipt (gas station receipts, fuel purchases)
            - service_invoice (oil changes, repairs, maintenance bills)
            - insurance_document (insurance cards, policies, claims)
            - parking_ticket (parking violations, citations, fines)
            - registration (vehicle registration, title documents)
            - inspection_certificate (state inspections, emissions tests)
            - odometer (odometer/mileage display readings)
            - unknown (if not clearly one of the above)
            
            Be very specific - look for key indicators like gas station names, service shop logos, government seals, etc.`
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
    max_tokens: 50
  })

  const content = response.choices[0]?.message?.content?.trim()
  if (!content) {
    return 'unknown'
  }

  // Validate the classification
  const validTypes = [
    'fuel_receipt', 'service_invoice', 'insurance_document', 
    'parking_ticket', 'registration', 'inspection_certificate', 
    'odometer', 'unknown'
  ]
  
  return validTypes.includes(content) ? content : 'unknown'
}

// Document Processing Functions
async function processFuelReceipt(base64Image: string) {
  return await processReceiptWithOpenAI(base64Image)
}

async function processServiceInvoice(base64Image: string) {
  console.log('🔧 Processing service invoice...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this service invoice and extract ALL information in JSON format. Look carefully for vehicle identification:
            {
              "type": "service_invoice",
              "shop_name": "string (dealership or shop name)",
              "service_type": "string (detailed service description)",
              "total_cost": number,
              "date": "YYYY-MM-DD",
              "mileage": number (odometer reading in/out),
              "parts_used": ["array of all parts with part numbers if visible"],
              "labor_hours": number,
              "warranty_info": "string",
              
              "vehicle_year": number (look for YEAR field),
              "vehicle_make": "string (look for MAKE field, brand name)",
              "vehicle_model": "string (look for MODEL field)",
              "vin": "string (if visible)",
              "license_plate": "string (if visible)",
              "color": "string (if visible)",
              
              "customer_info": {
                "name": "string (if visible)",
                "phone": "string (if visible)",
                "address": "string (if visible)"
              },
              
              "work_order_number": "string (R.O. number if visible)",
              "technician": "string (tech name/code if visible)",
              "labor_rate": number (hourly rate if visible),
              "parts_total": number,
              "labor_total": number,
              "tax_amount": number (if separate),
              "additional_fees": ["array of other fees/charges"]
            }
            
            CRITICAL: Look for vehicle identification fields like YEAR, MAKE/MODEL, VIN, LICENSE, COLOR. These are often in header sections or vehicle info boxes. Extract ALL visible data, not just summary information.`
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
    max_tokens: 600
  })

  return await parseOpenAIResponse(response)
}

async function processParkingTicket(base64Image: string) {
  console.log('🎫 Processing parking ticket...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this parking ticket and extract information in JSON format:
            {
              "type": "parking_ticket",
              "ticket_number": "string",
              "violation_type": "string",
              "fine_amount": number,
              "date_issued": "YYYY-MM-DD",
              "due_date": "YYYY-MM-DD",
              "location": "string",
              "license_plate": "string (if visible)",
              "issuing_agency": "string"
            }
            
            Extract exact values from the ticket.`
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
    max_tokens: 500
  })

  return await parseOpenAIResponse(response)
}

async function processInsuranceDocument(base64Image: string) {
  console.log('🛡️ Processing insurance document...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this insurance document and extract ALL information in comprehensive JSON format:
            {
              "type": "insurance_document",
              "insurance_company": "string",
              "agent_name": "string (if visible)",
              "agent_phone": "string (if visible)",
              "policy_number": "string",
              "group_number": "string (if visible)",
              "effective_date": "YYYY-MM-DD",
              "expiration_date": "YYYY-MM-DD",
              "issue_date": "YYYY-MM-DD (if visible)",
              "vehicle_info": {
                "year": number (if visible),
                "make": "string",
                "model": "string",
                "vin": "string (if visible)",
                "license_plate": "string (if visible)"
              },
              "policyholder_info": {
                "name": "string",
                "address": "string (if visible)",
                "city": "string (if visible)",
                "state": "string (if visible)",
                "zip": "string (if visible)"
              },
              "coverage_details": {
                "liability_limits": "string (e.g., 100/300/100)",
                "comprehensive_deductible": "string (if visible)",
                "collision_deductible": "string (if visible)",
                "uninsured_motorist": "string (if visible)",
                "personal_injury_protection": "string (if visible)",
                "coverage_types": ["array of all coverage types listed"]
              },
              "premium_info": {
                "total_premium": number (if visible),
                "monthly_premium": number (if visible),
                "annual_premium": number (if visible),
                "payment_method": "string (if visible)"
              },
              "claim_info": {
                "claim_number": "string (if visible)",
                "claim_phone": "string (if visible)",
                "emergency_roadside": "string (if visible)"
              },
              "document_type": "string (card, declaration, certificate, etc.)",
              "state_minimum_met": "string (if indicated)",
              "additional_drivers": ["array if listed"],
              "discounts_applied": ["array if listed"]
            }
            
            CRITICAL: Extract EVERY detail visible on the insurance document. Look for:
            - All coverage limits and deductibles
            - Agent and company contact information
            - Complete vehicle identification
            - Policyholder information
            - Premium and payment details
            - Claim reporting information
            - Any additional drivers or discounts
            
            Convert all dates to YYYY-MM-DD format. If information is not visible, use null or empty string.`
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
    max_tokens: 1200
  })

  return await parseOpenAIResponse(response)
}

async function processRegistration(base64Image: string) {
  console.log('📋 Processing registration document...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this vehicle registration and extract ALL information in comprehensive JSON format:
            {
              "type": "registration",
              "state": "string",
              "registration_number": "string",
              "issue_date": "YYYY-MM-DD (if visible)",
              "expiration_date": "YYYY-MM-DD",
              "renewal_date": "YYYY-MM-DD (if different from expiration)",
              "vehicle_info": {
                "year": number,
                "make": "string",
                "model": "string",
                "body_style": "string (sedan, SUV, truck, etc.)",
                "color": "string",
                "vin": "string (full 17-character VIN)",
                "engine_size": "string (if visible)",
                "fuel_type": "string (gas, diesel, electric, etc.)"
              },
              "license_plate": "string",
              "plate_type": "string (standard, personalized, etc.)",
              "owner_info": {
                "name": "string (if visible)",
                "address": "string (if visible)",
                "city": "string (if visible)",
                "state": "string (if visible)",
                "zip": "string (if visible)"
              },
              "registration_fees": {
                "total_paid": number (if visible),
                "registration_fee": number (if visible),
                "title_fee": number (if visible),
                "other_fees": ["array of other fees if visible"]
              },
              "title_number": "string (if visible)",
              "lien_holder": "string (if visible)",
              "gross_weight": "string (if visible)",
              "odometer_reading": number (if visible),
              "document_number": "string (any document/control numbers)"
            }
            
            CRITICAL: Extract EVERY detail visible on the registration. Look for:
            - Complete VIN (17 characters)
            - All fees and charges
            - Owner information
            - Vehicle specifications
            - Title information
            - Lien holder information
            - Any control or document numbers
            
            Convert all dates to YYYY-MM-DD format. If information is not visible, use null or empty string.`
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
    max_tokens: 1200
  })

  return await parseOpenAIResponse(response)
}

async function processInspectionCertificate(base64Image: string) {
  console.log('✅ Processing inspection certificate...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this inspection certificate and extract information in JSON format:
            {
              "type": "inspection_certificate",
              "inspection_type": "string (safety, emissions, etc.)",
              "result": "string (pass/fail)",
              "expiration_date": "YYYY-MM-DD",
              "inspection_date": "YYYY-MM-DD",
              "inspector_name": "string",
              "station_name": "string",
              "mileage": number (if shown),
              "issues_found": ["array of issues if any"]
            }
            
            Extract exact values from the inspection certificate.`
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
    max_tokens: 500
  })

  return await parseOpenAIResponse(response)
}

async function processUnknownDocument(base64Image: string) {
  console.log('❓ Processing unknown document...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this document and extract any vehicle-related information in JSON format:
            {
              "type": "unknown_document",
              "document_description": "string (what type of document this appears to be)",
              "extracted_text": "string (key text from the document)",
              "date": "YYYY-MM-DD (if any date is visible)",
              "amount": number (if any monetary amount is visible),
              "vehicle_related": boolean (true if related to vehicles)
            }
            
            Extract any useful information even if document type is unclear.`
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
    max_tokens: 400
  })

  return await parseOpenAIResponse(response)
}

// Helper function to parse OpenAI responses with markdown cleanup
async function parseOpenAIResponse(response: any) {
  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI Vision')
  }

  console.log('📄 OpenAI Vision response:', content)

  try {
    // Clean up markdown code blocks if present
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    const parsed = JSON.parse(cleanContent)
    console.log('✅ Parsed document data:', parsed)
    return parsed
  } catch (parseError) {
    console.error('❌ Failed to parse OpenAI response as JSON:', parseError)
    console.error('❌ Raw content:', content)
    throw new Error('Failed to parse OpenAI response as JSON')
  }
}

// Legacy function - now calls processFuelReceipt
async function processReceiptWithOpenAI(base64Image: string) {
  console.log('🧾 Processing receipt with OpenAI Vision...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this fuel receipt and extract ALL information in JSON format:
            {
              "type": "fuel",
              "station_name": "string",
              "total_amount": number,
              "gallons": number,
              "price_per_gallon": number,
              "date": "YYYY-MM-DD",
              "time": "HH:MM (if visible)",
              "location": "string (address/city if visible)",
              "pump_number": "string (if visible)",
              "fuel_type": "string (regular, premium, diesel, etc.)",
              "payment_method": "string (cash, card, etc.)",
              "receipt_number": "string (if visible)",
              "vehicle_info": {
                "license_plate": "string (if visible)",
                "odometer": number (if visible),
                "vin": "string (if visible)"
              },
              "additional_charges": ["array of other fees like car wash, etc."]
            }
            
            CRITICAL: Look for ANY vehicle identification like license plate, odometer reading, or VIN that might be printed on the receipt. Convert dates from MM/DD/YYYY to YYYY-MM-DD format.`
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
    max_tokens: 500
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI Vision')
  }

  console.log('📄 OpenAI Vision response:', content)

  try {
    // Clean up markdown code blocks if present
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    const parsed = JSON.parse(cleanContent)
    console.log('✅ Parsed receipt data:', parsed)
    return parsed
  } catch (parseError) {
    console.error('❌ Failed to parse OpenAI response as JSON:', parseError)
    console.error('❌ Raw content:', content)
    throw new Error('Failed to parse OpenAI response as JSON')
  }
}

async function processOdometerWithOpenAI(base64Image: string) {
  console.log('🚗 Processing odometer with OpenAI Vision...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Read the odometer/mileage display in this image and return JSON:
            {
              "type": "odometer",
              "current_mileage": number,
              "confidence": number
            }
            
            Look for digital or analog odometer displays. Be very careful with the numbers.
            Confidence should be 0-100 based on how clearly you can read it.`
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
    max_tokens: 300
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI Vision')
  }

  try {
    return JSON.parse(content)
  } catch (error) {
    throw new Error('Failed to parse OpenAI response as JSON')
  }
}

async function processServiceWithOpenAI(base64Image: string) {
  console.log('🔧 Processing service invoice with OpenAI Vision...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this service invoice and extract ALL information in comprehensive JSON format:
            {
              "type": "service_invoice",
              "shop_name": "string",
              "shop_address": "string (if visible)",
              "shop_phone": "string (if visible)",
              "service_type": "string (detailed description)",
              "work_order_number": "string (if visible)",
              "invoice_number": "string (if visible)",
              "date": "YYYY-MM-DD",
              "service_advisor": "string (if visible)",
              "technician": "string (if visible)",
              "vehicle_info": {
                "year": number (if visible),
                "make": "string",
                "model": "string",
                "vin": "string (if visible)",
                "license_plate": "string (if visible)",
                "color": "string (if visible)",
                "mileage": number (if visible)
              },
              "customer_info": {
                "name": "string (if visible)",
                "phone": "string (if visible)",
                "address": "string (if visible)"
              },
              "services_performed": ["array of all services/operations"],
              "parts_used": ["array of all parts with part numbers"],
              "parts_total": number,
              "labor_hours": number (if visible),
              "labor_rate": number (if visible),
              "labor_total": number,
              "tax_amount": number (if visible),
              "additional_fees": ["array of other charges like disposal fees, shop supplies, etc."],
              "total_cost": number,
              "payment_method": "string (if visible)",
              "warranty_info": "string (if visible)",
              "recommendations": ["array of recommended future services"],
              "next_service_due": "string (mileage or date if mentioned)"
            }
            
            CRITICAL: Extract EVERY detail visible on the invoice. Look for:
            - All part numbers and descriptions
            - Individual line item costs
            - Labor breakdown
            - Any vehicle identification (VIN, plate, mileage)
            - Service advisor/technician names
            - Work order numbers
            - Warranty information
            - Future service recommendations
            - All fees and charges
            
            Convert dates to YYYY-MM-DD format. If information is not visible, use null or empty string.`
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
    max_tokens: 1500
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI Vision')
  }

  try {
    return JSON.parse(content)
  } catch (error) {
    throw new Error('Failed to parse OpenAI response as JSON')
  }
}
