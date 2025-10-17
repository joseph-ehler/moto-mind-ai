/**
 * Speedometer Component
 * 
 * Visual speed gauge with needle display
 */

'use client'

import { Card, Stack, Text } from '@/components/design-system'
import { formatSpeed } from '@/lib/tracking/utils'

interface SpeedometerProps {
  speed: number // meters per second
  maxSpeed?: number
  unit?: 'imperial' | 'metric'
}

export function Speedometer({ speed, maxSpeed = 0, unit = 'imperial' }: SpeedometerProps) {
  const mph = speed * 2.23694
  const maxMph = maxSpeed * 2.23694
  
  // Calculate needle rotation (0° = 0mph, 180° = 120mph)
  const maxDisplaySpeed = 120
  const rotation = Math.min((mph / maxDisplaySpeed) * 180, 180)

  return (
    <Card className="p-6">
      <Stack spacing="md">
        <Text className="text-sm font-medium text-center">Current Speed</Text>
        
        {/* Speedometer Gauge */}
        <div className="relative w-full aspect-video flex items-center justify-center">
          {/* Arc background */}
          <svg
            viewBox="0 0 200 120"
            className="w-full h-full"
          >
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-gray-200"
            />
            
            {/* Speed zones */}
            <path
              d="M 20 100 A 80 80 0 0 1 100 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-green-500"
              opacity="0.3"
            />
            <path
              d="M 100 20 A 80 80 0 0 1 140 35"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-yellow-500"
              opacity="0.3"
            />
            <path
              d="M 140 35 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-red-500"
              opacity="0.3"
            />
            
            {/* Tick marks */}
            {Array.from({ length: 13 }, (_, i) => {
              const angle = i * 15 - 90
              const innerRadius = 70
              const outerRadius = 76
              const x1 = 100 + innerRadius * Math.cos((angle * Math.PI) / 180)
              const y1 = 100 + innerRadius * Math.sin((angle * Math.PI) / 180)
              const x2 = 100 + outerRadius * Math.cos((angle * Math.PI) / 180)
              const y2 = 100 + outerRadius * Math.sin((angle * Math.PI) / 180)
              
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-400"
                />
              )
            })}
            
            {/* Speed labels */}
            <text x="25" y="105" className="text-[8px] fill-current text-gray-600">0</text>
            <text x="95" y="25" className="text-[8px] fill-current text-gray-600">60</text>
            <text x="170" y="105" className="text-[8px] fill-current text-gray-600">120</text>
            
            {/* Needle */}
            <g transform={`rotate(${rotation - 90} 100 100)`}>
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="35"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-black"
              />
              <circle
                cx="100"
                cy="100"
                r="6"
                fill="currentColor"
                className="text-black"
              />
            </g>
          </svg>
          
          {/* Center speed display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
            <p className="text-4xl font-bold">{Math.round(mph)}</p>
            <p className="text-sm text-muted-foreground">mph</p>
          </div>
        </div>
        
        {/* Max speed */}
        <div className="text-center text-sm text-muted-foreground">
          Max: {formatSpeed(maxSpeed, unit)}
        </div>
      </Stack>
    </Card>
  )
}
