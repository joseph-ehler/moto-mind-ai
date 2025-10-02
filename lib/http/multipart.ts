// Multipart Form Parser
// Utility for parsing multipart form data in API routes

import formidable from 'formidable'
import { NextApiRequest } from 'next'
import fs from 'fs'

export interface ParsedMultipart {
  fields: Record<string, string>
  files: Record<string, {
    filepath: string
    originalFilename: string
    mimetype: string
    size: number
  }>
}

/**
 * Parses multipart form data from API request
 */
export async function parseMultipart(req: NextApiRequest): Promise<ParsedMultipart> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 20 * 1024 * 1024, // 20MB limit per file
      maxTotalFileSize: 20 * 1024 * 1024, // 20MB total limit
      keepExtensions: true
    })
    
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(new Error(`Multipart parsing failed: ${err.message}`))
        return
      }
      
      // Normalize fields (formidable returns arrays)
      const normalizedFields: Record<string, string> = {}
      for (const [key, value] of Object.entries(fields)) {
        if (Array.isArray(value)) {
          normalizedFields[key] = value[0] || ''
        } else {
          normalizedFields[key] = value || ''
        }
      }
      
      // Normalize files
      const normalizedFiles: Record<string, any> = {}
      for (const [key, value] of Object.entries(files)) {
        if (Array.isArray(value)) {
          normalizedFiles[key] = value[0]
        } else {
          normalizedFiles[key] = value
        }
      }
      
      resolve({
        fields: normalizedFields,
        files: normalizedFiles
      })
    })
  })
}

/**
 * Converts uploaded file to base64
 */
export async function toBase64(file: any): Promise<{ base64: string; mime: string }> {
  if (!file || !file.filepath) {
    throw new Error('No file provided')
  }
  
  try {
    const buffer = await fs.promises.readFile(file.filepath)
    const base64 = buffer.toString('base64')
    
    // Clean up temp file
    try {
      await fs.promises.unlink(file.filepath)
    } catch {
      // Ignore cleanup errors
    }
    
    return {
      base64,
      mime: file.mimetype || 'image/jpeg'
    }
  } catch (error) {
    throw new Error(`File processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Normalizes processing mode
 */
export function normMode(mode: string): 'ocr' | 'document' | 'auto' {
  const normalized = mode?.toLowerCase()
  
  if (['ocr', 'document', 'auto'].includes(normalized)) {
    return normalized as 'ocr' | 'document' | 'auto'
  }
  
  return 'auto' // Default fallback
}

/**
 * Normalizes document type
 */
export function normDocType(docType: string): string | undefined {
  if (!docType || typeof docType !== 'string') {
    return undefined
  }
  
  const normalized = docType.toLowerCase().replace(/[^a-z_]/g, '_')
  
  // Map common variations
  const typeMap: Record<string, string> = {
    'service': 'service_invoice',
    'fuel': 'fuel_receipt',
    'gas': 'fuel_receipt',
    'insurance': 'insurance_card',
    'dashboard': 'dashboard_snapshot',
    'odometer': 'odometer',
    'accident': 'accident_report',
    'inspection': 'inspection_certificate'
  }
  
  return typeMap[normalized] || normalized
}
