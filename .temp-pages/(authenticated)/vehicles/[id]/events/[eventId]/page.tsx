import { redirect } from 'next/navigation'

/**
 * Vehicle-Scoped Event View
 * 
 * Route: /vehicles/[vehicleId]/events/[eventId]
 * 
 * For now, this redirects to the global event view at /events/[eventId].
 * This keeps the implementation simple while providing the correct URL structure.
 * 
 * Future enhancements:
 * - Vehicle context header showing vehicle info
 * - Breadcrumbs: Dashboard > Vehicles > [Vehicle Name] > Events > [Event]
 * - "Back to Vehicle" button
 * - Related events from the same vehicle
 * - Vehicle-specific event comparison
 * - Maintenance timeline visualization
 */

interface PageProps {
  params: Promise<{
    id: string        // Vehicle ID from parent [id] folder
    eventId: string   // Event ID from this [eventId] folder
  }>
}

export default async function VehicleEventPage({ params }: PageProps) {
  const { eventId } = await params
  
  // Redirect to global event view
  // The global event page already has all the event display logic
  redirect(`/events/${eventId}`)
}
