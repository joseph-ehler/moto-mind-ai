/**
 * MotoMind Design System
 * 
 * Built on top of shadcn/ui + Tailwind CSS
 * Provides consistent design tokens, components, and patterns
 * for the entire MotoMind application.
 */

// ============================================================================
// DESIGN TOKENS (Tailwind-compatible)
// ============================================================================

export const designSystem = {
  // Colors (using Tailwind color palette)
  colors: {
    // Brand colors
    primary: {
      50: 'bg-blue-50 text-blue-50 border-blue-50',
      100: 'bg-blue-100 text-blue-100 border-blue-100',
      500: 'bg-blue-500 text-blue-500 border-blue-500', // Main brand
      600: 'bg-blue-600 text-blue-600 border-blue-600',
      900: 'bg-blue-900 text-blue-900 border-blue-900'
    },
    
    // Semantic colors
    success: {
      50: 'bg-green-50 text-green-50 border-green-50',
      500: 'bg-green-500 text-green-500 border-green-500',
      700: 'bg-green-700 text-green-700 border-green-700'
    },
    
    warning: {
      50: 'bg-yellow-50 text-yellow-50 border-yellow-50',
      500: 'bg-yellow-500 text-yellow-500 border-yellow-500',
      700: 'bg-yellow-700 text-yellow-700 border-yellow-700'
    },
    
    danger: {
      50: 'bg-red-50 text-red-50 border-red-50',
      500: 'bg-red-500 text-red-500 border-red-500',
      700: 'bg-red-700 text-red-700 border-red-700'
    },
    
    // Neutral colors
    neutral: {
      0: 'bg-white text-white border-white',
      50: 'bg-gray-50 text-gray-50 border-gray-50',
      100: 'bg-gray-100 text-gray-100 border-gray-100',
      200: 'bg-gray-200 text-gray-200 border-gray-200',
      300: 'bg-gray-300 text-gray-300 border-gray-300',
      400: 'bg-gray-400 text-gray-400 border-gray-400',
      500: 'bg-gray-500 text-gray-500 border-gray-500',
      600: 'bg-gray-600 text-gray-600 border-gray-600',
      700: 'bg-gray-700 text-gray-700 border-gray-700',
      800: 'bg-gray-800 text-gray-800 border-gray-800',
      900: 'bg-gray-900 text-gray-900 border-gray-900'
    }
  },

  // Typography (Tailwind classes)
  typography: {
    // Mobile-first font sizes (16px+ base)
    size: {
      xs: 'text-xs',      // 12px - Use sparingly
      sm: 'text-sm',      // 14px - Captions only
      base: 'text-base',  // 16px - Body text minimum
      lg: 'text-lg',      // 18px - Large body
      xl: 'text-xl',      // 20px - Headings
      '2xl': 'text-2xl',  // 24px - Page titles
      '3xl': 'text-3xl',  // 30px - Hero titles
      '4xl': 'text-4xl'   // 36px - Large heroes
    },
    
    weight: {
      normal: 'font-normal',
      medium: 'font-medium', 
      semibold: 'font-semibold',
      bold: 'font-bold'
    },
    
    // Responsive typography patterns
    patterns: {
      hero: 'text-3xl sm:text-4xl lg:text-5xl font-bold',
      title: 'text-2xl sm:text-3xl font-semibold',
      subtitle: 'text-xl sm:text-2xl font-medium',
      body: 'text-base leading-relaxed',
      caption: 'text-sm text-gray-600',
      button: 'text-base font-semibold'
    }
  },

  // Spacing (Tailwind spacing scale)
  spacing: {
    // Touch targets (mobile-first)
    touch: {
      min: 'min-h-[44px] min-w-[44px]',  // iOS/Android minimum
      button: 'h-12',                     // 48px button height
      large: 'h-14'                       // 56px large buttons
    },
    
    // Padding patterns
    padding: {
      xs: 'p-2',          // 8px
      sm: 'p-3',          // 12px
      md: 'p-4 sm:p-6',   // 16px → 24px responsive
      lg: 'p-6 sm:p-8',   // 24px → 32px responsive
      xl: 'p-8 sm:p-12'   // 32px → 48px responsive
    },
    
    // Gap patterns
    gap: {
      xs: 'gap-2',        // 8px
      sm: 'gap-3',        // 12px  
      md: 'gap-4 sm:gap-6', // 16px → 24px responsive
      lg: 'gap-6 sm:gap-8', // 24px → 32px responsive
      xl: 'gap-8 sm:gap-12' // 32px → 48px responsive
    },
    
    // Vertical rhythm
    stack: {
      tight: 'space-y-2',
      normal: 'space-y-4 sm:space-y-6',
      loose: 'space-y-6 sm:space-y-8',
      xl: 'space-y-8 sm:space-y-12'
    }
  },

  // Effects (shadows, borders, etc.)
  effects: {
    shadow: {
      sm: 'shadow-sm',
      base: 'shadow',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl'
    },
    
    border: {
      base: 'border border-gray-200',
      focus: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
      error: 'border-red-300 focus:ring-red-500 focus:border-red-500'
    },
    
    radius: {
      sm: 'rounded',
      md: 'rounded-lg', 
      lg: 'rounded-xl',
      xl: 'rounded-2xl',
      full: 'rounded-full'
    },
    
    // Touch feedback
    touch: 'active:scale-95 transition-transform duration-150'
  }
} as const

