// Simplest possible endpoint to test if API routes work
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔥 SIMPLE TEST ENDPOINT HIT')
  console.log('Method:', req.method)
  
  return res.status(200).json({
    success: true,
    message: 'Simple test endpoint working',
    method: req.method,
    timestamp: new Date().toISOString()
  })
}
