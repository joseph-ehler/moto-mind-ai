'use client'

/**
 * Stats/Metrics Cards
 * 
 * Premium stats and metrics components for dashboards
 * Includes trend indicators, sparklines, comparisons, and more
 * 
 * NOTE: Install recharts for advanced charts:
 * npm install recharts
 */

import React from 'react'
import { Stack, Flex } from '../primitives/Layout'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type TrendDirection = 'up' | 'down' | 'neutral'

export interface TrendData {
  value: number
  direction: TrendDirection
  label?: string
}

export interface ThresholdConfig {
  warning?: number
  danger?: number
  compare?: 'greater' | 'less'
}

// ============================================================================
// UTILITIES - Number formatting and helpers
// ============================================================================

export const formatters = {
  currency: (value: number, currency = 'USD') => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value),
  
  percent: (value: number, decimals = 1) => 
    `${value.toFixed(decimals)}%`,
  
  compact: (value: number) => 
    new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value),
  
  number: (value: number, decimals = 0) => 
    value.toLocaleString('en-US', { maximumFractionDigits: decimals }),
  
  duration: (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }
}

// ============================================================================
// 1. STAT CARD - Basic metric display
// ============================================================================

export interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: TrendData
  description?: string
  loading?: boolean
  onClick?: () => void
  tooltip?: string
  threshold?: ThresholdConfig
  showCopyButton?: boolean
  badge?: string
  animate?: boolean
}

/**
 * StatCard - Basic metric display card
 * 
 * @example
 * <StatCard
 *   label="Total Vehicles"
 *   value={12}
 *   trend={{ value: 8, direction: 'up', label: 'vs last month' }}
 *   icon={<Car />}
 * />
 */
export function StatCard({
  label,
  value,
  icon,
  trend,
  description,
  loading = false,
  onClick,
  tooltip,
  threshold,
  showCopyButton = false,
  badge,
  animate = true
}: StatCardProps) {
  const [copied, setCopied] = React.useState(false)
  const [showTooltip, setShowTooltip] = React.useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(String(value))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Determine threshold status
  const getThresholdStatus = () => {
    if (!threshold || typeof value !== 'number') return null
    const compare = threshold.compare || 'greater'
    
    if (threshold.danger !== undefined) {
      if (compare === 'greater' && value >= threshold.danger) return 'danger'
      if (compare === 'less' && value <= threshold.danger) return 'danger'
    }
    if (threshold.warning !== undefined) {
      if (compare === 'greater' && value >= threshold.warning) return 'warning'
      if (compare === 'less' && value <= threshold.warning) return 'warning'
    }
    return 'success'
  }

  const thresholdStatus = getThresholdStatus()
  const statusColors = {
    danger: 'border-red-200 bg-red-50',
    warning: 'border-amber-200 bg-amber-50',
    success: 'border-green-200 bg-green-50'
  }

  if (loading) {
    return (
      <div className="bg-white border border-black/5 rounded-2xl p-6">
        <Stack spacing="md">
          <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
          <div className="w-32 h-8 bg-slate-200 rounded animate-pulse" />
          <div className="w-20 h-3 bg-slate-200 rounded animate-pulse" />
        </Stack>
      </div>
    )
  }

  return (
    <div
      className={`
        bg-white border rounded-2xl p-6 transition-all
        ${thresholdStatus ? statusColors[thresholdStatus] : 'border-black/5'}
        ${onClick ? 'cursor-pointer hover:shadow-xl active:scale-[0.98]' : 'hover:shadow-lg'}
        ${animate ? 'animate-in fade-in slide-in-from-bottom-2 duration-300' : ''}
        relative group
      `}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black text-white text-xs rounded-lg whitespace-nowrap z-10 animate-in fade-in slide-in-from-bottom-1 duration-200">
          {tooltip}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45" />
        </div>
      )}

      {/* Badge */}
      {badge && (
        <div className="absolute top-3 right-3 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
          {badge}
        </div>
      )}

      <Stack spacing="md">
        <Flex align="center" justify="between">
          <span className="text-sm font-medium text-black/60">{label}</span>
          <Flex align="center" gap="sm">
            {showCopyButton && (
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded text-black/40 hover:text-black"
                aria-label="Copy value"
              >
                {copied ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            )}
            {icon && (
              <div className="text-black/40 [&>svg]:w-5 [&>svg]:h-5">
                {icon}
              </div>
            )}
          </Flex>
        </Flex>

        <div className="text-3xl font-bold text-black">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        {(trend || description) && (
          <div className="flex items-center gap-2">
            {trend && <TrendIndicator {...trend} />}
            {description && (
              <span className="text-xs text-black/50">{description}</span>
            )}
          </div>
        )}
      </Stack>
    </div>
  )
}

