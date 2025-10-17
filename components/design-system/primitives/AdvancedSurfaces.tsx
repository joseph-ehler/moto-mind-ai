/**
 * Elite Surface Components
 * 
 * World-class surface components inspired by Apple, Google, Microsoft
 * Built on mandatory MotoMind Design System foundation
 */

import React, { forwardRef, useEffect, useState } from 'react'
import { Container, Stack } from '@/components/design-system'
import { cn } from '@/lib/design-system'
import { eliteSurfaces } from '@/lib/design-system/elite-surfaces'

// ============================================================================
// APPLE-STYLE GLASS SURFACE
// ============================================================================

interface AppleGlassSurfaceProps {
  children: React.ReactNode
  variant?: 'subtle' | 'medium' | 'strong'
  context?: 'onLight' | 'onDark' | 'onColor'
  premium?: boolean
  className?: string
}

export const AppleGlassSurface = forwardRef<HTMLDivElement, AppleGlassSurfaceProps>(({
  children,
  variant = 'medium',
  context = 'onLight',
  premium = false,
  className
}, ref) => {
  const glassConfig = premium 
    ? eliteSurfaces.glassmorphism.premium.frostedGlass
    : eliteSurfaces.glassmorphism.contextual[context]

  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden',
        // Apple-style rounded corners
        'rounded-2xl',
        // Subtle border enhancement
        'ring-1 ring-white/20',
        className
      )}
      style={{
        background: glassConfig.background,
        backdropFilter: glassConfig.backdropFilter,
        border: glassConfig.border,
        boxShadow: 'boxShadow' in glassConfig ? glassConfig.boxShadow : undefined
      }}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
})

AppleGlassSurface.displayName = 'AppleGlassSurface'

// ============================================================================
// MATERIAL YOU ADAPTIVE SURFACE
// ============================================================================

interface MaterialYouSurfaceProps {
  children: React.ReactNode
  container?: 'primary' | 'secondary' | 'tertiary'
  elevation?: 0 | 1 | 2 | 3 | 4 | 5
  adaptive?: boolean
  className?: string
}

export const MaterialYouSurface = forwardRef<HTMLDivElement, MaterialYouSurfaceProps>(({
  children,
  container = 'primary',
  elevation = 1,
  adaptive = true,
  className
}, ref) => {
  const containerConfig = eliteSurfaces.materialYou.containers[container]
  const elevationColor = eliteSurfaces.materialYou.colorTokens.elevation[`level${elevation}` as keyof typeof eliteSurfaces.materialYou.colorTokens.elevation]

  return (
    <div
      ref={ref}
      className={cn(
        'relative',
        // Material You rounded corners
        'rounded-3xl',
        // Dynamic color adaptation
        adaptive && 'transition-colors duration-300 ease-out',
        className
      )}
      style={{
        background: elevationColor,
        color: containerConfig.onSurface
      }}
    >
      {children}
    </div>
  )
})

MaterialYouSurface.displayName = 'MaterialYouSurface'

// ============================================================================
// SOPHISTICATED DEPTH SURFACE
// ============================================================================

interface SophisticatedDepthSurfaceProps {
  children: React.ReactNode
  depth?: 'subtle' | 'soft' | 'medium' | 'strong'
  organic?: boolean
  context?: 'background' | 'surface' | 'overlay' | 'modal' | 'tooltip'
  className?: string
}

export const SophisticatedDepthSurface = forwardRef<HTMLDivElement, SophisticatedDepthSurfaceProps>(({
  children,
  depth = 'soft',
  organic = true,
  context = 'surface',
  className
}, ref) => {
  const contextConfig = eliteSurfaces.depth.contextualDepth[context]

  const boxShadow = organic 
    ? eliteSurfaces.depth.organicShadows.natural
    : eliteSurfaces.depth.layeredShadows[depth].join(', ')

  return (
    <div
      ref={ref}
      className={cn(
        'relative bg-white',
        'rounded-2xl',
        className
      )}
      style={{
        boxShadow,
        zIndex: contextConfig.zIndex
      }}
    >
      {children}
    </div>
  )
})

SophisticatedDepthSurface.displayName = 'SophisticatedDepthSurface'

// ============================================================================
// ADAPTIVE INTELLIGENT SURFACE
// ============================================================================

interface AdaptiveSurfaceProps {
  children: React.ReactNode
  contentType?: 'text' | 'media' | 'form' | 'data'
  deviceAware?: boolean
  themeAware?: boolean
  className?: string
}

