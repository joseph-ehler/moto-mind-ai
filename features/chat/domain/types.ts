/**
 * Chat/Event Domain Types
 * 
 * Core types for event cards and chat-style timeline display.
 * These types represent the business domain, independent of UI or data layer.
 */

/**
 * Weather information associated with an event
 */
export interface EventWeather {
  temperature_f?: number
  condition?: string
  precipitation_mm?: number
  windspeed_mph?: number
  humidity_percent?: number
}

/**
 * Core event data structure for timeline/chat display
 */
export interface EventData {
  event_id: string
  event_type: string
  event_date: string
  event_summary?: string
  event_location?: string
  event_cost?: number
  event_gallons?: number
  event_miles?: number
  event_vendor?: string
  event_weather?: EventWeather
}

/**
 * Event type configurations for display
 */
export type EventType = 
  | 'fuel'
  | 'service'
  | 'dashboard_snapshot'
  | 'damage'
  | 'expense'
  | 'modification'
  | 'odometer'
  | 'tire'
  | 'trip'
  | 'warning'
  | 'car_wash'
  | 'default'

/**
 * Event type display configuration
 */
export interface EventTypeConfig {
  emoji: string
  label: string
  gradient: string
  border: string
}

/**
 * Map of event types to their display configurations
 */
export type EventTypeConfigMap = Record<EventType, EventTypeConfig>
