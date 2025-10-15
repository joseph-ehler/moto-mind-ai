/**
 * Check Threads and Messages Count
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('🔍 Checking Conversation Data...\n')

  // Get all threads
  const { data: threads, error: threadsError } = await supabase
    .from('conversation_threads')
    .select('*')
    .order('created_at', { ascending: false })

  if (threadsError) {
    console.error('❌ Error loading threads:', threadsError)
    return
  }

  console.log(`📊 Found ${threads.length} threads:\n`)

  for (const thread of threads) {
    console.log(`Thread: ${thread.id}`)
    console.log(`  Vehicle ID: ${thread.vehicle_id}`)
    console.log(`  Title: ${thread.title || '(no title)'}`)
    console.log(`  Message Count (stored): ${thread.message_count}`)
    console.log(`  Created: ${new Date(thread.created_at).toLocaleString()}`)
    console.log(`  Updated: ${new Date(thread.updated_at).toLocaleString()}`)

    // Get actual message count
    const { data: messages, error: messagesError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('thread_id', thread.id)

    if (messagesError) {
      console.log(`  ❌ Error loading messages: ${messagesError.message}`)
    } else {
      console.log(`  Message Count (actual): ${messages.length}`)
      if (messages.length > 0) {
        console.log(`  Messages:`)
        messages.forEach((m, i) => {
          console.log(`    ${i + 1}. [${m.role}] ${m.content.substring(0, 50)}...`)
        })
      }
    }
    console.log('')
  }

  // Check if trigger exists
  console.log('🔧 Checking if triggers exist...\n')
  const { data: triggers, error: triggerError } = await supabase.rpc('exec', {
    sql: `
      SELECT trigger_name, event_manipulation, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_name IN ('conversation_message_created', 'conversation_title_generator');
    `
  })

  if (triggerError) {
    console.log('⚠️  Could not check triggers (this is okay)')
  } else if (triggers) {
    console.log('✅ Triggers:', triggers)
  }
}

checkData()
