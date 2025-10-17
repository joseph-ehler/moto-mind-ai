/**
 * Tracking Control Panel
 * 
 * Start/stop/pause controls for GPS tracking
 */

'use client'

import { Play, Square, Pause, Settings } from 'lucide-react'
import { Button } from '@/components/ui'
import { Card } from '@/components/design-system'
import type { TrackingStatus } from '@/lib/tracking/types'

interface ControlPanelProps {
  status: TrackingStatus
  onStart: () => void
  onStop: () => void
  onPause: () => void
  onResume: () => void
  disabled?: boolean
}

export function ControlPanel({
  status,
  onStart,
  onStop,
  onPause,
  onResume,
  disabled = false
}: ControlPanelProps) {
  const isActive = status === 'active'
  const isPaused = status === 'paused'
  const isIdle = status === 'idle'
  const isStarting = status === 'starting'
  const isStopping = status === 'stopping'

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`h-3 w-3 rounded-full ${
                isActive
                  ? 'bg-green-500 animate-pulse'
                  : isPaused
                  ? 'bg-yellow-500'
                  : 'bg-gray-300'
              }`}
            />
            {isActive && (
              <div className="absolute inset-0 h-3 w-3 rounded-full bg-green-500 animate-ping opacity-75" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {isActive && 'Tracking Active'}
              {isPaused && 'Tracking Paused'}
              {isIdle && 'Ready to Track'}
              {isStarting && 'Starting...'}
              {isStopping && 'Stopping...'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isActive && 'Recording your trip'}
              {isPaused && 'Tracking paused'}
              {isIdle && 'Press start to begin'}
              {isStarting && 'Requesting permissions...'}
              {isStopping && 'Saving data...'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {isIdle && (
            <Button
              onClick={onStart}
              disabled={disabled || isStarting}
              size="lg"
              className="gap-2"
            >
              <Play className="h-5 w-5" />
              Start Tracking
            </Button>
          )}

          {isActive && (
            <>
              <Button
                onClick={onPause}
                disabled={disabled}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Pause className="h-5 w-5" />
                Pause
              </Button>
              <Button
                onClick={onStop}
                disabled={disabled || isStopping}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <Square className="h-5 w-5" />
                Stop
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button
                onClick={onResume}
                disabled={disabled}
                size="lg"
                className="gap-2"
              >
                <Play className="h-5 w-5" />
                Resume
              </Button>
              <Button
                onClick={onStop}
                disabled={disabled || isStopping}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <Square className="h-5 w-5" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