export const AdaptiveSurface = forwardRef<HTMLDivElement, AdaptiveSurfaceProps>(({
  children,
  contentType = 'text',
  deviceAware = true,
  themeAware = true,
  className
}, ref) => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto')

  useEffect(() => {
    if (deviceAware) {
      const updateDeviceType = () => {
        const width = window.innerWidth
        if (width < 768) setDeviceType('mobile')
        else if (width < 1024) setDeviceType('tablet')
        else setDeviceType('desktop')
      }

      updateDeviceType()
      window.addEventListener('resize', updateDeviceType)
      return () => window.removeEventListener('resize', updateDeviceType)
    }
  }, [deviceAware])

  useEffect(() => {
    if (themeAware) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setTheme(mediaQuery.matches ? 'dark' : 'light')
      
      const handleChange = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? 'dark' : 'light')
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [themeAware])

  const contentConfig = eliteSurfaces.adaptive.contextAdaptation.content[contentType]
  const deviceConfig = eliteSurfaces.adaptive.contextAdaptation.device[deviceType]
  const themeConfig = eliteSurfaces.adaptive.contextAdaptation.theme[theme]

  return (
    <div
      ref={ref}
      className={cn(
        'relative transition-all duration-300 ease-out',
        className
      )}
      style={{
        ...contentConfig,
        ...deviceConfig,
        ...themeConfig
      }}
    >
      {children}
    </div>
  )
})

AdaptiveSurface.displayName = 'AdaptiveSurface'

// ============================================================================
// PREMIUM MICRO-INTERACTION SURFACE
// ============================================================================

interface PremiumInteractionSurfaceProps {
  children: React.ReactNode
  hoverEffect?: 'breathe' | 'lift' | 'glow'
  transition?: 'gentle' | 'smooth' | 'elastic'
  loading?: boolean
  loadingType?: 'shimmer' | 'skeleton' | 'pulse'
  onClick?: () => void
  className?: string
}

export const PremiumInteractionSurface = forwardRef<HTMLDivElement, PremiumInteractionSurfaceProps>(({
  children,
  hoverEffect = 'breathe',
  transition = 'gentle',
  loading = false,
  loadingType = 'shimmer',
  onClick,
  className
}, ref) => {
  const transitionConfig = eliteSurfaces.microInteractions.stateTransitions[transition]
  const hoverConfig = eliteSurfaces.microInteractions.hoverEffects[hoverEffect]
  const loadingConfig = eliteSurfaces.microInteractions.loadingStates[loadingType]

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        'relative bg-white rounded-2xl overflow-hidden',
        onClick && 'cursor-pointer',
        // Motion safe hover effects
        onClick && 'motion-safe:hover:transform motion-safe:hover:shadow-lg',
        loading && 'pointer-events-none',
        className
      )}
      style={{
        transition: `${transitionConfig.properties.join(', ')} ${transitionConfig.duration} ${transitionConfig.easing}`,
        ...(onClick && {
          ':hover': hoverConfig
        })
      }}
    >
      {loading && (
        <div 
          className="absolute inset-0 z-20"
          style={loadingConfig}
        />
      )}
      
      <div className={cn('relative z-10', loading && 'opacity-50')}>
        {children}
      </div>
    </div>
  )
})

PremiumInteractionSurface.displayName = 'PremiumInteractionSurface'

// ============================================================================
// INTELLIGENT CONTENT SURFACE
// ============================================================================

interface IntelligentContentSurfaceProps {
  children: React.ReactNode
  contentType?: 'text' | 'media' | 'code' | 'data'
  accessibilityLevel?: 'normal' | 'enhanced' | 'maximum'
  className?: string
}

export const IntelligentContentSurface = forwardRef<HTMLDivElement, IntelligentContentSurfaceProps>(({
  children,
  contentType = 'text',
  accessibilityLevel = 'normal',
  className
}, ref) => {
  const contentConfig = eliteSurfaces.intelligence.contentAware[contentType]
  const accessibilityConfig = eliteSurfaces.intelligence.accessibilityIntelligence

  const getAccessibilityStyles = () => {
    switch (accessibilityLevel) {
      case 'enhanced':
        return accessibilityConfig.contrastAdjustment.low
      case 'maximum':
        return accessibilityConfig.contrastAdjustment.high
      default:
        return accessibilityConfig.contrastAdjustment.normal
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        'relative bg-white rounded-xl',
        // Content-specific classes
        contentType === 'code' && 'font-mono text-sm',
        contentType === 'data' && 'font-variant-numeric tabular-nums',
        className
      )}
      style={{
        ...contentConfig,
        ...getAccessibilityStyles()
      }}
    >
      {children}
    </div>
  )
})

IntelligentContentSurface.displayName = 'IntelligentContentSurface'

// ============================================================================
// PRESET SURFACES (APPLE, GOOGLE, MICROSOFT STYLES)
// ============================================================================

interface PresetSurfaceProps {
  children: React.ReactNode
  preset: 'apple-card' | 'apple-modal' | 'material-card' | 'material-fab' | 'fluent-acrylic' | 'fluent-mica'
  className?: string
}

