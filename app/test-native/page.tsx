'use client'

import { useState } from 'react'
import { Container, Section, Stack, Heading, Text } from '@/components/design-system'
import { Button, Alert, AlertDescription, Card } from '@/components/ui'
import { MapPin, Play, Square, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function TestNativePage() {
  const [isTracking, setIsTracking] = useState(false)
  const [locations, setLocations] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [watcherId, setWatcherId] = useState<string | null>(null)

  const startBackgroundTracking = async () => {
    try {
      setError(null)
      
      // Check if we're in native app
      if (typeof window === 'undefined' || !(window as any).Capacitor) {
        setError('Not running in native app. Use: npm run cap:open:ios')
        return
      }

      // Import the plugin dynamically (only works in native)
      // @ts-ignore - dynamic import for native only
      const BackgroundGeolocation = (await import('@capacitor-community/background-geolocation')).BackgroundGeolocation

      // Request permission and start watching
      const watcher = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: "MotoMind is tracking your location",
          backgroundTitle: "Tracking Active",
          requestPermissions: true,
          stale: false,
          distanceFilter: 10, // Update every 10 meters
        },
        (location, error) => {
          if (error) {
            console.error('Background location error:', error)
            setError(JSON.stringify(error))
            return
          }

          if (location) {
            console.log('📍 Background location update:', location)
            setLocations(prev => [...prev, {
              lat: location.latitude,
              lng: location.longitude,
              accuracy: location.accuracy,
              time: new Date().toLocaleTimeString(),
              speed: location.speed,
              heading: location.bearing
            }].slice(-10)) // Keep last 10 locations
          }
        }
      )

      setWatcherId(watcher)
      setIsTracking(true)
      console.log('✅ Background tracking started!')
      
    } catch (err) {
      console.error('Error starting background tracking:', err)
      setError(err instanceof Error ? err.message : JSON.stringify(err))
    }
  }

  const stopBackgroundTracking = async () => {
    try {
      if (!watcherId) return

      // @ts-ignore - dynamic import for native only
      const BackgroundGeolocation = (await import('@capacitor-community/background-geolocation')).BackgroundGeolocation
      await BackgroundGeolocation.removeWatcher({ id: watcherId })
      
      setIsTracking(false)
      setWatcherId(null)
      console.log('⏹️ Background tracking stopped')
      
    } catch (err) {
      console.error('Error stopping background tracking:', err)
      setError(err instanceof Error ? err.message : JSON.stringify(err))
    }
  }

  return (
    <Container size="md" useCase="articles">
      <Section spacing="lg">
        <Stack spacing="xl">
          {/* Header */}
          <div>
            <Heading level="hero">Native Background Test</Heading>
            <Text className="text-muted-foreground">
              Testing background geolocation for magical auto-tracking
            </Text>
          </div>

          {/* Status */}
          {isTracking && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                ✅ Background tracking active! Put the app in background and move around.
              </AlertDescription>
            </Alert>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong><br />
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          {!isTracking && !error && (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                <strong>How to test:</strong><br />
                1. Make sure you opened this in Xcode (npm run cap:open:ios)<br />
                2. Press the button below<br />
                3. Grant location permissions (Always Allow)<br />
                4. Put app in background (home button)<br />
                5. Walk around or drive<br />
                6. Come back - see if locations were tracked!
              </AlertDescription>
            </Alert>
          )}

          {/* Controls */}
          <div className="flex gap-4">
            {!isTracking ? (
              <Button onClick={startBackgroundTracking} size="lg">
                <Play className="h-5 w-5 mr-2" />
                Start Background Tracking
              </Button>
            ) : (
              <Button onClick={stopBackgroundTracking} variant="destructive" size="lg">
                <Square className="h-5 w-5 mr-2" />
                Stop Tracking
              </Button>
            )}
          </div>

          {/* Location Updates */}
          {locations.length > 0 && (
            <Card>
              <Stack spacing="md">
                <Heading level={4}>Location Updates ({locations.length})</Heading>
                <div className="space-y-2">
                  {locations.map((loc, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-muted rounded-md font-mono text-sm"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <strong>Lat:</strong> {loc.lat.toFixed(6)}
                        </div>
                        <div>
                          <strong>Lng:</strong> {loc.lng.toFixed(6)}
                        </div>
                        <div>
                          <strong>Accuracy:</strong> ±{loc.accuracy.toFixed(0)}m
                        </div>
                        <div>
                          <strong>Time:</strong> {loc.time}
                        </div>
                        {loc.speed !== null && (
                          <div>
                            <strong>Speed:</strong> {(loc.speed * 2.237).toFixed(1)} mph
                          </div>
                        )}
                        {loc.heading !== null && (
                          <div>
                            <strong>Heading:</strong> {loc.heading.toFixed(0)}°
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Stack>
            </Card>
          )}

          {/* Debug Info */}
          <Card>
            <Stack spacing="sm">
              <Heading level={5}>Debug Info</Heading>
              <Text size="sm" className="font-mono">
                Is Native: {typeof window !== 'undefined' && (window as any).Capacitor ? '✅ Yes' : '❌ No'}<br />
                Tracking: {isTracking ? '✅ Active' : '❌ Inactive'}<br />
                Watcher ID: {watcherId || 'None'}<br />
                Location Count: {locations.length}
              </Text>
            </Stack>
          </Card>
        </Stack>
      </Section>
    </Container>
  )
}
