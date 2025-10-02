import { NextApiRequest, NextApiResponse } from 'next'
import { generateNotifications } from '@/lib/services/notifications'
import { handleApiError } from '@/lib/utils/errors'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Mock tenant ID for development
    const tenantId = '550e8400-e29b-41d4-a716-446655440000'

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Generate priority notifications
    const notifications = await generateNotifications(tenantId)

    return res.status(200).json({ 
      notifications,
      count: notifications.length,
      generated_at: new Date().toISOString()
    })
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}
