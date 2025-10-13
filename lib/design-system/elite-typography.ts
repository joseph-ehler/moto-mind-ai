/**
 * Elite-Tier Typography System
 * 
 * World-class typography features that rival the best design systems:
 * - Variable fonts with dynamic scaling
 * - Optical sizing optimization
 * - Reading modes and accessibility
 * - AI-powered typography optimization
 * - Performance monitoring
 */

// ============================================================================
// VARIABLE FONTS SYSTEM
// ============================================================================

export const variableFonts = {
  // Variable font configurations
  primary: {
    family: 'Inter Variable',
    fallback: ['Inter', 'system-ui', 'sans-serif'],
    axes: {
      weight: { min: 100, max: 900, default: 400 },
      width: { min: 75, max: 125, default: 100 },
      slant: { min: -10, max: 0, default: 0 },
      optical: { min: 6, max: 144, default: 14 }
    }
  },

  // Dynamic weight scaling based on size
  dynamicWeights: {
    display: {
      base: 700,
      scale: (size: number) => Math.max(600, 700 - (size - 48) * 2) // Lighter at larger sizes
    },
    heading: {
      base: 600,
      scale: (size: number) => Math.max(500, 600 - (size - 24) * 1.5)
    },
    body: {
      base: 400,
      scale: (size: number) => Math.max(350, 400 - (size - 16) * 0.5)
    }
  },

  // Contextual width adjustments
  contextualWidth: {
    narrow: 87.5, // Condensed for tight spaces
    normal: 100,  // Standard width
    wide: 112.5   // Extended for emphasis
  }
} as const

// ============================================================================
// OPTICAL SIZING SYSTEM
// ============================================================================

export const opticalSizing = {
  // Automatic optical size calculation
  calculateOpticalSize: (fontSize: number): number => {
    // Convert px to optical size units (roughly equivalent to pt)
    return Math.max(6, Math.min(144, fontSize * 0.75))
  },

  // Size-specific optimizations
  sizeOptimizations: {
    small: {
      range: [6, 12],
      adjustments: {
        letterSpacing: '0.015em',
        fontWeight: '+50', // Slightly heavier
        lineHeight: 1.5
      }
    },
    medium: {
      range: [12, 24],
      adjustments: {
        letterSpacing: '0em',
        fontWeight: '0',
        lineHeight: 1.4
      }
    },
    large: {
      range: [24, 72],
      adjustments: {
        letterSpacing: '-0.015em',
        fontWeight: '-25', // Slightly lighter
        lineHeight: 1.2
      }
    },
    display: {
      range: [72, 144],
      adjustments: {
        letterSpacing: '-0.025em',
        fontWeight: '-50', // Much lighter
        lineHeight: 1.0
      }
    }
  }
} as const

// ============================================================================
// ADVANCED KERNING & LIGATURES
// ============================================================================

export const advancedTypography = {
  // OpenType features
  openTypeFeatures: {
    kerning: 'kern 1',           // Contextual kerning
    ligatures: 'liga 1, clig 1', // Common & contextual ligatures
    numerals: 'tnum 1',          // Tabular numerals for data
    fractions: 'frac 1',         // Automatic fractions
    superscript: 'sups 1',       // Superscript
    subscript: 'subs 1',         // Subscript
    smallCaps: 'smcp 1',         // Small capitals
    stylistic: 'ss01 1'          // Stylistic alternates
  },

  // Context-aware typography
  contextualFeatures: {
    code: {
      fontVariant: 'normal',
      fontFeatureSettings: '"tnum" 1, "zero" 1', // Tabular nums, slashed zero
      letterSpacing: '0.025em'
    },
    data: {
      fontFeatureSettings: '"tnum" 1, "lnum" 1', // Tabular, lining numerals
      fontVariantNumeric: 'tabular-nums'
    },
    emphasis: {
      fontFeatureSettings: '"swsh" 1', // Swashes for emphasis
      fontStyle: 'italic'
    }
  }
} as const

// ============================================================================
// READING MODES SYSTEM
// ============================================================================

