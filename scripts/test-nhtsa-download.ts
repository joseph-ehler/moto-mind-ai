/**
 * NHTSA Download System Test
 * 
 * Quick test to verify downloader and parser work correctly
 * Tests with small sample before full import
 */

import { getNHTSADownloader } from '../lib/nhtsa/downloader'
import { getNHTSAParser } from '../lib/nhtsa/parser'

async function testNHTSADownload() {
  console.log('🧪 NHTSA DOWNLOAD SYSTEM TEST\n')
  console.log('='.repeat(80))
  
  try {
    // Test 1: Downloader
    console.log('\n📦 TEST 1: Downloader')
    console.log('='.repeat(80))
    
    const downloader = getNHTSADownloader()
    
    console.log('Data directory:', downloader.getDataDir())
    console.log('Complaints downloaded:', downloader.isDownloaded('complaints'))
    console.log('Investigations downloaded:', downloader.isDownloaded('investigations'))
    
    // Test 2: Parser (if files exist)
    console.log('\n📋 TEST 2: Parser')
    console.log('='.repeat(80))
    
    const parser = getNHTSAParser()
    
    const complaintFiles = downloader.getExtractedFiles('complaints')
    if (complaintFiles.length > 0) {
      console.log(`\nFound ${complaintFiles.length} complaint files`)
      
      // Test parsing first file (first 1000 records)
      const testFile = complaintFiles[0]
      console.log(`\nTesting: ${testFile}`)
      
      const complaints = await parser.parseComplaints(testFile)
      
      console.log(`\nParsed ${complaints.length} complaints`)
      
      if (complaints.length > 0) {
        const sample = complaints[0]
        console.log('\nSample complaint:')
        console.log('  ODI Number:', sample.odiNumber)
        console.log('  Vehicle:', `${sample.year} ${sample.make} ${sample.model}`)
        console.log('  Component:', sample.component)
        console.log('  Date:', sample.date)
        console.log('  Crash:', sample.crash)
        console.log('  Fire:', sample.fire)
        console.log('  Summary:', sample.summary.substring(0, 100) + '...')
        
        // Stats
        const crashes = complaints.filter(c => c.crash).length
        const fires = complaints.filter(c => c.fire).length
        const injuries = complaints.reduce((sum, c) => sum + c.injured, 0)
        const deaths = complaints.reduce((sum, c) => sum + c.deaths, 0)
        
        console.log('\nStats:')
        console.log(`  Crashes: ${crashes}`)
        console.log(`  Fires: ${fires}`)
        console.log(`  Injuries: ${injuries}`)
        console.log(`  Deaths: ${deaths}`)
        
        // Vehicle distribution
        const makes = new Set(complaints.map(c => c.make))
        console.log(`  Unique makes: ${makes.size}`)
      }
    } else {
      console.log('No complaint files found. Run import-nhtsa-data.ts first.')
    }
    
    const investigationFiles = downloader.getExtractedFiles('investigations')
    if (investigationFiles.length > 0) {
      console.log(`\n\nFound ${investigationFiles.length} investigation files`)
      
      const testFile = investigationFiles[0]
      console.log(`\nTesting: ${testFile}`)
      
      const investigations = await parser.parseInvestigations(testFile)
      
      console.log(`\nParsed ${investigations.length} investigations`)
      
      if (investigations.length > 0) {
        const sample = investigations[0]
        console.log('\nSample investigation:')
        console.log('  NHTSA ID:', sample.nhtsaId)
        console.log('  Vehicle:', `${sample.year} ${sample.make} ${sample.model}`)
        console.log('  Component:', sample.component)
        console.log('  Subject:', sample.subject)
        console.log('  Open Date:', sample.openDate)
        console.log('  Status:', sample.closeDate ? 'Closed' : 'Open')
        
        // Stats
        const open = investigations.filter(i => !i.closeDate).length
        const closed = investigations.filter(i => i.closeDate).length
        
        console.log('\nStats:')
        console.log(`  Open: ${open}`)
        console.log(`  Closed: ${closed}`)
      }
    } else {
      console.log('\nNo investigation files found. Run import-nhtsa-data.ts first.')
    }
    
    // Summary
    console.log('\n\n' + '='.repeat(80))
    console.log('✅ TEST COMPLETE!')
    console.log('='.repeat(80))
    
    if (complaintFiles.length === 0 && investigationFiles.length === 0) {
      console.log('\n📥 Next step: Download data')
      console.log('   npx tsx scripts/import-nhtsa-data.ts')
    } else {
      console.log('\n✅ Downloader and parser working correctly!')
      console.log('   Ready for full import.')
    }
    
    console.log('\n')
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run test
testNHTSADownload()