// ============================================================================
// 2. TREND INDICATOR - Shows trend with percentage
// ============================================================================

export interface TrendIndicatorProps extends TrendData {}

/**
 * TrendIndicator - Displays trend direction and percentage
 * 
 * @example
 * <TrendIndicator value={12} direction="up" label="vs last month" />
 */
export function TrendIndicator({ value, direction, label }: TrendIndicatorProps) {
  const config = {
    up: {
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )
    },
    down: {
      color: 'text-red-600',
      bg: 'bg-red-50',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )
    },
    neutral: {
      color: 'text-black/60',
      bg: 'bg-slate-100',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      )
    }
  }

  const { color, bg, icon } = config[direction]

  return (
    <div className={`inline-flex items-center gap-1 ${bg} ${color} px-2 py-0.5 rounded-md text-xs font-medium`}>
      {icon}
      <span>{value}%</span>
      {label && <span className="text-black/40 ml-0.5">{label}</span>}
    </div>
  )
}

// ============================================================================
// 3. SPARKLINE - Mini line chart
// ============================================================================

export interface SparklineProps {
  data: number[]
  color?: 'blue' | 'green' | 'red' | 'purple'
  height?: number
  showDots?: boolean
}

/**
 * Sparkline - Tiny line chart for trends
 * 
 * @example
 * <Sparkline data={[10, 20, 15, 30, 25, 35]} color="blue" />
 */
export function Sparkline({ 
  data, 
  color = 'blue', 
  height = 32,
  showDots = false
}: SparklineProps) {
  if (data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = ((max - value) / range) * height
    return `${x},${y}`
  }).join(' ')

  const colors = {
    blue: { stroke: 'stroke-blue-500', fill: 'fill-blue-500' },
    green: { stroke: 'stroke-green-500', fill: 'fill-green-500' },
    red: { stroke: 'stroke-red-500', fill: 'fill-red-500' },
    purple: { stroke: 'stroke-purple-500', fill: 'fill-purple-500' }
  }

  const { stroke, fill } = colors[color]

  return (
    <svg width="100%" height={height} className="overflow-visible">
      <polyline
        points={points}
        className={`${stroke} fill-none`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = ((max - value) / range) * height
        return (
          <circle
            key={index}
            cx={`${x}%`}
            cy={y}
            r="2"
            className={fill}
          />
        )
      })}
    </svg>
  )
}

// ============================================================================
// 4. METRIC WITH SPARKLINE - Combines metric and chart
// ============================================================================

export interface MetricWithSparklineProps {
  label: string
  value: string | number
  sparklineData: number[]
  trend?: TrendData
  sparklineColor?: 'blue' | 'green' | 'red' | 'purple'
}

/**
 * MetricWithSparkline - Metric card with inline sparkline
 * 
 * @example
 * <MetricWithSparkline
 *   label="Fuel Costs"
 *   value="$342"
 *   sparklineData={[100, 120, 110, 140, 130, 150]}
 *   trend={{ value: 12, direction: 'up' }}
 * />
 */
export function MetricWithSparkline({
  label,
  value,
  sparklineData,
  trend,
  sparklineColor = 'blue'
}: MetricWithSparklineProps) {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <Stack spacing="md">
        <span className="text-sm font-medium text-black/60">{label}</span>
        
        <Flex align="end" justify="between">
          <div>
            <div className="text-3xl font-bold text-black mb-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {trend && <TrendIndicator {...trend} />}
          </div>
          <div className="w-24">
            <Sparkline data={sparklineData} color={sparklineColor} height={40} />
          </div>
        </Flex>
      </Stack>
    </div>
  )
}

