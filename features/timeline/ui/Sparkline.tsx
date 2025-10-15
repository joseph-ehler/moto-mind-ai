/**
 * Sparkline Component
 * 
 * Simple inline chart for showing trends
 * Perfect for month headers and stats
 */

'use client'

import { useMemo } from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  showTrend?: boolean
}

export function Sparkline({ 
  data, 
  width = 60, 
  height = 20, 
  color = '#3b82f6',
  showTrend = false
}: SparklineProps) {
  const { points, trend } = useMemo(() => {
    if (data.length === 0) return { points: '', trend: 0 }
    
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    
    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * width
        const y = height - ((value - min) / range) * height
        return `${x},${y}`
      })
      .join(' ')
    
    // Calculate trend (simple: last value vs first value)
    const trend = data[data.length - 1] - data[0]
    
    return { points, trend }
  }, [data, width, height])
  
  if (data.length === 0) return null
  
  const trendColor = trend > 0 ? '#ef4444' : trend < 0 ? '#10b981' : '#6b7280'
  const trendIcon = trend > 0 ? '↗' : trend < 0 ? '↘' : '→'
  
  return (
    <div className="flex items-center gap-1.5">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />
        {/* Optional: Fill area under line */}
        <polyline
          points={`0,${height} ${points} ${width},${height}`}
          fill={color}
          fillOpacity="0.1"
          stroke="none"
        />
      </svg>
      
      {showTrend && (
        <span 
          className="text-xs font-semibold"
          style={{ color: trendColor }}
        >
          {trendIcon}
        </span>
      )}
    </div>
  )
}

/**
 * Mini Sparkline for inline use
 */
export function MiniSparkline({ data, color = '#3b82f6' }: { data: number[], color?: string }) {
  return <Sparkline data={data} width={40} height={16} color={color} />
}
