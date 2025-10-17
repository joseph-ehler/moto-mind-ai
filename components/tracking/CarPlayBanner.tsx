/**
 * CarPlay/Android Auto Connection Banner
 * 
 * Displays when car connection is detected with confidence scoring details.
 * Provides auto-start toggle and connection information.
 * 
 * @module components/tracking/CarPlayBanner
 */

'use client'

import { useState, useEffect } from 'react'
import { useCarPlayDetection } from '@/hooks/useCarPlayDetection'
import { Stack, Flex, Text } from '@/components/design-system'
import { Card, Button, Badge } from '@/components/ui'
import { Car, Wifi, Zap, Bluetooth, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CarPlayBannerProps {
  /** Callback when user wants to start tracking */
  onAutoStart?: () => void
  /** Whether tracking is currently active */
  isTracking?: boolean
  /** Minimum confidence level to show banner (default: 'medium') */
  minimumConfidence?: 'low' | 'medium' | 'high' | 'very-high'
}

/**
 * Banner component showing CarPlay/Android Auto connection status
 * 
 * @example
 * ```tsx
 * <CarPlayBanner
 *   onAutoStart={() => startTracking()}
 *   isTracking={trackingActive}
 *   minimumConfidence="medium"
 * />
 * ```
 */
export function CarPlayBanner({ 
  onAutoStart, 
  isTracking = false,
  minimumConfidence = 'medium' 
}: CarPlayBannerProps) {
  const signals = useCarPlayDetection()
  const [autoStartEnabled, setAutoStartEnabled] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  
  // Load auto-start preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('carplay_autostart')
      setAutoStartEnabled(saved === 'true')
    }
  }, [])
  
  // Auto-start tracking if enabled and car connected
  useEffect(() => {
    if (!signals || isTracking) return
    
    // Check if confidence meets minimum
    const confidenceLevels = ['low', 'medium', 'high', 'very-high']
    const minIndex = confidenceLevels.indexOf(minimumConfidence)
    const currentIndex = confidenceLevels.indexOf(signals.confidence.level)
    
    const meetsConfidence = currentIndex >= minIndex
    
    if (autoStartEnabled && meetsConfidence && onAutoStart) {
      console.log('[CarPlayBanner] Auto-starting tracking - car detected')
      onAutoStart()
    }
  }, [signals, autoStartEnabled, isTracking, minimumConfidence, onAutoStart])
  
  const handleEnableAutoStart = () => {
    setAutoStartEnabled(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('carplay_autostart', 'true')
    }
  }
  
  const handleDisableAutoStart = () => {
    setAutoStartEnabled(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('carplay_autostart', 'false')
    }
  }
  
  // Don't show if no signals or confidence too low
  if (!signals) return null
  
  const confidenceLevels = ['low', 'medium', 'high', 'very-high']
  const minIndex = confidenceLevels.indexOf(minimumConfidence)
  const currentIndex = confidenceLevels.indexOf(signals.confidence.level)
  
  if (currentIndex < minIndex) return null
  
  // Determine connection icon and label
  const connectionIcon = signals.connectionType === 'wireless' 
    ? <Wifi className="w-5 h-5" />
    : <Zap className="w-5 h-5" />
  
  const connectionLabel = signals.connectionType === 'wireless'
    ? 'Wireless'
    : signals.connectionType === 'wired'
    ? 'Wired'
    : 'Unknown'
  
  // Badge color based on confidence
  const confidenceColor = 
    signals.confidence.level === 'very-high' ? 'bg-green-500' :
    signals.confidence.level === 'high' ? 'bg-blue-500' :
    signals.confidence.level === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
  
  const confidenceTextColor = 
    signals.confidence.level === 'very-high' ? 'text-green-700' :
    signals.confidence.level === 'high' ? 'text-blue-700' :
    signals.confidence.level === 'medium' ? 'text-yellow-700' : 'text-gray-700'
  
  return (
    <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none shadow-lg">
      <Stack spacing="sm">
        {/* Header */}
        <Flex align="center" justify="between">
          <Flex align="center" gap="sm">
            <Car className="w-5 h-5" />
            {connectionIcon}
            <div>
              <Text className="font-semibold text-white">
                {signals.signals.displayMode === 'carplay' && 'CarPlay Connected'}
                {signals.signals.displayMode === 'android-auto' && 'Android Auto Connected'}
                {signals.signals.displayMode === 'normal' && 'Car Connected'}
              </Text>
              <Text size="xs" className="text-white/80">
                {connectionLabel} connection detected
              </Text>
            </div>
          </Flex>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-white hover:bg-white/20"
          >
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <>
                <Info className="w-4 h-4 mr-1" />
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </Flex>
        
        {/* Confidence and Signal Badges */}
        <Flex gap="sm" wrap="wrap">
          <Badge 
            variant="secondary" 
            className={cn(
              'capitalize',
              confidenceColor,
              'text-white border-white/40'
            )}
          >
            {signals.confidence.level.replace('-', ' ')} confidence 
            ({signals.confidence.score}%)
          </Badge>
          
          {signals.signals.carBluetooth && (
            <Badge variant="outline" className="bg-white/20 text-white border-white/40">
              <Bluetooth className="w-3 h-3 mr-1" />
              Bluetooth
            </Badge>
          )}
          
          {signals.signals.carWiFi && (
            <Badge variant="outline" className="bg-white/20 text-white border-white/40">
              <Wifi className="w-3 h-3 mr-1" />
              WiFi
            </Badge>
          )}
          
          {signals.signals.charging && (
            <Badge variant="outline" className="bg-white/20 text-white border-white/40">
              <Zap className="w-3 h-3 mr-1" />
              Charging
            </Badge>
          )}
        </Flex>
        
        {/* Details (expandable) */}
        {showDetails && (
          <div className="bg-white/10 rounded-lg p-3 text-sm">
            <Text className="font-semibold text-white mb-2">
              Detection Details:
            </Text>
            <ul className="space-y-1 text-white/90 text-xs">
              {signals.confidence.reasons.map((reason, i) => (
                <li key={i}>✓ {reason}</li>
              ))}
            </ul>
            
            {signals.signals.screenResolution.matches && (
              <Text size="xs" className="text-white/70 mt-2">
                Display: {signals.signals.screenResolution.type}
              </Text>
            )}
          </div>
        )}
        
        {/* Auto-start Controls */}
        {!isTracking && (
          <div className="border-t border-white/20 pt-3 mt-1">
            {!autoStartEnabled ? (
              <div>
                <Text size="sm" className="text-white/90 mb-2">
                  Enable auto-start to begin tracking automatically when you connect to your car.
                </Text>
                <Button 
                  onClick={handleEnableAutoStart}
                  variant="secondary"
                  size="sm"
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-white/40"
                >
                  Enable Auto-Start
                </Button>
              </div>
            ) : (
              <Stack spacing="xs">
                <Flex align="center" justify="between">
                  <Text size="sm" className="text-white/90">
                    ✓ Auto-start enabled
                  </Text>
                  <Button
                    onClick={handleDisableAutoStart}
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-white/10 h-auto py-1 px-2"
                  >
                    Disable
                  </Button>
                </Flex>
                <Text size="xs" className="text-white/70">
                  Tracking will start automatically when you connect to your car
                </Text>
              </Stack>
            )}
          </div>
        )}
        
        {/* Already tracking message */}
        {isTracking && autoStartEnabled && (
          <div className="border-t border-white/20 pt-3 mt-1">
            <Text size="sm" className="text-white/90 text-center">
              ✓ Tracking active • Auto-start enabled
            </Text>
          </div>
        )}
      </Stack>
    </Card>
  )
}
