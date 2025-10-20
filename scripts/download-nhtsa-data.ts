/**
 * NHTSA Data Download Script (Download Only)
 * 
 * Downloads NHTSA data files WITHOUT database import
 * Use this to get the data files first, then import separately
 */

import { getNHTSADownloader } from '../lib/nhtsa/downloader'
import { getNHTSAParser } from '../lib/nhtsa/parser'

async function downloadNHTSAData() {
  console.log('📥 NHTSA DATA DOWNLOAD STARTING\n')
  console.log('='.repeat(80))
  
  try {
    // Step 1: Download files
    console.log('\n📦 Downloading NHTSA data files...')
    const downloader = getNHTSADownloader()
    await downloader.downloadAll()
    
    // Step 2: Verify downloads
    console.log('\n✅ Verifying downloads...')
    const complaintFiles = downloader.getExtractedFiles('complaints')
    const investigationFiles = downloader.getExtractedFiles('investigations')
    
    console.log(`\n📋 Complaint files: ${complaintFiles.length}`)
    complaintFiles.forEach(f => console.log(`   - ${f}`))
    
    console.log(`\n🔍 Investigation files: ${investigationFiles.length}`)
    investigationFiles.forEach(f => console.log(`   - ${f}`))
    
    // Step 3: Test parsing (first 10,000 records as sample)
    if (complaintFiles.length > 0) {
      console.log('\n📊 Testing complaint parser (first 10k records)...')
      const parser = getNHTSAParser()
      const testFile = complaintFiles[0]
      const complaints = await parser.parseComplaints(testFile, 10000)
      
      console.log(`✅ Parsed ${complaints.length} complaints successfully`)
      
      if (complaints.length > 0) {
        const sample = complaints[0]
        console.log('\nSample complaint:')
        console.log(`  Vehicle: ${sample.year} ${sample.make} ${sample.model}`)
        console.log(`  Component: ${sample.component}`)
        console.log(`  Date: ${sample.date}`)
        console.log(`  Crash: ${sample.crash}, Fire: ${sample.fire}`)
      }
    }
    
    if (investigationFiles.length > 0) {
      console.log('\n📊 Testing investigation parser...')
      const parser = getNHTSAParser()
      const testFile = investigationFiles[0]
      const investigations = await parser.parseInvestigations(testFile)
      
      console.log(`✅ Parsed ${investigations.length} investigations successfully`)
      
      if (investigations.length > 0) {
        const sample = investigations[0]
        console.log('\nSample investigation:')
        console.log(`  Vehicle: ${sample.year} ${sample.make} ${sample.model}`)
        console.log(`  Component: ${sample.component}`)
        console.log(`  Subject: ${sample.subject}`)
        console.log(`  Status: ${sample.closeDate ? 'Closed' : 'Open'}`)
      }
    }
    
    // Summary
    console.log('\n\n' + '='.repeat(80))
    console.log('✅ DOWNLOAD COMPLETE!')
    console.log('='.repeat(80))
    console.log('\n📁 Data location: ./data/nhtsa/')
    console.log('\n📝 Next steps:')
    console.log('   1. Apply database migration (create tables)')
    console.log('   2. Run: npx tsx scripts/import-nhtsa-data.ts --skip-download')
    console.log('\n')
    
  } catch (error: any) {
    console.error('\n❌ Download failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run download
downloadNHTSAData()
