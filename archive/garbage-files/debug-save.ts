// Debug endpoint to see what the UI is sending
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔍 DEBUG SAVE ENDPOINT')
  console.log('Method:', req.method)
  console.log('Headers:', JSON.stringify(req.headers, null, 2))
  console.log('Body:', JSON.stringify(req.body, null, 2))
  console.log('Query:', JSON.stringify(req.query, null, 2))

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { eventType, data, uploadId, vehicleId } = req.body

    console.log('Extracted values:')
    console.log('- eventType:', eventType)
    console.log('- data:', JSON.stringify(data, null, 2))
    console.log('- uploadId:', uploadId)
    console.log('- vehicleId:', vehicleId)

    return res.status(200).json({
      success: true,
      received: {
        eventType,
        data,
        uploadId,
        vehicleId
      },
      message: 'Debug endpoint - data received successfully'
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return res.status(500).json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