// ============================================================================
// 5. COMPARISON CARD - Compare two metrics
// ============================================================================

export interface ComparisonCardProps {
  label: string
  current: { label: string; value: number }
  previous: { label: string; value: number }
  unit?: string
}

/**
 * ComparisonCard - Compare current vs previous period
 * 
 * @example
 * <ComparisonCard
 *   label="Total Miles"
 *   current={{ label: 'This month', value: 1250 }}
 *   previous={{ label: 'Last month', value: 980 }}
 *   unit="miles"
 * />
 */
export function ComparisonCard({
  label,
  current,
  previous,
  unit
}: ComparisonCardProps) {
  const percentChange = previous.value > 0 
    ? ((current.value - previous.value) / previous.value) * 100 
    : 0
  const direction: TrendDirection = percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral'

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <Stack spacing="lg">
        <span className="text-sm font-medium text-black/60">{label}</span>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-black/40 mb-1">{current.label}</div>
            <div className="text-2xl font-bold text-black">
              {current.value.toLocaleString()}
              {unit && <span className="text-sm text-black/40 ml-1">{unit}</span>}
            </div>
          </div>

          <div>
            <div className="text-xs text-black/40 mb-1">{previous.label}</div>
            <div className="text-2xl font-bold text-black/60">
              {previous.value.toLocaleString()}
              {unit && <span className="text-sm text-black/40 ml-1">{unit}</span>}
            </div>
          </div>
        </div>

        <TrendIndicator 
          value={Math.abs(Math.round(percentChange))} 
          direction={direction}
          label="change"
        />
      </Stack>
    </div>
  )
}

// ============================================================================
// 6. PROGRESS METRIC - Show progress towards goal
// ============================================================================

export interface ProgressMetricProps {
  label: string
  current: number
  target: number
  unit?: string
  color?: 'blue' | 'green' | 'purple'
}

/**
 * ProgressMetric - Show progress towards a target
 * 
 * @example
 * <ProgressMetric
 *   label="Maintenance Budget"
 *   current={750}
 *   target={1000}
 *   unit="USD"
 * />
 */
export function ProgressMetric({
  label,
  current,
  target,
  unit,
  color = 'blue'
}: ProgressMetricProps) {
  const percentage = Math.min((current / target) * 100, 100)
  const remaining = Math.max(target - current, 0)

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600'
  }

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <Stack spacing="md">
        <span className="text-sm font-medium text-black/60">{label}</span>

        <Flex align="end" justify="between">
          <div>
            <div className="text-3xl font-bold text-black">
              {current.toLocaleString()}
              <span className="text-lg text-black/40 ml-1">/ {target.toLocaleString()}</span>
            </div>
            {unit && <div className="text-xs text-black/40 mt-1">{unit}</div>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-black">{Math.round(percentage)}%</div>
            <div className="text-xs text-black/40">{remaining.toLocaleString()} remaining</div>
          </div>
        </Flex>

        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${colorClasses[color]} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </Stack>
    </div>
  )
}

// ============================================================================
// 7. MULTI-METRIC CARD - Multiple metrics in one card
// ============================================================================

export interface MultiMetricItem {
  label: string
  value: string | number
  trend?: TrendData
}

export interface MultiMetricCardProps {
  title: string
  metrics: MultiMetricItem[]
  icon?: React.ReactNode
}

/**
 * MultiMetricCard - Display multiple related metrics
 * 
 * @example
 * <MultiMetricCard
 *   title="Vehicle Overview"
 *   metrics={[
 *     { label: 'Active', value: 8, trend: { value: 2, direction: 'up' }},
 *     { label: 'Maintenance Due', value: 3 },
 *     { label: 'Total Miles', value: '45.2K' }
 *   ]}
 * />
 */
