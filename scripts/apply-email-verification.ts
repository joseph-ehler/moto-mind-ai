#!/usr/bin/env tsx
/**
 * Apply Email Verification Migration
 * Direct SQL execution using PostgreSQL client
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local')
  process.exit(1)
}

async function applyMigration() {
  const client = new Client({ connectionString: DATABASE_URL })
  
  try {
    console.log('🔄 Connecting to database...\n')
    await client.connect()
    
    console.log('📦 Applying email verification migration...\n')
    
    // Step 1: Add email_verified column
    await client.query(`
      ALTER TABLE user_tenants 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false
    `)
    console.log('✅ Added email_verified column')
    
    // Step 2: Add email_verified_at column
    await client.query(`
      ALTER TABLE user_tenants 
      ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ
    `)
    console.log('✅ Added email_verified_at column')
    
    // Step 3: Add index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_tenants_email_verified 
      ON user_tenants(email_verified)
    `)
    console.log('✅ Created index on email_verified')
    
    // Step 4: Add comments
    await client.query(`
      COMMENT ON COLUMN user_tenants.email_verified 
      IS 'Whether the user has verified their email address'
    `)
    await client.query(`
      COMMENT ON COLUMN user_tenants.email_verified_at 
      IS 'Timestamp when email was verified'
    `)
    console.log('✅ Added column comments')
    
    // Step 5: Create trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION set_email_verified_at()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.email_verified = true AND OLD.email_verified = false THEN
          NEW.email_verified_at = NOW();
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `)
    console.log('✅ Created trigger function')
    
    // Step 6: Create trigger
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_set_email_verified_at ON user_tenants
    `)
    await client.query(`
      CREATE TRIGGER trigger_set_email_verified_at
      BEFORE UPDATE ON user_tenants
      FOR EACH ROW
      EXECUTE FUNCTION set_email_verified_at()
    `)
    console.log('✅ Created trigger')
    
    // Verification
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_tenants'
      AND column_name IN ('email_verified', 'email_verified_at')
      ORDER BY column_name
    `)
    
    console.log('\n📊 Verification:')
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}${row.column_default ? ` (default: ${row.column_default})` : ''}`)
    })
    
    console.log('\n✅ Email verification migration completed successfully!')
    console.log('\n🎉 Your auth system now supports email verification!')
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    throw error
  } finally {
    await client.end()
  }
}

// Run it
applyMigration()
  .then(() => {
    console.log('\n✨ All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error:', error)
    process.exit(1)
  })
