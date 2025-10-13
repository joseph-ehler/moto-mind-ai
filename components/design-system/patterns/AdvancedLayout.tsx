/**
 * Elite-Tier Layout System
 * 
 * Advanced layout features for top-tier implementation:
 * - CSS Subgrid support
 * - Container queries
 * - Visual debugging
 * - Performance optimizations
 * - Advanced accessibility
 */

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/design-system'

// ============================================================================
// ADVANCED GRID WITH SUBGRID SUPPORT
// ============================================================================

interface AdvancedGridProps {
  children: React.ReactNode
  columns?: number | 'auto' | 'fit' | 'fill'
  rows?: number | 'auto'
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  subgrid?: boolean // CSS Subgrid support
  areas?: string[] // Named grid areas
  dense?: boolean // Grid auto-flow dense
  align?: 'start' | 'end' | 'center' | 'stretch'
  justify?: 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around'
  minItemWidth?: string // For auto-fit grids
  debug?: boolean // Visual debugging
  className?: string
}

export function AdvancedGrid({
  children,
  columns = 'auto',
  rows = 'auto',
  gap = 'md',
  subgrid = false,
  areas,
  dense = false,
  align = 'stretch',
  justify = 'start',
  minItemWidth = '250px',
  debug = false,
  className
}: AdvancedGridProps) {
  // Generate grid template columns
  const getGridColumns = () => {
    if (typeof columns === 'number') {
      return `repeat(${columns}, 1fr)`
    }
    
    switch (columns) {
      case 'auto':
        return 'repeat(auto-fit, minmax(250px, 1fr))'
      case 'fit':
        return `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
      case 'fill':
        return `repeat(auto-fill, minmax(${minItemWidth}, 1fr))`
      default:
        return 'none'
    }
  }

  // Generate grid template rows
  const getGridRows = () => {
    if (typeof rows === 'number') {
      return `repeat(${rows}, auto)`
    }
    return rows === 'auto' ? 'auto' : 'none'
  }

  // Gap classes
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }

  // Alignment classes
  const alignClasses = {
    start: 'items-start',
    end: 'items-end', 
    center: 'items-center',
    stretch: 'items-stretch'
  }

  const justifyClasses = {
    start: 'justify-items-start',
    end: 'justify-items-end',
    center: 'justify-items-center',
    stretch: 'justify-items-stretch',
    'space-between': 'justify-between',
    'space-around': 'justify-around'
  }

  // Grid areas style
  const gridAreasStyle = areas ? {
    gridTemplateAreas: areas.map(area => `"${area}"`).join(' ')
  } : {}

  return (
    <div
      className={cn(
        'grid',
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        dense && 'grid-flow-dense',
        debug && 'debug-grid',
        className
      )}
      style={{
        gridTemplateColumns: subgrid ? 'subgrid' : getGridColumns(),
        gridTemplateRows: subgrid ? 'subgrid' : getGridRows(),
        ...gridAreasStyle
      }}
    >
      {children}
    </div>
  )
}

// Grid Item with advanced positioning
interface GridItemProps {
  children: React.ReactNode
  area?: string // Named grid area
  column?: string | number // Grid column position
  row?: string | number // Grid row position
  span?: { columns?: number; rows?: number } // Span multiple cells
  className?: string
}

export function GridItem({
  children,
  area,
  column,
  row,
  span,
  className
}: GridItemProps) {
  const style: React.CSSProperties = {}
  
  if (area) style.gridArea = area
  if (column) style.gridColumn = column
  if (row) style.gridRow = row
  if (span?.columns) style.gridColumn = `span ${span.columns}`
  if (span?.rows) style.gridRow = `span ${span.rows}`

  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}

// ============================================================================
// CONTAINER QUERIES SUPPORT
// ============================================================================

interface ContainerQueryProps {
  children: React.ReactNode
  name?: string // Container query name
  type?: 'inline-size' | 'block-size' | 'size' // Container query type
  className?: string
}

export function ContainerQuery({
  children,
  name = 'container',
  type = 'inline-size',
  className
}: ContainerQueryProps) {
  return (
    <div
      className={cn('container-query', className)}
      style={{
        containerName: name,
        containerType: type
      }}
    >
      {children}
    </div>
  )
}

// ============================================================================
// RESPONSIVE BREAKPOINT HOOK
// ============================================================================

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('sm')
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      setWindowSize({ width, height: window.innerHeight })
      
      if (width >= 1536) setBreakpoint('2xl')
      else if (width >= 1280) setBreakpoint('xl')
      else if (width >= 1024) setBreakpoint('lg')
      else if (width >= 768) setBreakpoint('md')
      else setBreakpoint('sm')
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return { breakpoint, windowSize, isMobile: breakpoint === 'sm' }
}

// ============================================================================
// LAYOUT DEBUGGING TOOLS
// ============================================================================

interface DebugLayoutProps {
  children: React.ReactNode
  showGrid?: boolean
  showBreakpoints?: boolean
  showSpacing?: boolean
  enabled?: boolean
}

export function DebugLayout({
  children,
  showGrid = true,
  showBreakpoints = true,
  showSpacing = true,
  enabled = process.env.NODE_ENV === 'development'
}: DebugLayoutProps) {
  const { breakpoint, windowSize } = useBreakpoint()
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Toggle debug mode with Ctrl+Shift+D
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDebugMode(!debugMode)
      }
    }

    if (enabled) {
      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }
  }, [debugMode, enabled])

  if (!enabled) return <>{children}</>

  return (
    <div className={cn('relative', debugMode && 'debug-mode')}>
      {/* Debug Overlay */}
      {debugMode && (
        <div className="fixed top-4 right-4 z-[9999] bg-black/90 text-white p-3 rounded-lg text-xs font-mono">
          <div>Breakpoint: <span className="text-green-400">{breakpoint}</span></div>
          <div>Width: <span className="text-blue-400">{windowSize.width}px</span></div>
          <div>Height: <span className="text-blue-400">{windowSize.height}px</span></div>
          <div className="text-gray-400 mt-1">Ctrl+Shift+D to toggle</div>
        </div>
      )}

      {/* Grid Overlay */}
      {debugMode && showGrid && (
        <div className="fixed inset-0 pointer-events-none z-[9998]">
          <div className="h-full w-full bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 bg-[length:100px_100%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-blue-500/10 bg-[length:100%_100px]" />
        </div>
      )}

      <div className={cn(
        debugMode && showSpacing && 'debug-spacing',
        debugMode && showGrid && 'debug-grid'
      )}>
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// PERFORMANCE-OPTIMIZED LAYOUTS
// ============================================================================

interface VirtualizedGridProps {
  items: any[]
  renderItem: (item: any, index: number) => React.ReactNode
  itemHeight?: number
  containerHeight?: number
  columns?: number
  gap?: number
  className?: string
}

export function VirtualizedGrid({
  items,
  renderItem,
  itemHeight = 200,
  containerHeight = 600,
  columns = 3,
  gap = 16,
  className
}: VirtualizedGridProps) {
  const [scrollTop, setScrollTop] = useState(0)
  
  // Calculate visible range
  const rowHeight = itemHeight + gap
  const totalRows = Math.ceil(items.length / columns)
  const visibleRows = Math.ceil(containerHeight / rowHeight) + 2 // Buffer
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 1)
  const endRow = Math.min(totalRows, startRow + visibleRows)
  
  // Get visible items
  const visibleItems = items.slice(
    startRow * columns,
    endRow * columns
  )

  return (
    <div
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalRows * rowHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: startRow * rowHeight,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: gap
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startRow * columns + index} style={{ height: itemHeight }}>
              {renderItem(item, startRow * columns + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ACCESSIBILITY-ENHANCED LAYOUTS
// ============================================================================

interface AccessibleLayoutProps {
  children: React.ReactNode
  landmark?: 'main' | 'nav' | 'aside' | 'header' | 'footer' | 'section' | 'article'
  label?: string
  description?: string
  skipLink?: string
  focusManagement?: boolean
  className?: string
}

export function AccessibleLayout({
  children,
  landmark,
  label,
  description,
  skipLink,
  focusManagement = true,
  className
}: AccessibleLayoutProps) {
  const Component = landmark || 'div'
  
  const props: any = {
    className: cn(
      'focus-within:outline-none',
      focusManagement && 'focus-management',
      className
    )
  }

  if (label) props['aria-label'] = label
  if (description) props['aria-describedby'] = description
  if (skipLink) props.id = skipLink

  return (
    <Component {...props}>
      {skipLink && (
        <a
          href={`#${skipLink}`}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
        >
          Skip to {label || 'content'}
        </a>
      )}
      {children}
    </Component>
  )
}