export const PresetSurface = forwardRef<HTMLDivElement, PresetSurfaceProps>(({
  children,
  preset,
  className
}, ref) => {
  const getPresetConfig = () => {
    switch (preset) {
      case 'apple-card':
        return eliteSurfaces.presets.apple.card
      case 'apple-modal':
        return eliteSurfaces.presets.apple.modal
      case 'material-card':
        return eliteSurfaces.presets.materialYou.card
      case 'material-fab':
        return eliteSurfaces.presets.materialYou.fab
      case 'fluent-acrylic':
        return eliteSurfaces.presets.fluent.acrylic
      case 'fluent-mica':
        return eliteSurfaces.presets.fluent.mica
      default:
        return eliteSurfaces.presets.apple.card
    }
  }

  const presetConfig = getPresetConfig()

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      style={presetConfig}
    >
      {children}
    </div>
  )
})

PresetSurface.displayName = 'PresetSurface'

// ============================================================================
// ELITE SURFACES SHOWCASE
// ============================================================================

export function EliteSurfacesShowcase() {
  return (
    <Container size="md" useCase="articles">
      <Stack spacing="xl">
        <div>
          <h2 className="text-3xl font-bold mb-6">Elite Surfaces Showcase</h2>
          
          {/* Apple-style Glass */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Apple-Style Glassmorphism</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl">
              <AppleGlassSurface variant="subtle" className="p-6">
                <h4 className="font-semibold mb-2">Subtle Glass</h4>
                <p className="text-sm opacity-80">Clean and minimal</p>
              </AppleGlassSurface>
              
              <AppleGlassSurface variant="medium" className="p-6">
                <h4 className="font-semibold mb-2">Medium Glass</h4>
                <p className="text-sm opacity-80">Balanced transparency</p>
              </AppleGlassSurface>
              
              <AppleGlassSurface variant="strong" premium className="p-6">
                <h4 className="font-semibold mb-2">Premium Glass</h4>
                <p className="text-sm opacity-80">Frosted luxury</p>
              </AppleGlassSurface>
            </div>
          </div>

          {/* Material You Surfaces */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Material You Adaptive</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MaterialYouSurface container="primary" className="p-6">
                <h4 className="font-semibold mb-2">Primary Container</h4>
                <p className="text-sm opacity-80">Adaptive colors</p>
              </MaterialYouSurface>
              
              <MaterialYouSurface container="secondary" elevation={2} className="p-6">
                <h4 className="font-semibold mb-2">Secondary Elevated</h4>
                <p className="text-sm opacity-80">Dynamic elevation</p>
              </MaterialYouSurface>
              
              <MaterialYouSurface container="tertiary" elevation={3} className="p-6">
                <h4 className="font-semibold mb-2">Tertiary Floating</h4>
                <p className="text-sm opacity-80">Contextual depth</p>
              </MaterialYouSurface>
            </div>
          </div>

          {/* Sophisticated Depth */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Sophisticated Depth</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SophisticatedDepthSurface depth="subtle" className="p-6">
                <h4 className="font-semibold mb-2">Subtle Depth</h4>
                <p className="text-sm text-gray-600">Organic shadows</p>
              </SophisticatedDepthSurface>
              
              <SophisticatedDepthSurface depth="medium" className="p-6">
                <h4 className="font-semibold mb-2">Medium Depth</h4>
                <p className="text-sm text-gray-600">Layered shadows</p>
              </SophisticatedDepthSurface>
              
              <SophisticatedDepthSurface depth="strong" context="modal" className="p-6">
                <h4 className="font-semibold mb-2">Strong Depth</h4>
                <p className="text-sm text-gray-600">Modal elevation</p>
              </SophisticatedDepthSurface>
            </div>
          </div>

          {/* Premium Interactions */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Premium Micro-Interactions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PremiumInteractionSurface 
                hoverEffect="breathe" 
                onClick={() => console.log('Breathe effect')}
                className="p-6"
              >
                <h4 className="font-semibold mb-2">Breathe Effect</h4>
                <p className="text-sm text-gray-600">Subtle scale animation</p>
              </PremiumInteractionSurface>
              
              <PremiumInteractionSurface 
                hoverEffect="lift" 
                onClick={() => console.log('Lift effect')}
                className="p-6"
              >
                <h4 className="font-semibold mb-2">Lift Effect</h4>
                <p className="text-sm text-gray-600">Elevation animation</p>
              </PremiumInteractionSurface>
              
              <PremiumInteractionSurface 
                hoverEffect="glow" 
                onClick={() => console.log('Glow effect')}
                className="p-6"
              >
                <h4 className="font-semibold mb-2">Glow Effect</h4>
                <p className="text-sm text-gray-600">Luminous feedback</p>
              </PremiumInteractionSurface>
            </div>
          </div>

          {/* Preset Surfaces */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Industry Presets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PresetSurface preset="apple-card" className="p-6">
                <h4 className="font-semibold mb-2">Apple Card Style</h4>
                <p className="text-sm opacity-80">iOS-inspired design</p>
              </PresetSurface>
              
              <PresetSurface preset="fluent-acrylic" className="p-6">
                <h4 className="font-semibold mb-2">Fluent Acrylic</h4>
                <p className="text-sm opacity-80">Windows 11 style</p>
              </PresetSurface>
            </div>
          </div>
        </div>
      </Stack>
    </Container>
  )
}
