/**
 * Layout Performance Monitor
 * 
 * Elite-tier performance monitoring and optimization for layouts:
 * - Layout shift detection
 * - Render performance tracking
 * - Memory usage monitoring
 * - Optimization suggestions
 */

import React from 'react'

// Type definitions for Web APIs
interface LayoutShift extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
  sources: any[]
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

interface LayoutMetrics {
  renderTime: number
  layoutShifts: number
  memoryUsage: number
  reflows: number
  repaints: number
  timestamp: number
}

interface PerformanceReport {
  metrics: LayoutMetrics
  warnings: string[]
  suggestions: string[]
  score: number // 0-100
}

// ============================================================================
// LAYOUT SHIFT DETECTION
// ============================================================================

class LayoutShiftMonitor {
  private observer: PerformanceObserver | null = null
  private shifts: LayoutShift[] = []
  private callbacks: ((shift: LayoutShift) => void)[] = []

  start() {
    if (!('PerformanceObserver' in window)) return

    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift') {
          const shift = entry as LayoutShift
          this.shifts.push(shift)
          this.callbacks.forEach(callback => callback(shift))
          
          // Warn about significant layout shifts
          if (shift.value > 0.1) {
            console.warn(`🚨 LAYOUT SHIFT DETECTED: ${shift.value.toFixed(4)}`, {
              sources: shift.sources,
              hadRecentInput: shift.hadRecentInput
            })
          }
        }
      }
    })

    this.observer.observe({ entryTypes: ['layout-shift'] })
  }

  stop() {
    this.observer?.disconnect()
    this.observer = null
  }

  getCLS(): number {
    // Calculate Cumulative Layout Shift
    return this.shifts
      .filter(shift => !shift.hadRecentInput)
      .reduce((sum, shift) => sum + shift.value, 0)
  }

  onShift(callback: (shift: LayoutShift) => void) {
    this.callbacks.push(callback)
  }

  getShifts(): LayoutShift[] {
    return [...this.shifts]
  }

  clear() {
    this.shifts = []
  }
}

// ============================================================================
// RENDER PERFORMANCE TRACKER
// ============================================================================

class RenderPerformanceTracker {
  private renderTimes: number[] = []
  private frameCount = 0
  private startTime = 0
  private rafId: number | null = null

  start() {
    this.startTime = performance.now()
    this.frameCount = 0
    this.renderTimes = []
    this.measureFrames()
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private measureFrames() {
    const frameStart = performance.now()
    
    this.rafId = requestAnimationFrame(() => {
      const frameEnd = performance.now()
      const frameTime = frameEnd - frameStart
      
      this.renderTimes.push(frameTime)
      this.frameCount++
      
      // Warn about slow frames (> 16.67ms = 60fps)
      if (frameTime > 16.67) {
        console.warn(`🐌 SLOW FRAME: ${frameTime.toFixed(2)}ms`)
      }
      
      this.measureFrames()
    })
  }

  getFPS(): number {
    const elapsed = performance.now() - this.startTime
    return (this.frameCount / elapsed) * 1000
  }

  getAverageFrameTime(): number {
    return this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length
  }

  getSlowFrames(): number {
    return this.renderTimes.filter(time => time > 16.67).length
  }
}

// ============================================================================
// MEMORY USAGE MONITOR
// ============================================================================

class MemoryMonitor {
  getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    return 0
  }

  getMemoryPressure(): 'low' | 'medium' | 'high' {
    const usage = this.getMemoryUsage()
    if (usage > 100) return 'high'
    if (usage > 50) return 'medium'
    return 'low'
  }

  monitorMemoryLeaks(interval = 5000): () => void {
    const measurements: number[] = []
    
    const measureMemory = () => {
      const usage = this.getMemoryUsage()
      measurements.push(usage)
      
      // Keep only last 10 measurements
      if (measurements.length > 10) {
        measurements.shift()
      }
      
      // Detect memory leaks (consistent growth)
      if (measurements.length >= 5) {
        const trend = this.calculateTrend(measurements)
        if (trend > 0.5) { // Growing by 0.5MB per measurement
          console.warn(`🚨 POTENTIAL MEMORY LEAK: ${trend.toFixed(2)}MB/measurement`)
        }
      }
    }

    const intervalId = setInterval(measureMemory, interval)
    return () => clearInterval(intervalId)
  }

  private calculateTrend(values: number[]): number {
    const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0)
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  }
}

// ============================================================================
// LAYOUT PERFORMANCE ANALYZER
// ============================================================================

export class LayoutPerformanceAnalyzer {
  private shiftMonitor = new LayoutShiftMonitor()
  private renderTracker = new RenderPerformanceTracker()
  private memoryMonitor = new MemoryMonitor()
  private isRunning = false

  start() {
    if (this.isRunning) return
    
    this.shiftMonitor.start()
    this.renderTracker.start()
    this.isRunning = true
    
    console.log('🚀 Layout Performance Monitoring Started')
  }

  stop() {
    if (!this.isRunning) return
    
    this.shiftMonitor.stop()
    this.renderTracker.stop()
    this.isRunning = false
    
    console.log('⏹️  Layout Performance Monitoring Stopped')
  }

