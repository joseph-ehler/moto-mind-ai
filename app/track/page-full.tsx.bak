/**
 * Vehicle Tracking Page
 * 
 * Real-time GPS tracking with live map display
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Container, Section, Stack, Heading, Text } from '@/components/design-system'
import { Alert, AlertDescription } from '@/components/ui'
import { ControlPanel } from '@/components/tracking/ControlPanel'
import { TripStats } from '@/components/tracking/TripStats'
import { Speedometer } from '@/components/tracking/Speedometer'
import { CarPlayBanner } from '@/components/tracking/CarPlayBanner'
import { ParkingMemoryWidget } from '@/components/parking/ParkingMemoryWidget'
import { SmartVehicleTracker } from '@/lib/tracking'
import type { TrackingState, LocationPoint, CrashDetection } from '@/lib/tracking/types'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

export default function TrackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tracker, setTracker] = useState<SmartVehicleTracker | null>(null)
  const [trackingState, setTrackingState] = useState<TrackingState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [initError, setInitError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/track')
    }
  }, [status, router])

  // Initialize tracker
  useEffect(() => {
    if (status !== 'authenticated') return

    const initTracker = async () => {
      try {
        setInitError(null)
        
        const newTracker = new SmartVehicleTracker({
          autoStart: false,
          batteryAware: false, // Disable for iOS compatibility
          offlineSupport: false, // Disable for iOS compatibility
          keepAwake: false, // Not supported on iOS
          highAccuracy: true,
          updateInterval: 1000
        })

        // Give it a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 100))

        // Listen to state changes
        newTracker.on('state-change', (state: TrackingState) => {
          setTrackingState(state)
          if (state.error) {
            setError(state.error)
          }
        })

        // Listen to location updates
        newTracker.on('location', (location: LocationPoint) => {
          console.log('[Track] Location update:', location)
        })

        // Listen to crash detection
        newTracker.on('crash', (crash: CrashDetection) => {
          console.error('[Track] 💥 CRASH DETECTED:', crash)
          alert(`🚨 CRASH DETECTED!\nSeverity: ${crash.severity}\nAcceleration: ${crash.acceleration.toFixed(2)}G`)
        })

        // Listen to events
        newTracker.on('event', (event: any) => {
          console.log('[Track] Event:', event)
        })

        setTracker(newTracker)
        setTrackingState(newTracker.getState())
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize tracker'
        console.error('[Track] Init error:', err)
        setInitError(errorMsg)
        setError(errorMsg)
      }
    }

    initTracker()

    return () => {
      if (tracker) {
        try {
          tracker.destroy()
        } catch (err) {
          console.error('[Track] Cleanup error:', err)
        }
      }
    }
  }, [status])

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as any })
        setPermissionGranted(result.state === 'granted')
        
        result.addEventListener('change', () => {
          setPermissionGranted(result.state === 'granted')
        })
      } catch (err) {
        console.warn('[Track] Permission check not supported')
        setPermissionGranted(null)
      }
    }

    checkPermissions()
  }, [])

  const handleStart = useCallback(async () => {
    if (!tracker) return
    
    setError(null)
    try {
      await tracker.startTracking()
      setPermissionGranted(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start tracking'
      setError(message)
      if (message.includes('denied')) {
        setPermissionGranted(false)
      }
    }
  }, [tracker])

  const handleStop = useCallback(async () => {
    if (!tracker) return
    
    try {
      await tracker.stopTracking()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop tracking')
    }
  }, [tracker])

  const handlePause = useCallback(() => {
    if (!tracker) return
    tracker.pauseTracking()
  }, [tracker])

  const handleResume = useCallback(() => {
    if (!tracker) return
    tracker.resumeTracking()
  }, [tracker])

  if (status === 'loading') {
    return (
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <div className="flex items-center justify-center min-h-[400px]">
            <Text>Loading...</Text>
          </div>
        </Section>
      </Container>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <Container size="md" useCase="articles">
      <Section spacing="lg">
        <Stack spacing="xl">
          {/* Header */}
          <div>
            <Heading level="hero">Vehicle Tracking</Heading>
            <Text className="text-muted-foreground">
              Real-time GPS tracking with automatic crash detection
            </Text>
          </div>

          {/* CarPlay/Android Auto Detection Banner */}
          <CarPlayBanner
            onAutoStart={handleStart}
            isTracking={trackingState?.status === 'active'}
            minimumConfidence="medium"
          />

          {/* Permission Alert */}
          {permissionGranted === false && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Location permission denied. Please enable location access in your browser settings to use tracking.
              </AlertDescription>
            </Alert>
          )}

          {/* Browser Support Alert */}
          {typeof navigator !== 'undefined' && !('geolocation' in navigator) && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Your browser doesn't support GPS tracking. Please use a modern browser like Chrome, Safari, or Firefox.
              </AlertDescription>
            </Alert>
          )}

          {/* Initialization Error Alert */}
          {initError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Initialization Error (iOS Debug):</strong><br />
                {initError}
                <br /><br />
                <strong>Details:</strong> Check if location permissions are enabled and try refreshing the page.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && !initError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Offline Mode Alert */}
          {trackingState && !trackingState.isOnline && trackingState.status === 'active' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You're offline. Location data is being saved locally and will sync when you're back online.
              </AlertDescription>
            </Alert>
          )}

          {/* Low Battery Alert */}
          {trackingState && trackingState.batteryLevel < 0.2 && trackingState.status === 'active' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Battery low ({Math.round(trackingState.batteryLevel * 100)}%). Tracking frequency has been reduced to save power.
              </AlertDescription>
            </Alert>
          )}

          {/* Control Panel */}
          {trackingState && (
            <ControlPanel
              status={trackingState.status}
              onStart={handleStart}
              onStop={handleStop}
              onPause={handlePause}
              onResume={handleResume}
              disabled={!tracker}
            />
          )}

          {/* Speedometer */}
          {trackingState && trackingState.currentLocation && (
            <Speedometer
              speed={trackingState.currentLocation.speed}
              maxSpeed={trackingState.maxSpeed}
            />
          )}

          {/* Trip Statistics */}
          {trackingState && trackingState.status !== 'idle' && (
            <TripStats state={trackingState} />
          )}

          {/* Parking Memory */}
          <ParkingMemoryWidget
            currentLocation={
              trackingState?.currentLocation
                ? {
                    latitude: trackingState.currentLocation.lat,
                    longitude: trackingState.currentLocation.lng
                  }
                : undefined
            }
            lastSessionId={trackingState?.sessionId || undefined}
            onSpotSaved={() => {
              console.log('[Track] Parking spot saved')
            }}
          />

          {/* Instructions */}
          {trackingState?.status === 'idle' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>How it works:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Press "Start Tracking" to begin recording your trip</li>
                  <li>• GPS will track your location, speed, and route</li>
                  <li>• Motion sensors detect crashes and sudden stops</li>
                  <li>• Data is saved offline and synced when online</li>
                  <li>• Battery-aware: adjusts frequency when battery is low</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Beta Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Beta Feature:</strong> This tracking system is in beta. For best results:
              <ul className="mt-1 space-y-1">
                <li>• Use on a mobile device for motion sensors</li>
                <li>• Allow location permissions when prompted</li>
                <li>• Keep the browser tab open during tracking</li>
                <li>• Install as a PWA for better background tracking</li>
              </ul>
            </AlertDescription>
          </Alert>
        </Stack>
      </Section>
    </Container>
  )
}