// ============================================================================
// LAYOUT PRESETS
// ============================================================================

// Holy Grail Layout
interface HolyGrailLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  sidebar?: React.ReactNode
  aside?: React.ReactNode
  sidebarWidth?: string
  asideWidth?: string
  className?: string
}

export function HolyGrailLayout({
  children,
  header,
  footer,
  sidebar,
  aside,
  sidebarWidth = '250px',
  asideWidth = '200px',
  className
}: HolyGrailLayoutProps) {
  return (
    <div
      className={cn('min-h-screen grid grid-rows-[auto_1fr_auto]', className)}
      style={{
        gridTemplateColumns: sidebar && aside 
          ? `${sidebarWidth} 1fr ${asideWidth}`
          : sidebar 
            ? `${sidebarWidth} 1fr`
            : aside
              ? `1fr ${asideWidth}`
              : '1fr'
      }}
    >
      {header && (
        <header className="col-span-full bg-white border-b border-gray-200">
          {header}
        </header>
      )}
      
      {sidebar && (
        <aside className="bg-gray-50 border-r border-gray-200">
          {sidebar}
        </aside>
      )}
      
      <main className="overflow-hidden">
        {children}
      </main>
      
      {aside && (
        <aside className="bg-gray-50 border-l border-gray-200">
          {aside}
        </aside>
      )}
      
      {footer && (
        <footer className="col-span-full bg-white border-t border-gray-200">
          {footer}
        </footer>
      )}
    </div>
  )
}

