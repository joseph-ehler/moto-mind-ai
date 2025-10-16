import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * POST /api/events/[eventId]/geocode
 * Geocode the event's location from address/vendor
 * 
 * Action sub-resource - specific operation beyond CRUD
 * 
 * Body (optional):
 * - address: custom address to geocode (overrides extracted address)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params

  try {
    const body = await request.json().catch(() => ({}))
    const { address: customAddress } = body

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch current event
    const { data: event, error: fetchError } = await supabase
      .from('vehicle_events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (fetchError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Use custom address if provided, else use extracted station_address, else vendor
    const primaryAddress = customAddress || event.station_address || event.display_vendor || event.vendor

    if (!primaryAddress) {
      return NextResponse.json(
        { error: 'No address or vendor name to geocode' },
        { status: 400 }
      )
    }
    
    console.log('🗺️ Geocoding address:', primaryAddress)

    // Geocoding function with Nominatim
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
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (!result) {
      return NextResponse.json(
        { 
          error: 'Could not find coordinates for this address',
          address: primaryAddress,
          tried_addresses: fallbacks
        },
        { status: 404 }
      )
    }
    
    // Build clean address from components
    const addressParts = []
    if (result.address?.road) addressParts.push(result.address.road)
    if (result.address?.city) addressParts.push(result.address.city)
    if (result.address?.state) addressParts.push(result.address.state)
    if (result.address?.postcode) addressParts.push(result.address.postcode)
    
    const cleanAddress = addressParts.length > 0 
      ? addressParts.join(', ') 
      : result.display_name

    // Update event with geocoded data
    const updates: any = {
      geocoded_lat: parseFloat(result.lat),
      geocoded_lng: parseFloat(result.lon)
    }
    
    // Only update geocoded_address if auto-geocoding (not manual address edit)
    if (!customAddress) {
      updates.geocoded_address = cleanAddress
    }

    const { data: updatedEvent, error: updateError } = await supabase
      .from('vehicle_events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating event with geocoding:', updateError)
      return NextResponse.json(
        { error: 'Failed to update event with geocoding' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      geocoding: {
        address: cleanAddress,
        lat: updates.geocoded_lat,
        lng: updates.geocoded_lng,
        source: customAddress ? 'manual' : 'auto'
      }
    })
  } catch (error) {
    console.error('Unexpected error during geocoding:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
