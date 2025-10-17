/**
 * Parking Memory System
 * 
 * Automatically remembers where user parked their car and provides
 * directions back to the vehicle. Includes reverse geocoding for
 * human-readable addresses.
 * 
 * @module lib/tracking/parking-memory
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Parking spot location with metadata
 */
export interface ParkingSpot {
  id: string
  userId: string
  sessionId?: string
  
  // Location
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
  placeName?: string
  
  // User metadata
  timestamp: Date
  photoUrl?: string
  notes?: string
  floor?: string
  section?: string
  spotNumber?: string
  
  // State
  isActive: boolean
  retrievedAt?: Date
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

/**
 * Options for saving a parking spot
 */
export interface SaveParkingSpotOptions {
  latitude: number
  longitude: number
  accuracy?: number
  sessionId?: string
  notes?: string
  floor?: string
  section?: string
  spotNumber?: string
  photoUrl?: string
  skipGeocoding?: boolean
}

/**
 * Geocoding result from reverse geocoding
 */
interface GeocodingResult {
  address?: string
  placeName?: string
}

/**
 * ParkingMemory class - Manages parking spot memory
 * 
 * Features:
 * - Save current parking location
 * - Automatic reverse geocoding for addresses
 * - Get active parking spot
 * - Calculate distance to parked car
 * - Directions integration
 * 
 * @example
 * ```typescript
 * const parkingMemory = new ParkingMemory()
 * 
 * // Save parking spot
 * const spot = await parkingMemory.saveSpot({
 *   latitude: 40.7128,
 *   longitude: -74.0060,
 *   notes: "Near the big tree"
 * })
 * 
 * // Get active spot
 * const activeSpot = await parkingMemory.getActiveSpot()
 * 
 * // Calculate distance
 * const distance = parkingMemory.calculateDistance(
 *   currentLat, currentLng,
 *   spot.latitude, spot.longitude
 * )
 * ```
 */
export class ParkingMemory {
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  /**
   * Save a new parking spot
   * 
   * Automatically deactivates any existing active parking spots.
   * Performs reverse geocoding to get address and place name.
   * 
   * @param options Parking spot details
   * @returns Saved parking spot with geocoded address
   */
  async saveSpot(options: SaveParkingSpotOptions): Promise<ParkingSpot> {
    const {
      latitude,
      longitude,
      accuracy,
      sessionId,
      notes,
      floor,
      section,
      spotNumber,
      photoUrl,
      skipGeocoding = false
    } = options
    
    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90')
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180')
    }
    
    // Get geocoding data if not skipped
    let geocoding: GeocodingResult = {}
    if (!skipGeocoding) {
      try {
        geocoding = await this.reverseGeocode(latitude, longitude)
      } catch (error) {
        console.warn('[ParkingMemory] Geocoding failed:', error)
        // Continue without geocoding data
      }
    }
    
    // Get current user
    const { data: { user }, error: userError } = await this.supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }
    
    // Insert parking spot
    const { data, error } = await this.supabase
      .from('parking_spots')
      .insert({
        user_id: user.id,
        session_id: sessionId || null,
        latitude,
        longitude,
        accuracy,
        address: geocoding.address,
        place_name: geocoding.placeName,
        notes,
        floor,
        section,
        spot_number: spotNumber,
        photo_url: photoUrl,
        is_active: true,
        timestamp: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('[ParkingMemory] Failed to save spot:', error)
      throw new Error('Failed to save parking spot')
    }
    
    return this.mapDbRowToSpot(data)
  }
  
  /**
   * Get the user's active parking spot
   * 
   * @returns Active parking spot or null if none exists
   */
  async getActiveSpot(): Promise<ParkingSpot | null> {
    const { data: { user }, error: userError } = await this.supabase.auth.getUser()
    if (userError || !user) {
      return null
    }
    
    const { data, error } = await this.supabase
      .from('parking_spots')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) {
      console.error('[ParkingMemory] Failed to get active spot:', error)
      return null
    }
    
