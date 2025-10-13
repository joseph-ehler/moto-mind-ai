/**
 * Elite Surfaces Design System
 * 
 * World-class surface system inspired by:
 * - Apple's glassmorphism and depth
 * - Google's Material You adaptive colors
 * - Microsoft's Fluent Design acrylic
 * - Clean, minimal, functional design
 */

// ============================================================================
// ADVANCED GLASSMORPHISM (APPLE-INSPIRED)
// ============================================================================

export const advancedGlassmorphism = {
  // Dynamic blur based on content behind
  dynamicBlur: {
    subtle: {
      backdropFilter: 'blur(8px) saturate(180%)',
      background: 'rgba(255, 255, 255, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    },
    medium: {
      backdropFilter: 'blur(16px) saturate(180%)',
      background: 'rgba(255, 255, 255, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
    },
    strong: {
      backdropFilter: 'blur(24px) saturate(200%)',
      background: 'rgba(255, 255, 255, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
    }
  },

  // Contextual glass (adapts to background)
  contextual: {
    onLight: {
      backdropFilter: 'blur(20px) saturate(180%)',
      background: 'rgba(255, 255, 255, 0.75)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    onDark: {
      backdropFilter: 'blur(20px) saturate(180%)',
      background: 'rgba(0, 0, 0, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    onColor: {
      backdropFilter: 'blur(20px) saturate(180%)',
      background: 'rgba(255, 255, 255, 0.25)',
      border: '1px solid rgba(255, 255, 255, 0.15)'
    }
  },

  // Premium glass effects
  premium: {
    frostedGlass: {
      backdropFilter: 'blur(40px) saturate(125%) contrast(125%)',
      background: 'rgba(255, 255, 255, 0.9)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 20px 40px rgba(0, 0, 0, 0.1)'
    },
    crystalClear: {
      backdropFilter: 'blur(12px) brightness(110%) contrast(110%)',
      background: 'rgba(255, 255, 255, 0.85)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
    }
  }
} as const

// ============================================================================
// MATERIAL YOU ADAPTIVE COLORS (GOOGLE-INSPIRED)
// ============================================================================

export const materialYouSurfaces = {
  // Dynamic color generation
  colorTokens: {
    primary: {
      surface: 'var(--md-sys-color-surface)',
      surfaceVariant: 'var(--md-sys-color-surface-variant)',
      surfaceContainer: 'var(--md-sys-color-surface-container)',
      surfaceContainerHigh: 'var(--md-sys-color-surface-container-high)',
      surfaceContainerHighest: 'var(--md-sys-color-surface-container-highest)'
    },
    elevation: {
      level0: 'var(--md-sys-color-surface)',
      level1: 'color-mix(in srgb, var(--md-sys-color-surface) 95%, var(--md-sys-color-primary) 5%)',
      level2: 'color-mix(in srgb, var(--md-sys-color-surface) 92%, var(--md-sys-color-primary) 8%)',
      level3: 'color-mix(in srgb, var(--md-sys-color-surface) 89%, var(--md-sys-color-primary) 11%)',
      level4: 'color-mix(in srgb, var(--md-sys-color-surface) 87%, var(--md-sys-color-primary) 13%)',
      level5: 'color-mix(in srgb, var(--md-sys-color-surface) 84%, var(--md-sys-color-primary) 16%)'
    }
  },

  // Adaptive surface containers
  containers: {
    primary: {
      background: 'var(--md-sys-color-primary-container)',
      onSurface: 'var(--md-sys-color-on-primary-container)',
      elevation: 'var(--md-elevation-level1)'
    },
    secondary: {
      background: 'var(--md-sys-color-secondary-container)',
      onSurface: 'var(--md-sys-color-on-secondary-container)',
      elevation: 'var(--md-elevation-level1)'
    },
    tertiary: {
      background: 'var(--md-sys-color-tertiary-container)',
      onSurface: 'var(--md-sys-color-on-tertiary-container)',
      elevation: 'var(--md-elevation-level1)'
    }
  }
} as const

// ============================================================================
// SOPHISTICATED DEPTH SYSTEM
// ============================================================================

export const sophisticatedDepth = {
  // Multi-layer shadow system
  layeredShadows: {
    subtle: [
      '0 1px 2px rgba(0, 0, 0, 0.04)',
      '0 1px 4px rgba(0, 0, 0, 0.04)'
    ],
    soft: [
      '0 2px 4px rgba(0, 0, 0, 0.06)',
      '0 4px 8px rgba(0, 0, 0, 0.06)',
      '0 8px 16px rgba(0, 0, 0, 0.06)'
    ],
    medium: [
      '0 4px 8px rgba(0, 0, 0, 0.08)',
      '0 8px 16px rgba(0, 0, 0, 0.08)',
      '0 16px 32px rgba(0, 0, 0, 0.08)'
    ],
    strong: [
      '0 8px 16px rgba(0, 0, 0, 0.1)',
      '0 16px 32px rgba(0, 0, 0, 0.1)',
      '0 32px 64px rgba(0, 0, 0, 0.1)'
    ]
  },

  // Contextual depth (based on surface hierarchy)
  contextualDepth: {
    background: { zIndex: 0, shadow: 'none' },
    surface: { zIndex: 1, shadow: 'subtle' },
    overlay: { zIndex: 10, shadow: 'soft' },
    modal: { zIndex: 100, shadow: 'medium' },
    tooltip: { zIndex: 1000, shadow: 'strong' },
    notification: { zIndex: 10000, shadow: 'strong' }
  },

  // Organic shadows (more natural feeling)
  organicShadows: {
    natural: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06)',
    floating: '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
    elevated: '0 8px 32px rgba(0, 0, 0, 0.16), 0 4px 16px rgba(0, 0, 0, 0.12)'
  }
} as const

