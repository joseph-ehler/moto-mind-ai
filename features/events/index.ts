/**
 * Events Feature - Public API
 * 
 * Comprehensive event management for vehicles.
 * Handles all types of vehicle events: fuel, service, maintenance, etc.
 * 
 * Architecture:
 * - domain/ - Types and pure business logic
 *   * Event types and interfaces
 *   * Completion score calculation
 *   * Event filtering and sorting
 *   * Analytics calculations (MPG, cost analysis)
 * 
 * - data/ - API calls and data management (placeholder)
 *   * Event CRUD operations
 *   * Photo uploads
 *   * Analytics queries
 *   * Batch operations
 * 
 * - hooks/ - React hooks for state management (placeholder)
 *   * useEvent, useEvents
 *   * useCreateEvent, useUpdateEvent, useDeleteEvent
 *   * useEventStats, useFuelEfficiency
 * 
 * - ui/ - 21 event-related components
 *   * Event display (headers, footers, sections)
 *   * Event editing (modals, forms)
 *   * Event analytics (insights, achievements)
 *   * Weather and location displays
 *   * Photo viewers
 * 
 * - __tests__/ - Domain tests and mocks
 *   * Event type tests
 *   * Event validation tests
 *   * Test fixtures and mocks
 * 
 * Key Features:
 * - Multi-type event support (fuel, service, damage, etc.)
 * - Rich event data (weather, location, photos, edits)
 * - Event analytics (MPG, costs, trends)
 * - Edit history and change tracking
 * - Photo management
 * - Completion scoring
 */

// Domain exports (types and business logic)
export type {
  EventData,
  ChangeEntry,
  EventType,
  CreateEventInput,
  UpdateEventInput,
  EventFilters,
  EventSortOptions,
  EventListResponse,
  CompletionScoreBreakdown,
} from './domain'

export {
  calculateCompletionScore,
  sortEventsByDate,
  filterEventsByType,
  filterEventsByDateRange,
  groupEventsByMonth,
  calculateTotalCost,
  calculateAverageMPG,
  getEventTypeLabel,
  hasBeenEdited,
  getLastEditReason,
} from './domain'

// Data layer (future)
// export { getEvent, getEvents, createEvent, updateEvent, deleteEvent } from './data'
// export { getEventStats, getFuelEfficiencyHistory, getCostAnalysis } from './data'

// Hooks (future)
// export { useEvent, useEvents, useRecentEvents } from './hooks'
// export { useCreateEvent, useUpdateEvent, useDeleteEvent } from './hooks'
// export { useEventStats, useFuelEfficiency, useCostAnalysis } from './hooks'

// UI Components (already exist in ui/ directory)
// Note: UI components have pre-existing syntax errors that need to be fixed
// Import directly from ui/ directory until those are resolved
// export * from './ui'
