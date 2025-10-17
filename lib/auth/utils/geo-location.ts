/**
 * Geo-Location Utility
 * 
 * Gets approximate location from IP address
 * Uses ipapi.co for free IP geolocation (no API key required)
 */

export interface LocationInfo {
  country: string
  countryCode: string
  city: string
  region: string
  timezone: string
  flag: string // Country flag emoji
}

/**
 * Get location from IP address
 * Uses ipapi.co free API (1000 requests/day)
 */
export async function getLocationFromIP(ipAddress: string): Promise<LocationInfo | null> {
  try {
    // Skip for localhost/private IPs (both IPv4 and IPv6)
    if (
      !ipAddress || 
      ipAddress === 'unknown' ||
      ipAddress === '127.0.0.1' || 
      ipAddress === '::1' ||              // IPv6 localhost
      ipAddress === '::ffff:127.0.0.1' || // IPv4-mapped IPv6 localhost
      ipAddress.startsWith('192.168.') || 
      ipAddress.startsWith('10.') ||
      ipAddress.startsWith('172.')        // Private range 172.16.0.0 - 172.31.255.255
    ) {
      return {
        country: 'Local Development',
        countryCode: 'localhost',
        city: 'Local Machine',
        region: 'Development',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        flag: '💻'
      }
    }

    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      headers: {
        'User-Agent': 'MotoMind-Auth/1.0'
      }
    })

    if (!response.ok) {
      console.warn(`[GEO] Failed to get location for IP: ${ipAddress}`)
      return null
    }

    const data = await response.json()

    return {
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || '',
      city: data.city || 'Unknown',
      region: data.region || '',
      timezone: data.timezone || '',
      flag: getCountryFlag(data.country_code || '')
    }

  } catch (error) {
    console.error('[GEO] Error getting location:', error)
    return null
  }
}

/**
 * Get country flag emoji from country code
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode === 'local') return '🏠'
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  
  return String.fromCodePoint(...codePoints)
}

/**
 * Format location for display
 */
export function formatLocation(location: LocationInfo | null): string {
  if (!location) return 'Unknown location'

  const parts = []
  
  if (location.city) {
    parts.push(location.city)
  }
  
  if (location.region && location.region !== location.city) {
    parts.push(location.region)
  }
  
  if (location.country) {
    parts.push(location.country)
  }

  return parts.join(', ') || 'Unknown location'
}

/**
 * Format location with flag for display
 */
export function formatLocationWithFlag(location: LocationInfo | null): string {
  if (!location) return 'Unknown location'

  const locationStr = formatLocation(location)
  return `${location.flag} ${locationStr}`
}