export const readingModes = {
  // Focus mode - minimal distractions
  focus: {
    typography: {
      fontSize: 'clamp(1.125rem, 2vw, 1.25rem)', // Slightly larger
      lineHeight: 1.7,                            // More breathing room
      letterSpacing: '0.01em',                    // Slight spacing
      fontWeight: 400,
      maxWidth: '60ch'                            // Narrower for focus
    },
    colors: {
      background: '#fefefe',
      text: '#2d3748',
      accent: '#4a5568'
    }
  },

  // Dyslexia-friendly mode
  dyslexiaFriendly: {
    typography: {
      fontFamily: ['OpenDyslexic', 'Comic Sans MS', 'Arial'],
      fontSize: 'clamp(1.125rem, 2vw, 1.375rem)', // Larger base size
      lineHeight: 1.8,                             // Extra line spacing
      letterSpacing: '0.05em',                     // Increased letter spacing
      wordSpacing: '0.16em',                       // Increased word spacing
      fontWeight: 500,                             // Medium weight
      maxWidth: '55ch'                             // Shorter lines
    },
    colors: {
      background: '#fdf6e3', // Warm, cream background
      text: '#5c4317',       // Dark brown text
      accent: '#b58900'      // Gold accents
    }
  },

  // High contrast mode
  highContrast: {
    typography: {
      fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
      lineHeight: 1.6,
      letterSpacing: '0.025em',
      fontWeight: 600, // Bolder for better contrast
      maxWidth: '65ch'
    },
    colors: {
      background: '#000000',
      text: '#ffffff',
      accent: '#ffff00'
    }
  },

  // Dark mode optimized
  darkOptimized: {
    typography: {
      fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', // Slightly smaller in dark
      lineHeight: 1.65,
      letterSpacing: '0.015em',
      fontWeight: 350, // Lighter weight for dark backgrounds
      maxWidth: '65ch'
    },
    colors: {
      background: '#0f1419',
      text: '#e6e6e6',
      accent: '#39bae6'
    }
  }
} as const

// ============================================================================
// AI-POWERED TYPOGRAPHY OPTIMIZATION
// ============================================================================

export const typographyAI = {
  // Content type detection and optimization
  contentTypeOptimization: {
    article: {
      fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
      lineHeight: 1.6,
      paragraphSpacing: '1.5em',
      maxWidth: '65ch'
    },
    
    technical: {
      fontSize: 'clamp(0.9375rem, 1.25vw, 1rem)',
      lineHeight: 1.5,
      fontFamily: ['JetBrains Mono', 'Consolas', 'monospace'],
      maxWidth: '80ch' // Wider for code
    },
    
    marketing: {
      fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
      lineHeight: 1.4,
      fontWeight: 500,
      maxWidth: '55ch' // Shorter for impact
    },
    
    legal: {
      fontSize: 'clamp(0.9375rem, 1.25vw, 1rem)',
      lineHeight: 1.7, // Extra spacing for dense content
      maxWidth: '70ch'
    }
  },

  // Reading difficulty optimization
  readabilityOptimization: {
    simple: {
      fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
      lineHeight: 1.8,
      letterSpacing: '0.025em',
      maxWidth: '50ch'
    },
    
    complex: {
      fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
      lineHeight: 1.7,
      paragraphSpacing: '2em', // More breaks
      maxWidth: '60ch'
    }
  },

  // User behavior adaptation
  adaptiveOptimization: {
    quickScan: {
      fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
      lineHeight: 1.5,
      fontWeight: 500, // Bolder for scanning
      maxWidth: '55ch'
    },
    
    deepRead: {
      fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
      lineHeight: 1.7,
      fontWeight: 400,
      maxWidth: '65ch'
    }
  }
} as const

// ============================================================================
// TYPOGRAPHY PERFORMANCE MONITORING
// ============================================================================

export class TypographyPerformanceMonitor {
  private metrics: {
    renderTime: number[]
    layoutShifts: number[]
    readabilityScore: number[]
  } = {
    renderTime: [],
    layoutShifts: [],
    readabilityScore: []
  }

