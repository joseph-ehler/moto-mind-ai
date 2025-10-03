// Quick fix to add address to existing Fuel Depot event
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ucbbzzoimghnaoihyqbd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjYmJ6em9pbWdobmFvaWh5cWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY4NDIxMywiZXhwIjoyMDc0MjYwMjEzfQ.Fq9BQHT8rQ2iNpgugdf-JdvdRYMf1vFTU1pvh88xbag'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixFuelDepotEvent() {
  console.log('🔧 Fixing Fuel Depot event address...')
  
  try {
    // Find the Fuel Depot event
    const { data: events, error: findError } = await supabase
      .from('vehicle_events')
      .select('*')
      .eq('type', 'fuel')
      .ilike('payload->data->>station_name', '%fuel depot%')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (findError) {
      console.log('❌ Error finding event:', findError)
      return
    }
    
    if (!events || events.length === 0) {
      console.log('❌ No Fuel Depot events found')
      return
    }
    
    const event = events[0]
    console.log('✅ Found event:', event.id)
    
    // Update the payload to include the address
    const updatedPayload = {
      ...event.payload,
      data: {
        ...event.payload.data,
        station_address: '1 GOODSPRINGS RD, JEAN, NV 89019'
      }
    }
    
    // Update the event with address and geocoding
    const { error: updateError } = await supabase
      .from('vehicle_events')
      .update({
        payload: updatedPayload,
        geocoded_lat: 35.794139,
        geocoded_lng: -115.314028,
        geocoded_address: '1 Goodsprings Road, Jean, NV 89019, United States',
        geocoded_at: new Date().toISOString()
      })
      .eq('id', event.id)
    
    if (updateError) {
      console.log('❌ Error updating event:', updateError)
      return
    }
    
    console.log('✅ Event updated with address and coordinates!')
    console.log('🗺️ Location: 1 GOODSPRINGS RD, JEAN, NV 89019')
    console.log('📍 Coordinates: 35.794139, -115.314028')
    console.log('🎉 Refresh your event detail page to see the map!')
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message)
  }
}

fixFuelDepotEvent()