    return data ? this.mapDbRowToSpot(data) : null
  }
  
  /**
   * Update parking spot metadata
   * 
   * @param spotId Parking spot ID
   * @param updates Fields to update
   */
  async updateSpot(
    spotId: string,
    updates: Partial<Pick<ParkingSpot, 'notes' | 'floor' | 'section' | 'spotNumber' | 'photoUrl'>>
  ): Promise<ParkingSpot> {
    const { data, error } = await this.supabase
      .from('parking_spots')
      .update({
        notes: updates.notes,
        floor: updates.floor,
        section: updates.section,
        spot_number: updates.spotNumber,
        photo_url: updates.photoUrl
      })
      .eq('id', spotId)
      .select()
      .single()
    
    if (error) {
      console.error('[ParkingMemory] Failed to update spot:', error)
      throw new Error('Failed to update parking spot')
    }
    
    return this.mapDbRowToSpot(data)
  }
  
  /**
   * Mark parking spot as retrieved (user found their car)
   * 
   * @param spotId Parking spot ID
   */
  async markAsRetrieved(spotId: string): Promise<void> {
    const { error } = await this.supabase
      .from('parking_spots')
      .update({
        is_active: false,
        retrieved_at: new Date().toISOString()
      })
      .eq('id', spotId)
    
    if (error) {
      console.error('[ParkingMemory] Failed to mark spot as retrieved:', error)
      throw new Error('Failed to mark parking spot as retrieved')
    }
  }
  
  /**
   * Delete a parking spot
   * 
   * @param spotId Parking spot ID
   */
  async deleteSpot(spotId: string): Promise<void> {
    const { error } = await this.supabase
      .from('parking_spots')
      .delete()
      .eq('id', spotId)
    
    if (error) {
      console.error('[ParkingMemory] Failed to delete spot:', error)
      throw new Error('Failed to delete parking spot')
    }
  }
  
  /**
   * Get parking spot history
   * 
   * @param limit Maximum number of spots to return
   * @returns Array of parking spots, most recent first
   */
  async getHistory(limit: number = 10): Promise<ParkingSpot[]> {
    const { data: { user }, error: userError } = await this.supabase.auth.getUser()
    if (userError || !user) {
      return []
    }
    
    const { data, error } = await this.supabase
      .from('parking_spots')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('[ParkingMemory] Failed to get history:', error)
      return []
    }
    
    return data.map(row => this.mapDbRowToSpot(row))
  }
  
  /**
   * Calculate distance between two coordinates
   * Uses Haversine formula for accurate distance calculation
   * 
   * @param lat1 First latitude
   * @param lng1 First longitude
   * @param lat2 Second latitude
   * @param lng2 Second longitude
   * @returns Distance in meters
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180
    
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    return R * c // Distance in meters
  }
  
  /**
   * Format distance for display
   * 
   * @param meters Distance in meters
   * @returns Formatted distance string (e.g., "150 m" or "1.2 km")
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`
    }
    return `${(meters / 1000).toFixed(1)} km`
  }
  
  /**
   * Generate Google Maps directions URL
   * 
   * @param spot Parking spot
   * @param currentLat Current latitude
   * @param currentLng Current longitude
   * @returns Google Maps directions URL
   */
  getDirectionsUrl(
    spot: ParkingSpot,
    currentLat?: number,
    currentLng?: number
  ): string {
    const destination = `${spot.latitude},${spot.longitude}`
    
    if (currentLat && currentLng) {
      const origin = `${currentLat},${currentLng}`
      return `https://www.google.com/maps/dir/${origin}/${destination}`
    }
    
    // If no current location, just open destination
    return `https://www.google.com/maps/search/?api=1&query=${destination}`
  }
  
  /**
   * Generate Apple Maps directions URL (iOS)
   * 
   * @param spot Parking spot
   * @param currentLat Current latitude
   * @param currentLng Current longitude
   * @returns Apple Maps directions URL
   */
  getAppleMapsUrl(
    spot: ParkingSpot,
    currentLat?: number,
    currentLng?: number
  ): string {
    if (currentLat && currentLng) {
      return `http://maps.apple.com/?saddr=${currentLat},${currentLng}&daddr=${spot.latitude},${spot.longitude}`
    }
    
    return `http://maps.apple.com/?q=${spot.latitude},${spot.longitude}`
  }
  
  // ========================================
  // PRIVATE: Geocoding
  // ========================================
  
  /**
   * Reverse geocode coordinates to address
   * Uses OpenStreetMap Nominatim (free, no API key required)
   * 
   * @param latitude Latitude
   * @param longitude Longitude
   * @returns Geocoding result with address and place name
   */
  private async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<GeocodingResult> {
    try {
      // Use OpenStreetMap Nominatim (free, no API key)
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MotoMind Vehicle Tracking App'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Extract address components
      const address = this.formatAddress(data.address)
      const placeName = this.extractPlaceName(data)
      
      return { address, placeName }
    } catch (error) {
      console.warn('[ParkingMemory] Reverse geocoding failed:', error)
      return {}
    }
  }
  
  /**
   * Format address from Nominatim response
   */
  private formatAddress(addressData: any): string {
    const parts: string[] = []
    
    // Street address
    if (addressData.house_number && addressData.road) {
      parts.push(`${addressData.house_number} ${addressData.road}`)
    } else if (addressData.road) {
      parts.push(addressData.road)
    }
    
    // City
    if (addressData.city) {
      parts.push(addressData.city)
    } else if (addressData.town) {
      parts.push(addressData.town)
    } else if (addressData.village) {
      parts.push(addressData.village)
    }
    
    // State/Province
    if (addressData.state) {
      parts.push(addressData.state)
    }
    
    // Postal code
    if (addressData.postcode) {
      parts.push(addressData.postcode)
    }
    
    return parts.join(', ')
  }
  
  /**
   * Extract place name from Nominatim response
   */
  private extractPlaceName(data: any): string | undefined {
    // Try to find a meaningful place name
    const candidates = [
      data.name,
      data.address?.amenity,
      data.address?.shop,
      data.address?.building,
      data.address?.commercial,
      data.address?.retail
    ]
    
    return candidates.find(name => name && name.length > 0)
  }
  
  // ========================================
  // PRIVATE: Database Mapping
  // ========================================
  
  /**
   * Map database row to ParkingSpot interface
   */
  private mapDbRowToSpot(row: Record<string, any>): ParkingSpot {
    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      accuracy: row.accuracy ? parseFloat(row.accuracy) : undefined,
      address: row.address,
      placeName: row.place_name,
      timestamp: new Date(row.timestamp),
      photoUrl: row.photo_url,
      notes: row.notes,
      floor: row.floor,
      section: row.section,
      spotNumber: row.spot_number,
      isActive: row.is_active,
      retrievedAt: row.retrieved_at ? new Date(row.retrieved_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }
}
