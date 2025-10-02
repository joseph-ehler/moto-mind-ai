// MotoMind: Create Sample Reminders for Testing
// This script creates sample reminders to test the Roman-style notification system

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
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

const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000'

async function createSampleReminders() {
  console.log('🚗 Creating sample reminders for testing notification system...')

  try {
    // First, get existing vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, label, make, model')
      .eq('tenant_id', TENANT_ID)
      .limit(3)

    if (vehiclesError || !vehicles || vehicles.length === 0) {
      console.log('❌ No vehicles found. Please add some vehicles first.')
      return
    }

    console.log(`📋 Found ${vehicles.length} vehicles to create reminders for`)

    // Sample reminders with different urgency levels
    const sampleReminders = [
      // Urgent - overdue
      {
        vehicle_id: vehicles[0].id,
        title: 'Oil change overdue',
        description: 'Last oil change was 6 months ago. Engine damage risk.',
        category: 'maintenance',
        priority: 'high',
        due_date: '2024-08-15', // 40+ days ago - urgent
        due_miles: null
      },
      // Attention - due soon
      {
        vehicle_id: vehicles[0].id,
        title: 'Registration renewal',
        description: 'Vehicle registration expires soon.',
        category: 'registration',
        priority: 'medium',
        due_date: '2025-02-15', // ~4 months from now - attention
        due_miles: null
      },
      // Mileage-based urgent
      ...(vehicles.length > 1 ? [{
        vehicle_id: vehicles[1].id,
        title: 'Brake inspection',
        description: 'Brake pads need inspection based on mileage.',
        category: 'maintenance',
        priority: 'high',
        due_date: null,
        due_miles: 45000 // Assuming current mileage is higher - urgent
      }] : []),
      // Attention - mileage soon
      ...(vehicles.length > 1 ? [{
        vehicle_id: vehicles[1].id,
        title: 'Tire rotation',
        description: 'Regular tire rotation for even wear.',
        category: 'maintenance',
        priority: 'medium',
        due_date: null,
        due_miles: 55000 // Assuming current mileage is close - attention
      }] : []),
      // Future reminder
      ...(vehicles.length > 2 ? [{
        vehicle_id: vehicles[2].id,
        title: 'Annual inspection',
        description: 'State-required annual safety inspection.',
        category: 'inspection',
        priority: 'medium',
        due_date: '2025-06-01', // Future - should not appear in notifications
        due_miles: null
      }] : [])
    ]

    // Create reminders
    for (const reminder of sampleReminders) {
      const vehicle = vehicles.find(v => v.id === reminder.vehicle_id)
      const vehicleName = vehicle?.label || `${vehicle?.make} ${vehicle?.model}`
      
      console.log(`📝 Creating reminder: "${reminder.title}" for ${vehicleName}`)

      const response = await fetch('http://localhost:3005/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reminder)
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Created: ${reminder.title}${result.deduplicated ? ' (deduplicated)' : ''}`)
      } else {
        const error = await response.json()
        console.log(`❌ Failed to create "${reminder.title}": ${error.error}`)
      }
    }

    // Also create some sample vehicle events for testing stale odometer detection
    console.log('\n🔢 Creating sample vehicle events...')
    
    // Create an old odometer reading to trigger "stale odometer" notification
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 100) // 100 days ago
    
    const eventResponse = await fetch(`http://localhost:3005/api/vehicles/${vehicles[0].id}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'odometer',
        date: oldDate.toISOString().split('T')[0],
        miles: 52000,
        payload: { note: 'Sample old odometer reading' }
      })
    })

    if (eventResponse.ok) {
      console.log('✅ Created old odometer reading (should trigger stale notification)')
    }

    console.log('\n🎉 Sample data created! Check the home page for notifications.')
    console.log('🌐 Visit: http://localhost:3005')

  } catch (error) {
    console.error('❌ Error creating sample reminders:', error)
  }
}

createSampleReminders()
