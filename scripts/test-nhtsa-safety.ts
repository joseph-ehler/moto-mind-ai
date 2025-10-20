/**
 * NHTSA Vehicle Safety Test - REAL APIs
 * Tests: Complaints, Recalls, Safety Ratings (5-Star)
 */

import { getVehicleSafety } from '../lib/nhtsa/vehicle-safety'

async function testNHTSASafety() {
  console.log('🛡️  NHTSA VEHICLE SAFETY TEST (REAL APIs)\n')
  console.log('='.repeat(80))
  console.log('Testing: Complaints + Recalls + Safety Ratings')
  console.log('='.repeat(80))
  
  // Test: 2021 Chevrolet Silverado
  console.log('\n📊 Vehicle: 2021 Chevrolet Silverado')
  console.log('='.repeat(80))
  
  const result = await getVehicleSafety({
    year: 2021,
    make: 'Chevrolet',
    model: 'Silverado'
  })
  
  // Safety Score & Risk Level
  console.log('\n🎯 OVERALL SAFETY ASSESSMENT:')
  console.log(`Safety Score: ${result.safetyScore}/100`)
  console.log(`Risk Level: ${result.overallRiskLevel.toUpperCase()}`)
  
  // Complaints
  console.log('\n📋 COMPLAINTS SUMMARY:')
  console.log(`Total Complaints: ${result.complaints.totalComplaints}`)
  console.log(`Crashes: ${result.complaints.crashCount}`)
  console.log(`Fires: ${result.complaints.fireCount}`)
  console.log(`Injuries: ${result.complaints.injuries}`)
  console.log(`Deaths: ${result.complaints.deaths}`)
  
  if (result.complaints.topComponents.length > 0) {
    console.log('\nTop Problem Areas:')
    result.complaints.topComponents.forEach((comp, i) => {
      console.log(`  ${i + 1}. ${comp.component}: ${comp.count} complaints`)
    })
  }
  
  if (result.complaints.commonIssues.length > 0) {
    console.log('\nCommon Issues:')
    result.complaints.commonIssues.slice(0, 5).forEach((issue, i) => {
      const severityIcon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢'
      console.log(`  ${severityIcon} ${issue.issue}: ${issue.count} reports`)
    })
  }
  
  // Recalls
  console.log('\n🚨 RECALLS:')
  console.log(`Total Recalls: ${result.recalls.totalRecalls}`)
  console.log(`Open Recalls: ${result.recalls.openRecalls}`)
  
  if (result.recalls.recent.length > 0) {
    console.log(`\nRecent Recalls: ${result.recalls.recent.length}`)
    result.recalls.recent.slice(0, 3).forEach((recall, i) => {
      console.log(`\n  ${i + 1}. ${recall.component}`)
      console.log(`     ID: ${recall.nhtsaId}`)
      console.log(`     Subject: ${recall.subject.substring(0, 80)}...`)
      console.log(`     Date: ${recall.reportReceivedDate}`)
    })
  }
  
  if (result.recalls.byComponent.length > 0) {
    console.log('\nRecalls by Component:')
    result.recalls.byComponent.forEach((comp, i) => {
      console.log(`  ${i + 1}. ${comp.component}: ${comp.count} recalls`)
    })
  }
  
  // Safety Ratings
  console.log('\n⭐ SAFETY RATINGS (5-Star NCAP):')
  if (result.safetyRatings.hasRatings) {
    console.log(`Overall Rating: ${'★'.repeat(result.safetyRatings.overallRating)}${'☆'.repeat(5 - result.safetyRatings.overallRating)} (${result.safetyRatings.overallRating}/5)`)
    
    result.safetyRatings.ratings.forEach((rating, i) => {
      console.log(`\n  Vehicle ${i + 1}: ${rating.vehicleDescription}`)
      console.log(`     Overall: ${rating.overallRating}/5 stars`)
      if (rating.overallFrontCrashRating > 0) {
        console.log(`     Front Crash: ${rating.overallFrontCrashRating}/5 stars`)
      }
      if (rating.overallSideCrashRating > 0) {
        console.log(`     Side Crash: ${rating.overallSideCrashRating}/5 stars`)
      }
      if (rating.rolloverRating > 0) {
        console.log(`     Rollover: ${rating.rolloverRating}/5 stars`)
      }
    })
  } else {
    console.log('No NCAP safety ratings available for this vehicle')
  }
  
  // Link-outs for unavailable data
  console.log('\n🔗 ADDITIONAL RESOURCES:')
  console.log(`TSBs (Technical Service Bulletins): ${result.linkOuts.tsbs}`)
  console.log(`Investigations: ${result.linkOuts.investigations}`)
  
  // Key Issues
  if (result.keyIssues.length > 0) {
    console.log('\n⚠️  KEY SAFETY ISSUES:')
    result.keyIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`)
    })
  }
  
  // Recommendations
  if (result.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:')
    result.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`)
    })
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('🛡️  NHTSA SAFETY TEST COMPLETE!')
  console.log('='.repeat(80))
}

testNHTSASafety().catch(console.error)
