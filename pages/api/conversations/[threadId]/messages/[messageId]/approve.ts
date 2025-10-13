/**
 * Mark a message proposal as approved
 * Stores approval status in message metadata
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

  const { threadId, messageId } = req.query
  const { proposalType, eventId } = req.body

  if (!threadId || typeof threadId !== 'string') {
    return res.status(400).json({ error: 'Thread ID required' })
  }

  if (!messageId || typeof messageId !== 'string') {
    return res.status(400).json({ error: 'Message ID required' })
  }

  try {
    // Get current message
    const { data: message, error: fetchError } = await supabase
      .from('conversation_messages')
      .select('metadata')
      .eq('id', messageId)
      .eq('thread_id', threadId)
      .single()

    if (fetchError || !message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Update metadata with approval status
    const { error: updateError } = await supabase
      .from('conversation_messages')
      .update({
        metadata: {
          ...message.metadata,
          proposal_approved: true,
          proposal_type: proposalType,
          approved_at: new Date().toISOString(),
          event_id: eventId
        }
      })
      .eq('id', messageId)

    if (updateError) {
      console.error('Failed to mark as approved:', updateError)
      return res.status(500).json({ error: 'Failed to update' })
    }

    return res.status(200).json({ 
      success: true,
      message: 'Proposal marked as approved'
    })
  } catch (error: any) {
    console.error('Approval error:', error)
    return res.status(500).json({ 
      error: 'Failed to mark as approved',
      details: error.message 
    })
  }
}
