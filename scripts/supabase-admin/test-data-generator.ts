/**
 * Test Data Generator
 * Generates realistic test data for development and testing
 */

import { SupabaseClient } from '@supabase/supabase-js'

// Realistic data pools
const MAKES = ['Tesla', 'Ford', 'Chevrolet', 'Toyota', 'Honda', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Nissan']

const MODELS_BY_MAKE: { [key: string]: string[] } = {
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
  'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Bronco'],
  'Chevrolet': ['Silverado', 'Camaro', 'Equinox', 'Tahoe', 'Corvette'],
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Tacoma', 'Highlander'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey'],
  'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'M3'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLE', 'GLC', 'S-Class'],
  'Audi': ['A4', 'A6', 'Q5', 'Q7', 'e-tron'],
  'Volkswagen': ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'ID.4'],
  'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Maxima']
}

export interface SeedOptions {
  table: string
  count: number
  tenantId: string
  realistic: boolean
}

export async function generateTestData(
  supabase: SupabaseClient,
  options: SeedOptions
): Promise<{ created: number; failed: number }> {
  console.log(`\n🌱 GENERATING TEST DATA\n`)
  console.log(`Table: ${options.table}`)
  console.log(`Count: ${options.count}`)
  console.log(`Tenant: ${options.tenantId}`)
  console.log(`Realistic: ${options.realistic ? 'Yes' : 'No'}\n`)
  
  let created = 0
  let failed = 0
  
  switch (options.table) {
    case 'vehicles':
      const result = await seedVehicles(supabase, options)
      created = result.created
      failed = result.failed
      break
    
    default:
      console.error(`❌ No seed function for table: ${options.table}`)
      return { created: 0, failed: options.count }
  }
  
  console.log(`\n✅ Created: ${created}`)
  console.log(`❌ Failed: ${failed}`)
  
  return { created, failed }
}

async function seedVehicles(
  supabase: SupabaseClient,
  options: SeedOptions
): Promise<{ created: number; failed: number }> {
  let created = 0
  let failed = 0
  
  console.log('Generating vehicles...')
  
  for (let i = 0; i < options.count; i++) {
    try {
      const vehicle = generateRealisticVehicle(options.tenantId)
      
      const { error } = await supabase
        .from('vehicles')
        .insert(vehicle)
      
      if (error) {
        console.error(`❌ Failed to insert vehicle ${i + 1}:`, error.message)
        failed++
      } else {
        created++
        if (created % 10 === 0) {
          console.log(`   Progress: ${created}/${options.count}...`)
        }
      }
    } catch (error: any) {
      console.error(`❌ Error generating vehicle ${i + 1}:`, error.message)
      failed++
    }
  }
  
  return { created, failed }
}

function generateRealisticVehicle(tenantId: string): any {
  const make = randomChoice(MAKES)
  const model = randomChoice(MODELS_BY_MAKE[make])
  const year = randomInt(2015, 2024)
  const vin = generateValidVIN(make, year)
  const mileage = generateRealisticMileage(year)
  
  return {
    tenant_id: tenantId,
    make,
    model,
    year,
    vin,
    license_plate: generateLicensePlate(),
    nickname: `${make} ${model}`,
    current_mileage: mileage,
    mileage_computed_from: 'manual',
    specs_enhancement_status: 'pending',
    specs_categories_completed: 0
  }
}

function generateValidVIN(make: string, year: number): string {
  // Simplified VIN generation (real VINs have checksums)
  const wmi = getWMI(make) // World Manufacturer Identifier
  const vds = randomAlphanumeric(6) // Vehicle Descriptor Section
  const vis = year.toString().slice(-1) + randomAlphanumeric(7) // Vehicle Identifier Section
  
  return wmi + vds + vis
}

function getWMI(make: string): string {
  const wmiMap: { [key: string]: string } = {
    'Tesla': '5YJ',
    'Ford': '1FA',
    'Chevrolet': '1G1',
    'Toyota': '4T1',
    'Honda': '1HG',
    'BMW': 'WBA',
    'Mercedes-Benz': 'WDD',
    'Audi': 'WAU',
    'Volkswagen': '3VW',
    'Nissan': '1N4'
  }
  
  return wmiMap[make] || '1XX'
}

function generateRealisticMileage(year: number): number {
  const age = new Date().getFullYear() - year
  const avgMilesPerYear = randomInt(8000, 15000)
  return age * avgMilesPerYear + randomInt(0, 5000)
}

function generateLicensePlate(): string {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ' // No I, O, Q
  const numbers = '0123456789'
  
  // Format: ABC1234
  let plate = ''
  for (let i = 0; i < 3; i++) {
    plate += letters[randomInt(0, letters.length - 1)]
  }
  for (let i = 0; i < 4; i++) {
    plate += numbers[randomInt(0, numbers.length - 1)]
  }
  
  return plate
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomAlphanumeric(length: number): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[randomInt(0, chars.length - 1)]
  }
  return result
}

export function previewTestData(table: string, count: number = 5): void {
  console.log(`\n📋 PREVIEW: ${count} sample ${table}\n`)
  
  if (table === 'vehicles') {
    for (let i = 0; i < count; i++) {
      const vehicle = generateRealisticVehicle('preview-tenant-id')
      console.log(`${i + 1}. ${vehicle.year} ${vehicle.make} ${vehicle.model}`)
      console.log(`   VIN: ${vehicle.vin}`)
      console.log(`   Plate: ${vehicle.license_plate}`)
      console.log(`   Mileage: ${vehicle.current_mileage.toLocaleString()} miles`)
      console.log()
    }
  }
}
