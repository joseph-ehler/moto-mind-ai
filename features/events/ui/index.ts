/**
 * Events UI Components - Barrel Export
 * 
 * All UI components for event display and management.
 */

// Event Display Components
export { EventHeader } from './EventHeader'
export { EventFooter } from './EventFooter'
export { DataSection } from './DataSection'
export { WeatherDisplay } from './WeatherDisplay'
export { WeatherSection } from './WeatherSection'

// Event Editing
export { EditEventModal } from './EditEventModal'
export { DeleteEventModal } from './DeleteEventModal'
export { EditReasonModal } from './EditReasonModal'

// Event Analytics
export { AIInsights } from './AIInsights'
export { EventAchievements } from './EventAchievements'
export { FuelEfficiencyContext } from './FuelEfficiencyContext'

// Event Extras
export { ChangeHistoryTimeline } from './ChangeHistoryTimeline'
export { CompletionScoreTooltip } from './CompletionScoreTooltip'
export { EventMapView } from './EventMapView'
export { ReceiptImageViewer } from './ReceiptImageViewer'
export { RelatedEvents } from './RelatedEvents'
export { RelatedFillUpCard } from './RelatedFillUpCard'
export { ShareableReceiptCard } from './ShareableReceiptCard'

// Note: Version 2 components are available but not exported by default
// Import them directly if needed: import { EventHeader } from './EventHeader.v2'
