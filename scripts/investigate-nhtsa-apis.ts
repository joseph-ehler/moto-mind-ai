/**
 * NHTSA API Investigation Script
 * 
 * Systematically tests different endpoints and formats to find working APIs
 */

async function investigateNHTSA() {
  console.log('🔍 NHTSA API INVESTIGATION\n')
  console.log('='.repeat(80))
  
  // Test 1: SODA API with different query formats
  console.log('\n📊 TEST 1: SODA API Query Formats')
  console.log('='.repeat(80))
  
  const sodaTests = [
    {
      name: 'Simple params',
      url: 'https://data.transportation.gov/resource/8qbs-9p4c.json?maketxt=CHEVROLET&modeltxt=SILVERADO&yeartxt=2021&$limit=5'
    },
    {
      name: 'SoQL WHERE clause',
      url: "https://data.transportation.gov/resource/8qbs-9p4c.json?$where=maketxt='CHEVROLET' AND modeltxt='SILVERADO' AND yeartxt='2021'&$limit=5"
    },
    {
      name: 'Case insensitive',
      url: "https://data.transportation.gov/resource/8qbs-9p4c.json?$where=upper(maketxt)='CHEVROLET'&$limit=5"
    },
    {
      name: 'Just limit (test access)',
      url: 'https://data.transportation.gov/resource/8qbs-9p4c.json?$limit=2'
    }
  ]
  
  for (const test of sodaTests) {
    try {
      console.log(`\nTesting: ${test.name}`)
      const response = await fetch(test.url)
      const data = await response.json()
      
      if (response.ok && Array.isArray(data)) {
        console.log(`✅ SUCCESS! Status: ${response.status}, Records: ${data.length}`)
        if (data.length > 0) {
          console.log(`   Sample fields:`, Object.keys(data[0]).slice(0, 10).join(', '))
        }
      } else {
        console.log(`❌ Failed: Status ${response.status}`)
        console.log(`   Response:`, JSON.stringify(data).substring(0, 200))
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`)
    }
  }
  
  // Test 2: Get dataset metadata
  console.log('\n\n📋 TEST 2: Dataset Metadata')
  console.log('='.repeat(80))
  
  try {
    const response = await fetch('https://data.transportation.gov/api/views/8qbs-9p4c.json')
    const metadata = await response.json()
    
    console.log('\nDataset Information:')
    console.log(`  Name: ${metadata.name}`)
    console.log(`  ID: ${metadata.id}`)
    console.log(`  Table ID: ${metadata.tableId}`)
    console.log(`  View Type: ${metadata.viewType}`)
    console.log(`  Columns: ${metadata.columns?.length}`)
    console.log(`  Rows: ${metadata.rowsUpdatedAt}`)
    
    if (metadata.columns && metadata.columns.length > 0) {
      console.log('\n  Field Names:')
      metadata.columns.slice(0, 15).forEach((col: any) => {
        console.log(`    - ${col.fieldName} (${col.dataTypeName})`)
      })
    }
  } catch (error: any) {
    console.log(`❌ Metadata fetch failed: ${error.message}`)
  }
  
  // Test 3: Socrata Discovery API
  console.log('\n\n🔎 TEST 3: Socrata Discovery API')
  console.log('='.repeat(80))
  
  try {
    const response = await fetch(
      'https://api.us.socrata.com/api/catalog/v1?domains=data.transportation.gov&search_context=data.transportation.gov&q=vehicle+complaints+nhtsa&only=dataset&limit=10'
    )
    const catalog = await response.json()
    
    console.log(`\nFound ${catalog.results?.length || 0} related datasets:`)
    catalog.results?.forEach((r: any, i: number) => {
      console.log(`\n${i + 1}. ${r.resource.name}`)
      console.log(`   ID: ${r.resource.id}`)
      console.log(`   Updated: ${r.resource.updatedAt}`)
      console.log(`   Link: ${r.link}`)
    })
  } catch (error: any) {
    console.log(`❌ Discovery API failed: ${error.message}`)
  }
  
  // Test 4: Alternative NHTSA APIs
  console.log('\n\n🚗 TEST 4: Alternative NHTSA APIs')
  console.log('='.repeat(80))
  
  const alternativeApis = [
    {
      name: 'SafetyRatings API',
      url: 'https://api.nhtsa.gov/SafetyRatings'
    },
    {
      name: 'Products API (Complaints)',
      url: 'https://api.nhtsa.gov/products/vehicle/complaints?make=CHEVROLET&model=SILVERADO&modelYear=2021'
    },
    {
      name: 'Recalls by Vehicle',
      url: 'https://api.nhtsa.gov/recalls/recallsByVehicle?make=CHEVROLET&model=SILVERADO&modelYear=2021'
    }
  ]
  
  for (const test of alternativeApis) {
    try {
      console.log(`\nTesting: ${test.name}`)
      const response = await fetch(test.url)
      const data = await response.json()
      
      console.log(`  Status: ${response.status}`)
      if (response.ok) {
        console.log(`✅ Endpoint accessible!`)
        console.log(`  Response structure:`, Object.keys(data).join(', '))
        
        // Check for results
        if (data.Results) {
          console.log(`  Results count: ${data.Results.length}`)
        } else if (Array.isArray(data)) {
          console.log(`  Array length: ${data.length}`)
        }
      } else {
        console.log(`❌ Status ${response.status}`)
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`)
    }
  }
  
  // Test 5: Check for direct file downloads
  console.log('\n\n📥 TEST 5: Direct File Downloads')
  console.log('='.repeat(80))
  
  const downloadUrls = [
    {
      name: 'FLAT_CMPL.zip (Complaints)',
      url: 'https://static.nhtsa.gov/odi/ffdd/cmpl/FLAT_CMPL.zip'
    },
    {
      name: 'FLAT_RCL.zip (Recalls)',
      url: 'https://static.nhtsa.gov/odi/ffdd/rcl/FLAT_RCL.zip'
    },
    {
      name: 'FLAT_INV.zip (Investigations)',
      url: 'https://static.nhtsa.gov/odi/ffdd/inv/FLAT_INV.zip'
    }
  ]
  
  for (const test of downloadUrls) {
    try {
      console.log(`\nChecking: ${test.name}`)
      const response = await fetch(test.url, { method: 'HEAD' })
      
      if (response.ok) {
        const size = response.headers.get('content-length')
        const sizeInMB = size ? (parseInt(size) / 1024 / 1024).toFixed(2) : 'unknown'
        console.log(`✅ Available! Size: ${sizeInMB} MB`)
        console.log(`   Last-Modified: ${response.headers.get('last-modified')}`)
      } else {
        console.log(`❌ Status: ${response.status}`)
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`)
    }
  }
  
  // Test 6: Try different dataset IDs
  console.log('\n\n🔢 TEST 6: Alternative Dataset IDs')
  console.log('='.repeat(80))
  
  const datasetIds = [
    '8qbs-9p4c',  // ODI Complaints (main)
    'a8j8-mz9p',  // Previous attempt
    'hn5w-g63b',  // Alternative
  ]
  
  for (const id of datasetIds) {
    try {
      console.log(`\nTesting dataset: ${id}`)
      const response = await fetch(`https://data.transportation.gov/resource/${id}.json?$limit=1`)
      const data = await response.json()
      
      if (response.ok && !data.error) {
        console.log(`✅ Accessible!`)
        if (Array.isArray(data) && data.length > 0) {
          console.log(`   Fields:`, Object.keys(data[0]).slice(0, 10).join(', '))
        }
      } else {
        console.log(`❌ Not accessible: ${data.message || response.status}`)
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`)
    }
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(80))
  console.log('📊 INVESTIGATION COMPLETE!')
  console.log('='.repeat(80))
  console.log('\nReview results above to determine:')
  console.log('1. Which API endpoints are accessible')
  console.log('2. What query formats work')
  console.log('3. Whether to use API or direct downloads')
  console.log('\n')
}

// Run investigation
investigateNHTSA().catch(console.error)