// ============================================================================
// ADAPTIVE SURFACE BEHAVIORS
// ============================================================================

export const adaptiveSurfaces = {
  // Context-aware adaptation
  contextAdaptation: {
    content: {
      text: { padding: '24px', lineHeight: 1.6 },
      media: { padding: '0', overflow: 'hidden' },
      form: { padding: '32px', background: 'var(--surface-form)' },
      data: { padding: '16px', fontVariant: 'tabular-nums' }
    },
    
    device: {
      mobile: { borderRadius: '12px', padding: '16px' },
      tablet: { borderRadius: '16px', padding: '24px' },
      desktop: { borderRadius: '20px', padding: '32px' }
    },

    theme: {
      light: { 
        background: 'rgba(255, 255, 255, 0.9)',
        border: 'rgba(0, 0, 0, 0.1)'
      },
      dark: { 
        background: 'rgba(0, 0, 0, 0.8)',
        border: 'rgba(255, 255, 255, 0.1)'
      },
      auto: {
        background: 'color-mix(in srgb, canvas 90%, transparent 10%)',
        border: 'color-mix(in srgb, canvasText 10%, transparent 90%)'
      }
    }
  },

  // Intelligent surface sizing
  intelligentSizing: {
    content: {
      minimal: { minHeight: '40px', padding: '8px 16px' },
      compact: { minHeight: '56px', padding: '12px 20px' },
      comfortable: { minHeight: '72px', padding: '16px 24px' },
      spacious: { minHeight: '96px', padding: '24px 32px' }
    },
    
    breakpoints: {
      xs: { maxWidth: '320px', padding: '12px' },
      sm: { maxWidth: '480px', padding: '16px' },
      md: { maxWidth: '768px', padding: '24px' },
      lg: { maxWidth: '1024px', padding: '32px' },
      xl: { maxWidth: '1280px', padding: '40px' }
    }
  }
} as const

// ============================================================================
// PREMIUM MICRO-INTERACTIONS
// ============================================================================

export const premiumMicroInteractions = {
  // Subtle state transitions
  stateTransitions: {
    gentle: {
      duration: '200ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      properties: ['background-color', 'border-color', 'box-shadow']
    },
    smooth: {
      duration: '300ms',
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      properties: ['transform', 'opacity']
    },
    elastic: {
      duration: '400ms',
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      properties: ['scale']
    }
  },

  // Hover micro-animations
  hoverEffects: {
    breathe: {
      transform: 'scale(1.02)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      transition: 'all 200ms ease-out'
    },
    lift: {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
      transition: 'all 200ms ease-out'
    },
    glow: {
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.3), 0 8px 32px rgba(0, 0, 0, 0.12)',
      transition: 'box-shadow 200ms ease-out'
    }
  },

  // Loading states
  loadingStates: {
    shimmer: {
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite ease-in-out'
    },
    skeleton: {
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton 1.2s infinite ease-in-out'
    },
    pulse: {
      animation: 'pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1)'
    }
  }
} as const

