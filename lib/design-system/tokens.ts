/**
 * Design System Tokens
 * 
 * The foundation of our entire design system. These tokens define:
 * - Colors (brand, semantic, neutral)
 * - Typography (sizes, weights, line heights)
 * - Spacing (margins, padding, gaps)
 * - Shadows, borders, and effects
 * - Breakpoints and layout
 */

// ============================================================================
// COLOR SYSTEM
// ============================================================================

export const colors = {
  // Brand Colors
  brand: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Primary brand color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },

  // Semantic Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0', 
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Success green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Warning orange
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  },

  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Danger red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },

  // Neutral Colors (Gray scale)
  neutral: {
    0: '#ffffff',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  }
} as const

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace']
  },

  // Font Sizes (mobile-first, responsive)
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px - Mobile minimum
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },

  // Line Heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  }
} as const

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export const spacing = {
  // Base spacing scale (4px increments)
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px

  // Semantic spacing
  touch: {
    min: '2.75rem',    // 44px - Minimum touch target
    button: '3rem',    // 48px - Button height
    large: '3.5rem'    // 56px - Large touch target
  }
} as const

// ============================================================================
// SHADOWS & EFFECTS
// ============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
} as const

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px'
} as const

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',   // Small devices
  md: '768px',   // Medium devices  
  lg: '1024px',  // Large devices
  xl: '1280px',  // Extra large devices
  '2xl': '1536px' // 2X large devices
} as const

// ============================================================================
// ANIMATION & TRANSITIONS
// ============================================================================

export const animation = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms'
  },
  
  easing: {
    ease: 'ease',
    linear: 'linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out'
  }
} as const

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
  base: 0,           // Base layer
  dropdown: 1000,    // Dropdowns, select menus
  sticky: 1100,      // Sticky headers, footers
  fixed: 1200,       // Fixed position elements
  modal: 1300,       // Modal overlays
  popover: 1400,     // Popovers, tooltips
  toast: 1500,       // Toast notifications
  tooltip: 1600      // Tooltips (highest)
} as const

// ============================================================================
// FOCUS & INTERACTION STATES
// ============================================================================

export const focusRing = {
  // Default focus ring for interactive elements
  default: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  
  // Destructive actions (delete, remove)
  destructive: 'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
  
  // Success actions
  success: 'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
  
  // No focus ring (use with caution, ensure other focus indicator exists)
  none: 'focus:outline-none',
  
  // Inset focus ring (for dark backgrounds)
  inset: 'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white',
  
  // Dark mode focus ring
  dark: 'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900'
} as const

export const interactionStates = {
  // Hover states
  hover: {
    scale: 'hover:scale-105 transition-transform duration-200',
    opacity: 'hover:opacity-80 transition-opacity duration-200',
    shadow: 'hover:shadow-lg transition-shadow duration-200'
  },
  
  // Active states
  active: {
    scale: 'active:scale-95',
    opacity: 'active:opacity-60'
  },
  
  // Disabled states
  disabled: {
    opacity: 'disabled:opacity-50 disabled:cursor-not-allowed',
    base: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
  }
} as const

// ============================================================================
// COMPONENT TOKENS
// ============================================================================

export const components = {
  // Button tokens
  button: {
    height: {
      sm: spacing.touch.min,     // 44px
      md: spacing.touch.button,  // 48px  
      lg: spacing.touch.large    // 56px
    },
    padding: {
      sm: `${spacing[2]} ${spacing[4]}`,  // 8px 16px
      md: `${spacing[3]} ${spacing[6]}`,  // 12px 24px
      lg: `${spacing[4]} ${spacing[8]}`   // 16px 32px
    },
    borderRadius: borderRadius.lg,
    fontSize: {
      sm: typography.fontSize.sm,
      md: typography.fontSize.base,
      lg: typography.fontSize.lg
    }
  },

  // Card tokens
  card: {
    padding: {
      sm: spacing[4],   // 16px
      md: spacing[6],   // 24px
      lg: spacing[8]    // 32px
    },
    borderRadius: borderRadius.xl,
    shadow: shadows.base
  },

  // Input tokens
  input: {
    height: spacing.touch.button,  // 48px
    padding: `${spacing[3]} ${spacing[4]}`, // 12px 16px
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSize.base
  }
} as const

// ============================================================================
// SEMANTIC TOKEN MAPPINGS
// ============================================================================

export const semantic = {
  // Text colors
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[600], 
    tertiary: colors.neutral[500],
    inverse: colors.neutral[0],
    success: colors.success[700],
    warning: colors.warning[700],
    danger: colors.danger[700]
  },

  // Background colors
  background: {
    primary: colors.neutral[0],
    secondary: colors.neutral[50],
    tertiary: colors.neutral[100],
    inverse: colors.neutral[900],
    success: colors.success[50],
    warning: colors.warning[50],
    danger: colors.danger[50]
  },

  // Border colors
  border: {
    primary: colors.neutral[200],
    secondary: colors.neutral[300],
    focus: colors.brand[500],
    success: colors.success[300],
    warning: colors.warning[300],
    danger: colors.danger[300]
  }
} as const

// ============================================================================
// EXPORT ALL TOKENS
// ============================================================================

export const designTokens = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  breakpoints,
  animation,
  zIndex,
  focusRing,
  interactionStates,
  components,
  semantic
} as const

export type DesignTokens = typeof designTokens
