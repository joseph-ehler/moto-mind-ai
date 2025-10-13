/**
 * Elite Typography Components
 * 
 * World-class typography with advanced features:
 * - Variable fonts with dynamic scaling
 * - Reading modes for accessibility
 * - AI-powered optimization
 * - Performance monitoring
 * 
 * Built on mandatory MotoMind Design System foundation
 */

import React, { useEffect, useState, useRef } from 'react'
import { Container, Stack } from '@/components/design-system'
import { cn } from '@/lib/design-system'
import { 
  eliteTypography, 
  type ReadingMode, 
  type ContentType,
  TypographyPerformanceMonitor 
} from '@/lib/design-system/elite-typography'

// ============================================================================
// VARIABLE FONT TEXT COMPONENT
// ============================================================================

interface VariableFontTextProps {
  children: React.ReactNode
  size?: number
  weight?: number
  width?: number
  optical?: boolean
  className?: string
}

export function VariableFontText({
  children,
  size = 16,
  weight,
  width,
  optical = true,
  className
}: VariableFontTextProps) {
  const dynamicWeight = weight || eliteTypography.variableFonts.dynamicWeights.body.scale(size)
  const fontWidth = width || eliteTypography.variableFonts.contextualWidth.normal
  const opticalSize = optical ? eliteTypography.opticalSizing.calculateOpticalSize(size) : undefined

  const fontVariationSettings = [
    `"wght" ${dynamicWeight}`,
    `"wdth" ${fontWidth}`,
    optical && `"opsz" ${opticalSize}`
  ].filter(Boolean).join(', ')

  return (
    <span
      className={cn('font-variable', className)}
      style={{
        fontSize: `${size}px`,
        fontWeight: dynamicWeight,
        fontVariationSettings,
        fontFeatureSettings: '"kern" 1, "liga" 1'
      }}
    >
      {children}
    </span>
  )
}

// ============================================================================
// ADAPTIVE TEXT COMPONENT
// ============================================================================

interface AdaptiveTextProps {
  children: React.ReactNode
  contentType?: ContentType
  readingMode?: ReadingMode
  className?: string
}

export function AdaptiveText({
  children,
  contentType = 'article',
  readingMode,
  className
}: AdaptiveTextProps) {
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (textRef.current) {
      // Apply content type optimization
      eliteTypography.utils.optimizeForContentType(contentType, textRef.current)
      
      // Apply reading mode if specified
      if (readingMode) {
        eliteTypography.utils.applyReadingMode(readingMode, textRef.current)
      }
    }
  }, [contentType, readingMode])

  return (
    <div ref={textRef} className={cn('adaptive-text', className)}>
      {children}
    </div>
  )
}

// ============================================================================
// READING MODE PROVIDER
// ============================================================================

interface ReadingModeContextType {
  currentMode: ReadingMode | null
  setReadingMode: (mode: ReadingMode | null) => void
  availableModes: ReadingMode[]
}

const ReadingModeContext = React.createContext<ReadingModeContextType>({
  currentMode: null,
  setReadingMode: () => {},
  availableModes: []
})

interface ReadingModeProviderProps {
  children: React.ReactNode
  defaultMode?: ReadingMode
}

export function ReadingModeProvider({ 
  children, 
  defaultMode 
}: ReadingModeProviderProps) {
  const [currentMode, setCurrentMode] = useState<ReadingMode | null>(defaultMode || null)
  const availableModes: ReadingMode[] = ['focus', 'dyslexiaFriendly', 'highContrast', 'darkOptimized']

  useEffect(() => {
    // Apply reading mode to document body
    if (currentMode) {
      eliteTypography.utils.applyReadingMode(currentMode, document.body)
    } else {
      // Reset to default styles
      document.body.removeAttribute('style')
    }
  }, [currentMode])

  return (
    <ReadingModeContext.Provider value={{
      currentMode,
      setReadingMode: setCurrentMode,
      availableModes
    }}>
      {children}
    </ReadingModeContext.Provider>
  )
}