export function MultiMetricCard({
  title,
  metrics,
  icon
}: MultiMetricCardProps) {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <Stack spacing="lg">
        <Flex align="center" justify="between">
          <h3 className="text-base font-semibold text-black">{title}</h3>
          {icon && (
            <div className="text-black/40 [&>svg]:w-5 [&>svg]:h-5">
              {icon}
            </div>
          )}
        </Flex>

        <div className="grid grid-cols-1 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-t border-black/5 first:border-t-0 first:pt-0">
              <span className="text-sm text-black/60">{metric.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-black">
                  {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                </span>
                {metric.trend && <TrendIndicator {...metric.trend} />}
              </div>
            </div>
          ))}
        </div>
      </Stack>
    </div>
  )
}

// ============================================================================
// 8. KPI CARD - Key Performance Indicator
// ============================================================================

export interface KPICardProps {
  label: string
  value: string | number
  target?: number
  trend?: TrendData
  status?: 'success' | 'warning' | 'danger'
  icon?: React.ReactNode
}

/**
 * KPICard - Premium KPI display
 * 
 * @example
 * <KPICard
 *   label="Average MPG"
 *   value={32.4}
 *   target={30}
 *   status="success"
 *   trend={{ value: 5, direction: 'up' }}
 * />
 */
export function KPICard({
  label,
  value,
  target,
  trend,
  status = 'success',
  icon
}: KPICardProps) {
  const statusConfig = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      accent: 'bg-green-500'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      accent: 'bg-amber-500'
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      accent: 'bg-red-500'
    }
  }

  const config = statusConfig[status]

  return (
    <div className={`${config.bg} border ${config.border} rounded-2xl p-6 hover:shadow-lg transition-shadow relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${config.accent}`} />
      
      <Stack spacing="md" className="pl-2">
        <Flex align="center" justify="between">
          <span className="text-sm font-medium text-black/60">{label}</span>
          {icon && (
            <div className="text-black/40 [&>svg]:w-5 [&>svg]:h-5">
              {icon}
            </div>
          )}
        </Flex>

        <div className="text-4xl font-bold text-black">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        <Flex align="center" gap="md">
          {trend && <TrendIndicator {...trend} />}
          {target && (
            <span className="text-xs text-black/40">
              Target: {target.toLocaleString()}
            </span>
          )}
        </Flex>
      </Stack>
    </div>
  )
}

// ============================================================================
// 9. STAT GROUP - Grid of related stats
// ============================================================================

export interface StatGroupProps {
  stats: StatCardProps[]
  columns?: 2 | 3 | 4
}

/**
 * StatGroup - Grid layout for multiple stats
 * 
 * @example
 * <StatGroup
 *   columns={3}
 *   stats={[
 *     { label: 'Total', value: 12 },
 *     { label: 'Active', value: 8 },
 *     { label: 'Inactive', value: 4 }
 *   ]}
 * />
 */
export function StatGroup({ stats, columns = 3 }: StatGroupProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}

// ============================================================================
// 10. ANIMATED COUNTER - Counts up to value
// ============================================================================

export interface AnimatedCounterProps {
  end: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
}

/**
 * AnimatedCounter - Number that animates from 0 to end
 * 
 * @example
 * <AnimatedCounter end={1234} duration={1000} prefix="$" />
 */
export function AnimatedCounter({
  end,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = ''
}: AnimatedCounterProps) {
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    let startTime: number | null = null
    const startValue = 0

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      const easeOutQuad = (t: number) => t * (2 - t)
      const currentCount = startValue + (end - startValue) * easeOutQuad(progress)
      
      setCount(currentCount)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [end, duration])

  return (
    <span>
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  )
}

// ============================================================================
// ELITE FEATURES - Advanced Stats & Charts
// ============================================================================

// 11. AREA CHART CARD - Smooth area chart with gradient
export interface AreaChartCardProps {
  label: string
  value: string | number
  data: Array<{ name: string; value: number }>
  trend?: TrendData
  color?: 'blue' | 'green' | 'purple' | 'red'
}

