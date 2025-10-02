// Simple data save endpoint for testing
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { eventType, data, uploadId, vehicleId } = req.body

    // For now, just log the data and return success
    console.log('📱 Smartphone Data Captured:', {
      eventType,
      data,
      uploadId,
      vehicleId,
      timestamp: new Date().toISOString()
    })

    // Simulate successful save
    return res.status(200).json({
      success: true,
      id: `event-${Date.now()}`,
      message: 'Data saved successfully (demo mode)',
      captured: {
        eventType,
        data,
        uploadId,
        vehicleId
      }
    })

  } catch (error) {
    console.error('Save error:', error)
    return res.status(500).json({ 
      error: 'Save failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
