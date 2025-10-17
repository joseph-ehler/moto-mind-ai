/**
 * Elite Surfaces Design System
 * 
 * Advanced surface system with:
 * - Material Design 3.0 elevation
 * - Glass morphism effects
 * - Interactive surface states
 * - Accessibility compliance
 * - Performance optimization
 */

// ============================================================================
// SURFACE ELEVATION SYSTEM
// ============================================================================

export const surfaceElevation = {
  // Material Design 3.0 elevation levels
  levels: {
    0: {
      shadow: 'none',
      overlay: 'rgba(0, 0, 0, 0)',
      description: 'Surface level - no elevation'
    },
    1: {
      shadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      overlay: 'rgba(0, 0, 0, 0.05)',
      description: 'Raised - cards, chips'
    },
    2: {
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.08)',
      description: 'Elevated - buttons, switches'
    },
    3: {
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.11)',
      description: 'Floating - FAB, menus'
    },
    4: {
      shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.12)',
      description: 'Hovering - dropdowns, tooltips'
    },
    5: {
      shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.14)',
      description: 'Overlaying - modals, dialogs'
    }
  },

  // Dynamic elevation for interactions
  interactive: {
    hover: {
      from: 1,
      to: 2,
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    active: {
      from: 2,
      to: 1,
      duration: '100ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    focus: {
      ring: '2px solid rgba(59, 130, 246, 0.5)',
      offset: '2px'
    }
  }
} as const

// ============================================================================
// SURFACE MATERIALS
// ============================================================================

export const surfaceMaterials = {
  // Glass morphism effects
  glass: {
    light: {
      background: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(10px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      borderRadius: '12px'
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px'
    },
    heavy: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(40px) saturate(200%)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      borderRadius: '20px'
    }
  },

  // Frosted glass effects
  frosted: {
    light: {
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.4)'
    },
    heavy: {
      background: 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(32px)',
      border: '1px solid rgba(255, 255, 255, 0.5)'
    }
  },

  // Solid materials
  solid: {
    paper: {
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px'
    },
    card: {
      background: '#ffffff',
      border: '1px solid #f3f4f6',
      borderRadius: '12px'
    },
    panel: {
      background: '#fafafa',
      border: '1px solid #e5e7eb',
      borderRadius: '16px'
    }
  },

  // Gradient materials
  gradient: {
    subtle: {
      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      border: '1px solid #e2e8f0'
    },
    warm: {
      background: 'linear-gradient(145deg, #fef7ed 0%, #fed7aa 100%)',
      border: '1px solid #fdba74'
    },
    cool: {
      background: 'linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%)',
      border: '1px solid #93c5fd'
    }
  }
} as const

// ============================================================================
// SURFACE INTERACTIONS
// ============================================================================

export const surfaceInteractions = {
  // Hover states
  hover: {
    lift: {
      transform: 'translateY(-2px)',
      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
    },
    glow: {
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
      transition: 'box-shadow 200ms ease'
    },
    scale: {
      transform: 'scale(1.02)',
      transition: 'transform 150ms ease'
    },
    brighten: {
      filter: 'brightness(1.05)',
      transition: 'filter 150ms ease'
    }
  },

  // Active states
  active: {
    press: {
      transform: 'translateY(1px) scale(0.98)',
      transition: 'transform 100ms ease'
    },
    darken: {
      filter: 'brightness(0.95)',
      transition: 'filter 100ms ease'
    }
  },

  // Focus states
  focus: {
    ring: {
      outline: '2px solid rgba(59, 130, 246, 0.5)',
      outlineOffset: '2px'
    },
    glow: {
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    }
  },

  // Loading states
  loading: {
    shimmer: {
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite'
    },
    pulse: {
      animation: 'pulse 2s infinite'
    }
  }
} as const

// ============================================================================
// SURFACE ACCESSIBILITY (ACCESSIBILITY-FIRST APPROACH)
// ============================================================================

export const surfaceAccessibility = {
  // Contrast requirements (WCAG 2.1 AA/AAA)
  contrast: {
    normal: {
      minRatio: 4.5,
      background: '#ffffff',
      text: '#111827'
    },
    large: {
      minRatio: 3.0,
      background: '#ffffff',
      text: '#374151'
    },
    highContrast: {
      minRatio: 7.0,
      background: '#000000',
      text: '#ffffff'
    }
  },

  // Focus indicators (keyboard navigation)
  focusIndicators: {
    visible: {
      outline: '2px solid #3b82f6',
      outlineOffset: '2px',
      borderRadius: '4px'
    },
    highContrast: {
      outline: '3px solid #000000',
      outlineOffset: '2px',
      backgroundColor: '#ffff00'
    }
  },

  // Motion preferences (RESPECT USER PREFERENCES)
  motion: {
    // Default: Minimal motion for accessibility
    reduced: {
      transition: 'none',
      animation: 'none',
      transform: 'none'
    },
    // Only when user explicitly allows motion
    respectful: {
      transition: 'opacity 200ms ease, transform 200ms ease',
      maxDuration: '200ms', // Keep animations short
      easing: 'ease-out'     // Gentle easing
    },
    // Purposeful motion only
    purposeful: {
      hover: 'transform 150ms ease-out', // Subtle feedback
      focus: 'box-shadow 150ms ease',    // Clear focus indication
      loading: 'opacity 1s ease-in-out' // Necessary feedback
    }
  },

  // Vestibular disorder considerations
  vestibularSafe: {
    // No parallax, no rotation, no scaling
    noParallax: true,
    noRotation: true,
    noAutoplay: true,
    maxScale: 1.02, // Minimal scaling only
    maxTranslate: '2px' // Minimal movement only
  }
} as const

