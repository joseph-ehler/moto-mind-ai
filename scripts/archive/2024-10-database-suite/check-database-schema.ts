/**
 * Check Database Schema
 * Verifies what tables exist in Supabase
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('🔍 Checking Supabase Database Schema...\n')
  console.log(`📍 URL: ${supabaseUrl}\n`)

  try {
    // Check main tables
    const tablesToCheck = [
      'vehicles',
      'vehicle_events',
      'conversation_threads',
      'conversation_messages',
      'images',
      'documents',
      'users'
    ]

    console.log('📊 Checking Tables:\n')

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`  ❌ ${table} - Does NOT exist`)
          console.log(`     Error: ${error.message}`)
        } else {
          console.log(`  ✅ ${table} - EXISTS`)
        }
      } catch (err: any) {
        console.log(`  ❌ ${table} - Error: ${err.message}`)
      }
    }

    // Check conversation_threads structure if it exists
    console.log('\n📋 Conversation Threads Structure:')
    const { data: threadSample, error: threadError } = await supabase
      .from('conversation_threads')
      .select('*')
      .limit(1)

    if (threadError) {
      console.log('  ❌ Table does not exist or has no data')
      console.log(`     Error: ${threadError.message}`)
    } else if (threadSample && threadSample.length > 0) {
      console.log('  ✅ Sample row columns:', Object.keys(threadSample[0]).join(', '))
    } else {
      console.log('  ⚠️  Table exists but is empty')
    }

    // Check conversation_messages structure if it exists
    console.log('\n📋 Conversation Messages Structure:')
    const { data: messageSample, error: messageError } = await supabase
      .from('conversation_messages')
      .select('*')
      .limit(1)

    if (messageError) {
      console.log('  ❌ Table does not exist or has no data')
      console.log(`     Error: ${messageError.message}`)
    } else if (messageSample && messageSample.length > 0) {
      console.log('  ✅ Sample row columns:', Object.keys(messageSample[0]).join(', '))
    } else {
      console.log('  ⚠️  Table exists but is empty')
    }

    console.log('\n✨ Schema check complete!')

  } catch (error: any) {
    console.error('❌ Failed to check schema:', error.message)
    process.exit(1)
  }
}

checkSchema()
