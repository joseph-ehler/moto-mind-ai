/**
 * FrameGuide Component
 * 
 * Visual overlay to guide camera capture
 * Different guides for different capture types
 */

import React from 'react'
import { cn } from '@/lib/utils'
import type { FrameGuideType } from '../types'

export interface FrameGuideProps {
  type: FrameGuideType
  className?: string
}

/**
 * Get frame dimensions and styling based on capture type
 */
function getFrameStyle(type: FrameGuideType): string {
  const styles = {
    'document-frame': 'w-[85%] max-w-md aspect-[8.5/11]', // Letter size ratio
    'vin-plate': 'w-[90%] max-w-sm h-20',                 // Wide rectangle
    'license-plate': 'w-[85%] max-w-sm h-24',             // Plate dimensions
    'odometer-display': 'w-64 h-64 rounded-full',         // Circular
    'receipt-frame': 'w-[70%] max-w-xs aspect-[3/4]',     // Tall rectangle
    'dashboard-cluster': 'w-[90%] max-w-lg aspect-[16/9]' // Wide view
  }
  return styles[type]
}

/**
 * Get border styling based on capture type
 */
function getBorderStyle(type: FrameGuideType): string {
  const baseStyle = 'border-4 border-white/80'
  
  if (type === 'odometer-display') {
    return `${baseStyle} border-dashed` // Dashed for circular
  }
  
  return baseStyle
}

/**
 * Corner guides for rectangular frames
 */
function CornerGuides() {
  const cornerClass = "absolute w-6 h-6 border-white/80"
  
  return (
    <>
      {/* Top left */}
      <div className={cn(cornerClass, "top-0 left-0 border-t-4 border-l-4")} />
      
      {/* Top right */}
      <div className={cn(cornerClass, "top-0 right-0 border-t-4 border-r-4")} />
      
      {/* Bottom left */}
      <div className={cn(cornerClass, "bottom-0 left-0 border-b-4 border-l-4")} />
      
      {/* Bottom right */}
      <div className={cn(cornerClass, "bottom-0 right-0 border-b-4 border-r-4")} />
    </>
  )
}

/**
 * Get instruction text for capture type
 */
function getDefaultInstructions(type: FrameGuideType): string {
  const instructions = {
    'document-frame': 'Position document within frame',
    'vin-plate': 'Center VIN plate in frame',
    'license-plate': 'Align license plate in frame',
    'odometer-display': 'Center odometer in circle',
    'receipt-frame': 'Position receipt within frame',
    'dashboard-cluster': 'Include gauges and warning lights'
  }
  return instructions[type]
}

/**
 * Frame guide overlay component
 */
export function FrameGuide({ type, className }: FrameGuideProps) {
  const showCorners = type !== 'odometer-display'
  
  return (
    <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none", className)}>
      {/* Frame outline */}
      <div className={cn(
        "relative",
        getFrameStyle(type),
        getBorderStyle(type)
      )}>
        {/* Corner guides */}
        {showCorners && <CornerGuides />}
        
        {/* Dashboard specific help text */}
        {type === 'dashboard-cluster' && (
          <div className="absolute -top-8 left-0 right-0 text-center">
            <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full inline-block">
              Include gauges and warning lights
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom instruction text */}
      <div className="absolute bottom-24 left-0 right-0 text-center px-4">
        <div className="text-white text-base font-medium bg-black/50 px-4 py-2 rounded-full inline-block">
          {getDefaultInstructions(type)}
        </div>
      </div>
    </div>
  )
}
