/**
 * Responsive Typography Design System
 * 
 * Elite-tier typography system with:
 * - Fluid scaling with CSS clamp()
 * - Optimal reading experience
 * - WCAG 2.1 AA compliance
 * - Mobile-first approach
 * - Container-based scaling
 */

// ============================================================================
// TYPOGRAPHY SCALE - FLUID & RESPONSIVE
// ============================================================================

export const typographyScale = {
  // Fluid font sizes using CSS clamp(min, preferred, max)
  // Format: clamp(mobile, viewport-based, desktop)
  
  // Display sizes (hero sections, landing pages)
  display: {
    xl: 'clamp(2.5rem, 8vw, 6rem)',      // 40px → 96px
    lg: 'clamp(2.25rem, 6vw, 4.5rem)',   // 36px → 72px
    md: 'clamp(2rem, 5vw, 3.75rem)',     // 32px → 60px
    sm: 'clamp(1.75rem, 4vw, 3rem)'      // 28px → 48px
  },

  // Heading sizes (page titles, section headers)
  heading: {
    h1: 'clamp(1.875rem, 4vw, 2.25rem)', // 30px → 36px
    h2: 'clamp(1.5rem, 3vw, 1.875rem)',  // 24px → 30px
    h3: 'clamp(1.25rem, 2.5vw, 1.5rem)', // 20px → 24px
    h4: 'clamp(1.125rem, 2vw, 1.25rem)', // 18px → 20px
    h5: 'clamp(1rem, 1.5vw, 1.125rem)',  // 16px → 18px
    h6: 'clamp(1rem, 1vw, 1rem)'         // 16px → 16px
  },

  // Body text sizes
  body: {
    xl: 'clamp(1.125rem, 2vw, 1.25rem)', // 18px → 20px
    lg: 'clamp(1rem, 1.5vw, 1.125rem)',  // 16px → 18px
    md: 'clamp(1rem, 1vw, 1rem)',        // 16px → 16px (base)
    sm: 'clamp(0.875rem, 1vw, 0.875rem)', // 14px → 14px
    xs: 'clamp(0.75rem, 1vw, 0.75rem)'   // 12px → 12px
  },

  // UI text sizes (buttons, labels, captions)
  ui: {
    button: 'clamp(1rem, 1vw, 1rem)',     // 16px (touch-friendly)
    label: 'clamp(0.875rem, 1vw, 0.875rem)', // 14px
    caption: 'clamp(0.75rem, 1vw, 0.8125rem)', // 12px → 13px
    overline: 'clamp(0.6875rem, 1vw, 0.75rem)' // 11px → 12px
  }
} as const

// ============================================================================
// LINE HEIGHT SYSTEM
// ============================================================================

export const lineHeights = {
  // Display text (large headings)
  display: {
    tight: '0.9',    // 90% - Very tight for impact
    normal: '1.0',   // 100% - Standard for displays
    relaxed: '1.1'   // 110% - Slightly relaxed
  },

  // Heading text
  heading: {
    tight: '1.1',    // 110% - Tight but readable
    normal: '1.2',   // 120% - Standard for headings
    relaxed: '1.3'   // 130% - More breathing room
  },

  // Body text (optimal for reading)
  body: {
    tight: '1.4',    // 140% - Minimum for accessibility
    normal: '1.5',   // 150% - Optimal for most content
    relaxed: '1.6',  // 160% - Very comfortable reading
    loose: '1.75'    // 175% - Maximum comfortable
  },

  // UI elements
  ui: {
    tight: '1.0',    // 100% - Buttons, labels
    normal: '1.2',   // 120% - Form inputs
    relaxed: '1.4'   // 140% - Captions, help text
  }
} as const

// ============================================================================
// FONT WEIGHTS
// ============================================================================

export const fontWeights = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',    // Body text default
  medium: '500',    // Emphasis, labels
  semibold: '600',  // Headings, important text
  bold: '700',      // Strong emphasis
  extrabold: '800',
  black: '900'
} as const

// ============================================================================
// LETTER SPACING
// ============================================================================

export const letterSpacing = {
  tighter: '-0.05em',  // -0.8px at 16px
  tight: '-0.025em',   // -0.4px at 16px
  normal: '0em',       // 0px
  wide: '0.025em',     // 0.4px at 16px
  wider: '0.05em',     // 0.8px at 16px
  widest: '0.1em'      // 1.6px at 16px
} as const

// ============================================================================
// READING OPTIMIZATION
// ============================================================================

export const readingOptimization = {
  // Optimal line lengths (characters per line)
  lineLength: {
    narrow: '45ch',    // Minimum comfortable
    optimal: '65ch',   // Ideal for most content
    wide: '75ch',      // Maximum comfortable
    caption: '40ch'    // Short form content
  },

  // Container-based max widths for optimal reading
  maxWidth: {
    prose: '65ch',     // Prose content
    heading: '40ch',   // Headings
    caption: '35ch',   // Captions, labels
    button: '20ch'     // Button text
  },

  // Paragraph spacing
  paragraphSpacing: {
    tight: '1em',      // Tight spacing
    normal: '1.25em',  // Standard spacing
    relaxed: '1.5em'   // Generous spacing
  }
} as const

