/**
 * iOS-Safe Track Page
 * Minimal version that works on iOS - no fancy features
 */

'use client'

import { useState } from 'react'
import { Container, Section, Stack, Heading, Text } from '@/components/design-system'
import { Button, Alert, AlertDescription } from '@/components/ui'
import { MapPin, Play, Square } from 'lucide-react'
import { TopNav } from '@/components/nav/TopNav'

export default function TrackPageIOSSafe() {
  const [isTracking, setIsTracking] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)

  const handleStart = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported on this device')
      return
    }

    try {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setIsTracking(true)
          setError(null)
        },
        (err) => {
          setError(`GPS Error: ${err.message}`)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      )
      setWatchId(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start tracking')
    }
  }

  const handleStop = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsTracking(false)
  }

  return (
    <>
      <TopNav />
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Stack spacing="xl">
            <div>
              <Heading level="hero">Vehicle Tracking</Heading>
              <Text className="text-muted-foreground">
                Minimal GPS tracking - testing iOS compatibility
              </Text>
            </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {location && (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                <strong>Location:</strong><br />
                Lat: {location.lat.toFixed(6)}<br />
                Lng: {location.lng.toFixed(6)}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            {!isTracking ? (
              <Button onClick={handleStart} size="lg">
                <Play className="h-5 w-5 mr-2" />
                Start Tracking
              </Button>
            ) : (
              <Button onClick={handleStop} variant="destructive" size="lg">
                <Square className="h-5 w-5 mr-2" />
                Stop Tracking
              </Button>
            )}
          </div>

          {isTracking && (
            <Alert>
              <AlertDescription>
                ✅ Tracking active - location updating
              </AlertDescription>
            </Alert>
          )}
        </Stack>
      </Section>
    </Container>
    </>
  )
}
