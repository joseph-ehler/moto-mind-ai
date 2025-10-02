/**
 * Canonical Vehicle Image Generation System
 * 
 * Generates consistent, studio-style vehicle images using AI with year-range consolidation.
 * Each canonical key represents a design-stable era (e.g., "2012-2015 Honda Civic Sedan").
 * 
 * Key benefits:
 * - 30x cost reduction through consolidation
 * - Consistent visual language across fleet
 * - Self-improving library via network effects
 * - No scraping/licensing issues
 */

import OpenAI from 'openai'
import { Pool } from 'pg'
import { supabaseStorage, type UploadResult } from './supabase-storage'

// Types
export interface VehicleSpecs {
  year: number
  make: string
  model: string
  bodyStyle: string
  trim?: string
  drivetrain?: string
  color?: string
  region?: 'USDM' | 'EUDM' | 'JDM'
}

export interface CanonicalKey {
  make: string
  model: string
  bodyStyle: string
  generation: string
  color: string
  region: string
}

export interface GeneratedImage {
  id: string
  canonicalKey: string
  s3Url: string
  angles: Record<string, string>
  verified: boolean
  prompt: any
  createdAt: Date
}

export interface GenerationRequest {
  canonicalKey: string
  specs: VehicleSpecs
  angles: ImageAngle[]
  priority?: number
  tenantId: string
  userId?: string
}

export type ImageAngle = 'front_3q' | 'side' | 'rear_3q' | 'interior'

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const DEFAULT_COLOR = 'neutral_silver'
const DEFAULT_REGION = 'USDM'

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

/**
 * Generate canonical key from vehicle specifications
 */
export function generateCanonicalKey(specs: VehicleSpecs): string {
  const generation = lookupGeneration(specs.make, specs.model, specs.bodyStyle, specs.year)
  const color = normalizeColor(specs.color || DEFAULT_COLOR)
  const region = specs.region || DEFAULT_REGION
  
  return `${generation}|${specs.make.toLowerCase()}|${specs.model.toLowerCase()}|${specs.bodyStyle.toLowerCase()}|${color}|${region.toLowerCase()}`
}

/**
 * Look up generation mapping for year-range consolidation
 */
export async function lookupGeneration(make: string, model: string, bodyStyle: string, year: number): Promise<string> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  
  try {
    const result = await client.query(`
      SELECT canonical_generation 
      FROM vehicle_generations 
      WHERE LOWER(make) = LOWER($1) 
        AND LOWER(model) = LOWER($2) 
        AND LOWER(body_style) = LOWER($3)
        AND $4 BETWEEN year_start AND year_end
      LIMIT 1
    `, [make, model, bodyStyle, year])
    
    if (result.rows.length > 0) {
      return result.rows[0].canonical_generation
    }
    
    // Fallback: create approximate generation based on 5-year windows
    const generationStart = Math.floor(year / 5) * 5
    const generationEnd = generationStart + 4
    return `${generationStart}-${generationEnd}`
    
  } finally {
    client.release()
    await pool.end()
  }
}

/**
 * Normalize color names for consistency
 */
function normalizeColor(color: string): string {
  const colorMap: Record<string, string> = {
    'white': 'pearl_white',
    'black': 'jet_black', 
    'silver': 'neutral_silver',
    'gray': 'neutral_silver',
    'grey': 'neutral_silver',
    'red': 'crimson_red',
    'blue': 'deep_blue',
    'green': 'forest_green',
    'yellow': 'bright_yellow',
    'orange': 'sunset_orange'
  }
  
  const normalized = color.toLowerCase().replace(/[^a-z]/g, '')
  return colorMap[normalized] || DEFAULT_COLOR
}

/**
 * Build generation prompts for different angles
 */
export class PromptBuilder {
  private baseConstraints = {
    canvas: '16:9 aspect ratio, 2048×1152 resolution',
    lighting: 'soft, even studio lighting with gentle floor shadow',
    background: 'seamless neutral light grey background (#F6F7F9)',
    quality: 'photorealistic, high detail, professional automotive photography',
    restrictions: 'no brand logos, no badges, no license plates, no watermarks, no people, no motion blur, no background props'
  }

  buildPrompt(specs: VehicleSpecs, angle: ImageAngle): string {
    const vehicle = this.formatVehicleDescription(specs)
    const angleSpec = this.getAngleSpecification(angle)
    const colorSpec = specs.color ? `, exterior color ${specs.color}` : ', neutral metallic silver exterior'
    
    return `Render a photorealistic studio image of a ${vehicle}${colorSpec}.

${angleSpec}

Studio setup: ${this.baseConstraints.lighting}; ${this.baseConstraints.background}.
Technical: ${this.baseConstraints.canvas}, ${this.baseConstraints.quality}.
Clean factory configuration, no aftermarket accessories.

Avoid: ${this.baseConstraints.restrictions}.`
  }

