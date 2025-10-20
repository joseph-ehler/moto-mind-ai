/**
 * Apply Conversation Threads Migration
 * Directly creates the tables if they don't exist properly
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  console.log('🚀 Applying Conversation Threads Migration...\n')

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250109010000_add_conversation_threads.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

  try {
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql_string: migrationSQL
    })

    if (error) {
      console.error('❌ Failed to apply migration:', error)
      console.log('\n📝 You can manually run this SQL in Supabase SQL Editor:')
      console.log(supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql'))
      console.log('\nSQL to run:')
      console.log('─'.repeat(80))
      console.log(migrationSQL)
      console.log('─'.repeat(80))
      return false
    }

    console.log('✅ Migration applied successfully!')

    // Verify tables exist
    console.log('\n🔍 Verifying tables...')

    const { data: threads, error: threadsError } = await supabase
      .from('conversation_threads')
      .select('*')
      .limit(0)

    if (threadsError) {
      console.log('❌ conversation_threads:', threadsError.message)
    } else {
      console.log('✅ conversation_threads table exists')
    }

    const { data: messages, error: messagesError } = await supabase
      .from('conversation_messages')
      .select('*')
      .limit(0)

    if (messagesError) {
      console.log('❌ conversation_messages:', messagesError.message)
    } else {
      console.log('✅ conversation_messages table exists')
    }

    console.log('\n🎉 All done! Ready to test the AI chat modal.')
    return true

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    return false
  }
}

applyMigration()
