/**
 * Message Feedback API
 * 
 * POST - Submit feedback for a message
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messageId } = req.query
  const { rating, comment } = req.body

  if (!messageId || typeof messageId !== 'string') {
    return res.status(400).json({ error: 'Message ID required' })
  }

  if (!rating || (rating !== 1 && rating !== 5)) {
    return res.status(400).json({ error: 'Rating must be 1 or 5' })
  }

  try {
    const { error } = await supabase
      .from('conversation_messages')
      .update({
        feedback_rating: rating,
        feedback_comment: comment || null
      })
      .eq('id', messageId)

    if (error) throw error

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Failed to save feedback:', error)
    return res.status(500).json({ error: 'Failed to save feedback' })
  }
}