export function AreaChartCard({
  label,
  value,
  data,
  trend,
  color = 'blue'
}: AreaChartCardProps) {
  // Use React.useId() for stable SSR-safe IDs
  const gradientId = React.useId()

  if (data.length < 2) return null

  const max = Math.max(...data.map(d => d.value))
  const min = Math.min(...data.map(d => d.value))
  const range = max - min || 1

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 160 - ((item.value - min) / range) * 120
    return `${x},${y}`
  }).join(' ')

  const colors = {
    blue: { stroke: '#3B82F6', from: '#3B82F6', to: '#DBEAFE' },
    green: { stroke: '#10B981', from: '#10B981', to: '#D1FAE5' },
    purple: { stroke: '#8B5CF6', from: '#8B5CF6', to: '#EDE9FE' },
    red: { stroke: '#EF4444', from: '#EF4444', to: '#FEE2E2' }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <Stack spacing="lg">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        
        <Flex align="end" justify="between">
          <div>
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {trend && <TrendIndicator {...trend} />}
          </div>
        </Flex>

        <svg width="100%" height="200" className="overflow-visible mt-4">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={colors[color].from} stopOpacity="0.3" />
              <stop offset="100%" stopColor={colors[color].to} stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,180 ${points} 100,180`}
            fill={`url(#${gradientId})`}
            stroke="none"
          />
          <polyline
            points={points}
            fill="none"
            stroke={colors[color].stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Stack>
    </div>
  )
}

// 12. BAR CHART CARD - Mini bar chart
export interface BarChartCardProps {
  label: string
  data: Array<{ label: string; value: number; color?: string }>
  total?: number
}

export function BarChartCard({ label, data, total }: BarChartCardProps) {
  const max = total || Math.max(...data.map(d => d.value))

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <Stack spacing="lg">
        <h3 className="text-sm font-medium text-black/60">{label}</h3>
        
        <Stack spacing="md">
          {data.map((item, index) => {
            const percentage = (item.value / max) * 100
            return (
              <div key={index}>
                <Flex justify="between" className="mb-1.5">
                  <span className="text-sm text-black/70">{item.label}</span>
                  <span className="text-sm font-medium text-black">{item.value}</span>
                </Flex>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color || 'bg-blue-600'} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </Stack>
      </Stack>
    </div>
  )
}

// 13. RADIAL PROGRESS - Circular progress indicator
export interface RadialProgressProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  color?: 'blue' | 'green' | 'purple' | 'red'
  label?: string
  showValue?: boolean
}

export function RadialProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color = 'blue',
  label,
  showValue = true
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  const colors = {
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    red: '#EF4444'
  }

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors[color]}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-black">{Math.round(value)}%</span>
          </div>
        )}
      </div>
      {label && <span className="text-sm text-black/60">{label}</span>}
    </div>
  )
}

// 14. GAUGE CHART - Semicircular gauge
export interface GaugeChartProps {
  value: number // 0-100
  min?: number
  max?: number
  label?: string
  status?: 'success' | 'warning' | 'danger'
}

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  label,
  status
}: GaugeChartProps) {
  const percentage = ((value - min) / (max - min)) * 100
  const angle = (percentage / 100) * 180 - 90

  const getColor = () => {
    if (status === 'success') return '#10B981'
    if (status === 'warning') return '#F59E0B'
    if (status === 'danger') return '#EF4444'
    if (percentage < 33) return '#EF4444'
    if (percentage < 66) return '#F59E0B'
    return '#10B981'
  }

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 flex flex-col items-center">
      <div className="relative w-48 h-24">
        <svg width="192" height="96" viewBox="0 0 192 96">
          {/* Background arc */}
          <path
            d="M 16 96 A 80 80 0 0 1 176 96"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d="M 16 96 A 80 80 0 0 1 176 96"
            fill="none"
            stroke={getColor()}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 2.51} 251`}
            className="transition-all duration-500"
          />
          {/* Needle */}
          <line
            x1="96"
            y1="96"
            x2="96"
            y2="36"
            stroke="#1F2937"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle}, 96, 96)`}
            className="transition-transform duration-500"
          />
          <circle cx="96" cy="96" r="6" fill="#1F2937" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <div className="text-3xl font-bold text-black">{value}</div>
          {label && <div className="text-xs text-black/60">{label}</div>}
        </div>
      </div>
    </div>
  )
}

// 15. TIME RANGE SELECTOR - Filter data by time period
export type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y' | 'all'

export interface TimeRangeSelectorProps {
  selected: TimeRange
  onChange: (range: TimeRange) => void
  ranges?: TimeRange[]
}

