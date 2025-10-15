// Create mock reminders to test the Roman notification system
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

function computeDedupeKey(vehicleId: string, title: string, dueDate?: string, category?: string, dueMiles?: number): string {
  const parts = [vehicleId, title, dueDate || '', category || '', dueMiles?.toString() || '']
  const combined = parts.join('|')
  return createHash('md5').update(combined).digest('hex')
}

async function createMockNotifications() {
  console.log('🔔 Creating mock notifications for Roman interface...')

  // Get vehicle IDs from the API response you showed
  const vehicleIds = [
    'cf1e58a5-d456-4a17-ae82-273ef0e65f9d', // Daily Driver
    '3096e8a9-c688-4b3f-a648-9f732afca661', // Work Truck  
    '44c582bc-f078-40e7-a27d-300a8139b729'  // Tesla Model 3
  ]

  const mockReminders = [
    // URGENT - Overdue (red notification)
    {
      vehicle_id: vehicleIds[0], // Daily Driver
      title: 'Oil change overdue',
      description: 'Last oil change was 6 months ago. Engine damage risk.',
      category: 'maintenance',
      priority: 'high',
      due_date: '2024-08-15', // 40+ days ago = urgent
      due_miles: null,
      status: 'open',
      source: 'user'
    },
    
    // ATTENTION - Due soon (amber notification)
    {
      vehicle_id: vehicleIds[0], // Daily Driver
      title: 'Registration renewal',
      description: 'Vehicle registration expires in 12 days.',
      category: 'registration', 
      priority: 'medium',
      due_date: '2025-10-07', // ~12 days from now = attention
      due_miles: null,
      status: 'open',
      source: 'user'
    },

    // URGENT - Mileage based (red notification)
    {
      vehicle_id: vehicleIds[1], // Work Truck
      title: 'Brake inspection overdue',
      description: 'Brake pads need immediate inspection for safety.',
      category: 'maintenance',
      priority: 'high', 
      due_date: null,
      due_miles: 45000, // Assuming current mileage is higher
      status: 'open',
      source: 'user'
    },

    // ATTENTION - Due soon by mileage (amber notification)
    {
      vehicle_id: vehicleIds[2], // Tesla Model 3
      title: 'Tire rotation due',
      description: 'Rotate tires for even wear pattern.',
      category: 'maintenance',
      priority: 'medium',
      due_date: null, 
      due_miles: 55000, // Close to current mileage
      status: 'open',
      source: 'user'
    }
  ]

  for (const reminder of mockReminders) {
    const dedupeKey = computeDedupeKey(
      reminder.vehicle_id,
      reminder.title,
      reminder.due_date,
      reminder.category,
      reminder.due_miles
    )

    console.log(`📝 Creating: ${reminder.title}`)

    const { error } = await supabase
      .from('reminders')
      .insert({
        ...reminder,
        dedupe_key: dedupeKey
      })

    if (error) {
      console.error(`❌ Failed to create ${reminder.title}:`, error)
    } else {
      console.log(`✅ Created: ${reminder.title}`)
    }
  }

  // Also create an old odometer reading to trigger "stale odometer" notification
  console.log('\n🔢 Creating old odometer reading for stale notification...')
  
  const oldDate = new Date()
  oldDate.setDate(oldDate.getDate() - 100) // 100 days ago

  const { error: eventError } = await supabase
    .from('vehicle_events')
    .insert({
      vehicle_id: vehicleIds[0], // Daily Driver
      type: 'odometer',
      date: oldDate.toISOString().split('T')[0],
      miles: 52000,
      payload: { note: 'Old odometer reading for testing stale notification' }
    })

  if (eventError) {
    console.error('❌ Failed to create odometer event:', eventError)
  } else {
    console.log('✅ Created old odometer reading')
  }

  console.log('\n🎉 Mock notifications created!')
  console.log('🌐 Visit http://localhost:3005 to see the Roman-style notifications!')
  console.log('\n📋 You should see:')
  console.log('  🔴 URGENT: Oil change overdue (Daily Driver)')
  console.log('  🔴 URGENT: Brake inspection overdue (Work Truck)')  
  console.log('  🟡 ATTENTION: Registration renewal (Daily Driver)')
  console.log('  🟡 ATTENTION: Tire rotation due (Tesla)')
  console.log('  🟡 ATTENTION: Update odometer (Daily Driver - stale)')
}

createMockNotifications().catch(console.error)
