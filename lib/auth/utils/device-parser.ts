/**
 * Device Parser Utility
 * 
 * Parses user agent string to extract:
 * - Browser name and version
 * - Operating system
 * - Device type (desktop/mobile/tablet)
 */

export interface DeviceInfo {
  browser: string
  browserVersion: string
  os: string
  osVersion: string
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  deviceName: string
}

/**
 * Parse user agent string
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      browserVersion: '',
      os: 'Unknown',
      osVersion: '',
      deviceType: 'unknown',
      deviceName: 'Unknown Device'
    }
  }

  const ua = userAgent.toLowerCase()

  // Detect browser
  let browser = 'Unknown'
  let browserVersion = ''

  if (ua.includes('edg/')) {
    browser = 'Edge'
    browserVersion = extractVersion(ua, /edg\/(\d+\.\d+)/)
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    browser = 'Chrome'
    browserVersion = extractVersion(ua, /chrome\/(\d+\.\d+)/)
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox'
    browserVersion = extractVersion(ua, /firefox\/(\d+\.\d+)/)
  } else if (ua.includes('safari/') && !ua.includes('chrome')) {
    browser = 'Safari'
    browserVersion = extractVersion(ua, /version\/(\d+\.\d+)/)
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    browser = 'Opera'
    browserVersion = extractVersion(ua, /(?:opera|opr)\/(\d+\.\d+)/)
  }

  // Detect OS
  let os = 'Unknown'
  let osVersion = ''

  if (ua.includes('windows nt 10.0')) {
    os = 'Windows'
    osVersion = '10/11'
  } else if (ua.includes('windows nt 6.3')) {
    os = 'Windows'
    osVersion = '8.1'
  } else if (ua.includes('windows nt 6.2')) {
    os = 'Windows'
    osVersion = '8'
  } else if (ua.includes('windows nt 6.1')) {
    os = 'Windows'
    osVersion = '7'
  } else if (ua.includes('mac os x')) {
    os = 'macOS'
    osVersion = extractVersion(ua, /mac os x (\d+[._]\d+)/).replace('_', '.')
  } else if (ua.includes('iphone')) {
    os = 'iOS'
    osVersion = extractVersion(ua, /iphone os (\d+[._]\d+)/).replace('_', '.')
  } else if (ua.includes('ipad')) {
    os = 'iPadOS'
    osVersion = extractVersion(ua, /cpu os (\d+[._]\d+)/).replace('_', '.')
  } else if (ua.includes('android')) {
    os = 'Android'
    osVersion = extractVersion(ua, /android (\d+\.\d+)/)
  } else if (ua.includes('linux')) {
    os = 'Linux'
  }

  // Detect device type
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown'
  
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'tablet'
    } else {
      deviceType = 'mobile'
    }
  } else {
    deviceType = 'desktop'
  }

  // Create device name
  const deviceName = createDeviceName(browser, os, deviceType)

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    deviceName
  }
}

/**
 * Extract version from user agent using regex
 */
function extractVersion(ua: string, regex: RegExp): string {
  const match = ua.match(regex)
  return match ? match[1] : ''
}

/**
 * Create human-readable device name
 */
function createDeviceName(browser: string, os: string, deviceType: string): string {
  if (deviceType === 'mobile') {
    if (os === 'iOS') return 'iPhone'
    if (os === 'Android') return 'Android Phone'
    return 'Mobile Device'
  }

  if (deviceType === 'tablet') {
    if (os === 'iPadOS') return 'iPad'
    if (os === 'Android') return 'Android Tablet'
    return 'Tablet'
  }

  // Desktop
  if (os === 'Windows') return 'Windows PC'
  if (os === 'macOS') return 'Mac'
  if (os === 'Linux') return 'Linux Desktop'

  return `${browser} on ${os}`
}

/**
 * Get device icon name for UI
 */
export function getDeviceIcon(deviceType: string): string {
  switch (deviceType) {
    case 'mobile':
      return 'smartphone'
    case 'tablet':
      return 'tablet'
    case 'desktop':
      return 'monitor'
    default:
      return 'help-circle'
  }
}

/**
 * Format device info for display
 */
export function formatDeviceInfo(device: DeviceInfo): string {
  const parts = []

  if (device.deviceName) {
    parts.push(device.deviceName)
  }

  if (device.browser && device.browserVersion) {
    parts.push(`${device.browser} ${device.browserVersion}`)
  }

  if (device.os && device.osVersion) {
    parts.push(`${device.os} ${device.osVersion}`)
  }

  return parts.join(' • ')
}
