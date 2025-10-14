import { NextApiRequest, NextApiResponse } from 'next'
import { withApiError, apiErrors, apiSuccess } from '@/lib/utils/api-error'
import { getVehicles, createVehicle } from '@/features/vehicles/data'
import { createVehicleRequestSchema, vehicleQuerySchema } from '@/lib/validation/vehicles'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Mock tenant ID for development
  const tenantId = '550e8400-e29b-41d4-a716-446655440000'

  switch (req.method) {
    case 'GET':
      return handleGetVehicles(req, res, tenantId)
    
    case 'POST':
      return handleCreateVehicle(req, res, tenantId)
    
    default:
      throw apiErrors.methodNotAllowed(req.method || 'UNKNOWN')
  }
}

async function handleGetVehicles(
  req: NextApiRequest, 
  res: NextApiResponse, 
  tenantId: string
) {
  // Validate query parameters
  const query = vehicleQuerySchema.parse(req.query)
  
  // Get vehicles from service
  const vehicles = await getVehicles(tenantId)
  
  // Apply filters if provided
  let filteredVehicles = vehicles
  
  if (query.garage_id) {
    filteredVehicles = filteredVehicles.filter(v => v.garage_id === query.garage_id)
  }
  
  if (query.make) {
    filteredVehicles = filteredVehicles.filter(v => 
      v.make.toLowerCase().includes(query.make!.toLowerCase())
    )
  }
  
  if (query.year) {
    filteredVehicles = filteredVehicles.filter(v => v.year === query.year)
  }
  
  // Apply pagination
  const total = filteredVehicles.length
  const paginatedVehicles = filteredVehicles
    .slice(query.offset, query.offset + query.limit)
  
  return res.status(200).json(apiSuccess({
    vehicles: paginatedVehicles,
    total,
    limit: query.limit,
    offset: query.offset,
  }, (req as any).requestId))
}

async function handleCreateVehicle(
  req: NextApiRequest, 
  res: NextApiResponse, 
  tenantId: string
) {
  // Validate request body
  const validatedData = createVehicleRequestSchema.parse(req.body)
  
  // Create vehicle using service
  const result = await createVehicle(validatedData, tenantId)
  
  return res.status(201).json(apiSuccess({
    message: 'Vehicle created successfully',
    vehicle: result.vehicle,
  }, (req as any).requestId))
}

export default withApiError(handler)
