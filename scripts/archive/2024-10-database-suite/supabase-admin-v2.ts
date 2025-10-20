#!/usr/bin/env tsx
/**
 * GOD-TIER SUPABASE ADMIN TOOL V2
 * 
 * Comprehensive database management for AI development
 * 
 * Features:
 * - Full schema introspection with JSON output
 * - Security audit & RLS validation
 * - TypeScript type generation
 * - Relationship mapping
 * - Migration generation
 * - Policy simulation
 * - Cross-tenant testing
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Import modules
import { getFullTableSchema, formatSchemaAsJSON, formatSchemaAsTable } from './supabase-admin/schema-introspection'
import { runSecurityAudit, printSecurityReport } from './supabase-admin/security-audit'
import { generateTypes } from './supabase-admin/type-generator'
import { mapRelationships, printRelationshipMap, generateMermaidDiagram } from './supabase-admin/relationship-mapper'
import { generateMigration, saveMigration } from './supabase-admin/migration-generator'
import { simulatePolicy, testCrossTenantIsolation } from './supabase-admin/policy-simulator'
import { validateDataIntegrity, printIntegrityReport, autoFixIssues } from './supabase-admin/data-integrity'
import { analyzePerformance, printPerformanceReport, generateOptimizationSQL } from './supabase-admin/performance-analyzer'
import { generateTestData, previewTestData } from './supabase-admin/test-data-generator'

// Load environment
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const TABLES = [
  'vehicles',
  'vehicle_events',
  'vehicle_images',
  'photo_metadata',
  'tenants',
  'user_tenants',
  'conversation_messages'
]

async function main() {
  const command = process.argv[2]
  const args = process.argv.slice(3)
  
  console.log('\n🔥 SUPABASE ADMIN TOOL V2 - GOD-TIER EDITION\n')
  
  // Test connection
  const { error } = await supabase.from('tenants').select('count').limit(1)
  if (error) {
    console.error('❌ Connection failed:', error.message)
    process.exit(1)
  }
  console.log('✅ Connected to Supabase\n')
  
  switch (command) {
    // SCHEMA INTROSPECTION
    case 'schema': {
      const table = args[0]
      const jsonOutput = args.includes('--json')
      
      if (!table) {
        console.error('Usage: npm run supabase:admin schema <table> [--json]')
        process.exit(1)
      }
      
      const schema = await getFullTableSchema(supabase, table)
      
      if (jsonOutput) {
        console.log(formatSchemaAsJSON(schema))
      } else {
        formatSchemaAsTable(schema)
      }
      break
    }
    
    // SECURITY AUDIT
    case 'audit':
    case 'security': {
      const report = await runSecurityAudit(supabase)
      printSecurityReport(report)
      
      // Exit with error code if score is low
      if (report.score < 70) {
        process.exit(1)
      }
      break
    }
    
    // DATA INTEGRITY VALIDATION
    case 'validate-integrity':
    case 'integrity': {
      const report = await validateDataIntegrity(supabase, TABLES)
      printIntegrityReport(report)
      
      if (args.includes('--auto-fix')) {
        const result = await autoFixIssues(supabase, report.issues)
        console.log(`\n✅ Auto-fix complete: ${result.fixed} fixed, ${result.failed} failed`)
      }
      
      if (report.score < 70) {
        process.exit(1)
      }
      break
    }
    
    // PERFORMANCE ANALYSIS
    case 'performance':
    case 'analyze-performance': {
      const report = await analyzePerformance(supabase, TABLES)
      printPerformanceReport(report)
      
      if (args.includes('--generate-sql')) {
        generateOptimizationSQL(report.issues)
      }
      
      if (report.score < 70) {
        process.exit(1)
      }
      break
    }
    
    // GENERATE TYPES
    case 'generate-types':
    case 'types': {
      const outputPath = args[0] || path.join(__dirname, '../types/database.ts')
      await generateTypes(supabase, TABLES, outputPath)
      break
    }
    
    // MAP RELATIONSHIPS
    case 'relationships':
    case 'map': {
      const relationships = await mapRelationships(supabase, TABLES)
      printRelationshipMap(relationships)
      
      if (args.includes('--mermaid')) {
        console.log('\n📊 MERMAID DIAGRAM:\n')
        console.log(generateMermaidDiagram(relationships))
      }
      break
    }
    
    // SIMULATE POLICY
    case 'test-policy':
    case 'simulate': {
      const table = args[0]
      const tenantArg = args.find(a => a.startsWith('--tenant='))
      const userArg = args.find(a => a.startsWith('--user='))
      
      if (!table || !tenantArg) {
        console.error('Usage: npm run supabase:admin test-policy <table> --tenant=<id> [--user=<id>]')
        process.exit(1)
      }
      
      const tenantId = tenantArg.split('=')[1]
      const userId = userArg?.split('=')[1] || 'test@example.com'
      
      await simulatePolicy(supabase, table, tenantId, userId)
      break
    }
    
    // TEST CROSS-TENANT ISOLATION
    case 'test-isolation': {
      const table = args[0]
      const tenant1Arg = args.find(a => a.startsWith('--tenant1='))
      const tenant2Arg = args.find(a => a.startsWith('--tenant2='))
      
      if (!table || !tenant1Arg || !tenant2Arg) {
        console.error('Usage: npm run supabase:admin test-isolation <table> --tenant1=<id> --tenant2=<id>')
        process.exit(1)
      }
      
      const tenant1 = tenant1Arg.split('=')[1]
      const tenant2 = tenant2Arg.split('=')[1]
      
      const result = await testCrossTenantIsolation(supabase, table, tenant1, tenant2)
      
      if (!result.isolated) {
        console.error('\n❌ CRITICAL: Cross-tenant isolation failed!')
        process.exit(1)
      }
      break
    }
    
    // GENERATE MIGRATION
    case 'generate-migration': {
      // Example: --add-column vehicles:fuel_type:varchar --secure
      const addColumnArgs = args.filter(a => a.startsWith('--add-column='))
      const secure = args.includes('--secure')
      
      if (addColumnArgs.length === 0) {
        console.error('Usage: npm run supabase:admin generate-migration --add-column=<table>:<column>:<type> [--secure]')
        console.error('Example: --add-column=vehicles:fuel_type:varchar --secure')
        process.exit(1)
      }
      
      const commands = addColumnArgs.map(arg => {
        const [table, column, type] = arg.split('=')[1].split(':')
        return {
          action: 'add-column' as const,
          table,
          column,
          type
        }
      })
      
      const { up, down } = generateMigration(commands, secure)
      
      console.log('\n📝 MIGRATION PREVIEW:\n')
      console.log('=== UP ===')
      console.log(up)
      console.log('\n=== DOWN ===')
      console.log(down)
      
      if (args.includes('--save')) {
        saveMigration(up, down, path.join(__dirname, '../supabase/migrations'))
      } else {
        console.log('\n💡 Add --save to write migration files')
      }
      break
    }
    
    // LIST ALL TENANTS
    case 'tenants': {
      const { data } = await supabase
        .from('tenants')
        .select('id, name, is_active, created_at')
        .order('created_at', { ascending: false })
      
      console.log('👥 TENANTS:\n')
      data?.forEach(tenant => {
        console.log(`${tenant.is_active ? '✅' : '❌'} ${tenant.name}`)
        console.log(`   ID: ${tenant.id}`)
        console.log(`   Created: ${tenant.created_at}`)
        console.log()
      })
      break
    }
    
    // SEED TEST DATA
    case 'seed': {
      const table = args[0]
      const countArg = args.find(a => a.startsWith('--count='))
      const tenantArg = args.find(a => a.startsWith('--tenant='))
      const preview = args.includes('--preview')
      
      if (!table) {
        console.error('Usage: npm run supabase:admin seed <table> --count=<n> --tenant=<id> [--preview]')
        process.exit(1)
      }
      
      if (preview) {
        previewTestData(table, 5)
        break
      }
      
      if (!tenantArg) {
        console.error('Error: --tenant=<id> is required')
        process.exit(1)
      }
      
      const count = countArg ? parseInt(countArg.split('=')[1]) : 10
      const tenantId = tenantArg.split('=')[1]
      
      const result = await generateTestData(supabase, {
        table,
        count,
        tenantId,
        realistic: true
      })
      
      if (result.failed > 0) {
        console.error(`\n⚠️  ${result.failed} records failed to insert`)
        process.exit(1)
      }
      
      break
    }
    
    // COMPREHENSIVE ANALYSIS
    case 'analyze':
    case 'full': {
      console.log('🔍 RUNNING COMPREHENSIVE ANALYSIS\n')
      
      // 1. Security audit
      console.log('\n1️⃣ SECURITY AUDIT')
      const report = await runSecurityAudit(supabase)
      printSecurityReport(report)
      
      // 2. Relationships
      console.log('\n2️⃣ RELATIONSHIPS')
      const relationships = await mapRelationships(supabase, TABLES)
      printRelationshipMap(relationships)
      
      // 3. Schema for each table
      console.log('\n3️⃣ TABLE SCHEMAS')
      for (const table of TABLES.slice(0, 3)) { // First 3 only to avoid spam
        const schema = await getFullTableSchema(supabase, table)
        formatSchemaAsTable(schema)
      }
      
      break
    }
    
    default:
      console.log('📚 GOD-TIER SUPABASE ADMIN COMMANDS:\n')
      console.log('Schema & Introspection:')
      console.log('  schema <table> [--json]         - Full table schema with columns, indexes, policies')
      console.log('  relationships [--mermaid]       - Map all table relationships')
      console.log('  types [output-path]             - Generate TypeScript types')
      console.log()
      console.log('Security & Testing:')
      console.log('  audit                           - Comprehensive security audit')
      console.log('  test-policy <table> --tenant=<id>       - Simulate RLS policy')
      console.log('  test-isolation <table> --tenant1=<id> --tenant2=<id>  - Test cross-tenant isolation')
      console.log()
      console.log('Data Quality & Performance:')
      console.log('  integrity [--auto-fix]          - Validate data integrity, find orphaned records')
      console.log('  performance [--generate-sql]    - Analyze performance, find slow queries')
      console.log()
      console.log('Migration & Development:')
      console.log('  generate-migration --add-column=<table>:<column>:<type> [--secure] [--save]')
      console.log('  seed <table> --count=<n> --tenant=<id> [--preview]  - Generate realistic test data')
      console.log('  tenants                         - List all tenants')
      console.log()
      console.log('Analysis:')
      console.log('  analyze                         - Run full analysis (security + schema + relationships)')
      console.log()
      console.log('Examples:')
      console.log('  npm run supabase:admin schema vehicles --json')
      console.log('  npm run supabase:admin audit')
      console.log('  npm run supabase:admin integrity')
      console.log('  npm run supabase:admin performance --generate-sql')
      console.log('  npm run supabase:admin test-policy vehicles --tenant=b9281da3-16c4-4370-83ad-4672cf928065')
      console.log('  npm run supabase:admin generate-migration --add-column=vehicles:fuel_type:varchar --secure --save')
      console.log('  npm run supabase:admin analyze')
      console.log()
  }
}

main().catch(console.error)
