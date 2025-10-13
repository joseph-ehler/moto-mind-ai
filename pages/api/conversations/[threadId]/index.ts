/**
 * Conversation Thread Management API
 * 
 * PATCH - Update conversation thread (rename)
 * DELETE - Delete a conversation thread
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
  const { threadId } = req.query

  if (!threadId || typeof threadId !== 'string') {
    return res.status(400).json({ error: 'Thread ID required' })
  }

  // PATCH - Update thread
  if (req.method === 'PATCH') {
    try {
      const { title } = req.body

      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Valid title required' })
      }

      const { data, error } = await supabase
        .from('conversation_threads')
        .update({ title: title.trim() })
        .eq('id', threadId)
        .select()
        .single()

      if (error) throw error

      return res.status(200).json({ success: true, thread: data })
    } catch (error) {
      console.error('Failed to update thread:', error)
      return res.status(500).json({ error: 'Failed to update conversation' })
    }
  }

  // DELETE - Delete thread
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('conversation_threads')
        .delete()
        .eq('id', threadId)

      if (error) throw error

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Failed to delete thread:', error)
      return res.status(500).json({ error: 'Failed to delete conversation' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
