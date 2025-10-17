/**
 * Parking Memory Widget
 * 
 * Displays active parking spot with directions and metadata.
 * Allows saving new parking spots when tracking ends.
 * 
 * @module components/parking/ParkingMemoryWidget
 */

'use client'

import { useState, useEffect } from 'react'
import { useParkingMemory } from '@/hooks/useParkingMemory'
import { Stack, Flex, Text } from '@/components/design-system'
import { Card, Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Textarea, Input, Label } from '@/components/ui'
import { MapPin, Navigation, Clock, Edit3, Trash2, Camera, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParkingMemoryWidgetProps {
  /** Current location for distance calculation */
  currentLocation?: { latitude: number; longitude: number }
  /** Last tracking session ID */
  lastSessionId?: string
  /** Callback when spot is saved */
  onSpotSaved?: () => void
}

/**
 * Main parking memory widget component
 * 
 * @example
 * ```tsx
 * <ParkingMemoryWidget
 *   currentLocation={{ latitude: 40.7128, longitude: -74.0060 }}
 *   lastSessionId={sessionId}
 *   onSpotSaved={() => console.log('Spot saved!')}
 * />
 * ```
 */
export function ParkingMemoryWidget({
  currentLocation,
  lastSessionId,
  onSpotSaved
}: ParkingMemoryWidgetProps) {
  const {
    activeSpot,
    isLoading,
    error,
    saveSpot,
    markAsRetrieved,
    updateSpot,
    deleteSpot,
    getDistanceToSpot,
    getDirectionsUrl
  } = useParkingMemory()
  
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Calculate distance if we have current location
  const distance = currentLocation && activeSpot
    ? getDistanceToSpot(currentLocation.latitude, currentLocation.longitude)
    : null
  
  // Format distance for display
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`
    }
    return `${(meters / 1000).toFixed(1)} km`
  }
  
  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }
  
  // Handle save parking spot
  const handleSaveSpot = async (formData: {
    notes?: string
    floor?: string
    section?: string
    spotNumber?: string
  }) => {
    if (!currentLocation) {
      alert('Location not available. Please enable location services.')
      return
    }
    
    setIsSaving(true)
    
    try {
      await saveSpot({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        sessionId: lastSessionId,
        ...formData
      })
      
      setShowSaveDialog(false)
      onSpotSaved?.()
    } catch (err) {
      console.error('Failed to save parking spot:', err)
      alert('Failed to save parking spot. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle mark as retrieved
  const handleRetrieved = async () => {
    if (!confirm('Mark this parking spot as retrieved?')) return
    
    try {
      await markAsRetrieved()
    } catch (err) {
      console.error('Failed to mark as retrieved:', err)
      alert('Failed to update parking spot. Please try again.')
    }
  }
  
  // Handle delete spot
  const handleDelete = async () => {
    if (!activeSpot) return
    if (!confirm('Delete this parking spot?')) return
    
    try {
      await deleteSpot(activeSpot.id)
    } catch (err) {
      console.error('Failed to delete spot:', err)
      alert('Failed to delete parking spot. Please try again.')
    }
  }
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <Stack spacing="sm">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </Stack>
      </Card>
    )
  }
  
  // Error state
  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <Text className="text-red-700 text-sm">{error}</Text>
      </Card>
    )
  }
  
  // Active parking spot exists
  if (activeSpot) {
    const directionsUrl = getDirectionsUrl(
      currentLocation?.latitude,
      currentLocation?.longitude
    )
    
    return (
      <>
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <Stack spacing="md">
            {/* Header */}
            <Flex align="center" justify="between">
              <Flex align="center" gap="sm">
                <div className="bg-blue-500 rounded-full p-2">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <Text className="font-semibold text-blue-900">Car Parked</Text>
                  <Text size="xs" className="text-blue-700">
                    {formatTimeAgo(activeSpot.timestamp)}
                  </Text>
                </div>
              </Flex>
              
              <Flex gap="xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                  className="text-blue-700 hover:bg-blue-100"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Flex>
            </Flex>
            
            {/* Location info */}
            {activeSpot.placeName && (
              <div className="bg-white/50 rounded-lg p-3">
                <Text className="font-medium text-blue-900">{activeSpot.placeName}</Text>
                {activeSpot.address && (
                  <Text size="sm" className="text-blue-700 mt-1">{activeSpot.address}</Text>
                )}
              </div>
            )}
            
            {/* Parking details */}
            {(activeSpot.floor || activeSpot.section || activeSpot.spotNumber) && (
              <Flex gap="xs" wrap="wrap">
                {activeSpot.floor && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {activeSpot.floor}
                  </Badge>
                )}
                {activeSpot.section && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Section {activeSpot.section}
                  </Badge>
                )}
                {activeSpot.spotNumber && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Spot {activeSpot.spotNumber}
                  </Badge>
                )}
              </Flex>
            )}
            
            {/* Notes */}
            {activeSpot.notes && (
              <div className="bg-white/50 rounded-lg p-3">
                <Text size="sm" className="text-blue-800">{activeSpot.notes}</Text>
              </div>
            )}
            
            {/* Distance */}
            {distance !== null && (
              <Flex align="center" gap="xs" className="text-blue-700">
                <Navigation className="w-4 h-4" />
                <Text size="sm" className="font-medium">
                  {formatDistance(distance)} away
                </Text>
              </Flex>
            )}
            
            {/* Actions */}
            <Flex gap="sm">
              {directionsUrl && (
                <Button
                  onClick={() => window.open(directionsUrl, '_blank')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
              )}
              
              <Button
                onClick={handleRetrieved}
                variant="outline"
                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Check className="w-4 h-4 mr-2" />
                Found It
              </Button>
            </Flex>
          </Stack>
        </Card>
        
        {/* Edit Dialog */}
        <EditSpotDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          spot={activeSpot}
          onSave={updateSpot}
        />
      </>
    )
  }
  
  // No active spot - show save option
  return (
    <>
      <Card className="border-dashed border-2">
        <Stack spacing="sm">
          <Flex align="center" gap="sm">
            <MapPin className="w-5 h-5 text-gray-400" />
            <Text className="text-gray-600">No parking spot saved</Text>
          </Flex>
          
          <Button
            onClick={() => setShowSaveDialog(true)}
            disabled={!currentLocation}
            className="w-full"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Save Parking Spot
          </Button>
          
          {!currentLocation && (
            <Text size="xs" className="text-gray-500 text-center">
              Location required to save parking spot
            </Text>
          )}
        </Stack>
      </Card>
      
      {/* Save Dialog */}
      <SaveSpotDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveSpot}
        isSaving={isSaving}
      />
    </>
  )
}

/**
 * Dialog for saving a new parking spot
 */
function SaveSpotDialog({
  open,
  onOpenChange,
  onSave,
  isSaving
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => void
  isSaving: boolean
}) {
  const [notes, setNotes] = useState('')
  const [floor, setFloor] = useState('')
  const [section, setSection] = useState('')
  const [spotNumber, setSpotNumber] = useState('')
  
  const handleSubmit = () => {
    onSave({
      notes: notes || undefined,
      floor: floor || undefined,
      section: section || undefined,
      spotNumber: spotNumber || undefined
    })
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Parking Spot</DialogTitle>
          <DialogDescription>
            Add details to help you find your car later
          </DialogDescription>
        </DialogHeader>
        
        <Stack spacing="md">
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Near the blue sign"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="floor">Floor (Optional)</Label>
            <Input
              id="floor"
              placeholder="e.g., Level 3"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <Flex gap="sm">
            <div className="flex-1">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                placeholder="e.g., A"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex-1">
              <Label htmlFor="spotNumber">Spot #</Label>
              <Input
                id="spotNumber"
                placeholder="e.g., 42"
                value={spotNumber}
                onChange={(e) => setSpotNumber(e.target.value)}
                className="mt-1"
              />
            </div>
          </Flex>
          
          <Flex gap="sm">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Spot'}
            </Button>
          </Flex>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Dialog for editing an existing parking spot
 */
function EditSpotDialog({
  open,
  onOpenChange,
  spot,
  onSave
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  spot: any
  onSave: (spotId: string, updates: any) => Promise<any>
}) {
  const [notes, setNotes] = useState(spot.notes || '')
  const [floor, setFloor] = useState(spot.floor || '')
  const [section, setSection] = useState(spot.section || '')
  const [spotNumber, setSpotNumber] = useState(spot.spotNumber || '')
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSubmit = async () => {
    setIsSaving(true)
    
    try {
      await onSave(spot.id, {
        notes: notes || undefined,
        floor: floor || undefined,
        section: section || undefined,
        spotNumber: spotNumber || undefined
      })
      
      onOpenChange(false)
    } catch (err) {
      alert('Failed to update parking spot')
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Parking Spot</DialogTitle>
        </DialogHeader>
        
        <Stack spacing="md">
          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              placeholder="e.g., Near the blue sign"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-floor">Floor</Label>
            <Input
              id="edit-floor"
              placeholder="e.g., Level 3"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <Flex gap="sm">
            <div className="flex-1">
              <Label htmlFor="edit-section">Section</Label>
              <Input
                id="edit-section"
                placeholder="e.g., A"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex-1">
              <Label htmlFor="edit-spotNumber">Spot #</Label>
              <Input
                id="edit-spotNumber"
                placeholder="e.g., 42"
                value={spotNumber}
                onChange={(e) => setSpotNumber(e.target.value)}
                className="mt-1"
              />
            </div>
          </Flex>
          
          <Flex gap="sm">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Flex>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