// ============================================================================
// SURFACE PERFORMANCE
// ============================================================================

export const surfacePerformance = {
  // GPU acceleration
  gpuAcceleration: {
    transform: 'translateZ(0)',
    willChange: 'transform',
    backfaceVisibility: 'hidden'
  },

  // Composite layers
  compositeLayers: {
    isolate: 'isolate',
    contain: 'layout style paint',
    contentVisibility: 'auto'
  },

  // Optimized animations
  optimizedAnimations: {
    transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 150ms ease',
    filter: 'filter 150ms ease'
  }
} as const

// ============================================================================
// SURFACE SEMANTIC TOKENS
// ============================================================================

export const surfaceSemantics = {
  // Surface roles
  roles: {
    background: {
      elevation: 0,
      material: 'solid.paper',
      description: 'App background'
    },
    surface: {
      elevation: 1,
      material: 'solid.card',
      description: 'Content cards'
    },
    overlay: {
      elevation: 5,
      material: 'glass.medium',
      description: 'Modals, dialogs'
    },
    tooltip: {
      elevation: 4,
      material: 'solid.panel',
      description: 'Tooltips, popovers'
    }
  },

  // Interactive surfaces
  interactive: {
    button: {
      elevation: 2,
      material: 'solid.card',
      hover: 'lift',
      active: 'press',
      focus: 'ring'
    },
    card: {
      elevation: 1,
      material: 'solid.card',
      hover: 'lift',
      focus: 'glow'
    },
    input: {
      elevation: 0,
      material: 'solid.paper',
      focus: 'ring',
      border: true
    }
  }
} as const

// ============================================================================
// SURFACE UTILITIES
// ============================================================================

export const surfaceUtils = {
  // Generate surface styles
  generateSurfaceStyles: (
    elevation: keyof typeof surfaceElevation.levels,
    material: string,
    interactive?: boolean
  ) => {
    const elevationConfig = surfaceElevation.levels[elevation]
    const materialPath = material.split('.')
    const materialConfig = materialPath.reduce((obj: any, key) => obj[key], surfaceMaterials)

    const baseStyles = {
      ...materialConfig,
      boxShadow: elevationConfig.shadow,
      position: 'relative' as const
    }

    if (interactive) {
      return {
        ...baseStyles,
        cursor: 'pointer',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        ':hover': surfaceInteractions.hover.lift,
        ':active': surfaceInteractions.active.press,
        ':focus-visible': surfaceInteractions.focus.ring
      }
    }

    return baseStyles
  },

  // Calculate contrast ratio
  calculateContrastRatio: (foreground: string, background: string): number => {
    // Simplified contrast calculation
    // In a real implementation, you'd use a proper color contrast library
    const getLuminance = (color: string): number => {
      // This is a simplified version - use a proper color library in production
      return 0.5 // Placeholder
    }

    const fgLuminance = getLuminance(foreground)
    const bgLuminance = getLuminance(background)
    
    const lighter = Math.max(fgLuminance, bgLuminance)
    const darker = Math.min(fgLuminance, bgLuminance)
    
    return (lighter + 0.05) / (darker + 0.05)
  },

  // Validate accessibility
  validateAccessibility: (
    foreground: string,
    background: string,
    textSize: 'normal' | 'large' = 'normal'
  ): { valid: boolean; ratio: number; required: number } => {
    const ratio = surfaceUtils.calculateContrastRatio(foreground, background)
    const required = textSize === 'large' 
      ? surfaceAccessibility.contrast.large.minRatio
      : surfaceAccessibility.contrast.normal.minRatio

    return {
      valid: ratio >= required,
      ratio,
      required
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const surfaces = {
  elevation: surfaceElevation,
  materials: surfaceMaterials,
  interactions: surfaceInteractions,
  accessibility: surfaceAccessibility,
  performance: surfacePerformance,
  semantics: surfaceSemantics,
  utils: surfaceUtils
} as const

export type SurfaceElevation = keyof typeof surfaceElevation.levels
export type SurfaceMaterial = string
export type SurfaceInteraction = keyof typeof surfaceInteractions.hover
export type Surfaces = typeof surfaces