  private formatVehicleDescription(specs: VehicleSpecs): string {
    let description = `${specs.year} ${specs.make} ${specs.model}`
    
    if (specs.trim) {
      description += ` ${specs.trim}`
    }
    
    // Add body style context for better accuracy
    const bodyStyleContext = this.getBodyStyleContext(specs.bodyStyle)
    if (bodyStyleContext) {
      description += `, ${bodyStyleContext}`
    }
    
    if (specs.drivetrain) {
      description += `, ${specs.drivetrain}`
    }
    
    return description
  }

  private getBodyStyleContext(bodyStyle: string): string {
    const contexts: Record<string, string> = {
      'sedan': 'four-door sedan body style',
      'hatchback': 'hatchback body style with rear liftgate',
      'suv': 'SUV body style with higher ride height',
      'truck': 'pickup truck with visible bed',
      'coupe': 'two-door coupe body style',
      'wagon': 'station wagon body style',
      'convertible': 'convertible with soft or hard top'
    }
    
    return contexts[bodyStyle.toLowerCase()] || ''
  }

  private getAngleSpecification(angle: ImageAngle): string {
    const angles: Record<ImageAngle, string> = {
      'front_3q': 'Angle: front three-quarter view, camera height ~1.5m, 35mm lens equivalent. Show front and driver side clearly.',
      'side': 'Angle: perfect side profile, camera height ~1.2m, 50mm lens equivalent. Show complete vehicle profile from driver side.',
      'rear_3q': 'Angle: rear three-quarter view, camera height ~1.5m, 35mm lens equivalent. Show rear and passenger side clearly.',
      'interior': 'Angle: interior dashboard view from driver seat position. Show steering wheel, instrument cluster, and center console. Soft lighting through windows.'
    }
    
    return angles[angle]
  }

  buildVerificationPrompt(specs: VehicleSpecs, angle: ImageAngle): string {
    const vehicle = `${specs.year} ${specs.make} ${specs.model} ${specs.bodyStyle}`
    
    return `Analyze this image and answer: Is this a ${vehicle}? 

Check for:
1. Correct body style (${specs.bodyStyle})
2. Appropriate proportions for ${specs.make} ${specs.model}
3. Year range accuracy (${specs.year} era styling)
4. Angle matches request (${angle})

Respond with JSON: { "match": true/false, "confidence": 0-100, "issues": ["list of problems if any"] }`
  }
}

/**
 * Main canonical image service
 */
export class CanonicalImageService {
  private promptBuilder = new PromptBuilder()
  
  /**
   * Get or generate canonical image for vehicle specs
   */
  async getCanonicalImage(
    specs: VehicleSpecs, 
    angle: ImageAngle = 'front_3q',
    options: { forceRegenerate?: boolean } = {}
  ): Promise<GeneratedImage | null> {
    const canonicalKey = generateCanonicalKey(specs)
    
    // Check cache first
    if (!options.forceRegenerate) {
      const cached = await this.getCachedImage(canonicalKey, angle)
      if (cached) {
        return cached
      }
    }
    
    // Generate new image
    return await this.generateImage(specs, angle, canonicalKey)
  }

  /**
   * Queue image generation for async processing
   */
  async queueGeneration(request: GenerationRequest): Promise<string> {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const client = await pool.connect()
    
    try {
      const result = await client.query(`
        INSERT INTO image_generation_queue (
          canonical_key, make, model, body_style, generation, color, angles, 
          priority, tenant_id, requested_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (canonical_key) DO UPDATE SET
          priority = LEAST(image_generation_queue.priority, EXCLUDED.priority),
          updated_at = NOW()
        RETURNING id
      `, [
        request.canonicalKey,
        request.specs.make,
        request.specs.model, 
        request.specs.bodyStyle,
        await lookupGeneration(request.specs.make, request.specs.model, request.specs.bodyStyle, request.specs.year),
        normalizeColor(request.specs.color || DEFAULT_COLOR),
        request.angles,
        request.priority || 5,
        request.tenantId,
        request.userId
      ])
      
      return result.rows[0].id
    } finally {
      client.release()
      await pool.end()
    }
  }

  /**
   * Process queued generation requests
   */
  async processQueue(batchSize: number = 5): Promise<void> {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const client = await pool.connect()
    
    try {
      // Get next batch of queued items
      const result = await client.query(`
        SELECT * FROM image_generation_queue 
        WHERE status = 'queued' AND attempts < max_attempts
        ORDER BY priority ASC, created_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      `, [batchSize])
      
      for (const item of result.rows) {
        await this.processQueueItem(item)
      }
    } finally {
      client.release()
      await pool.end()
    }
  }

