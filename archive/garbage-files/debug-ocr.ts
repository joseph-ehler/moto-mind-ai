import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import Tesseract from 'tesseract.js'
import OpenAI from 'openai'
import fs from 'fs'

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse the uploaded file
    const form = formidable({
      uploadDir: './uploads',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    })

    const [fields, files] = await form.parse(req)
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image

    if (!imageFile) {
      return res.status(400).json({ error: 'No image file provided' })
    }

    console.log('🔍 Debug OCR for file:', imageFile.originalFilename)

    // Step 1: Try Tesseract OCR
    let tesseractText = ''
    let tesseractConfidence = 0
    
    try {
      const tesseractResult = await Tesseract.recognize(imageFile.filepath, 'eng', {
        logger: m => console.log('Tesseract:', m)
      })

      tesseractText = tesseractResult.data.text
      tesseractConfidence = tesseractResult.data.confidence
      
      console.log('📝 Tesseract OCR text:')
      console.log('=' .repeat(50))
      console.log(tesseractText)
      console.log('=' .repeat(50))
      console.log('Confidence:', tesseractConfidence)

    } catch (tesseractError) {
      console.error('❌ Tesseract failed:', tesseractError)
    }

    // Step 2: Try OpenAI Vision
    let visionText = ''
    let visionError = null
    
    try {
      const imageBuffer = fs.readFileSync(imageFile.filepath)
      const base64Image = imageBuffer.toString('base64')

      console.log('🤖 Trying OpenAI Vision...')
      console.log('Image size:', imageBuffer.length, 'bytes')
      console.log('Base64 length:', base64Image.length)

      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this image. Return the raw text exactly as you see it."
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
        max_tokens: 500,
        temperature: 0
      })

      visionText = visionResponse.choices[0]?.message?.content || ''
      
      console.log('🤖 OpenAI Vision text:')
      console.log('=' .repeat(50))
      console.log(visionText)
      console.log('=' .repeat(50))

    } catch (error) {
      console.error('❌ OpenAI Vision failed:', error)
      visionError = error instanceof Error ? error.message : 'Unknown error'
    }

    // Clean up uploaded file
    fs.unlinkSync(imageFile.filepath)

    return res.status(200).json({
      success: true,
      tesseract: {
        text: tesseractText,
        confidence: tesseractConfidence,
        length: tesseractText.length
      },
      vision: {
        text: visionText,
        error: visionError,
        length: visionText.length
      },
      comparison: {
        tesseract_has_gallons: tesseractText.toLowerCase().includes('gallons'),
        tesseract_has_total: tesseractText.toLowerCase().includes('total'),
        vision_has_gallons: visionText.toLowerCase().includes('gallons'),
        vision_has_total: visionText.toLowerCase().includes('total')
      }
    })

  } catch (error) {
    console.error('Debug OCR error:', error)
    return res.status(500).json({
      error: 'Failed to debug OCR',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
