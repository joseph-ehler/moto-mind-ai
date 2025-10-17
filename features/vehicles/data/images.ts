// MotoMindAI: Vehicle Images API
// Handles CRUD operations for vehicle images

import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'
import { z } from 'zod'

// Validation schemas
const CreateImageSchema = z.object({
  storage_path: z.string().min(1),
  public_url: z.string().url(),
  filename: z.string().min(1),
  image_type: z.enum(['hero', 'front', 'rear', 'side_left', 'side_right', 'interior', 'engine', 'odometer', 'damage', 'maintenance', 'general']).default('general'),
  is_primary: z.boolean().default(false),
  description: z.string().optional(),
})

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🚀 Vehicle images API called:', req.method, req.url)
    
    // Get auth context from middleware
    const tenantId = (req as any).tenantId
    const userId = (req as any).userId
    const supabase = (req as any).supabase
    
    if (!tenantId || !userId || !supabase) {
      return res.status(401).json({ error: 'Unauthorized - no tenant context' })
    }
    
    const auth = { tenantId, userId }
    const { id: vehicleId } = req.query

    if (!vehicleId || typeof vehicleId !== 'string') {
      console.log('❌ Missing or invalid vehicle ID:', vehicleId)
      return res.status(400).json({ error: 'Vehicle ID is required' })
    }

    console.log('📋 Request details:', { method: req.method, vehicleId, tenantId })

    switch (req.method) {
      case 'GET':
        return await handleGetImages(req, res, auth, vehicleId, supabase)
      case 'POST':
        return await handleCreateImage(req, res, auth, vehicleId, supabase)
      case 'DELETE':
        return await handleDeleteImage(req, res, auth, vehicleId, supabase)
      case 'PATCH':
        return await handleUpdateImage(req, res, auth, vehicleId, supabase)
      default:
        console.log('❌ Method not allowed:', req.method)
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('❌ Vehicle images API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Please try again later'
    })
  }
}

async function handleGetImages(
  req: NextApiRequest,
  res: NextApiResponse,
  auth: { tenantId: string; userId: string },
  vehicleId: string,
  supabase: any
) {
  try {
    console.log('🔍 Fetching images for vehicle:', vehicleId, 'tenant:', auth.tenantId)

    // Verify vehicle belongs to tenant
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', vehicleId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (vehicleError) {
      console.error('❌ Vehicle lookup error:', vehicleError)
      return res.status(404).json({ error: 'Vehicle not found', details: vehicleError.message })
    }

    if (!vehicle) {
      console.log('❌ Vehicle not found for tenant')
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    console.log('✅ Vehicle found:', vehicle.id)

    // Get all images for the vehicle
    const { data: images, error } = await supabase
      .from('vehicle_images')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching vehicle images:', error)
      return res.status(500).json({ 
        error: 'Failed to fetch images', 
        details: error.message,
        code: error.code 
      })
    }

    console.log('✅ Found', images?.length || 0, 'images for vehicle')

    return res.status(200).json({
      images: images || [],
      total: images?.length || 0
    })
  } catch (error) {
    console.error('❌ Unexpected error in handleGetImages:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch images',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleCreateImage(
  req: NextApiRequest,
  res: NextApiResponse,
  auth: { tenantId: string; userId: string },
  vehicleId: string,
  supabase: any
) {
  try {
    // Validate request body
    const validation = CreateImageSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: `Invalid image data: ${validation.error.errors.map(e => e.message).join(', ')}`
      })
    }

    const imageData = validation.data

    // Verify vehicle belongs to tenant
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', vehicleId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (vehicleError || !vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    // If this is being set as primary, unset other primary images of the same type
    if (imageData.is_primary) {
      await supabase
        .from('vehicle_images')
        .update({ is_primary: false })
        .eq('vehicle_id', vehicleId)
        .eq('image_type', imageData.image_type)
        .eq('is_primary', true)
    }

    // Create the image record
    const { data: image, error } = await supabase
      .from('vehicle_images')
      .insert({
        tenant_id: auth.tenantId,
        vehicle_id: vehicleId,
        storage_path: imageData.storage_path,
        public_url: imageData.public_url,
        filename: imageData.filename,
        image_type: imageData.image_type,
        is_primary: imageData.is_primary,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating vehicle image:', error)
      return res.status(500).json({ 
        error: 'Failed to create image record',
        details: error.message 
      })
    }

    return res.status(201).json({ image })
  } catch (error) {
    console.error('Error in handleCreateImage:', error)
    return res.status(500).json({ error: 'Failed to create image' })
  }
}