// Masonry Layout
interface MasonryLayoutProps {
  children: React.ReactNode
  columns?: number
  gap?: string
  className?: string
}

export function MasonryLayout({
  children,
  columns = 3,
  gap = '1rem',
  className
}: MasonryLayoutProps) {
  return (
    <div
      className={cn('masonry-layout', className)}
      style={{
        columnCount: columns,
        columnGap: gap,
        columnFill: 'balance'
      }}
    >
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          style={{
            breakInside: 'avoid',
            marginBottom: gap,
            display: 'inline-block',
            width: '100%'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

interface ResponsiveProps {
  children: React.ReactNode
  show?: ('sm' | 'md' | 'lg' | 'xl' | '2xl')[]
  hide?: ('sm' | 'md' | 'lg' | 'xl' | '2xl')[]
  className?: string
}

export function Responsive({ children, show, hide, className }: ResponsiveProps) {
  const { breakpoint } = useBreakpoint()
  
  if (show && !show.includes(breakpoint)) return null
  if (hide && hide.includes(breakpoint)) return null
  
  return <div className={className}>{children}</div>
}

// Breakpoint-specific components
export const Mobile = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Responsive show={['sm']} className={className}>{children}</Responsive>
)

export const Tablet = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Responsive show={['md']} className={className}>{children}</Responsive>
)

export const Desktop = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Responsive show={['lg', 'xl', '2xl']} className={className}>{children}</Responsive>
)
