/**
 * Feature flags for controlling system behavior
 * Use these to safely roll out new features and manage technical debt
 */

export const flags = {
  // Jurisdiction system
  useSimpleJurisdiction: true,  // Set to false when full schema is ready
  
  // Weather system  
  useSimpleWeather: true,       // Set to false when real Open-Meteo is integrated
  
  // Reminders system
  enableReminderCreation: true, // Set to false if reminders table doesn't exist
  
  // Location normalization
  useNormalizedLocation: false, // Set to true when country/state codes are added
  
  // Debug and development
  showDebugInfo: false,         // Show raw API responses in UI
  enableMockData: true,         // Use mock data for development
}

/**
 * Environment-based overrides
 * These can be controlled via environment variables
 */
if (typeof window === 'undefined') {
  // Server-side overrides
  if (process.env.NODE_ENV === 'production') {
    flags.showDebugInfo = false
    flags.enableMockData = false
  }
  
  if (process.env.ENABLE_REAL_JURISDICTION === 'true') {
    flags.useSimpleJurisdiction = false
  }
  
  if (process.env.ENABLE_REAL_WEATHER === 'true') {
    flags.useSimpleWeather = false
  }
}

export default flags
