import { NextApiRequest, NextApiResponse } from 'next'
import { getGarages, createGarage } from '@/lib/services/vehicless'
import { garageQuerySchema, createGarageRequestSchema } from '@/lib/validation/vehicless'
import { handleApiError } from '@/lib/utils/errors'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Mock tenant ID for development - replace with real auth
    const tenantId = '550e8400-e29b-41d4-a716-446655440000'

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, tenantId)
      case 'POST':
        return handlePost(req, res, tenantId)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, tenantId: string) {
  try {
    // Validate query parameters
    const query = garageQuerySchema.parse(req.query)
    
    // Get garages using service
    const garages = await getGarages(tenantId, query)
    
    return res.status(200).json({ garages })
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, tenantId: string) {
  try {
    // Validate request body
    const garageData = createGarageRequestSchema.parse({
      ...req.body,
      is_default: req.body.isDefault // Handle frontend naming
    })
    
    // Create garage using service
    const garage = await createGarage(tenantId, garageData)
    
    return res.status(201).json({ 
      success: true, 
      garage,
      message: 'Garage created successfully'
    })
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}
