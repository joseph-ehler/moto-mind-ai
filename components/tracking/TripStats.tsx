/**
 * Trip Statistics Display
 * 
 * Shows current trip stats: distance, duration, speed, etc.
 */

'use client'

import { Navigation, Clock, Gauge, Activity, Battery, BatteryCharging, Wifi, WifiOff } from 'lucide-react'
import { Card, Grid, Stack, Text } from '@/components/design-system'
import { formatDistance, formatDuration, formatSpeed } from '@/lib/tracking/utils'
import type { TrackingState } from '@/lib/tracking/types'

interface TripStatsProps {
  state: TrackingState
}

export function TripStats({ state }: TripStatsProps) {
  const {
    distanceTraveled,
    duration,
    maxSpeed,
    avgSpeed,
    currentLocation,
    pointsRecorded,
    batteryLevel,
    isCharging,
    isOnline
  } = state

  const currentSpeed = currentLocation?.speed || 0

  return (
    <Grid columns="auto" gap="md">
      {/* Distance */}
      <Card className="p-4">
        <Stack spacing="sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <Text className="text-sm font-medium">Distance</Text>
          </div>
          <div>
            <p className="text-3xl font-bold">{formatDistance(distanceTraveled)}</p>
          </div>
        </Stack>
      </Card>

      {/* Duration */}
      <Card className="p-4">
        <Stack spacing="sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <Text className="text-sm font-medium">Duration</Text>
          </div>
          <div>
            <p className="text-3xl font-bold">{formatDuration(duration)}</p>
          </div>
        </Stack>
      </Card>

      {/* Current Speed */}
      <Card className="p-4">
        <Stack spacing="sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gauge className="h-4 w-4" />
            <Text className="text-sm font-medium">Current Speed</Text>
          </div>
          <div>
            <p className="text-3xl font-bold">{formatSpeed(currentSpeed)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Max: {formatSpeed(maxSpeed)}
            </p>
          </div>
        </Stack>
      </Card>

      {/* Average Speed */}
      <Card className="p-4">
        <Stack spacing="sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Navigation className="h-4 w-4" />
            <Text className="text-sm font-medium">Average Speed</Text>
          </div>
          <div>
            <p className="text-3xl font-bold">{formatSpeed(avgSpeed)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {pointsRecorded} points recorded
            </p>
          </div>
        </Stack>
      </Card>

      {/* System Status */}
      <Card className="p-4 col-span-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Battery */}
            <div className="flex items-center gap-2">
              {isCharging ? (
                <BatteryCharging
                  className="h-4 w-4 text-green-500"
                />
              ) : (
                <Battery
                  className={`h-4 w-4 ${
                    batteryLevel < 0.2 ? 'text-red-500' : 'text-muted-foreground'
                  }`}
                />
              )}
              <Text className="text-sm">
                {Math.round(batteryLevel * 100)}%{isCharging && ' ⚡'}
              </Text>
            </div>

            {/* Network */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-500" />
              )}
              <Text className="text-sm">
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </div>

            {/* Location Accuracy */}
            {currentLocation && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Text className="text-sm">
                  ±{Math.round(currentLocation.accuracy)}m
                </Text>
              </div>
            )}
          </div>

          {/* Coordinates */}
          {currentLocation && (
            <div className="text-right">
              <Text className="text-xs text-muted-foreground font-mono">
                {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </Text>
            </div>
          )}
        </div>
      </Card>
    </Grid>
  )
}