export const useReadingMode = () => React.useContext(ReadingModeContext)

// ============================================================================
// READING MODE SELECTOR
// ============================================================================

interface ReadingModeSelectorProps {
  className?: string
}

export function ReadingModeSelector({ className }: ReadingModeSelectorProps) {
  const { currentMode, setReadingMode, availableModes } = useReadingMode()

  const modeLabels = {
    focus: 'Focus Mode',
    dyslexiaFriendly: 'Dyslexia Friendly',
    highContrast: 'High Contrast',
    darkOptimized: 'Dark Optimized'
  }

  return (
    <div className={cn('reading-mode-selector', className)}>
      <Stack spacing="sm">
        <label className="text-sm font-medium text-gray-700">
          Reading Mode
        </label>
        <select
          value={currentMode || ''}
          onChange={(e) => setReadingMode(e.target.value as ReadingMode || null)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Default</option>
          {availableModes.map(mode => (
            <option key={mode} value={mode}>
              {modeLabels[mode]}
            </option>
          ))}
        </select>
      </Stack>
    </div>
  )
}

// ============================================================================
// PERFORMANCE MONITORED TEXT
// ============================================================================

interface PerformanceMonitoredTextProps {
  children: React.ReactNode
  onPerformanceUpdate?: (metrics: any) => void
  className?: string
}

export function PerformanceMonitoredText({
  children,
  onPerformanceUpdate,
  className
}: PerformanceMonitoredTextProps) {
  const textRef = useRef<HTMLDivElement>(null)
  const [monitor] = useState(() => new TypographyPerformanceMonitor())

  useEffect(() => {
    if (textRef.current) {
      // Monitor font loading
      monitor.monitorFontLoading()

      // Calculate readability score
      const readabilityScore = monitor.calculateReadabilityScore(textRef.current)
      
      // Get performance report
      const report = monitor.getPerformanceReport()
      
      if (onPerformanceUpdate) {
        onPerformanceUpdate({ ...report, readabilityScore })
      }

      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Typography Performance:', {
          readabilityScore,
          ...report
        })
      }
    }
  }, [monitor, onPerformanceUpdate])

  return (
    <div ref={textRef} className={cn('performance-monitored-text', className)}>
      {children}
    </div>
  )
}

// ============================================================================
// CONTEXTUAL TYPOGRAPHY
// ============================================================================

interface ContextualTypographyProps {
  children: React.ReactNode
  context: 'code' | 'data' | 'emphasis'
  className?: string
}

export function ContextualTypography({
  children,
  context,
  className
}: ContextualTypographyProps) {
  const contextualFeatures = eliteTypography.advancedTypography.contextualFeatures[context]

  return (
    <span
      className={cn('contextual-typography', className)}
      style={{
        fontFeatureSettings: contextualFeatures.fontFeatureSettings,
        fontVariantNumeric: contextualFeatures.fontVariantNumeric,
        letterSpacing: contextualFeatures.letterSpacing,
        fontStyle: contextualFeatures.fontStyle
      }}
    >
      {children}
    </span>
  )
}

// ============================================================================
// SMART PARAGRAPH COMPONENT
// ============================================================================

interface SmartParagraphProps {
  children: React.ReactNode
  difficulty?: 'simple' | 'complex'
  readingPattern?: 'quickScan' | 'deepRead'
  className?: string
}

export function SmartParagraph({
  children,
  difficulty = 'simple',
  readingPattern = 'deepRead',
  className
}: SmartParagraphProps) {
  const difficultyConfig = eliteTypography.typographyAI.readabilityOptimization[difficulty]
  const patternConfig = eliteTypography.typographyAI.adaptiveOptimization[readingPattern]

  // Combine configurations
  const combinedConfig = { ...difficultyConfig, ...patternConfig }

  return (
    <p
      className={cn('smart-paragraph', className)}
      style={{
        fontSize: combinedConfig.fontSize,
        lineHeight: combinedConfig.lineHeight,
        letterSpacing: combinedConfig.letterSpacing,
        fontWeight: combinedConfig.fontWeight,
        maxWidth: combinedConfig.maxWidth,
        marginBottom: combinedConfig.paragraphSpacing
      }}
    >
      {children}
    </p>
  )
}

