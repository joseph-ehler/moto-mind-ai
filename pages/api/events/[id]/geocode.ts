import { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'

import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/events/[id]/geocode
 * Re-geocodes the event's vendor/address
 */
async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const { address: customAddress } = req.body || {}

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Event ID is required' })
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch current event
    const { data: event, error: fetchError } = await supabase
      .from('vehicle_events')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Use custom address if provided (user manually edited), else use extracted station_address, else fall back to vendor name
    const primaryAddress = customAddress || event.station_address || event.display_vendor || event.vendor

    if (!primaryAddress) {
      return res.status(400).json({ error: 'No address or vendor name to geocode' })
    }
    
    console.log('🗺️ Geocoding address:', primaryAddress)

    // Try geocoding with fallbacks
    const tryGeocode = async (address: string) => {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(address)}&` +
        `format=json&` +
        `limit=1&` +
        `addressdetails=1`

      const response = await fetch(geocodeUrl, {
        headers: { 'User-Agent': 'MotoMind Vehicle Tracker' }
      })

      if (!response.ok) return null
      const data = await response.json()
      return data && data.length > 0 ? data[0] : null
    }

    // Build fallback queries with multiple address format variations
    const fallbacks = [primaryAddress]
    
    // Parse address components
    const addressMatch = primaryAddress.match(/(.+?),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5})/)
    if (addressMatch) {
      const [, street, city, state, zip] = addressMatch
      
      // Try alternative street formats (HWY -> Highway, etc.)
      const streetVariations = [
        street,
        street.replace(/US HWY/i, 'US Highway'),
        street.replace(/US HWY/i, 'Highway'),
        street.replace(/\s+S\s*$/, ' South'),
        street.replace(/\s+N\s*$/, ' North'),
        street.replace(/\s+E\s*$/, ' East'),
        street.replace(/\s+W\s*$/, ' West')
      ]
      
      // Try different combinations
      for (const streetVar of streetVariations) {
        if (streetVar !== primaryAddress) {
          fallbacks.push(`${streetVar}, ${city}, ${state} ${zip}`)
          fallbacks.push(`${streetVar}, ${city}, ${state}`)
        }
      }
      
      // Try station name + city + state
      fallbacks.push(`${event.vendor || event.display_vendor}, ${city}, ${state}`)
      
      // Try just city, state, zip
      fallbacks.push(`${city}, ${state} ${zip}`)
      
      // Try ZIP + State as last resort
      fallbacks.push(`${zip}, ${state}`)
    }

    // Try each fallback until one succeeds
    let result = null
    for (const address of fallbacks) {
      console.log('🔍 Trying:', address)
      result = await tryGeocode(address)
      if (result) {
        console.log('✅ Geocoded successfully with:', address)
        break
      }
    }

    if (!result) {
      return res.status(404).json({ 
        error: 'Could not find coordinates for this address',
        address: primaryAddress,
        triedAddresses: fallbacks
      })
    }
    
    // Build clean address from components
    const addressParts = []
    if (result.address.road) addressParts.push(result.address.road)
    if (result.address.city) addressParts.push(result.address.city)
    if (result.address.state) addressParts.push(result.address.state)
    if (result.address.postcode) addressParts.push(result.address.postcode)
    
    const cleanAddress = addressParts.length > 0 
      ? addressParts.join(', ') 
      : result.display_name

    // Update event with geocoded data
    // Only update address if we're geocoding vendor (NOT if user manually entered address)
    const updates: any = {
      geocoded_lat: parseFloat(result.lat),
      geocoded_lng: parseFloat(result.lon)
    }
    
    // Only update geocoded_address if this was auto-geocoding (not manual address edit)
    if (!customAddress) {
      updates.geocoded_address = cleanAddress
    }

    const { data: updatedEvent, error: updateError } = await supabase
      .from('vehicle_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating event with geocoding:', updateError)
      return res.status(500).json({ error: 'Failed to update event with geocoding' })
    }

    return res.status(200).json({
      success: true,
      event: updatedEvent,
      geocoding: updates
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}


export default withTenantIsolation(handler)