async function handleUpdateImage(
  req: NextApiRequest,
  res: NextApiResponse,
  auth: { tenantId: string; userId: string },
  vehicleId: string,
  supabase: any
) {
  try {
    const { imageId, action, image_type } = req.body

    if (!imageId) {
      return res.status(400).json({ error: 'Image ID is required' })
    }

    if (!action) {
      return res.status(400).json({ error: 'Action is required (set_primary, remove_primary)' })
    }

    console.log('🔄 Updating image:', { imageId, action, image_type })

    // Verify image belongs to this vehicle and tenant
    const { data: image, error: imageError } = await supabase
      .from('vehicle_images')
      .select('*')
      .eq('id', imageId)
      .eq('vehicle_id', vehicleId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (imageError || !image) {
      return res.status(404).json({ error: 'Image not found' })
    }

    if (action === 'set_primary') {
      // First, unset any existing primary image of the same type
      const imageType = image_type || image.image_type
      
      await supabase
        .from('vehicle_images')
        .update({ is_primary: false })
        .eq('vehicle_id', vehicleId)
        .eq('image_type', imageType)
        .eq('is_primary', true)

      // Set this image as primary
      const { error: updateError } = await supabase
        .from('vehicle_images')
        .update({ is_primary: true })
        .eq('id', imageId)

      if (updateError) {
        console.error('Error setting primary image:', updateError)
        return res.status(500).json({ error: 'Failed to set primary image' })
      }

      // If this is a hero image, also update the vehicle's hero_image_url
      if (imageType === 'hero') {
        await supabase
          .from('vehicles')
          .update({ hero_image_url: image.public_url })
          .eq('id', vehicleId)
          .eq('tenant_id', auth.tenantId)
      }

      console.log('✅ Image set as primary')
      return res.status(200).json({ success: true, message: 'Image set as primary' })

    } else if (action === 'remove_primary') {
      // Remove primary status
      const { error: updateError } = await supabase
        .from('vehicle_images')
        .update({ is_primary: false })
        .eq('id', imageId)

      if (updateError) {
        console.error('Error removing primary status:', updateError)
        return res.status(500).json({ error: 'Failed to remove primary status' })
      }

      // If this was a hero image, clear the vehicle's hero_image_url
      if (image.image_type === 'hero') {
        await supabase
          .from('vehicles')
          .update({ hero_image_url: null })
          .eq('id', vehicleId)
          .eq('tenant_id', auth.tenantId)
      }

      console.log('✅ Primary status removed')
      return res.status(200).json({ success: true, message: 'Primary status removed' })

    } else {
      return res.status(400).json({ error: 'Invalid action. Use set_primary or remove_primary' })
    }

  } catch (error) {
    console.error('Error in handleUpdateImage:', error)
    return res.status(500).json({ error: 'Failed to update image' })
  }
}

async function handleDeleteImage(
  req: NextApiRequest,
  res: NextApiResponse,
  auth: { tenantId: string; userId: string },
  vehicleId: string,
  supabase: any
) {
  try {
    const { imageId } = req.body

    if (!imageId) {
      return res.status(400).json({ error: 'Image ID is required' })
    }

    // Get image details before deletion
    const { data: image } = await supabase
      .from('vehicle_images')
      .select('*')
      .eq('id', imageId)
      .eq('vehicle_id', vehicleId)
      .eq('tenant_id', auth.tenantId)
      .single()

    // Delete the image record (this will also handle storage cleanup if needed)
    const { error } = await supabase
      .from('vehicle_images')
      .delete()
      .eq('id', imageId)
      .eq('vehicle_id', vehicleId)
      .eq('tenant_id', auth.tenantId)

    if (error) {
      console.error('Error deleting vehicle image:', error)
      return res.status(500).json({ error: 'Failed to delete image' })
    }

    // If this was the hero image, clear the vehicle's hero_image_url
    if (image && image.image_type === 'hero' && image.is_primary) {
      await supabase
        .from('vehicles')
        .update({ hero_image_url: null })
        .eq('id', vehicleId)
        .eq('tenant_id', auth.tenantId)
    }

    // Delete associated timeline event (if any)
    const { error: eventDeleteError } = await supabase
      .from('vehicle_events')
      .delete()
      .eq('image_id', imageId)
      .eq('vehicle_id', vehicleId)
      .eq('tenant_id', auth.tenantId)

    if (eventDeleteError) {
      console.warn('⚠️ Failed to delete associated timeline event:', eventDeleteError)
      // Don't fail the whole request - image is already deleted
    } else {
      console.log('✅ Deleted associated timeline event for image:', imageId)
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error in handleDeleteImage:', error)
    return res.status(500).json({ error: 'Failed to delete image' })
  }
}


export default withTenantIsolation(handler)
