/**
 * Relationship Mapper Module
 * Visual schema relationships and foreign keys
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface Relationship {
  from: string
  to: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  foreignKey: string
  references: string
}

export async function mapRelationships(
  supabase: SupabaseClient,
  tables: string[]
): Promise<Relationship[]> {
  console.log('\n🔗 MAPPING TABLE RELATIONSHIPS\n')
  
  const relationships: Relationship[] = []
  
  for (const table of tables) {
    // Get sample to detect foreign keys
    const { data } = await supabase
      .from(table)
      .select('*')
      .limit(1)
    
    if (!data || data.length === 0) continue
    
    const sample = data[0]
    
    // Detect foreign keys (columns ending in _id)
    for (const [key, value] of Object.entries(sample)) {
      if (key.endsWith('_id') && key !== 'id') {
        const referencedTable = key.replace('_id', '') + 's' // Simple pluralization
        
        // Check if referenced table exists
        if (tables.includes(referencedTable) || tables.includes(key.replace('_id', ''))) {
          relationships.push({
            from: table,
            to: referencedTable.endsWith('s') ? referencedTable : key.replace('_id', ''),
            type: 'one-to-many', // Default assumption
            foreignKey: key,
            references: 'id'
          })
        }
      }
    }
  }
  
  return relationships
}

export function printRelationshipMap(relationships: Relationship[]): void {
  console.log('\n═'.repeat(70))
  console.log('🔗 DATABASE RELATIONSHIP MAP')
  console.log('═'.repeat(70) + '\n')
  
  if (relationships.length === 0) {
    console.log('No relationships detected.\n')
    return
  }
  
  // Group by source table
  const grouped: { [key: string]: Relationship[] } = {}
  
  for (const rel of relationships) {
    if (!grouped[rel.from]) {
      grouped[rel.from] = []
    }
    grouped[rel.from].push(rel)
  }
  
  // Print ASCII art relationships
  for (const [table, rels] of Object.entries(grouped)) {
    console.log(`📊 ${table}`)
    
    for (const rel of rels) {
      const arrow = rel.type === 'one-to-many' ? '→' : '↔'
      console.log(`   ${arrow} ${rel.to}`)
      console.log(`      via ${rel.foreignKey} → ${rel.references}`)
    }
    
    console.log()
  }
  
  console.log('═'.repeat(70) + '\n')
}

export function generateMermaidDiagram(relationships: Relationship[]): string {
  let diagram = '```mermaid\nerDiagram\n'
  
  for (const rel of relationships) {
    const cardinality = rel.type === 'one-to-many' ? '||--o{' : '||--||'
    diagram += `  ${rel.from.toUpperCase()} ${cardinality} ${rel.to.toUpperCase()} : "${rel.foreignKey}"\n`
  }
  
  diagram += '```'
  
  return diagram
}
