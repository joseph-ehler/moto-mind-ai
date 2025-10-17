/**
 * Hybrid Address Extraction (SERVER-SIDE ONLY)
 * Three-tier fallback strategy for extracting gas station addresses
 * 
 * Strategy:
 * 1. Use structured extraction (if available)
 * 2. Try OCR-only extraction (non-strict mode)
 * 3. Fallback to reverse geocoding from GPS
 * 4. Return null if all fail
 * 
 * IMPORTANT: This file uses OpenAI and must only be imported server-side!
 * For client-side imports, use './address-types' instead.
 */

import OpenAI from 'openai'
import type { AddressResult, AddressSource, AddressConfidence, GPSCoordinates } from './address-types'
import { isValidAddress } from './address-types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Main address extraction with three-tier fallback
 */
export async function extractAddress(
  photo: File | string, // File or base64
  gps?: GPSCoordinates,
  structuredAddress?: string | null
): Promise<AddressResult> {
  
  // TIER 1: Use structured extraction if available
  if (structuredAddress && isValidAddress(structuredAddress)) {
    console.log('✅ Address from structured extraction:', structuredAddress)
    return {
      address: structuredAddress,
      source: 'vision_structured',
      confidence: 'high',
      method: 'Structured extraction (strict mode)'
    }
  }
  
  // TIER 2: Try OCR-only extraction (non-strict mode)
  console.log('📸 Structured extraction failed, trying OCR-only mode...')
  try {
    const ocrAddress = await extractAddressViaOCR(photo)
    if (ocrAddress && isValidAddress(ocrAddress)) {
      console.log('✅ Address from OCR extraction:', ocrAddress)
      return {
        address: ocrAddress,
        source: 'vision_ocr',
        confidence: 'medium',
        method: 'OCR extraction (non-strict mode)'
      }
    }
  } catch (error) {
    console.log('⚠️ OCR extraction failed:', error)
  }
  
  // TIER 3: Fallback to reverse geocoding
  if (gps) {
    console.log('📍 OCR failed, trying reverse geocoding...')
    try {
      const geocodedAddress = await reverseGeocode(gps.latitude, gps.longitude)
      if (geocodedAddress) {
        console.log('✅ Address from reverse geocoding:', geocodedAddress)
        return {
          address: geocodedAddress,
          source: 'geocoding',
          confidence: 'low',
          method: 'Reverse geocoding (approximate)'
        }
      }
    } catch (error) {
      console.log('⚠️ Reverse geocoding failed:', error)
    }
  }
  
  // TIER 4: No address available
  console.log('❌ All address extraction methods failed')
  return {
    address: null,
    source: 'none',
    confidence: 'none',
    method: 'No extraction method succeeded'
  }
}

/**
 * OCR-only extraction using OpenAI Vision (non-strict mode)
 * Focused prompt asking ONLY for address
 */
async function extractAddressViaOCR(photo: File | string): Promise<string | null> {
  let base64: string
  
  // Convert File to base64 if needed
  if (typeof photo === 'string') {
    base64 = photo
  } else {
    base64 = await fileToBase64(photo)
  }
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { 
              url: `data:image/jpeg;base64,${base64}`
            }
          },
          {
            type: 'text',
            text: `
Look at the TOP of this receipt image.

Extract ONLY the business address. This is usually in the first 3-5 lines.

Look for:
- Street address (e.g., "1 GOODSPRINGS RD")
- City, State, ZIP (e.g., "JEAN, NV 89019")

Combine into a single line: "1 Goodsprings Rd, Jean, NV 89019"

If you see multiple lines with address parts, combine them.
If no address is visible, respond with exactly: null

Do not include:
- Business name
- Phone numbers
- Other header information

Just the address.
            `.trim()
          }
        ]
      }
    ],
    max_tokens: 100,
    temperature: 0
    // NO strict mode - free-form extraction!
  })
  
  const content = response.choices[0].message.content?.trim()
  
  if (!content || content.toLowerCase() === 'null') {
    return null
  }
  
  return cleanAddress(content)
}

/**
 * Forward geocoding - convert address to coordinates
 * Uses Nominatim (OpenStreetMap) - Free!
 */
export async function forwardGeocode(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MotoMind App (contact@motomind.app)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data || data.length === 0) {
      return null
    }
    
    const result = data[0]
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon)
    }
  } catch (error) {
    console.error('Forward geocoding error:', error)
    return null
  }
}

/**
 * Reverse geocoding using Nominatim (OpenStreetMap)
 * Free, no API key needed!
 */
async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MotoMind App (contact@motomind.app)' // Required by Nominatim
      }
    })
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.address) {
      return null
    }
    
    // Build formatted address from components
    const parts = []
    
    // Street address
    if (data.address.house_number && data.address.road) {
      parts.push(`${data.address.house_number} ${data.address.road}`)
    } else if (data.address.road) {
      parts.push(data.address.road)
    }
    
    // City
    if (data.address.city) {
      parts.push(data.address.city)
    } else if (data.address.town) {
      parts.push(data.address.town)
    } else if (data.address.village) {
      parts.push(data.address.village)
    }
    
    // State & ZIP
    if (data.address.state && data.address.postcode) {
      parts.push(`${data.address.state} ${data.address.postcode}`)
    } else if (data.address.state) {
      parts.push(data.address.state)
    }
    
    return parts.length > 0 ? parts.join(', ') : null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

/**
 * Clean up OCR-extracted address
 */
function cleanAddress(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')                    // Multiple spaces → single
    .replace(/,\s*,/g, ',')                  // Double commas
    .replace(/\.\s*\./g, '.')                // Double periods
    .replace(/([A-Z]{2})\s+(\d)/g, '$1 $2')  // State + ZIP spacing
    .replace(/^["']|["']$/g, '')             // Remove quotes
    .trim()
}

/**
 * Convert File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