export function TimeRangeSelector({
  selected,
  onChange,
  ranges = ['24h', '7d', '30d', '90d', '1y']
}: TimeRangeSelectorProps) {
  const labels: Record<TimeRange, string> = {
    '24h': '24H',
    '7d': '7D',
    '30d': '30D',
    '90d': '90D',
    '1y': '1Y',
    'all': 'All'
  }

  return (
    <div className="inline-flex items-center gap-1 bg-slate-100 rounded-lg p-1">
      {ranges.map(range => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selected === range
              ? 'bg-white text-black shadow-sm'
              : 'text-black/60 hover:text-black'
          }`}
        >
          {labels[range]}
        </button>
      ))}
    </div>
  )
}

// 16. DISTRIBUTION CARD - Show data distribution
export interface DistributionCardProps {
  label: string
  data: Array<{ label: string; value: number; percentage?: number }>
}

export function DistributionCard({ label, data }: DistributionCardProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <Stack spacing="lg">
        <h3 className="text-sm font-medium text-black/60">{label}</h3>

        <Stack spacing="sm">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            return (
              <Flex key={index} align="center" justify="between" gap="md">
                <Flex align="center" gap="sm" className="flex-1">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-green-500' :
                    index === 2 ? 'bg-purple-500' :
                    index === 3 ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-black/70">{item.label}</span>
                </Flex>
                <Flex align="center" gap="md">
                  <span className="text-sm font-medium text-black">{item.value}</span>
                  <span className="text-xs text-black/40 w-12 text-right">
                    {percentage.toFixed(1)}%
                  </span>
                </Flex>
              </Flex>
            )
          })}
        </Stack>

        {/* Visual distribution bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            return (
              <div
                key={index}
                className={`h-full ${
                  index === 0 ? 'bg-blue-500' :
                  index === 1 ? 'bg-green-500' :
                  index === 2 ? 'bg-purple-500' :
                  index === 3 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            )
          })}
        </div>
      </Stack>
    </div>
  )
}

// 17. REAL-TIME STAT - Updates in real-time
export interface RealTimeStatProps {
  label: string
  getValue: () => number | string
  updateInterval?: number // ms
  icon?: React.ReactNode
  formatValue?: (value: number | string) => string
}

export function RealTimeStat({
  label,
  getValue,
  updateInterval = 1000,
  icon,
  formatValue
}: RealTimeStatProps) {
  // Initialize with null to avoid hydration mismatch
  const [value, setValue] = React.useState<number | string | null>(null)
  const [mounted, setMounted] = React.useState(false)

  // Set initial value only on client
  React.useEffect(() => {
    setMounted(true)
    setValue(getValue())
  }, [getValue])

  React.useEffect(() => {
    if (!mounted) return

    const interval = setInterval(() => {
      setValue(getValue())
    }, updateInterval)

    return () => clearInterval(interval)
  }, [getValue, updateInterval, mounted])

  const displayValue = value !== null && formatValue ? formatValue(value) : value

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <Stack spacing="md">
        <Flex align="center" justify="between">
          <span className="text-sm font-medium text-black/60">{label}</span>
          {icon && (
            <div className="text-black/40 [&>svg]:w-5 [&>svg]:h-5">
              {icon}
            </div>
          )}
        </Flex>

        <div className="text-3xl font-bold text-black tabular-nums">
          {value === null ? (
            <div className="h-9 w-24 bg-slate-200 rounded animate-pulse" />
          ) : (
            displayValue
          )}
        </div>

        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-black/40">Live</span>
        </div>
      </Stack>
    </div>
  )
}

// 18. HEATMAP CARD - Show activity/intensity over time
export interface HeatmapCellProps {
  date: string
  value: number
  max: number
}

export interface HeatmapCardProps {
  label: string
  data: HeatmapCellProps[]
  weeks?: number
}