// ============================================================================
// SURFACE INTELLIGENCE
// ============================================================================

export const surfaceIntelligence = {
  // Content-aware surfaces
  contentAware: {
    text: {
      maxWidth: '65ch',
      lineHeight: 1.6,
      padding: '24px 32px'
    },
    media: {
      aspectRatio: '16/9',
      overflow: 'hidden',
      borderRadius: '12px'
    },
    code: {
      fontFamily: 'monospace',
      fontSize: '14px',
      padding: '16px',
      background: 'var(--surface-code)'
    },
    data: {
      fontVariant: 'tabular-nums',
      padding: '12px 16px',
      borderCollapse: 'collapse'
    }
  },

  // Accessibility intelligence
  accessibilityIntelligence: {
    contrastAdjustment: {
      low: { filter: 'contrast(150%)' },
      normal: { filter: 'none' },
      high: { filter: 'contrast(200%) brightness(120%)' }
    },
    
    motionSensitivity: {
      reduced: { 
        transition: 'none',
        animation: 'none',
        transform: 'none'
      },
      normal: {
        transition: 'all 200ms ease',
        animation: 'inherit'
      }
    },

    focusEnhancement: {
      keyboard: {
        outline: '3px solid var(--focus-color)',
        outlineOffset: '2px',
        borderRadius: '4px'
      },
      mouse: {
        outline: 'none'
      }
    }
  }
} as const

// ============================================================================
// ELITE SURFACE PRESETS
// ============================================================================

export const eliteSurfacePresets = {
  // Apple-inspired presets
  apple: {
    card: {
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    },
    modal: {
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(40px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
    }
  },

  // Google Material You presets
  materialYou: {
    card: {
      background: 'var(--md-sys-color-surface-container)',
      color: 'var(--md-sys-color-on-surface)',
      borderRadius: '12px',
      elevation: 'var(--md-elevation-level1)'
    },
    fab: {
      background: 'var(--md-sys-color-primary-container)',
      color: 'var(--md-sys-color-on-primary-container)',
      borderRadius: '16px',
      elevation: 'var(--md-elevation-level3)'
    }
  },

  // Microsoft Fluent presets
  fluent: {
    acrylic: {
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(30px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px'
    },
    mica: {
      background: 'color-mix(in srgb, canvas 70%, transparent 30%)',
      backdropFilter: 'blur(50px)',
      borderRadius: '8px'
    }
  }
} as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const eliteSurfaceUtils = {
  // Generate dynamic glass effect based on background
  generateDynamicGlass: (backgroundLuminance: number) => {
    const opacity = backgroundLuminance > 0.5 ? 0.8 : 0.4
    const blur = backgroundLuminance > 0.5 ? 20 : 30
    
    return {
      background: `rgba(255, 255, 255, ${opacity})`,
      backdropFilter: `blur(${blur}px) saturate(180%)`,
      border: `1px solid rgba(255, 255, 255, ${opacity * 0.3})`
    }
  },

  // Calculate optimal surface elevation
  calculateOptimalElevation: (context: string, importance: number) => {
    const baseElevation = {
      background: 0,
      content: 1,
      navigation: 2,
      modal: 4,
      tooltip: 5
    }[context] || 1

    return Math.min(5, baseElevation + Math.floor(importance * 2))
  },

  // Generate accessible surface colors
  generateAccessibleSurface: (baseColor: string, contrastRatio: number) => {
    // This would use a proper color manipulation library in production
    return {
      background: baseColor,
      foreground: contrastRatio > 4.5 ? '#000000' : '#ffffff',
      border: `color-mix(in srgb, ${baseColor} 80%, transparent 20%)`
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const eliteSurfaces = {
  glassmorphism: advancedGlassmorphism,
  materialYou: materialYouSurfaces,
  depth: sophisticatedDepth,
  adaptive: adaptiveSurfaces,
  microInteractions: premiumMicroInteractions,
  intelligence: surfaceIntelligence,
  presets: eliteSurfacePresets,
  utils: eliteSurfaceUtils
} as const

export type EliteSurfaces = typeof eliteSurfaces