// ============================================================================
// COMPONENT VARIANTS (shadcn/ui compatible)
// ============================================================================

export const componentVariants = {
  // Button variants (extends shadcn Button)
  button: {
    // Size variants
    size: {
      sm: `${designSystem.spacing.touch.min} px-4 ${designSystem.typography.size.sm}`,
      md: `${designSystem.spacing.touch.button} px-6 ${designSystem.typography.size.base}`,
      lg: `${designSystem.spacing.touch.large} px-8 ${designSystem.typography.size.lg}`
    },
    
    // Semantic variants
    semantic: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      success: 'bg-green-600 hover:bg-green-700 text-white',
      warning: 'bg-yellow-600 hover:bg-yellow-700 text-white', 
      danger: 'bg-red-600 hover:bg-red-700 text-white'
    }
  },

  // Card variants (extends shadcn Card)
  card: {
    padding: {
      sm: designSystem.spacing.padding.sm,
      md: designSystem.spacing.padding.md,
      lg: designSystem.spacing.padding.lg
    },
    
    elevation: {
      flat: 'border border-gray-200',
      raised: `${designSystem.effects.shadow.base} border border-gray-200`,
      floating: `${designSystem.effects.shadow.lg} border border-gray-200`
    }
  },

  // Input variants (extends shadcn Input)
  input: {
    size: {
      md: `${designSystem.spacing.touch.button} px-4 ${designSystem.typography.size.base}`,
      lg: `${designSystem.spacing.touch.large} px-6 ${designSystem.typography.size.lg}`
    }
  }
} as const

// ============================================================================
// LAYOUT PATTERNS
// ============================================================================

export const layoutPatterns = {
  // Container patterns
  container: {
    sm: 'max-w-2xl mx-auto px-4 sm:px-6',
    md: 'max-w-4xl mx-auto px-4 sm:px-6',
    lg: 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8',
    xl: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    full: 'w-full px-4 sm:px-6 lg:px-8'
  },

  // Grid patterns (mobile-first)
  grid: {
    auto: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    cards: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    dashboard: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    sidebar: 'grid grid-cols-1 lg:grid-cols-4'
  },

  // Flex patterns
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    column: 'flex flex-col',
    responsive: 'flex flex-col sm:flex-row'
  },

  // Section patterns
  section: {
    sm: 'py-8 sm:py-12',
    md: 'py-12 sm:py-16',
    lg: 'py-16 sm:py-20',
    xl: 'py-20 sm:py-24'
  }
} as const

// ============================================================================
// SEMANTIC PATTERNS (for specific use cases)
// ============================================================================

export const semanticPatterns = {
  // Dashboard patterns
  dashboard: {
    hero: `${layoutPatterns.container.lg} ${layoutPatterns.section.md}`,
    metrics: `${layoutPatterns.grid.dashboard} ${designSystem.spacing.gap.md}`,
    card: `${componentVariants.card.padding.md} ${componentVariants.card.elevation.raised} ${designSystem.effects.radius.lg}`
  },

  // Form patterns
  form: {
    container: `${designSystem.spacing.stack.normal}`,
    field: `${designSystem.spacing.stack.tight}`,
    group: `${designSystem.spacing.stack.normal}`,
    actions: `${layoutPatterns.flex.responsive} ${designSystem.spacing.gap.md}`
  },

  // Modal patterns
  modal: {
    overlay: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50',
    container: 'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6',
    content: `bg-white ${designSystem.effects.radius.xl} ${designSystem.effects.shadow.xl} w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-hidden`
  }
} as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Helper to build component classes
export function buildComponentClass(
  base: string,
  variants?: Record<string, string | undefined>,
  className?: string
): string {
  const variantClasses = variants ? Object.values(variants).filter(Boolean) : []
  return cn(base, ...variantClasses, className)
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  designSystem as ds,
  componentVariants as cv,
  layoutPatterns as layout,
  semanticPatterns as patterns
}

export type DesignSystem = typeof designSystem
export type ComponentVariants = typeof componentVariants
export type LayoutPatterns = typeof layoutPatterns
export type SemanticPatterns = typeof semanticPatterns
