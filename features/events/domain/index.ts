/**
 * Events Domain - Business Logic & Types
 * 
 * Pure business logic for vehicle events.
 * No side effects, no API calls - just types and pure functions.
 */

// Types
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
} from './types'

// Business Logic Functions
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
} from './event-utils'
