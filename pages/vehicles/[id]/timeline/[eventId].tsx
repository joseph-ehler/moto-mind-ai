import { useRouter } from 'next/router'
import { ArrowLeft, Edit2, Trash2, Image as ImageIcon, MoreHorizontal, Clock, User, Calendar } from 'lucide-react'
import useSWR from 'swr'
import { useState } from 'react'
import { UnifiedEventDetail } from '@/components/timeline/UnifiedEventDetail'
import { ImageViewerModal } from '@/components/timeline/ImageViewerModal'
import { EditEventModal } from '@/components/events/EditEventModal'
import { SingleEventMap } from '@/components/maps/SingleEventMap'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function TimelineEventDetail() {
  const router = useRouter()
  const { id: vehicleId, eventId } = router.query
  const [isDeleting, setIsDeleting] = useState(false)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const { data: eventData, error, mutate } = useSWR(
    vehicleId && eventId ? `/api/vehicles/${vehicleId}/timeline/${eventId}` : null,
    fetcher
  )

  const { data: vehicleData } = useSWR(
    vehicleId ? `/api/vehicles/${vehicleId}` : null,
    fetcher
  )

  const handleBack = () => {
    router.push(`/vehicles/${vehicleId}`)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/timeline/${eventId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete')

      // Redirect back to timeline
      router.push(`/vehicles/${vehicleId}`)
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete event. Please try again.')
      setIsDeleting(false)
    }
  }

  const handleEditSuccess = () => {
    mutate() // Refresh the data
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load event</p>
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Timeline
          </button>
        </div>
      </div>
    )
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading event...</div>
      </div>
    )
  }

  const vehicle = vehicleData?.vehicle
  const event = eventData?.event

  // Get event type label
  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'dashboard_snapshot': 'Dashboard Snapshot',
      'fuel': 'Fuel Record',
      'service': 'Service Record',
      'maintenance': 'Maintenance',
      'repair': 'Repair',
      'odometer': 'Odometer Reading',
      'inspection': 'Inspection',
      'insurance': 'Insurance',
      'accident': 'Accident',
      'photo': 'Photo',
      'document': 'Document'
    }
    return labels[type] || type
  }

  // Get document image URL
  const getDocumentImageUrl = () => {
    // Check payload.raw_extraction.image_url first (most reliable)
    if (event?.payload?.raw_extraction?.raw_extraction?.source_document_url) {
      return event.payload.raw_extraction.raw_extraction.source_document_url
    }
    // Check payload.raw_extraction.image_url
    if (event?.payload?.raw_extraction?.image_url) {
      return event.payload.raw_extraction.image_url
    }
    // Check nested raw_extraction
    if (event?.payload?.raw_extraction?.raw_extraction?.image_url) {
      return event.payload.raw_extraction.raw_extraction.image_url
    }
    // Everything is an event - check payload.image_url
    if (event?.payload?.image_url) {
      return event.payload.image_url
    }
    // Fallback: Check for joined image data (Supabase returns as array)
    if (event?.image && Array.isArray(event.image) && event.image.length > 0) {
      return event.image[0].public_url
    }
    // Check for image object (single)
    if (event?.image && typeof event.image === 'object' && !Array.isArray(event.image) && event.image.public_url) {
      return event.image.public_url
    }
    // Legacy fallback
    if (event?.payload?.source_document_url) {
      return event.payload.source_document_url
    }
    return null
  }

  const documentImageUrl = getDocumentImageUrl()
  
  // Get image filename for modal
  const getImageFilename = () => {
    if (event?.image && Array.isArray(event.image) && event.image.length > 0) {
      return event.image[0].filename
    }
    if (event?.image && typeof event.image === 'object' && !Array.isArray(event.image) && event.image.filename) {
      return event.image.filename
    }
    return `${getEventTypeLabel(event?.type)} - ${new Date(event?.created_at).toLocaleDateString()}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - matches vehicle details page */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Timeline</span>
            </button>

            {vehicle && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </div>
                {vehicle.license_plate && (
                  <div className="text-xs text-gray-500">{vehicle.license_plate}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content - matches vehicle details page width */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        
        {/* Event Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {getEventTypeLabel(event?.type)}
                </h1>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                  {event?.type}
                </span>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      aria-label="Event actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40" onCloseAutoFocus={(e) => e.preventDefault()}>
                    <DropdownMenuItem 
                      onClick={() => {
                        setShowEditModal(true)
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Event
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-red-600 focus:text-red-600"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete Event'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="text-sm text-gray-500">
                {event?.created_at && new Date(event.created_at).toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </div>

              {event?.summary && (
                <p className="mt-3 text-gray-700">{event.summary}</p>
              )}
            </div>

            {/* Document Image Thumbnail */}
            {documentImageUrl && (
              <button
                onClick={() => setShowImageViewer(true)}
                className="ml-4 flex-shrink-0 group relative"
              >
                <img
                  src={documentImageUrl}
                  alt="Document"
                  className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200 group-hover:border-blue-400 transition-all"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <UnifiedEventDetail 
            event={event} 
            onImageClick={() => setShowImageViewer(true)}
          />
        </div>

        {/* Location Map - only show if event has geocoded location */}
        <SingleEventMap event={event} />

      </div>

      {/* Image Viewer Modal */}
      {documentImageUrl && (
        <ImageViewerModal
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          imageUrl={documentImageUrl}
          imageName={getImageFilename()}
        />
      )}

      {/* Edit Event Modal */}
      {event && vehicleId && (
        <EditEventModal
          event={event}
          vehicleId={vehicleId as string}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}
