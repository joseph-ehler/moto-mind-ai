#!/usr/bin/env tsx
/**
 * Supabase Health Checker
 * 
 * Tests if Supabase DNS/connectivity is working
 * Usage: npm run db:health
 */

import * as dns from 'dns'
import * as util from 'util'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const resolveDns = util.promisify(dns.resolve4)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const DATABASE_URL = process.env.DATABASE_URL

async function checkDNS(hostname: string): Promise<boolean> {
  try {
    await resolveDns(hostname)
    return true
  } catch (error) {
    return false
  }
}

async function checkHTTPS(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    })
    return response.ok || response.status === 401 || response.status === 404
  } catch (error) {
    return false
  }
}

async function main() {
  console.log('\n🏥 SUPABASE HEALTH CHECK\n')
  
  if (!SUPABASE_URL) {
    console.error('❌ No SUPABASE_URL found in .env.local')
    process.exit(1)
  }

  const apiHost = SUPABASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')
  
  // Extract database hostname from DATABASE_URL
  let dbHost = 'unknown'
  if (DATABASE_URL) {
    const match = DATABASE_URL.match(/@([^:\/]+)/)
    if (match) dbHost = match[1]
  }

  console.log('📍 Testing connectivity...\n')

  // Test 1: API DNS
  process.stdout.write(`   API DNS (${apiHost})... `)
  const apiDnsOk = await checkDNS(apiHost)
  console.log(apiDnsOk ? '✅' : '❌')

  // Test 2: API HTTPS
  process.stdout.write(`   API HTTPS (${SUPABASE_URL})... `)
  const apiHttpsOk = await checkHTTPS(SUPABASE_URL)
  console.log(apiHttpsOk ? '✅' : '❌')

  // Test 3: Database DNS
  if (dbHost !== 'unknown') {
    process.stdout.write(`   DB DNS (${dbHost})... `)
    const dbDnsOk = await checkDNS(dbHost)
    console.log(dbDnsOk ? '✅' : '❌')
  }

  console.log('\n' + '='.repeat(60))
  
  if (apiDnsOk && apiHttpsOk) {
    console.log('✅ Supabase is HEALTHY - migrations can run automatically')
    console.log('\n💡 Try: npm run db:migrate')
    process.exit(0)
  } else {
    console.log('⚠️  Supabase connectivity DEGRADED - use manual SQL paste')
    console.log('\n📝 Workaround:')
    console.log('   1. npm run db:generate-sql')
    console.log('   2. Paste .migrations-output/pending-migrations.sql into dashboard')
    console.log('\n🔗 Status: https://status.supabase.com')
    process.exit(1)
  }
}

main()
