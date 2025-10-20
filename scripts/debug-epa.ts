/**
 * Debug EPA API
 * Check what the actual API returns
 */

async function debugEPA() {
  const baseUrl = 'https://www.fueleconomy.gov/ws/rest'
  
  console.log('🔍 Debugging EPA API\n')
  
  // Test 1: Get makes for 2021
  console.log('Test 1: Get makes for 2021')
  const makesUrl = `${baseUrl}/vehicle/menu/make?year=2021`
  console.log(`URL: ${makesUrl}`)
  
  try {
    const response = await fetch(makesUrl, {
      headers: { 'Accept': 'application/json' }
    })
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500))
  } catch (error) {
    console.log('Error:', error)
  }
  
  console.log('\n---\n')
  
  // Test 2: Get models for 2021 Chevrolet
  console.log('Test 2: Get models for 2021 Chevrolet')
  const modelsUrl = `${baseUrl}/vehicle/menu/model?year=2021&make=Chevrolet`
  console.log(`URL: ${modelsUrl}`)
  
  try {
    const response = await fetch(modelsUrl, {
      headers: { 'Accept': 'application/json' }
    })
    const data = await response.json()
    console.log('Models:', JSON.stringify(data, null, 2).substring(0, 1000))
    
    // Find Silverado
    if (data.menuItem) {
      const silverado = data.menuItem.find((m: any) => m.text.includes('Silverado'))
      console.log('\nSilverado model:', silverado)
    }
  } catch (error) {
    console.log('Error:', error)
  }
  
  console.log('\n---\n')
  
  // Test 3: Try the options endpoint with exact model name
  console.log('Test 3: Get options for 2021 Chevrolet Silverado 1500')
  const optionsUrl = `${baseUrl}/vehicle/menu/options?year=2021&make=Chevrolet&model=Silverado%201500`
  console.log(`URL: ${optionsUrl}`)
  
  try {
    const response = await fetch(optionsUrl, {
      headers: { 'Accept': 'application/json' }
    })
    const data = await response.json()
    console.log('Options:', JSON.stringify(data, null, 2).substring(0, 1000))
  } catch (error) {
    console.log('Error:', error)
  }
}

debugEPA().catch(console.error)
