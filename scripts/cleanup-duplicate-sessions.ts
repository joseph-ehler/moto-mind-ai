/**
 * Cleanup Duplicate Sessions
 * Removes duplicate sessions from same device/browser
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanupDuplicateSessions() {
  console.log('🧹 Cleaning up duplicate sessions...\n')
  
  // Get all sessions
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('❌ Failed to fetch sessions:', error)
    return
  }
  
  if (!sessions || sessions.length === 0) {
    console.log('✅ No sessions found')
    return
  }
  
  console.log(`📊 Found ${sessions.length} total sessions\n`)
  
  // Group by user_id + browser + os + ip_address (same device)
  const deviceGroups = new Map<string, any[]>()
  
  for (const session of sessions) {
    const key = `${session.user_id}|${session.browser}|${session.os}|${session.ip_address}`
    if (!deviceGroups.has(key)) {
      deviceGroups.set(key, [])
    }
    deviceGroups.get(key)!.push(session)
  }
  
  console.log(`🔍 Found ${deviceGroups.size} unique devices\n`)
  
  let deletedCount = 0
  
  // For each device, keep only the most recent session
  for (const [key, deviceSessions] of deviceGroups.entries()) {
    if (deviceSessions.length > 1) {
      // Sort by last_active (most recent first)
      deviceSessions.sort((a, b) => 
        new Date(b.last_active || b.created_at).getTime() - 
        new Date(a.last_active || a.created_at).getTime()
      )
      
      // Keep the first (most recent), delete the rest
      const toKeep = deviceSessions[0]
      const toDelete = deviceSessions.slice(1)
      
      console.log(`🗑️  Device: ${toKeep.browser} on ${toKeep.os} (${toKeep.ip_address})`)
      console.log(`   Keeping: ${toKeep.id} (${toKeep.last_active || toKeep.created_at})`)
      console.log(`   Deleting: ${toDelete.length} older sessions`)
      
      // Delete old sessions
      for (const session of toDelete) {
        const { error: deleteError } = await supabase
          .from('sessions')
          .delete()
          .eq('id', session.id)
        
        if (deleteError) {
          console.error(`   ❌ Failed to delete session ${session.id}:`, deleteError)
        } else {
          deletedCount++
        }
      }
      
      console.log()
    }
  }
  
  if (deletedCount > 0) {
    console.log(`✅ Cleaned up ${deletedCount} duplicate sessions`)
    console.log(`📊 ${sessions.length - deletedCount} unique sessions remaining\n`)
  } else {
    console.log('✅ No duplicate sessions found\n')
  }
  
  // Show final session count
  const { count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📊 Total sessions after cleanup: ${count}`)
}

cleanupDuplicateSessions()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
