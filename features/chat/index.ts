/**
 * Chat Feature - Public API
 * 
 * Components for displaying vehicle events in chat/timeline format.
 * Provides event cards with weather, location, and cost information.
 * 
 * Architecture:
 * - domain/ - Core types and business logic
 * - data/ - API calls and data management (placeholder)
 * - hooks/ - Custom React hooks (placeholder)
 * - ui/ - React components for event display
 */

// UI Components
export { EventCard } from './ui'
export type { EventCardProps } from './ui'

// Domain Types
export type {
  EventData,
  EventWeather,
  EventType,
  EventTypeConfig,
  EventTypeConfigMap
} from './domain'

// Data Layer (future)
// export { fetchEvents, subscribeToEvents } from './data'

// Hooks (future)
// export { useEventTimeline, useRealtimeEvents } from './hooks'
