/**
 * Type Generator Module
 * Auto-generate TypeScript types from database schema
 */

import { SupabaseClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

interface TypeMapping {
  [key: string]: string
}

const PG_TO_TS_TYPES: TypeMapping = {
  'uuid': 'string',
  'varchar': 'string',
  'text': 'string',
  'integer': 'number',
  'bigint': 'number',
  'numeric': 'number',
  'boolean': 'boolean',
  'timestamp': 'string',
  'timestamptz': 'string',
  'date': 'string',
  'jsonb': 'any',
  'json': 'any',
  'unknown': 'any'
}

export async function generateTypes(
  supabase: SupabaseClient,
  tables: string[],
  outputPath: string
): Promise<void> {
  console.log('\n📝 GENERATING TYPESCRIPT TYPES\n')
  
  let output = `/**
 * Auto-generated TypeScript types from Supabase schema
 * Generated: ${new Date().toISOString()}
 * 
 * DO NOT EDIT MANUALLY - Changes will be overwritten
 * Run: npm run supabase:admin generate-types
 */

`
  
  for (const table of tables) {
    console.log(`📊 Generating types for: ${table}`)
    
    const typeDefinition = await generateTableType(supabase, table)
    output += typeDefinition + '\n\n'
  }
  
  // Add Database type
  output += generateDatabaseType(tables)
  
  // Write to file
  fs.writeFileSync(outputPath, output, 'utf-8')
  
  console.log(`\n✅ Types written to: ${outputPath}`)
  console.log(`   ${tables.length} tables processed`)
}

async function generateTableType(
  supabase: SupabaseClient,
  tableName: string
): Promise<string> {
  // Get sample to inspect structure
  const { data } = await supabase
    .from(tableName)
    .select('*')
    .limit(1)
  
  if (!data || data.length === 0) {
    return `export interface ${toPascalCase(tableName)} {
  // No data available to generate types
}`
  }
  
  const sample = data[0]
  const typeName = toPascalCase(tableName)
  
  let typeStr = `export interface ${typeName} {\n`
  
  for (const [key, value] of Object.entries(sample)) {
    const tsType = inferTSType(value)
    const nullable = value === null ? ' | null' : ''
    typeStr += `  ${key}: ${tsType}${nullable}\n`
  }
  
  typeStr += '}'
  
  return typeStr
}

function inferTSType(value: any): string {
  if (value === null) return 'any'
  
  const jsType = typeof value
  
  if (jsType === 'string') {
    // Check for UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return 'string'
    }
    // Check for timestamp
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return 'string' // Could also be Date
    }
    return 'string'
  }
  
  if (jsType === 'number') return 'number'
  if (jsType === 'boolean') return 'boolean'
  if (jsType === 'object') return 'any' // Could be more specific
  
  return 'any'
}

function generateDatabaseType(tables: string[]): string {
  let dbType = `export interface Database {\n`
  dbType += `  public: {\n`
  dbType += `    Tables: {\n`
  
  for (const table of tables) {
    const typeName = toPascalCase(table)
    dbType += `      ${table}: {\n`
    dbType += `        Row: ${typeName}\n`
    dbType += `        Insert: Partial<${typeName}>\n`
    dbType += `        Update: Partial<${typeName}>\n`
    dbType += `      }\n`
  }
  
  dbType += `    }\n`
  dbType += `  }\n`
  dbType += `}`
  
  return dbType
}

function toPascalCase(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}
