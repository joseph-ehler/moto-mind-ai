/**
 * Event Type Registry - Elite Tier
 * 
 * Central registry mapping event types to their renderers
 * All renderers now provide rich, contextual data visualization
 */

import { EventTypeRenderer } from './types'
import { FuelEvent } from './FuelEvent'
import { ServiceEvent } from './ServiceEvent'
import { OdometerEvent } from './OdometerEvent'
import { WarningEvent } from './WarningEvent'
import { TireEvent } from './TireEvent'
import { DamageEvent } from './DamageEvent'
import { DefaultEvent } from './DefaultEvent'
// NEW: Enhanced tracking renderers
import { ModificationEvent } from './ModificationEvent'
import { CarWashEvent } from './CarWashEvent'
import { TripEvent } from './TripEvent'
import { ExpenseEvent } from './ExpenseEvent'

export * from './types'

/**
 * Registry of event type renderers
 * Each renderer provides elite-tier data visualization and insights
 */
export const EVENT_RENDERERS: Record<string, EventTypeRenderer> = {
  // 💎 Elite Tier Renderers
  fuel: FuelEvent,                    // ⛽ Fuel economy analysis & cost breakdown
  service: ServiceEvent,              // 🔧 Service tracking with warranty & next service
  maintenance: ServiceEvent,          // 🔧 Reuse service renderer
  odometer: OdometerEvent,            // 📏 Mileage tracking with milestones & averages
  dashboard_warning: WarningEvent,    // ⚠️ Warning severity & resolution tracking
  tire_tread: TireEvent,             // 🛞 Tread depth with safety indicators
  tire_pressure: TireEvent,          // 🛞 Pressure monitoring per tire
  damage: DamageEvent,               // 🚗 Damage severity & repair tracking
  
  // ✨ Enhanced Tracking Renderers (NEW)
  modification: ModificationEvent,    // 🔩 Vehicle mods, upgrades, customization
  car_wash: CarWashEvent,            // 🧼 Cleaning, detailing services
  trip: TripEvent,                   // 🗺️ Road trips, business travel
  expense: ExpenseEvent,             // 💰 Tolls, parking, misc expenses
  
  // 📝 Using smart default for other types
  dashboard_snapshot: DefaultEvent,
  parking: DefaultEvent,
  document: DefaultEvent,
  inspection: DefaultEvent,
  recall: DefaultEvent,
  manual: DefaultEvent,
}

/**
 * Get renderer for event type
 * Falls back to DefaultEvent if type not found
 */
export function getEventRenderer(type: string): EventTypeRenderer {
  return EVENT_RENDERERS[type] || DefaultEvent
}