// ============================================================================
// TYPOGRAPHY PERFORMANCE DASHBOARD
// ============================================================================

interface TypographyPerformanceDashboardProps {
  enabled?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export function TypographyPerformanceDashboard({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right'
}: TypographyPerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [monitor] = useState(() => new TypographyPerformanceMonitor())

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      const report = monitor.getPerformanceReport()
      setMetrics(report)
    }, 2000)

    return () => clearInterval(interval)
  }, [enabled, monitor])

  if (!enabled || !metrics) return null

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-[9999] bg-black/90 text-white p-3 rounded-lg text-xs font-mono max-w-xs`}>
      <div className="mb-2 font-bold">Typography Performance</div>
      
      <div className="space-y-1">
        <div>Font Load: <span className="text-green-400">{metrics.fontLoadTime?.toFixed(1) || 0}ms</span></div>
        <div>Readability: <span className="text-blue-400">{metrics.readabilityScore?.toFixed(0) || 0}/100</span></div>
        <div>Layout Shifts: <span className="text-yellow-400">{metrics.layoutShifts}</span></div>
      </div>

      {metrics.recommendations?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="text-orange-400 text-xs mb-1">Suggestions:</div>
          {metrics.recommendations.slice(0, 2).map((rec: string, i: number) => (
            <div key={i} className="text-orange-300 text-xs truncate">{rec}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ELITE TYPOGRAPHY SHOWCASE
// ============================================================================

export function EliteTypographyShowcase() {
  return (
    <Container size="md" useCase="articles">
      <Stack spacing="xl">
        <div>
          <h2 className="text-2xl font-bold mb-4">Variable Font Scaling</h2>
          <Stack spacing="md">
            <VariableFontText size={48} weight={700}>
              Dynamic Weight Display Text
            </VariableFontText>
            <VariableFontText size={24} weight={600}>
              Adaptive Heading Text
            </VariableFontText>
            <VariableFontText size={16} weight={400}>
              Optimized Body Text with Perfect Optical Sizing
            </VariableFontText>
          </Stack>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Contextual Typography</h2>
          <Stack spacing="md">
            <div>
              <strong>Code Context:</strong>
              <ContextualTypography context="code">
                const fontSize = clamp(1rem, 2vw, 1.5rem);
              </ContextualTypography>
            </div>
            
            <div>
              <strong>Data Context:</strong>
              <ContextualTypography context="data">
                Revenue: $1,234,567.89
              </ContextualTypography>
            </div>
            
            <div>
              <strong>Emphasis Context:</strong>
              <ContextualTypography context="emphasis">
                Beautiful, expressive typography
              </ContextualTypography>
            </div>
          </Stack>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Smart Paragraphs</h2>
          <Stack spacing="md">
            <SmartParagraph difficulty="simple" readingPattern="quickScan">
              This paragraph is optimized for quick scanning with larger text,
              medium weight, and shorter line length for easy consumption.
            </SmartParagraph>
            
            <SmartParagraph difficulty="complex" readingPattern="deepRead">
              This paragraph is designed for deep reading of complex content,
              with optimal line height, comfortable spacing, and typography
              settings that reduce cognitive load during extended reading sessions.
            </SmartParagraph>
          </Stack>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Adaptive Content</h2>
          <AdaptiveText contentType="technical">
            <h3>Technical Documentation</h3>
            <p>
              This content is automatically optimized for technical reading
              with appropriate font family, sizing, and spacing for code-heavy content.
            </p>
          </AdaptiveText>
        </div>
      </Stack>
    </Container>
  )
}
