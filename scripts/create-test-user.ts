/**
 * Create Test User for AI Chat
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

async function createTestUser() {
  console.log('🔍 Checking for existing users...\n')

  // Check if any users exist
  const { data: existingUsers, error: checkError } = await supabase
    .from('users')
    .select('id, email')
    .limit(5)

  if (checkError) {
    console.error('❌ Error checking users:', checkError)
    process.exit(1)
  }

  if (existingUsers && existingUsers.length > 0) {
    console.log('✅ Found existing users:')
    existingUsers.forEach(u => {
      console.log(`   - ${u.email || 'No email'} (${u.id})`)
    })
    console.log('\n✨ You can use these users for AI chat!')
    return
  }

  console.log('⚠️  No users found. Creating test user...\n')

  // Create test user directly in users table
  const testUserId = '00000000-0000-0000-0000-000000000001'
  
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      id: testUserId,
      email: 'test@motomind.ai',
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (createError) {
    console.error('❌ Failed to create user:', createError)
    console.log('\nℹ️  This might be because the users table has different columns.')
    console.log('Run this SQL in Supabase to see the users table structure:')
    console.log('   SELECT * FROM information_schema.columns WHERE table_name = \'users\';')
    process.exit(1)
  }

  console.log('✅ Test user created!')
  console.log(`   Email: test@motomind.ai`)
  console.log(`   ID: ${testUserId}`)
  console.log('\n🎉 You can now use AI chat!')
}

createTestUser()