export function HeatmapCard({ label, data, weeks = 12 }: HeatmapCardProps) {
  const max = Math.max(...data.map(d => d.value))
  
  const getColor = (value: number) => {
    const intensity = value / max
    if (intensity === 0) return 'bg-slate-100'
    if (intensity < 0.25) return 'bg-green-200'
    if (intensity < 0.5) return 'bg-green-400'
    if (intensity < 0.75) return 'bg-green-600'
    return 'bg-green-800'
  }

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <Stack spacing="md">
        <h3 className="text-sm font-medium text-black/60">{label}</h3>
        
        <div className="grid grid-cols-12 gap-1">
          {data.slice(0, weeks * 7).map((cell, index) => (
            <div
              key={index}
              className={`w-full aspect-square rounded-sm ${getColor(cell.value)} transition-colors hover:ring-2 hover:ring-black/20`}
              title={`${cell.date}: ${cell.value}`}
            />
          ))}
        </div>

        <Flex align="center" justify="between" className="text-xs text-black/40">
          <span>Less</span>
          <Flex gap="xs">
            <div className="w-3 h-3 rounded-sm bg-slate-100" />
            <div className="w-3 h-3 rounded-sm bg-green-200" />
            <div className="w-3 h-3 rounded-sm bg-green-400" />
            <div className="w-3 h-3 rounded-sm bg-green-600" />
            <div className="w-3 h-3 rounded-sm bg-green-800" />
          </Flex>
          <span>More</span>
        </Flex>
      </Stack>
    </div>
  )
}

// 19. DELTA STAT - Shows absolute and percentage change
export interface DeltaStatProps {
  label: string
  current: number
  previous: number
  format?: (value: number) => string
  goodDirection?: 'up' | 'down' // What direction is considered good
}

