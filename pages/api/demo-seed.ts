// MotoMindAI: Demo Seed API Endpoint
// Resets demo tenant with fresh data for consistent demos

import type { NextApiRequest, NextApiResponse } from 'next'
import { seedSmartphoneData } from '../../scripts/seed-smartphone'

interface SeedResponse {
  success: boolean
  message: string
  vehicles: Array<{
    id: string
    label: string
    status: string
    mpg: number
    issues: string[]
  }>
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SeedResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Demo seed not available in production' })
  }

  try {
    console.log('🌱 Resetting demo data via API...')
    
    // Run the smartphone seed script
    await seedSmartphoneData()
    
    // Return demo status for UI
    const response: SeedResponse = {
      success: true,
      message: 'Demo data reset successfully',
      vehicles: [
        {
          id: 'truck-47',
          label: 'Truck 47',
          status: 'flagged',
          mpg: 10.4,
          issues: ['Fuel efficiency down 16%', 'Maintenance overdue 95 days', 'Harsh braking events']
        },
        {
          id: 'truck-23',
          label: 'Truck 23', 
          status: 'healthy',
          mpg: 14.2,
          issues: []
        },
        {
          id: 'van-12',
          label: 'Van 12',
          status: 'warning',
          mpg: 7.3,
          issues: ['Low fuel efficiency', 'Excessive idle time']
        },
        {
          id: 'johns-truck',
          label: "John's Truck",
          status: 'healthy',
          mpg: 11.8,
          issues: []
        }
      ]
    }

    return res.status(200).json(response)
    
  } catch (error) {
    console.error('Demo seed failed:', error)
    return res.status(500).json({ 
      error: 'Failed to reset demo data. Check server logs.' 
    })
  }
}
