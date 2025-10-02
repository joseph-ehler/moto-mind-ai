// Test import resolution
const path = require('path')
const fs = require('fs')

// Test if files exist at the expected paths
const testPaths = [
  'lib/utils/errors.ts',
  'lib/utils/http-envelope.ts', 
  'lib/domain/types.ts',
  'lib/middleware/tenant-context.ts'
]

console.log('🔍 Testing import paths from pages/api/vehicles/index.ts...')

testPaths.forEach(testPath => {
  const fullPath = path.join(__dirname, testPath)
  const exists = fs.existsSync(fullPath)
  console.log(`${exists ? '✅' : '❌'} ${testPath} - ${exists ? 'EXISTS' : 'MISSING'}`)
  
  if (exists) {
    const relativePath = path.relative('pages/api/vehicles', testPath)
    console.log(`   Import path should be: '../../${relativePath.replace(/\\/g, '/')}'`)
  }
})

// Test the actual import paths used in vehicles/index.ts
const vehiclesFile = path.join(__dirname, 'pages/api/vehicles/index.ts')
if (fs.existsSync(vehiclesFile)) {
  const content = fs.readFileSync(vehiclesFile, 'utf8')
  const importLines = content.split('\n').filter(line => line.includes('from \'../../lib'))
  
  console.log('\n📋 Current import statements:')
  importLines.forEach(line => {
    console.log(`   ${line.trim()}`)
  })
}