// ============================================================================
// RESPONSIVE TYPOGRAPHY CLASSES
// ============================================================================

export const responsiveTypographyClasses = {
  // Display classes
  'display-xl': {
    fontSize: typographyScale.display.xl,
    lineHeight: lineHeights.display.normal,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tighter
  },
  
  'display-lg': {
    fontSize: typographyScale.display.lg,
    lineHeight: lineHeights.display.normal,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight
  },

  // Heading classes
  'heading-h1': {
    fontSize: typographyScale.heading.h1,
    lineHeight: lineHeights.heading.normal,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight
  },

  'heading-h2': {
    fontSize: typographyScale.heading.h2,
    lineHeight: lineHeights.heading.normal,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal
  },

  'heading-h3': {
    fontSize: typographyScale.heading.h3,
    lineHeight: lineHeights.heading.normal,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal
  },

  // Body classes
  'body-xl': {
    fontSize: typographyScale.body.xl,
    lineHeight: lineHeights.body.normal,
    fontWeight: fontWeights.normal
  },

  'body-lg': {
    fontSize: typographyScale.body.lg,
    lineHeight: lineHeights.body.normal,
    fontWeight: fontWeights.normal
  },

  'body-md': {
    fontSize: typographyScale.body.md,
    lineHeight: lineHeights.body.normal,
    fontWeight: fontWeights.normal
  },

  // UI classes
  'ui-button': {
    fontSize: typographyScale.ui.button,
    lineHeight: lineHeights.ui.tight,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.wide
  },

  'ui-label': {
    fontSize: typographyScale.ui.label,
    lineHeight: lineHeights.ui.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide
  }
} as const

// ============================================================================
// ACCESSIBILITY FEATURES
// ============================================================================

export const accessibilityFeatures = {
  // Minimum contrast ratios (WCAG 2.1 AA)
  contrastRatios: {
    normalText: 4.5,     // 18px+ or 14px+ bold
    largeText: 3.0,      // 24px+ or 18.5px+ bold
    uiComponents: 3.0    // Form controls, icons
  },

  // Focus indicators
  focusIndicators: {
    outline: '2px solid #3b82f6',
    outlineOffset: '2px',
    borderRadius: '4px'
  },

  // Reduced motion preferences
  reducedMotion: {
    transition: 'none',
    animation: 'none'
  }
} as const

// ============================================================================
// CONTAINER-BASED TYPOGRAPHY
// ============================================================================

export const containerTypography = {
  // Typography that scales based on container width
  containerQueries: {
    // Small containers (< 400px)
    small: {
      fontSize: typographyScale.body.sm,
      lineHeight: lineHeights.body.normal
    },
    
    // Medium containers (400px - 600px)
    medium: {
      fontSize: typographyScale.body.md,
      lineHeight: lineHeights.body.normal
    },
    
    // Large containers (> 600px)
    large: {
      fontSize: typographyScale.body.lg,
      lineHeight: lineHeights.body.relaxed
    }
  }
} as const

// ============================================================================
// SEMANTIC TYPOGRAPHY MAPPING
// ============================================================================

export const semanticTypography = {
  // Page structure
  pageTitle: 'display-lg',
  sectionTitle: 'heading-h1',
  subsectionTitle: 'heading-h2',
  componentTitle: 'heading-h3',
  
  // Content types
  heroText: 'display-xl',
  leadText: 'body-xl',
  bodyText: 'body-md',
  captionText: 'body-sm',
  
  // UI elements
  buttonText: 'ui-button',
  labelText: 'ui-label',
  helpText: 'body-xs',
  
  // Navigation
  navLink: 'body-md',
  breadcrumb: 'body-sm',
  
  // Data display
  metricValue: 'display-md',
  metricLabel: 'ui-label',
  tableHeader: 'ui-label',
  tableCell: 'body-sm'
} as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getTypographyClass(semantic: keyof typeof semanticTypography): string {
  return semanticTypography[semantic]
}

export function generateTypographyCSS(className: keyof typeof responsiveTypographyClasses): string {
  const styles = responsiveTypographyClasses[className]
  return Object.entries(styles)
    .map(([property, value]) => `${property.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
    .join(' ')
}

// ============================================================================
// EXPORTS
// ============================================================================

export const responsiveTypography = {
  scale: typographyScale,
  lineHeights,
  fontWeights,
  letterSpacing,
  readingOptimization,
  classes: responsiveTypographyClasses,
  accessibility: accessibilityFeatures,
  container: containerTypography,
  semantic: semanticTypography,
  getTypographyClass,
  generateTypographyCSS
} as const

export type ResponsiveTypography = typeof responsiveTypography
export type TypographyScale = keyof typeof responsiveTypographyClasses
export type SemanticTypography = keyof typeof semanticTypography
