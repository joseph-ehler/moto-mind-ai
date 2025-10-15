'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Section, Stack, Card, Heading, Text, Flex, Button, MomentumStack, useToast } from '@/components/design-system'
import { ArrowLeft, Share2, Download, Trash2, Edit2, Sparkles, FileText } from 'lucide-react'
import { DataSectionV2 } from '@/features/events/ui/DataSection.v2'
import { SimpleEventMap } from '@/components/maps/SimpleEventMap'
import { LocationCard } from '@/components/maps/LocationCard'
import { WeatherDisplay } from '@/features/events/ui/WeatherDisplay'
import { ChangeHistoryTimeline } from '@/features/events/ui/ChangeHistoryTimeline'
import { Modal } from '@/components/ui/Modal'
import { EventFooter } from '@/features/events/ui/EventFooter'
import { AppNavigation } from '@/components/app/AppNavigation'
import { EditReasonModal } from '@/features/events/ui/EditReasonModal'
import { DeleteEventModal } from '@/features/events/ui/DeleteEventModal'
import { EventHeaderV2 } from '@/features/events/ui/EventHeader.v2'
import { AIInsights } from '@/features/events/ui/AIInsights'
import { EventAchievements } from '@/features/events/ui/EventAchievements'
// import { ShareableReceiptCard } from '@/features/events/ui/ShareableReceiptCard' // PAUSED - needs work
import type { EventData, ChangeEntry } from '@/types/event'
import { formatDateWithoutTimezone, generateEventPDF } from '@/utils/eventUtils'
import { buildFinancialFields, buildLocationFields, buildReceiptFields, buildVehicleFields, getFieldValue } from '@/utils/eventFieldBuilders'
// import { shareImage } from '@/utils/shareAsImage' // PAUSED - needs work
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SkeletonInsightCard, SkeletonAchievementCard, SkeletonDataSection } from '@/components/ui/SkeletonLoader'

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params?.id as string

  const [event, setEvent] = useState<EventData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({})
  const [changesList, setChangesList] = useState<Array<{ field: string; oldValue: any; newValue: any }>>([])
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const [deletedEventId, setDeletedEventId] = useState<string | null>(null)
  
  // Toast hook
  const toast = useToast()
  
  // Related events & context
  const [relatedEvents, setRelatedEvents] = useState<any>(null)
  const [efficiencyContext, setEfficiencyContext] = useState<any>(null)

  useEffect(() => {
    if (!eventId) return

    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch event')
        }

        const data = await response.json()
        
        // Debug: Check what API returned
        console.log('📡 API Response:', {
          hasEvent: !!data.event,
          hasVehicle: !!data.event?.vehicle,
          vehicleName: data.event?.vehicle?.name,
          fullVehicleData: data.event?.vehicle
        })
        
        setEvent(data.event)
        
        // Fetch related events and efficiency context
        if (data.event.type === 'fuel') {
          fetchRelatedData(data.event)
        }
      } catch (err) {
        console.error('Error fetching event:', err)
        setError('Failed to load event details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])
  
  const fetchRelatedData = async (currentEvent: EventData) => {
    try {
      // Fetch previous and next fill-ups
      console.log('🔍 Fetching related events for:', eventId)
      const relatedRes = await fetch(`/api/events/${eventId}/related`)
      
      if (relatedRes.ok) {
        const data = await relatedRes.json()
        console.log('📊 Related events data:', data)
        setRelatedEvents(data)
        
        // Calculate efficiency context
        if (data.previous && currentEvent.miles && data.previous.miles) {
          const milesDriven = currentEvent.miles - data.previous.miles
          const currentMPG = milesDriven / currentEvent.gallons
          
          console.log('⛽ Efficiency calculation:', {
            milesDriven,
            currentMPG,
            averageMPG: data.averageMPG,
            currentEventMiles: currentEvent.miles,
            previousEventMiles: data.previous.miles
          })
          
          // Calculate previous MPG (need to get the fill-up before the previous one)
          let previousMPG = null
          if (data.previousMPG) {
            previousMPG = data.previousMPG
          }
          
          setEfficiencyContext({
            currentMPG,
            averageMPG: data.averageMPG || null,
            previousMPG: previousMPG
          })
          
          console.log('✅ Efficiency context set:', {
            currentMPG,
            averageMPG: data.averageMPG,
            previousMPG
          })
        } else {
          console.log('ℹ️ Efficiency not available (first event or incomplete data)', {
            hasPrevious: !!data.previous,
            currentMiles: currentEvent.miles,
            previousMiles: data.previous?.miles
          })
        }
      } else {
        console.log('❌ Related events API failed:', relatedRes.status)
      }
    } catch (err) {
      console.error('❌ Error fetching related data:', err)
    }
  }
  
  const handleShare = async () => {
    if (!event) return
    
    const shareData = {
      title: `Fuel Fill-Up at ${event.display_vendor || event.vendor}`,
      text: `$${event.total_amount?.toFixed(2)} • ${event.gallons?.toFixed(1)} gallons • ${formatDateWithoutTimezone(event.date)}`,
      url: window.location.href
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link Copied!', 'Share link has been copied to clipboard')
    }
  }
  
  const handleExport = () => {
    if (!event) return
    
    try {
      generateEventPDF(event)
      toast.success('PDF Ready!', 'Your receipt has been downloaded and is ready to share')
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('Export Failed', 'Unable to generate PDF. Please try again or contact support.')
    }
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async (reason: string) => {
    if (!event) return
    
    setIsDeleting(true)
    setShowDeleteModal(false)

    try {
      const response = await fetch(`/api/events/${eventId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      // Store deleted event ID for undo
      setDeletedEventId(eventId)
      
      // Show undo toast
      setShowUndoToast(true)

      // Auto-hide undo toast after 10 seconds
      setTimeout(() => {
        setShowUndoToast(false)
        // Navigate to vehicle timeline after toast disappears
        if (event.vehicle?.id) {
          router.push(`/vehicles/${event.vehicle.id}`)
        } else {
          router.push('/vehicles')
        }
      }, 10000)
    } catch (err) {
      console.error('Error deleting event:', err)
      alert('Failed to delete event. Please try again.')
      setIsDeleting(false)
    }
  }

  const handleUndoDelete = async () => {
    if (!deletedEventId) return

    try {
      const response = await fetch(`/api/events/${deletedEventId}/restore`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to restore event')
      }

      // Hide toast and refresh
      setShowUndoToast(false)
      setDeletedEventId(null)
      
      // Refresh the page to show restored event
      window.location.reload()
    } catch (err) {
      console.error('Error restoring event:', err)
      alert('Failed to undo deletion. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Stack spacing="md">
            <Text>Loading event details...</Text>
          </Stack>
        </Section>
      </Container>
    )
  }

  if (error || !event) {
    return (
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Stack spacing="md">
            <Text>{error || 'Event not found'}</Text>
            <Button onClick={() => router.back()}>Go Back</Button>
          </Stack>
        </Section>
      </Container>
    )
  }

  // Edit handlers
  const handleSectionSave = async (updates: Record<string, any>) => {
    // Build list of changes
    const changes = Object.entries(updates).map(([key, newValue]) => {
      const oldValue = getFieldValue(event, key)
      return {
        field: key,
        oldValue,
        newValue
      }
    }).filter(change => change.oldValue !== change.newValue)

    if (changes.length === 0) return

    // Smart Friction: Skip modal if only editing notes
    const changedFields = changes.map(c => c.field)
    const onlyNotesChanged = changedFields.length === 1 && changedFields[0] === 'notes'
    
    if (onlyNotesChanged) {
      // Save directly without modal for notes-only edits
      setPendingChanges(updates)
      await handleConfirmEdit('Updated notes')
    } else {
      // Show modal for factual/financial changes
      setPendingChanges(updates)
      setChangesList(changes)
      setShowEditModal(true)
    }
  }

  // Per-field save handler for new inline editing
  const handleFieldSave = async (updates: Record<string, any>) => {
    if (!event) return
    
    // Get primary field name (first key in updates object)
    const fieldName = Object.keys(updates)[0]
    const newValue = updates[fieldName]
    const oldValue = getFieldValue(event, fieldName)
    
    // Don't save if primary field unchanged
    if (oldValue === newValue) return
    
    setIsSaving(true)
    
    // OPTIMISTIC UPDATE - Apply ALL updates (including coordinates)
    const optimisticEvent = { ...event, ...updates }
    setEvent(optimisticEvent)
    console.log('🔄 Optimistic update applied:', updates)
    
    try {
      // For notes-only, save directly without modal
      const isNotesField = fieldName === 'notes'
      const reason = isNotesField ? 'Updated notes' : `Updated ${fieldName}`
      
      const response = await fetch(`/api/events/${eventId}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changes: updates,
          reason
        })
      })
      
      if (!response.ok) throw new Error('Failed to save')
      
      const data = await response.json()
      setEvent(data.event)
      
      // Show success toast for THIS field only
      toast.success(`${fieldName} updated`, `Successfully saved changes`)
      
      // Trigger background updates if needed
      const locationChanged = fieldName === 'vendor' || fieldName === 'geocoded_address'
      const dateChanged = fieldName === 'date'
      
      if (locationChanged || dateChanged) {
        // Trigger background geocoding/weather update
        fetch(`/api/events/${eventId}/enhance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locationChanged,
            dateChanged
          })
        })
          .then(res => res.json())
          .then(result => {
            if (result.event) {
              // Update with enhanced data (new coordinates, weather)
              setEvent(result.event)
              console.log('✅ Enhanced data updated:', result.event)
            }
          })
          .catch(err => console.warn('Background update failed:', err))
      }
    } catch (error) {
      console.error('Failed to save field:', error)
      // ROLLBACK on error
      setEvent(event)
      toast.error('Failed to save', 'Please try again')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmEdit = async (reason: string) => {
    if (!event) return
    
    setIsSaving(true)
    setShowEditModal(false)

    // Save original state for rollback
    const originalEvent = { ...event }
    
    // Detect what changed for smart updates
    const changedFields = Object.keys(pendingChanges)
    const locationChanged = changedFields.includes('vendor') || changedFields.includes('geocoded_address')
    const dateChanged = changedFields.includes('date')
    const timeChanged = changedFields.includes('time')
    
    console.log('🔍 Change detection:', {
      changedFields,
      dateChanged,
      timeChanged,
      locationChanged,
      pendingChanges
    })
    
    // Process changes - ensure dates are saved without timezone conversion
    const processedChanges = { ...pendingChanges }
    if (processedChanges.date) {
      // Ensure date is in YYYY-MM-DD format (no timezone conversion)
      processedChanges.date = processedChanges.date.split('T')[0]
      console.log('📅 Processed date:', processedChanges.date)
    }
    
    // OPTIMISTIC UPDATE: Update UI immediately
    const optimisticEvent = { ...event, ...processedChanges }
    setEvent(optimisticEvent)

    try {
      const response = await fetch(`/api/events/${eventId}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changes: processedChanges,
          reason
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save changes')
      }

      // Success! Fetch updated event to get change history
      const updatedResponse = await fetch(`/api/events/${eventId}`)
      if (updatedResponse.ok) {
        const data = await updatedResponse.json()
        setEvent(data.event) // Update with full event including change history
        
        console.log('✅ Event saved successfully, checking for smart updates...', {
          dateChanged,
          timeChanged,
          locationChanged
        })
        
        // SMART UPDATES: Trigger background refreshes based on what changed
        
        // If vendor changed (NOT manual address edit), re-geocode in background
        if (processedChanges.vendor && !processedChanges.geocoded_address) {
          toast.info('Finding Location...', 'Geocoding your address to update the map')
          try {
            await fetch(`/api/events/${eventId}/geocode`, { method: 'POST' })
            // Refresh event to get new geocoding
            const refreshed = await fetch(`/api/events/${eventId}`)
            if (refreshed.ok) {
              const refreshedData = await refreshed.json()
              setEvent(refreshedData.event)
              toast.success('Location Updated', 'Map and address have been refreshed with the new location')
            }
          } catch (geoErr) {
            console.error('Geocoding error:', geoErr)
            toast.warning('Location saved', 'Could not update map automatically')
          }
        }
        
        // If user manually edited address, geocode THAT specific address
        if (processedChanges.geocoded_address && !processedChanges.vendor) {
          toast.info('Updating Map...', 'Finding coordinates for your address')
          try {
            const geoResponse = await fetch(`/api/events/${eventId}/geocode`, { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address: processedChanges.geocoded_address })
            })
            if (geoResponse.ok) {
              const refreshed = await fetch(`/api/events/${eventId}`)
              if (refreshed.ok) {
                const refreshedData = await refreshed.json()
                setEvent(refreshedData.event)
                toast.success('Map Updated', 'Your location has been pinpointed on the map')
              }
            }
          } catch (geoErr) {
            console.error('Geocoding error:', geoErr)
            toast.warning('Address saved', 'Could not update map automatically')
          }
        }
        
        // If date or time changed, re-fetch weather
        if (dateChanged || timeChanged) {
          console.log('🌤️ Date/time changed, fetching new weather...', { 
            dateChanged, 
            timeChanged, 
            newDate: processedChanges.date 
          })
          toast.info('Loading Weather...', 'Fetching historical conditions for the updated date and time')
          try {
            const weatherResponse = await fetch(`/api/events/${eventId}/weather`, { method: 'POST' })
            console.log('🌤️ Weather API response:', weatherResponse.status, weatherResponse.statusText)
            
            if (!weatherResponse.ok) {
              const errorText = await weatherResponse.text()
              console.error('🌤️ Weather API error:', errorText)
              throw new Error(`Weather API failed: ${weatherResponse.status}`)
            }
            
            // Refresh event to get new weather
            const refreshed = await fetch(`/api/events/${eventId}`)
            if (refreshed.ok) {
              const refreshedData = await refreshed.json()
              setEvent(refreshedData.event)
              console.log('🌤️ Weather updated successfully:', refreshedData.event.weather_temperature_f)
              toast.success('Weather Refreshed', 'Historical weather data has been updated for the new date')
            }
          } catch (weatherErr) {
            console.error('🌤️ Weather error:', weatherErr)
            toast.warning('Date saved', 'Could not update weather automatically')
          }
        }
      }
      
      // Show success toast
      toast.success('Saved!', 'Your changes have been updated successfully')
    } catch (err) {
      console.error('Error saving changes:', err)
      
      // ROLLBACK: Restore original state
      setEvent(originalEvent)
      
      // Show error toast
      toast.error('Save Failed', 'Unable to save changes. Please check your connection and try again.')
    } finally {
      setIsSaving(false)
      setPendingChanges({})
      setChangesList([])
    }
  }

  // Extract data for sections using field builders
  const financialFields = buildFinancialFields(event)
  const locationFields = buildLocationFields(event)
  const receiptFields = buildReceiptFields(event)
  const vehicleFields = buildVehicleFields(event)
  
  // Calculate AI Insights data
  const currentMPG = event.miles && event.gallons && relatedEvents?.previous?.miles
    ? (event.miles - relatedEvents.previous.miles) / event.gallons
    : null
    
  const currentPricePerGallon = event.total_amount && event.gallons
    ? event.total_amount / event.gallons
    : 0
    
  const averageMPG = efficiencyContext?.averageMPG || null
  const previousMPG = efficiencyContext?.previousMPG || null
  const averagePricePerGallon = efficiencyContext?.averagePricePerGallon || null

  return (
    <>
      <AppNavigation />
      
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        {/* Immersive Header - Full Width */}
        <EventHeaderV2
          event={event}
          onBack={() => router.back()}
          onShare={handleShare}
          onExport={handleExport}
          onDelete={handleDelete}
        />

      {/* Main Content - Constrained Width */}
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <MomentumStack baseSpacing="lg">
            {/* Section: AI Insights */}
            <div className="space-y-4">
              <SectionHeader 
                level="subsection" 
                icon={<Sparkles className="w-5 h-5 text-purple-600" />}
              >
                AI Insights
              </SectionHeader>
              
              <Stack spacing="md">
                {/* AI Insights */}
                {isLoading ? (
                  <SkeletonInsightCard />
                ) : currentMPG ? (
                  <AIInsights
                currentMPG={currentMPG}
                currentPricePerGallon={currentPricePerGallon}
                currentTotalCost={event.total_amount}
                currentGallons={event.gallons}
                averageMPG={averageMPG}
                averagePricePerGallon={averagePricePerGallon}
                previousMPG={previousMPG}
                    vehicleName={event.vehicle?.name}
                  />
                ) : (
                  <AIInsights
                    currentMPG={null}
                    currentPricePerGallon={currentPricePerGallon}
                    currentTotalCost={event.total_amount}
                    currentGallons={event.gallons}
                    averageMPG={averageMPG}
                    averagePricePerGallon={averagePricePerGallon}
                    previousMPG={previousMPG}
                    vehicleName={event.vehicle?.name}
                  />
                )}
                
                {/* Gamification - Hidden on detail page, will be moved to dedicated gamification section */}
                {/* TODO: Create dedicated gamification dashboard/page */}
              </Stack>
            </div>
            
            {/* Section: Event Details */}
            <div className="pt-4">
              <SectionHeader 
                level="subsection"
                icon={<FileText className="w-5 h-5 text-gray-700" />}
                divider="subtle"
              >
                Event Details
              </SectionHeader>
              
              <MomentumStack baseSpacing="md">
                {/* Data Sections */}
                {isLoading ? (
                  <SkeletonDataSection />
                ) : (
                  <DataSectionV2
              title="💵 Payment Breakdown"
              fields={financialFields}
              defaultExpanded={true}
              isEditable={true}
                    onSave={handleFieldSave}
                  />
                )}

                {isLoading ? (
                  <SkeletonDataSection />
                ) : (
                  <DataSectionV2
              title="📍 Location & Time"
              fields={locationFields}
              defaultExpanded={true}
              isEditable={true}
              onSave={handleFieldSave}
              map={
                event.station_address || (event.geocoded_lat && event.geocoded_lng) ? (
                  <div>
                    <SimpleEventMap
                      lat={event.geocoded_lat}
                      lng={event.geocoded_lng}
                      address={event.station_address || event.geocoded_address || ''}
                      stationName={event.display_vendor || event.vendor || ''}
                      className="h-64 w-full"
                    />
                    <LocationCard
                      stationName={event.display_vendor || event.vendor || ''}
                      address={event.station_address || event.geocoded_address || ''}
                      className="m-4"
                    />
                  </div>
                ) : null
              }
              weather={
                event.weather_temperature_f && event.weather_condition ? (
                  <WeatherDisplay
                    temperature_f={event.weather_temperature_f}
                    condition={event.weather_condition as 'clear' | 'rain' | 'snow' | 'cloudy' | 'extreme'}
                    precipitation_mm={event.weather_precipitation_mm}
                    windspeed_mph={event.weather_windspeed_mph}
                    humidity_percent={event.weather_humidity_percent}
                    pressure_inhg={event.weather_pressure_inhg}
                  />
                ) : null
              }
                  />
                )}

                {!isLoading && receiptFields.length > 0 && (
                  <DataSectionV2
              title="🧾 Transaction Details"
              fields={receiptFields}
              defaultExpanded={true}
              isEditable={true}
                    onSave={handleFieldSave}
                  />
                )}

                {!isLoading && vehicleFields.length > 0 && (
                  <DataSectionV2
              title="🚗 Vehicle & Notes"
              fields={vehicleFields}
              defaultExpanded={true}
              isEditable={true}
                    onSave={handleFieldSave}
                  />
                )}
                
                {/* Fuel Additives Section */}
                {!isLoading && event.products && event.products.length > 0 && (
                  <Card className="p-6">
                    <Stack spacing="md">
                      <Flex align="center" gap="sm">
                        <Text className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                          🧪 Fuel Additives
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {event.products.length} product{event.products.length > 1 ? 's' : ''}
                        </Text>
                      </Flex>
                      
                      <Stack spacing="sm">
                        {event.products.map((product: any, idx: number) => (
                          <Card key={idx} className="p-4 bg-green-50 border-green-200">
                            <Stack spacing="xs">
                              <Text className="font-semibold text-gray-900">
                                {product.brand} {product.product_name}
                              </Text>
                              {product.size && (
                                <Text className="text-sm text-gray-600">
                                  <span className="font-medium">Size:</span> {product.size}
                                </Text>
                              )}
                              {product.type && (
                                <Text className="text-sm text-gray-600">
                                  <span className="font-medium">Type:</span> {product.type}
                                </Text>
                              )}
                              {product.purpose && (
                                <Text className="text-sm text-gray-700 mt-1">
                                  {product.purpose}
                                </Text>
                              )}
                            </Stack>
                          </Card>
                        ))}
                      </Stack>
                    </Stack>
                  </Card>
                )}
              </MomentumStack>
            </div>

            {/* Change History */}
            {!isLoading && event.edit_changes && event.edit_changes.length > 0 && (
            <ChangeHistoryTimeline
              changes={event.edit_changes}
              createdAt={event.created_at}
            />
          )}

          {/* Edit Reason Modal */}
          <EditReasonModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onConfirm={handleConfirmEdit}
            changes={changesList}
          />

          {/* Delete Event Modal */}
          <DeleteEventModal
            event={event}
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
          />

          {/* Value Props Footer */}
          <EventFooter eventType={event.type} />

          </MomentumStack>
        </Section>
      </Container>
      </div>

      {/* Undo Delete Toast */}
      {showUndoToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-4">
          <Card className="bg-green-600 border-2 border-green-700 shadow-2xl">
            <Flex align="center" justify="between" gap="md" className="p-4">
              <div className="flex-1">
                <Text className="font-bold text-white text-base mb-1">
                  ✅ Event deleted
                </Text>
                <Text className="text-sm text-green-100">
                  Can be restored within 30 days
                </Text>
              </div>
              <Flex gap="sm" className="flex-shrink-0">
                <button
                  onClick={handleUndoDelete}
                  className="px-4 py-2 bg-white text-green-700 font-semibold text-sm rounded-lg hover:bg-green-50 transition-colors"
                >
                  Undo
                </button>
                <button
                  onClick={() => setShowUndoToast(false)}
                  className="p-2 text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Flex>
            </Flex>
          </Card>
        </div>
      )}
    </>
  )
}