export function DeltaStat({
  label,
  current,
  previous,
  format = (v) => v.toLocaleString(),
  goodDirection
}: DeltaStatProps) {
  const delta = current - previous
  const percentChange = previous !== 0 ? (delta / previous) * 100 : 0
  const direction: TrendDirection = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral'
  
  const isGood = goodDirection
    ? (goodDirection === 'up' && direction === 'up') || (goodDirection === 'down' && direction === 'down')
    : direction === 'up'

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <Stack spacing="md">
        <span className="text-sm font-medium text-black/60">{label}</span>
        
        <div className="text-3xl font-bold text-black">
          {format(current)}
        </div>

        <Flex align="center" gap="sm">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
            isGood ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {direction === 'up' && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
            {direction === 'down' && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span>{format(Math.abs(delta))}</span>
            <span>({Math.abs(percentChange).toFixed(1)}%)</span>
          </div>
          <span className="text-xs text-black/40">vs previous</span>
        </Flex>
      </Stack>
    </div>
  )
}

// 20. COMPOSITE DASHBOARD CARD - Multiple charts in one card
export interface CompositeDashboardCardProps {
  title: string
  primaryMetric: { label: string; value: number | string }
  charts: Array<{
    type: 'sparkline' | 'progress' | 'radial'
    data: any
    label?: string
  }>
}

export function CompositeDashboardCard({
  title,
  primaryMetric,
  charts
}: CompositeDashboardCardProps) {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <Stack spacing="lg">
        <h3 className="text-base font-semibold text-black">{title}</h3>

        <div>
          <div className="text-xs text-black/40 mb-1">{primaryMetric.label}</div>
          <div className="text-4xl font-bold text-black">
            {primaryMetric.value}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-black/5">
          {charts.map((chart, index) => (
            <div key={index} className="text-center">
              {chart.type === 'radial' && (
                <RadialProgress value={chart.data} size={60} strokeWidth={6} showValue={false} />
              )}
              {chart.type === 'progress' && (
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${chart.data}%` }}
                  />
                </div>
              )}
              {chart.type === 'sparkline' && (
                <Sparkline data={chart.data} height={24} color="blue" />
              )}
              {chart.label && (
                <div className="text-xs text-black/60 mt-2">{chart.label}</div>
              )}
            </div>
          ))}
        </div>
      </Stack>
    </div>
  )
}

// ============================================================================
// FINAL ELITE ADDITIONS - Polish & Production Features
// ============================================================================

// 21. EMPTY STAT STATE - When no data is available
export interface EmptyStatStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyStatState({
  title = 'No data available',
  description = 'Data will appear here once available',
  icon,
  action
}: EmptyStatStateProps) {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-8">
      <Stack spacing="md" className="items-center text-center">
        {icon ? (
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-black/30">
            {icon}
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-black/30">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-black mb-1">{title}</h3>
          <p className="text-xs text-black/60">{description}</p>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            {action.label}
          </button>
        )}
      </Stack>
    </div>
  )
}

// 22. STAT CARD WITH REFRESH - Manual refresh button
export interface StatCardWithRefreshProps extends Omit<StatCardProps, 'loading'> {
  onRefresh: () => Promise<void>
  lastUpdated?: Date
  autoRefresh?: number // seconds
}

export function StatCardWithRefresh({
  onRefresh,
  lastUpdated,
  autoRefresh,
  ...props
}: StatCardWithRefreshProps) {
  const [refreshing, setRefreshing] = React.useState(false)
  const [timeAgo, setTimeAgo] = React.useState('')

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }

  // Auto-refresh
  React.useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(handleRefresh, autoRefresh * 1000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Update time ago
  React.useEffect(() => {
    if (!lastUpdated) return
    
    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
      if (seconds < 60) setTimeAgo('Just now')
      else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`)
      else setTimeAgo(`${Math.floor(seconds / 3600)}h ago`)
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 10000)
    return () => clearInterval(interval)
  }, [lastUpdated])

  return (
    <div className="relative">
      <StatCard {...props} loading={refreshing} />
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="absolute top-3 right-3 p-1.5 hover:bg-black/5 rounded-lg transition-colors disabled:opacity-50"
        aria-label="Refresh data"
      >
        <svg className={`w-4 h-4 text-black/40 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      {lastUpdated && (
        <div className="absolute bottom-3 right-3 text-xs text-black/30">
          {timeAgo}
        </div>
      )}
    </div>
  )
}

// 23. EXPORT DATA UTILITY - Export chart data to CSV/JSON
export const exportData = {
  toCSV: (data: Array<Record<string, any>>, filename = 'data.csv') => {
    if (data.length === 0) return
    
    const headers = Object.keys(data[0])
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },

  toJSON: (data: any, filename = 'data.json') => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}

// 24. METRIC COMPARISON - Side-by-side metric comparison
export interface MetricComparisonProps {
  title: string
  metrics: Array<{
    label: string
    current: number
    previous: number
    format?: (value: number) => string
  }>
}

export function MetricComparison({ title, metrics }: MetricComparisonProps) {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <Stack spacing="lg">
        <h3 className="text-base font-semibold text-black">{title}</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/5">
                <th className="text-left text-xs font-medium text-black/60 pb-2">Metric</th>
                <th className="text-right text-xs font-medium text-black/60 pb-2">Current</th>
                <th className="text-right text-xs font-medium text-black/60 pb-2">Previous</th>
                <th className="text-right text-xs font-medium text-black/60 pb-2">Change</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => {
                const delta = metric.current - metric.previous
                const percentChange = metric.previous !== 0 ? (delta / metric.previous) * 100 : 0
                const direction: TrendDirection = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral'
                const format = metric.format || ((v: number) => v.toLocaleString())

                return (
                  <tr key={index} className="border-b border-black/5 last:border-b-0">
                    <td className="py-3 text-sm text-black/70">{metric.label}</td>
                    <td className="py-3 text-sm font-medium text-black text-right">
                      {format(metric.current)}
                    </td>
                    <td className="py-3 text-sm text-black/60 text-right">
                      {format(metric.previous)}
                    </td>
                    <td className="py-3 text-right">
                      <TrendIndicator
                        value={Math.abs(Math.round(percentChange))}
                        direction={direction}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Stack>
    </div>
  )
}

// 25. RESPONSIVE STAT GRID - Auto-responsive grid
export interface ResponsiveStatGridProps {
  stats: StatCardProps[]
  minCardWidth?: number // px
  gap?: 'sm' | 'md' | 'lg'
}

export function ResponsiveStatGrid({
  stats,
  minCardWidth = 280,
  gap = 'md'
}: ResponsiveStatGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }

  return (
    <div
      className={`grid ${gapClasses[gap]}`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minCardWidth}px, 1fr))`
      }}
    >
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}
