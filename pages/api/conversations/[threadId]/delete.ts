/**
 * Delete Conversation Thread API
 * 
 * DELETE: Soft-delete a conversation thread and its messages
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
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { threadId } = req.query

  if (!threadId || typeof threadId !== 'string') {
    return res.status(400).json({ error: 'Thread ID is required' })
  }

  try {
    // Verify thread exists and get vehicle_id for ownership check
    const { data: thread, error: threadError } = await supabase
      .from('conversation_threads')
      .select('id, vehicle_id, title')
      .eq('id', threadId)
      .single()

    if (threadError || !thread) {
      return res.status(404).json({ error: 'Thread not found' })
    }

    // Soft delete: Update archived flag instead of hard delete
    // This allows potential recovery and maintains data integrity
    const { error: updateError } = await supabase
      .from('conversation_threads')
      .update({
        archived_at: new Date().toISOString(),
        title: thread.title || `[Deleted] ${new Date().toLocaleDateString()}`
      })
      .eq('id', threadId)

    if (updateError) {
      console.error('Failed to archive thread:', updateError)
      return res.status(500).json({ error: 'Failed to delete conversation' })
    }

    console.log(`✅ Archived conversation thread: ${threadId}`)

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
      threadId
    })
  } catch (error) {
    console.error('Delete thread error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
