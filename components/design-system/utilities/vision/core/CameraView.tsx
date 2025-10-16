/**
 * CameraView Component
 * 
 * Pure camera UI - video display with controls
 * Uses design system primitives
 */

import React from 'react'
import { Camera, ArrowLeft } from 'lucide-react'
import { Flex } from '../../../primitives/Layout'
import { Button } from '../../../primitives/Button'
import { Text } from '../../../primitives/Typography'
import type { FrameGuideType } from '../types'
import { FrameGuide } from './FrameGuide'

export interface CameraViewProps {
  // Refs
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  
  // State
  isProcessing: boolean
  instructions: string
  frameGuide: FrameGuideType
  isMobile: boolean
  
  // Actions
  onCapture: () => void
  onBack: () => void
  
  // Optional
  className?: string
  
  // Plugin system
  pluginOverlays?: React.ReactNode[]
  pluginToolbar?: React.ReactNode[]
}

/**
 * Camera view with video, overlay, and controls
 * Full screen black background for focus
 */
export function CameraView({
  videoRef,
  canvasRef,
  isProcessing,
  instructions,
  frameGuide,
  isMobile,
  onCapture,
  onBack,
  className,
  pluginOverlays = [],
  pluginToolbar = []
}: CameraViewProps) {
  // Mirror video for front-facing camera (desktop), but not rear camera (mobile)
  // This gives a natural selfie experience on desktop and correct orientation on mobile
  const shouldMirror = !isMobile
  
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{
          transform: shouldMirror ? 'scaleX(-1)' : 'none'
        }}
      />
      
      {/* Hidden canvas for capture */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* Frame guide overlay */}
      <FrameGuide type={frameGuide} />
      
      {/* Plugin overlays */}
      {pluginOverlays.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {pluginOverlays.map((overlay, index) => (
            <div key={index} className="pointer-events-auto">
              {overlay}
            </div>
          ))}
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        {/* Instructions */}
        <div className="text-center mb-6">
          <Text className="text-white text-lg font-medium mb-2">
            {instructions}
          </Text>
          {isProcessing && (
            <Text className="text-blue-400 text-sm">
              Processing image...
            </Text>
          )}
        </div>

        {/* Control buttons */}
        <Flex align="center" justify="center" gap="lg">
          {/* Back button */}
          <Button
            onClick={onBack}
            variant="ghost"
            size="lg"
            className="text-white border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>

          {/* Capture button */}
          <Button
            onClick={onCapture}
            disabled={isProcessing}
            size="lg"
            className="w-20 h-20 rounded-full bg-white text-black hover:bg-gray-100 disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-8 h-8" />
            )}
          </Button>

          {/* Spacer for centering */}
          <div className="w-16" />
        </Flex>
        
        {/* Plugin toolbar */}
        {pluginToolbar.length > 0 && (
          <Flex align="center" justify="center" gap="sm" className="mt-4">
            {pluginToolbar.map((toolbar, index) => (
              <React.Fragment key={index}>
                {toolbar}
              </React.Fragment>
            ))}
          </Flex>
        )}
      </div>
    </div>
  )
}
