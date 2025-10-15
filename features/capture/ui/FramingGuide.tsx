/**
 * Framing Guide Component
 * 
 * Visual overlay to help users frame documents/receipts properly
 */

'use client'

import React from 'react'
import { Text } from '@/components/design-system'

interface FramingGuideProps {
  eventType: string
  stepId?: string
  visible?: boolean
}

interface GuideConfig {
  x: string      // X position (percentage)
  y: string      // Y position (percentage)
  width: string  // Width (percentage)
  height: string // Height (percentage)
  label: string
  hint?: string
}

const GUIDE_CONFIGS: Record<string, GuideConfig> = {
  // Receipt guides (portrait, narrow)
  receipt: {
    x: '15%',
    y: '15%',
    width: '70%',
    height: '70%',
    label: 'Frame receipt inside box',
    hint: 'Make sure all text is visible'
  },
  
  // Odometer/gauge (landscape, small)
  odometer: {
    x: '10%',
    y: '30%',
    width: '80%',
    height: '40%',
    label: 'Frame odometer reading',
    hint: 'Ensure numbers are clear'
  },
  
  // Gauge (landscape, small)
  gauge: {
    x: '10%',
    y: '30%',
    width: '80%',
    height: '40%',
    label: 'Frame fuel gauge',
    hint: 'Capture the entire gauge'
  },
  
  // Document (portrait, large)
  document: {
    x: '10%',
    y: '10%',
    width: '80%',
    height: '80%',
    label: 'Frame entire document',
    hint: 'All corners should be visible'
  },
  
  // Default (general purpose)
  default: {
    x: '10%',
    y: '20%',
    width: '80%',
    height: '60%',
    label: 'Frame subject in box',
    hint: 'Center and fill the frame'
  }
}

export function FramingGuide({ eventType, stepId, visible = true }: FramingGuideProps) {
  if (!visible) return null

  // Determine which guide to show
  let guideConfig = GUIDE_CONFIGS.default
  
  if (stepId?.includes('receipt')) {
    guideConfig = GUIDE_CONFIGS.receipt
  } else if (stepId?.includes('odometer')) {
    guideConfig = GUIDE_CONFIGS.odometer
  } else if (stepId?.includes('gauge')) {
    guideConfig = GUIDE_CONFIGS.gauge
  } else if (stepId?.includes('document') || stepId?.includes('invoice')) {
    guideConfig = GUIDE_CONFIGS.document
  } else if (eventType === 'fuel') {
    guideConfig = GUIDE_CONFIGS.receipt
  } else if (eventType === 'service' || eventType === 'maintenance') {
    guideConfig = GUIDE_CONFIGS.document
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* SVG Overlay */}
      <svg className="w-full h-full">
        {/* Darkened edges */}
        <defs>
          <mask id="guide-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={guideConfig.x}
              y={guideConfig.y}
              width={guideConfig.width}
              height={guideConfig.height}
              fill="black"
              rx="8"
            />
          </mask>
        </defs>
        
        <rect
          width="100%"
          height="100%"
          fill="black"
          opacity="0.4"
          mask="url(#guide-mask)"
        />
        
        {/* Framing box */}
        <rect
          x={guideConfig.x}
          y={guideConfig.y}
          width={guideConfig.width}
          height={guideConfig.height}
          stroke="white"
          strokeWidth="3"
          strokeDasharray="20,10"
          fill="none"
          rx="8"
          opacity="0.9"
        />
        
        {/* Corner brackets */}
        {[
          { x: guideConfig.x, y: guideConfig.y }, // Top-left
          { x: `calc(${guideConfig.x} + ${guideConfig.width})`, y: guideConfig.y }, // Top-right
          { x: guideConfig.x, y: `calc(${guideConfig.y} + ${guideConfig.height})` }, // Bottom-left
          { x: `calc(${guideConfig.x} + ${guideConfig.width})`, y: `calc(${guideConfig.y} + ${guideConfig.height})` } // Bottom-right
        ].map((corner, i) => {
          const isRight = i === 1 || i === 3
          const isBottom = i === 2 || i === 3
          
          return (
            <g key={i}>
              {/* Horizontal bracket */}
              <line
                x1={corner.x}
                y1={corner.y}
                x2={`calc(${corner.x} ${isRight ? '-' : '+'} 30px)`}
                y2={corner.y}
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Vertical bracket */}
              <line
                x1={corner.x}
                y1={corner.y}
                x2={corner.x}
                y2={`calc(${corner.y} ${isBottom ? '-' : '+'} 30px)`}
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          )
        })}
      </svg>
      
      {/* Instructions */}
      <div className="absolute top-[8%] left-0 right-0 text-center">
        <div className="inline-block px-4 py-2 bg-black/70 rounded-full backdrop-blur-sm">
          <Text className="text-white text-sm font-semibold">
            {guideConfig.label}
          </Text>
        </div>
        {guideConfig.hint && (
          <div className="mt-2 inline-block px-3 py-1 bg-black/50 rounded-full backdrop-blur-sm">
            <Text className="text-white/80 text-xs">
              {guideConfig.hint}
            </Text>
          </div>
        )}
      </div>
      
      {/* Grid lines (subtle) */}
      <svg className="w-full h-full opacity-20">
        {/* Rule of thirds grid */}
        <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke="white" strokeWidth="1" />
        <line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke="white" strokeWidth="1" />
        <line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke="white" strokeWidth="1" />
        <line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke="white" strokeWidth="1" />
      </svg>
    </div>
  )
}
