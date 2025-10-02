#!/usr/bin/env node

// Automated migration runner - no more manual SQL pasting!
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration(sqlFile) {
  try {
    console.log(`🚀 Running migration: ${sqlFile}`)
    
    const sqlPath = path.join(__dirname, sqlFile)
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Split by semicolons and run each statement
    const statements = sql.split(';').filter(s => s.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement.trim() 
        })
        
        if (error) {
          console.error(`❌ Error in statement: ${statement.substring(0, 100)}...`)
          console.error(error)
          return false
        }
      }
    }
    
    console.log(`✅ Migration completed: ${sqlFile}`)
    return true
    
  } catch (error) {
    console.error(`❌ Migration failed: ${sqlFile}`)
    console.error(error)
    return false
  }
}

// Run migration from command line
const migrationFile = process.argv[2]
if (!migrationFile) {
  console.error('Usage: node run-migration.js <sql-file>')
  process.exit(1)
}

runMigration(migrationFile)