  private async getCachedImage(canonicalKey: string, angle: ImageAngle): Promise<GeneratedImage | null> {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const client = await pool.connect()
    
    try {
      const result = await client.query(`
        SELECT * FROM vehicle_images 
        WHERE canonical_key = $1 AND verified = true
        AND angles ? $2
      `, [canonicalKey, angle])
      
      if (result.rows.length > 0) {
        const row = result.rows[0]
        return {
          id: row.id,
          canonicalKey: row.canonical_key,
          s3Url: row.angles[angle] || row.s3_url,
          angles: row.angles,
          verified: row.verified,
          prompt: row.prompt,
          createdAt: row.created_at
        }
      }
      
      return null
    } finally {
      client.release()
      await pool.end()
    }
  }

  private async generateImage(specs: VehicleSpecs, angle: ImageAngle, canonicalKey: string): Promise<GeneratedImage> {
    const prompt = this.promptBuilder.buildPrompt(specs, angle)
    
    console.log(`🎨 Generating ${angle} image for: ${specs.year} ${specs.make} ${specs.model}`)
    console.log(`📝 Prompt: ${prompt}`)
    
    const startTime = Date.now()
    
    try {
      // Generate image with OpenAI DALL-E
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        size: '1792x1024', // Closest to 16:9 available
        quality: 'hd',
        n: 1
      })
      
      const imageUrl = response.data[0].url
      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI')
      }
      
      // Verify image quality
      const verificationResult = await this.verifyImage(imageUrl, specs, angle)
      
      // Upload to Supabase Storage and save to database
      const storageUrl = await this.uploadToSupabase(imageUrl, canonicalKey, angle)
      const generatedImage = await this.saveToDatabase({
        canonicalKey,
        storageUrl,
        angles: { [angle]: storageUrl },
        prompt: { text: prompt, model: 'dall-e-3' },
        verified: verificationResult.match && verificationResult.confidence > 70,
        verificationResult,
        generationTimeMs: Date.now() - startTime,
        generationCostCents: 4 // DALL-E 3 HD cost
      })
      
      console.log(`✅ Generated and cached image: ${canonicalKey}`)
      return generatedImage
      
    } catch (error) {
      console.error(`❌ Image generation failed for ${canonicalKey}:`, error)
      throw error
    }
  }

  private async verifyImage(imageUrl: string, specs: VehicleSpecs, angle: ImageAngle): Promise<any> {
    try {
      const verificationPrompt = this.promptBuilder.buildVerificationPrompt(specs, angle)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: verificationPrompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 300
      })
      
      const result = response.choices[0].message.content
      return JSON.parse(result || '{"match": false, "confidence": 0, "issues": ["Parse error"]}')
      
    } catch (error) {
      console.error('Image verification failed:', error)
      return { match: false, confidence: 0, issues: ['Verification failed'] }
    }
  }

  private async uploadToSupabase(imageUrl: string, canonicalKey: string, angle: ImageAngle): Promise<string> {
    try {
      const uploadResult = await supabaseStorage.uploadImageFromUrl(
        imageUrl, 
        canonicalKey, 
        angle,
        {
          canonicalKey,
          angle,
          generatedAt: new Date(),
          model: 'dall-e-3',
          verified: false
        }
      )
      
      if (uploadResult.success && uploadResult.url) {
        console.log(`✅ Uploaded to Supabase Storage: ${uploadResult.url}`)
        return uploadResult.url
      } else {
        console.error('❌ Supabase upload failed:', uploadResult.error)
        // Fallback to original URL if upload fails
        return imageUrl
      }
    } catch (error) {
      console.error('❌ Supabase upload error:', error)
      // Fallback to original URL if upload fails
      return imageUrl
    }
  }

  private async saveToDatabase(data: any): Promise<GeneratedImage> {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const client = await pool.connect()
    
    try {
      const result = await client.query(`
        INSERT INTO vehicle_images (
          canonical_key, storage_url, storage_path, angles, prompt, verified, 
          verification_result, generation_time_ms, generation_cost_cents
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (canonical_key) DO UPDATE SET
          angles = vehicle_images.angles || EXCLUDED.angles,
          updated_at = NOW()
        RETURNING *
      `, [
        data.canonicalKey,
        data.storageUrl,
        data.storageUrl, // Use URL as path for now
        JSON.stringify(data.angles),
        JSON.stringify(data.prompt),
        data.verified,
        JSON.stringify(data.verificationResult),
        data.generationTimeMs,
        data.generationCostCents
      ])
      
      const row = result.rows[0]
      return {
        id: row.id,
        canonicalKey: row.canonical_key,
        s3Url: row.s3_url,
        angles: row.angles,
        verified: row.verified,
        prompt: row.prompt,
        createdAt: row.created_at
      }
    } finally {
      client.release()
      await pool.end()
    }
  }

  private async processQueueItem(item: any): Promise<void> {
    // TODO: Implement queue processing
    console.log(`Processing queue item: ${item.canonical_key}`)
  }
}

// Export singleton instance
export const canonicalImageService = new CanonicalImageService()
