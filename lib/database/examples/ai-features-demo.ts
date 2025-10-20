/**
 * AI Features Demo
 * 
 * Demonstrates all Phase 2 AI capabilities:
 * - Natural language queries
 * - Query explanation
 * - Index recommendations
 * - Schema context generation
 */

import { initDatabase } from '../core'

async function main() {
  console.log('🚀 God-Tier Database Toolkit - AI Features Demo\n')
  
  const db = await initDatabase()
  
  try {
    // =========================================================================
    // 1. NATURAL LANGUAGE QUERIES
    // =========================================================================
    
    console.log('1️⃣  Natural Language Queries\n')
    console.log('─'.repeat(60))
    
    // Example 1: Simple query
    console.log('\n📝 Query: "Show me vehicles from last week"\n')
    
    const result1 = await db.ask('Show me vehicles from last week')
    
    console.log('Generated SQL:')
    console.log(result1.nlQuery.generatedSql)
    console.log(`\nConfidence: ${(result1.nlQuery.confidence * 100).toFixed(0)}%`)
    console.log(`Results: ${result1.rowCount} rows in ${result1.duration}ms`)
    
    // Example 2: Aggregation
    console.log('\n📝 Query: "How many trips in December?"\n')
    
    const result2 = await db.ask('How many trips in December?')
    
    console.log('Generated SQL:')
    console.log(result2.nlQuery.generatedSql)
    console.log(`\nResults: ${JSON.stringify(result2.rows[0], null, 2)}`)
    
    // Example 3: Dry run
    console.log('\n📝 Query (dry run): "Delete old trips"\n')
    
    const result3 = await db.ask('Delete old trips', { dryRun: true })
    
    console.log('Generated SQL (NOT EXECUTED):')
    console.log(result3.nlQuery.generatedSql)
    
    if (result3.nlQuery.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      result3.nlQuery.warnings.forEach(w => console.log(`   ${w}`))
    }
    
    // =========================================================================
    // 2. QUERY EXPLANATION
    // =========================================================================
    
    console.log('\n\n2️⃣  Query Explanation\n')
    console.log('─'.repeat(60))
    
    const sql = `
      SELECT v.*, COUNT(t.id) as trip_count
      FROM vehicles v
      LEFT JOIN trips t ON t.vehicle_id = v.id
      GROUP BY v.id
      HAVING COUNT(t.id) > 10
      LIMIT 100
    `
    
    console.log('\n📊 Analyzing query...\n')
    
    const explanation = await db.explain(sql)
    
    console.log('Summary:')
    console.log(explanation.summary)
    
    console.log('\n🔍 Execution Steps:')
    explanation.steps.forEach((step, i) => {
      console.log(`\n  ${i + 1}. ${step.operation}`)
      console.log(`     ${step.description}`)
      console.log(`     Cost: ${step.cost.toFixed(2)}, Rows: ${step.rows}`)
    })
    
    console.log('\n📈 Performance:')
    console.log(`   Rating: ${explanation.performance.rating.toUpperCase()}`)
    console.log(`   Total Cost: ${explanation.performance.totalCost.toFixed(2)}`)
    console.log(`   Indexes Used: ${explanation.performance.indexUsage.length || 'None'}`)
    
    if (explanation.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      explanation.recommendations.forEach(rec => {
        console.log(`   ${rec}`)
      })
    }
    
    // =========================================================================
    // 3. INDEX RECOMMENDATIONS
    // =========================================================================
    
    console.log('\n\n3️⃣  Index Recommendations\n')
    console.log('─'.repeat(60))
    
    console.log('\n🔍 Analyzing slow queries (threshold: 100ms)...\n')
    
    const indexAnalysis = await db.recommendIndexes(100)
    
    console.log(`Found ${indexAnalysis.slowQueries.length} slow queries`)
    
    if (indexAnalysis.slowQueries.length > 0) {
      console.log('\n📉 Top Slow Queries:')
      indexAnalysis.slowQueries.slice(0, 3).forEach((q, i) => {
        console.log(`\n  ${i + 1}. ${q.fingerprint}`)
        console.log(`     Avg Duration: ${q.avgDuration.toFixed(2)}ms`)
        console.log(`     Calls: ${q.calls}`)
        console.log(`     Total Duration: ${q.totalDuration.toFixed(2)}ms`)
      })
    }
    
    if (indexAnalysis.recommendations.length === 0) {
      console.log('\n✅ No missing indexes detected! Database is well-optimized.')
    } else {
      console.log(`\n🎯 Index Recommendations (${indexAnalysis.recommendations.length}):\n`)
      
      indexAnalysis.recommendations.forEach((rec, i) => {
        const priorityEmoji = rec.priority === 'high' ? '🔴' : 
                             rec.priority === 'medium' ? '🟡' : '⚪'
        
        console.log(`${i + 1}. ${priorityEmoji} ${rec.priority.toUpperCase()} - ${rec.table}`)
        console.log(`   Columns: ${rec.columns.join(', ')}`)
        console.log(`   ${rec.reason}`)
        console.log(`   Impact: ${rec.impact}`)
        console.log(`   Estimated Improvement: ~${rec.estimatedImprovementMs}ms`)
        console.log(`   SQL: ${rec.sql}`)
        console.log('')
      })
    }
    
    // =========================================================================
    // 4. SCHEMA CONTEXT
    // =========================================================================
    
    console.log('\n4️⃣  Schema Context\n')
    console.log('─'.repeat(60))
    
    console.log('\n📚 Generating schema context...\n')
    
    const context = await db.getSchemaContext()
    
    console.log(`Database: ${context.database}`)
    console.log(`Total Tables: ${context.tables.length}`)
    console.log(`Total Relationships: ${context.relationships.length}`)
    
    console.log('\n📊 Table Overview:')
    context.tables.slice(0, 5).forEach(table => {
      console.log(`\n  • ${table.name}`)
      console.log(`    Columns: ${table.columns.length}`)
      console.log(`    Indexes: ${table.indexes.length}`)
      console.log(`    Foreign Keys: ${table.foreignKeys.length}`)
      console.log(`    Row Count: ${table.rowCount || 'N/A'}`)
      console.log(`    Size: ${table.sizeBytes ? `${(table.sizeBytes / 1024).toFixed(2)} KB` : 'N/A'}`)
    })
    
    if (context.tables.length > 5) {
      console.log(`\n  ... and ${context.tables.length - 5} more tables`)
    }
    
    console.log('\n🔗 Relationships:')
    context.relationships.slice(0, 5).forEach(rel => {
      console.log(`\n  • ${rel.from} → ${rel.to}`)
      console.log(`    Type: ${rel.type}`)
      console.log(`    Via: ${rel.via.join(', ')}`)
    })
    
    if (context.relationships.length > 5) {
      console.log(`\n  ... and ${context.relationships.length - 5} more relationships`)
    }
    
    // =========================================================================
    // 5. SCHEMA EXPORT
    // =========================================================================
    
    console.log('\n\n5️⃣  Schema Export\n')
    console.log('─'.repeat(60))
    
    console.log('\n📄 Generating markdown documentation...\n')
    
    const markdown = await db.exportSchema()
    
    console.log(`Generated ${markdown.length} characters of documentation`)
    console.log('\nPreview (first 500 chars):')
    console.log('─'.repeat(60))
    console.log(markdown.substring(0, 500) + '...')
    console.log('─'.repeat(60))
    
    console.log('\n💾 To save to file:')
    console.log('   await db.exportSchema("docs/schema.md")')
    
    // =========================================================================
    // SUMMARY
    // =========================================================================
    
    console.log('\n\n✅ Demo Complete!\n')
    console.log('─'.repeat(60))
    console.log('\nAll AI features are working:')
    console.log('  ✅ Natural Language Queries')
    console.log('  ✅ Query Explanation')
    console.log('  ✅ Index Recommendations')
    console.log('  ✅ Schema Context Generation')
    console.log('  ✅ Schema Export')
    console.log('\nNext Steps:')
    console.log('  • Try: npm run db ask "your question"')
    console.log('  • Try: npm run db explain "your SQL"')
    console.log('  • Try: npm run db indexes')
    console.log('  • Try: npm run db schema:export')
    console.log('\n🔥 God-Tier Database Toolkit is ready!\n')
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    throw error
  } finally {
    await db.shutdown()
  }
}

// Run demo
if (require.main === module) {
  main().catch(console.error)
}

export default main