  // Monitor font loading performance
  monitorFontLoading(): Promise<void> {
    return new Promise((resolve) => {
      if ('fonts' in document) {
        const startTime = performance.now()
        
        document.fonts.ready.then(() => {
          const loadTime = performance.now() - startTime
          this.metrics.renderTime.push(loadTime)
          
          console.log(`🔤 Font loading completed in ${loadTime.toFixed(2)}ms`)
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  // Calculate readability score
  calculateReadabilityScore(element: HTMLElement): number {
    const computedStyle = getComputedStyle(element)
    const fontSize = parseFloat(computedStyle.fontSize)
    const lineHeight = parseFloat(computedStyle.lineHeight) / fontSize
    const textWidth = element.offsetWidth
    const charWidth = fontSize * 0.6 // Approximate character width
    const charactersPerLine = textWidth / charWidth

    let score = 100

    // Penalize for poor line length
    if (charactersPerLine < 45 || charactersPerLine > 75) {
      score -= Math.abs(charactersPerLine - 60) * 0.5
    }

    // Penalize for poor line height
    if (lineHeight < 1.2 || lineHeight > 1.8) {
      score -= Math.abs(lineHeight - 1.5) * 20
    }

    // Penalize for small font size
    if (fontSize < 16) {
      score -= (16 - fontSize) * 5
    }

    return Math.max(0, Math.min(100, score))
  }

  // Get performance report
  getPerformanceReport() {
    const avgRenderTime = this.metrics.renderTime.reduce((a, b) => a + b, 0) / this.metrics.renderTime.length
    const avgReadability = this.metrics.readabilityScore.reduce((a, b) => a + b, 0) / this.metrics.readabilityScore.length

    return {
      fontLoadTime: avgRenderTime || 0,
      readabilityScore: avgReadability || 0,
      layoutShifts: this.metrics.layoutShifts.length,
      recommendations: this.generateRecommendations(avgReadability)
    }
  }

  private generateRecommendations(readabilityScore: number): string[] {
    const recommendations: string[] = []

    if (readabilityScore < 70) {
      recommendations.push('Consider increasing font size for better readability')
    }
    if (readabilityScore < 60) {
      recommendations.push('Adjust line height to 1.4-1.6 for optimal reading')
    }
    if (readabilityScore < 50) {
      recommendations.push('Reduce line length to 45-75 characters')
    }

    return recommendations
  }
}

// ============================================================================
// ADVANCED TYPOGRAPHY UTILITIES
// ============================================================================

export const eliteTypographyUtils = {
  // Generate variable font CSS
  generateVariableFontCSS: (
    size: number,
    weight?: number,
    width?: number,
    optical?: number
  ): string => {
    const opticalSize = optical || opticalSizing.calculateOpticalSize(size)
    const fontWeight = weight || variableFonts.dynamicWeights.body.scale(size)
    const fontWidth = width || variableFonts.contextualWidth.normal

    return `
      font-family: ${variableFonts.primary.family};
      font-size: ${size}px;
      font-weight: ${fontWeight};
      font-variation-settings: 
        "wght" ${fontWeight},
        "wdth" ${fontWidth},
        "opsz" ${opticalSize};
      font-feature-settings: ${advancedTypography.openTypeFeatures.kerning};
    `
  },

  // Apply reading mode
  applyReadingMode: (mode: keyof typeof readingModes, element: HTMLElement): void => {
    const modeConfig = readingModes[mode]
    const styles = modeConfig.typography

    Object.entries(styles).forEach(([property, value]) => {
      const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase()
      element.style.setProperty(cssProperty, value as string)
    })

    // Apply color scheme
    element.style.backgroundColor = modeConfig.colors.background
    element.style.color = modeConfig.colors.text
  },

  // Optimize typography for content type
  optimizeForContentType: (
    contentType: keyof typeof typographyAI.contentTypeOptimization,
    element: HTMLElement
  ): void => {
    const optimization = typographyAI.contentTypeOptimization[contentType]
    
    Object.entries(optimization).forEach(([property, value]) => {
      const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase()
      element.style.setProperty(cssProperty, value as string)
    })
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const eliteTypography = {
  variableFonts,
  opticalSizing,
  advancedTypography,
  readingModes,
  typographyAI,
  TypographyPerformanceMonitor,
  utils: eliteTypographyUtils
} as const

export type EliteTypography = typeof eliteTypography
export type ReadingMode = keyof typeof readingModes
export type ContentType = keyof typeof typographyAI.contentTypeOptimization