  getReport(): PerformanceReport {
    const cls = this.shiftMonitor.getCLS()
    const fps = this.renderTracker.getFPS()
    const avgFrameTime = this.renderTracker.getAverageFrameTime()
    const slowFrames = this.renderTracker.getSlowFrames()
    const memoryUsage = this.memoryMonitor.getMemoryUsage()
    const memoryPressure = this.memoryMonitor.getMemoryPressure()

    const metrics: LayoutMetrics = {
      renderTime: avgFrameTime,
      layoutShifts: cls,
      memoryUsage,
      reflows: 0, // Would need more advanced detection
      repaints: 0, // Would need more advanced detection
      timestamp: Date.now()
    }

    const warnings: string[] = []
    const suggestions: string[] = []

    // Analyze metrics and generate warnings/suggestions
    if (cls > 0.1) {
      warnings.push(`High Cumulative Layout Shift: ${cls.toFixed(4)}`)
      suggestions.push('Use CSS containment, reserve space for dynamic content')
    }

    if (fps < 50) {
      warnings.push(`Low FPS: ${fps.toFixed(1)}`)
      suggestions.push('Optimize animations, reduce DOM complexity')
    }

    if (avgFrameTime > 20) {
      warnings.push(`Slow frame times: ${avgFrameTime.toFixed(2)}ms`)
      suggestions.push('Use CSS transforms instead of layout properties')
    }

    if (slowFrames > 10) {
      warnings.push(`${slowFrames} slow frames detected`)
      suggestions.push('Consider virtualization for large lists')
    }

    if (memoryPressure === 'high') {
      warnings.push(`High memory usage: ${memoryUsage.toFixed(1)}MB`)
      suggestions.push('Check for memory leaks, optimize component lifecycle')
    }

    // Calculate performance score (0-100)
    let score = 100
    score -= Math.min(cls * 100, 30) // CLS penalty
    score -= Math.min((60 - fps) * 2, 30) // FPS penalty
    score -= Math.min(avgFrameTime, 20) // Frame time penalty
    score -= Math.min(memoryUsage / 10, 20) // Memory penalty

    return {
      metrics,
      warnings,
      suggestions,
      score: Math.max(0, Math.round(score))
    }
  }

  // Optimization suggestions based on layout patterns
  analyzeLayoutPattern(element: HTMLElement): string[] {
    const suggestions: string[] = []
    const computedStyle = getComputedStyle(element)

    // Check for expensive layout properties
    if (computedStyle.position === 'fixed' || computedStyle.position === 'sticky') {
      suggestions.push('Consider using CSS containment for fixed/sticky elements')
    }

    // Check for transforms that could be optimized
    if (computedStyle.transform !== 'none') {
      suggestions.push('Ensure transforms use GPU acceleration (transform3d)')
    }

    // Check for large grids
    const children = element.children.length
    if (children > 100) {
      suggestions.push('Consider virtualization for large collections')
    }

    // Check for missing containment
    if (computedStyle.contain === 'none') {
      suggestions.push('Add CSS containment for better performance isolation')
    }

    return suggestions
  }
}

// ============================================================================
// PERFORMANCE HOOKS
// ============================================================================

export function useLayoutPerformance() {
  const [analyzer] = React.useState(() => new LayoutPerformanceAnalyzer())
  const [report, setReport] = React.useState<PerformanceReport | null>(null)

  React.useEffect(() => {
    analyzer.start()
    
    const interval = setInterval(() => {
      setReport(analyzer.getReport())
    }, 1000)

    return () => {
      analyzer.stop()
      clearInterval(interval)
    }
  }, [analyzer])

  return { analyzer, report }
}

// ============================================================================
// PERFORMANCE DEBUGGING COMPONENT
// ============================================================================

interface PerformanceDebuggerProps {
  enabled?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export function PerformanceDebugger({ 
  enabled = process.env.NODE_ENV === 'development',
  position = 'top-right'
}: PerformanceDebuggerProps) {
  const { report } = useLayoutPerformance()

  if (!enabled || !report) return null

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-[9999] bg-black/90 text-white p-3 rounded-lg text-xs font-mono max-w-xs`}>
      <div className="flex items-center justify-between mb-2">
        <span>Performance</span>
        <span className={`font-bold ${getScoreColor(report.score)}`}>
          {report.score}/100
        </span>
      </div>
      
      <div className="space-y-1">
        <div>CLS: <span className="text-blue-400">{report.metrics.layoutShifts.toFixed(4)}</span></div>
        <div>Frame: <span className="text-green-400">{report.metrics.renderTime.toFixed(1)}ms</span></div>
        <div>Memory: <span className="text-purple-400">{report.metrics.memoryUsage.toFixed(1)}MB</span></div>
      </div>

      {report.warnings.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="text-red-400 text-xs">Warnings:</div>
          {report.warnings.slice(0, 2).map((warning, i) => (
            <div key={i} className="text-red-300 text-xs truncate">{warning}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export const layoutPerformance = {
  LayoutPerformanceAnalyzer,
  LayoutShiftMonitor,
  RenderPerformanceTracker,
  MemoryMonitor,
  useLayoutPerformance,
  PerformanceDebugger
}

// Global performance analyzer instance
export const globalPerformanceAnalyzer = new LayoutPerformanceAnalyzer()

// Auto-start in development - DISABLED to prevent performance overhead
// The monitor itself was causing the 33ms "slow frames" it was detecting
// To enable: manually call globalPerformanceAnalyzer.start() in your component
// if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
//   globalPerformanceAnalyzer.start()
// }
