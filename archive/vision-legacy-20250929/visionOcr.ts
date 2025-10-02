// MotoMindAI: OpenAI Vision OCR API with Validation Pipeline
// Uses GPT-4 Vision to extract data from photos with comprehensive validation

import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import { validateExtraction, extractMiles } from '../../lib/processing/validation'
import { safeVisionExtraction, extractOdometer, extractFuelReceipt } from '../../lib/vision/retry-logic'
import { selectOptimalModel } from '../../lib/vision/smart-model-selection'
import { processWithCache, detectDuplicate, imageCache } from '../../lib/vision/image-cache'
import { estimateCost, calculateActualCost, globalCostTracker } from '../../lib/vision/dynamic-cost-estimation'
import { getPrompt, cleanExtraction, generateTimelineSummary, calculateConfidence } from '../../lib/vision/simplified-prompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { image, type } = req.body

    if (!image || !type) {
      return res.status(400).json({ error: 'Missing image or type' })
    }

    // Different prompts for different types
    const prompts = {
      odometer: `You are analyzing a vehicle odometer photo. 
        Look for the main mileage reading displayed on the odometer.
        Return ONLY the numeric value of the miles/kilometers shown.
        If you see multiple numbers, return the main odometer reading (usually the largest display).
        
        Examples:
        - If you see "123456" on the odometer, return: 123456
        - If you see "87,432 miles", return: 87432
        - If you see multiple displays, return the main odometer reading
        
        Return only the number, no units, no explanation.`,
      
      fuel_receipt: `You are analyzing a fuel receipt photo.
        Extract the gallons purchased and total cost.
        Return in format: {"gallons": X.XX, "cost": X.XX}
        If you cannot find both values, return null for missing values.`,
      
      maintenance_doc: `You are analyzing a maintenance document photo.
        Extract key information like service type, date, mileage, and cost.
        Return as JSON with available fields.`
    }

    // Use optimized extraction with retry logic and smart model selection
    let visionResponse
    
    try {
      if (type === 'odometer') {
        visionResponse = await extractOdometer(image)
      } else if (type === 'fuel_receipt') {
        visionResponse = await extractFuelReceipt(image)
      } else {
        // Generic extraction with smart model selection
        const modelChoice = selectOptimalModel({ documentType: type })
        console.log(`🤖 Using ${modelChoice.model} for ${type} - ${modelChoice.reasoning}`)
        
        const prompt = prompts[type as keyof typeof prompts] || prompts.odometer
        visionResponse = await safeVisionExtraction({
          base64Image: image,
          prompt,
          documentType: type,
          costBudget: 'medium'
        })
      }
    } catch (error) {
      console.error('Vision extraction failed:', error)
      return res.status(500).json({ 
        error: 'Vision processing failed after retries',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    const extractedText = visionResponse.content

    if (!extractedText) {
      return res.status(400).json({ error: 'No text extracted from image' })
    }

    // Parse and structure the extracted data
    let extractedData: any = {}
    let initialConfidence = 90 // Vision API typically has high confidence

    if (type === 'odometer') {
      // Use robust mileage extraction
      const miles = extractMiles({ extracted_data: { raw_text: extractedText } })
      
      if (!miles) {
        return res.status(400).json({ 
          error: 'Invalid odometer reading extracted',
          extracted: extractedText 
        })
      }

      extractedData = {
        mileage: miles,
        raw_text: extractedText
      }
    } else if (type === 'fuel_receipt') {
      try {
        // Try to parse JSON response
        const parsed = JSON.parse(extractedText)
        extractedData = {
          total_amount: parsed.cost,
          gallons: parsed.gallons,
          raw_text: extractedText
        }
      } catch {
        // Fallback to raw text
        extractedData = {
          raw_text: extractedText
        }
      }
    } else {
      // For other types, structure as best we can
      extractedData = {
        raw_text: extractedText
      }
    }

    // Apply validation pipeline
    const validation = validateExtraction(extractedData, initialConfidence)

    // Return enhanced response with validation and optimization metadata
    return res.status(200).json({
      extracted_data: extractedData,
      confidence: validation.confidence_adjusted,
      source: 'openai_vision_optimized',
      validation: {
        rollup: validation.needs_review ? 'needs_review' : 'validated',
        issues: validation.issues,
        original_confidence: initialConfidence
      },
      raw_response: extractedText,
      optimization_metadata: {
        model_used: visionResponse.model,
        attempt_count: visionResponse.attempt,
        processing_time_ms: visionResponse.processingTime,
        estimated_cost_usd: visionResponse.totalCost.toFixed(4),
        cost_savings: visionResponse.model === 'gpt-4o-mini' ? 'high' : 'none'
      },
      // Legacy fields for backward compatibility
      ...(type === 'odometer' && { miles: extractedData.mileage }),
      ...(type === 'fuel_receipt' && { 
        extracted: extractedText,
        gallons: extractedData.gallons,
        cost: extractedData.total_amount 
      })
    })

  } catch (error) {
    console.error('Vision OCR error:', error)
    
    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(401).json({ error: 'OpenAI API key not configured' })
    }

    return res.status(500).json({ 
      error: 'Vision processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Increase body size limit for base64 images
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
