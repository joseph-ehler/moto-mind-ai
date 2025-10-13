/**
 * Design System Rules & Constraints
 * 
 * These rules are ENFORCED by the design system to prevent UX violations.
 * Breaking these rules requires explicit override flags and justification.
 */

// ============================================================================
// READING WIDTH RULES (Eye Strain Prevention)
// ============================================================================

export const READING_WIDTH_RULES = {
  // Maximum comfortable reading widths
  CONTENT_MAX_WIDTH: {
    // Primary rule: NEVER exceed medium for consumer content
    CONSUMER_FACING: '896px',     // Medium container (md)
    
    // Rare exceptions (require explicit override)
    DATA_TABLES: '1152px',        // Large container (lg) - tables only
    ADMIN_DASHBOARDS: '1280px',   // XL container (xl) - admin only
    
    // Absolute maximum (emergency override only)
    EMERGENCY_MAX: '1536px'       // 2XL - requires approval
  },
  
  // Optimal reading line lengths (45-75 characters)
  OPTIMAL_LINE_LENGTH: {
    MIN_CHARS: 45,
    MAX_CHARS: 75,
    IDEAL_CHARS: 65
  }
} as const

// ============================================================================
// CONTAINER USAGE RULES
// ============================================================================

export const CONTAINER_RULES = {
  // Default: Always use 'md' for consumer content
  DEFAULT: 'md',
  
  // Allowed use cases by container size
  ALLOWED_USAGE: {
    sm: [
      'forms',
      'modals', 
      'narrow_content',
      'mobile_focused'
    ],
    
    md: [
      'articles',           // ✅ DEFAULT for all consumer content
      'blog_posts',
      'product_pages', 
      'marketing_pages',
      'user_dashboards',
      'settings_pages',
      'general_content'     // ✅ This should be 90% of use cases
    ],
    
    lg: [
      'data_tables',        // ⚠️  EXCEPTION: Wide tables only
      'admin_dashboards',   // ⚠️  EXCEPTION: Admin interfaces only
      'analytics_views',    // ⚠️  EXCEPTION: Data visualization
      'comparison_tables'   // ⚠️  EXCEPTION: Side-by-side comparisons
    ],
    
    xl: [
      'admin_only',         // 🚨 RESTRICTED: Admin interfaces only
      'data_visualization', // 🚨 RESTRICTED: Charts/graphs only
      'system_monitoring'   // 🚨 RESTRICTED: Technical dashboards
    ],
    
    full: [
      'emergency_override'  // 🔥 FORBIDDEN: Requires explicit approval
    ]
  }
} as const

// ============================================================================
// TYPOGRAPHY RULES
// ============================================================================

export const TYPOGRAPHY_RULES = {
  // Mobile-first font sizes (accessibility)
  MIN_FONT_SIZES: {
    BODY_TEXT: '16px',        // Never go below 16px for body text
    CAPTIONS: '14px',         // Minimum for captions/labels
    BUTTONS: '16px',          // Touch-friendly button text
    HEADINGS: '18px'          // Minimum for any heading
  },
  
  // Line height rules for readability
  LINE_HEIGHT: {
    BODY_MIN: 1.4,           // Minimum line height for body text
    BODY_IDEAL: 1.6,         // Ideal line height for readability
    HEADINGS_MIN: 1.2        // Minimum for headings
  },
  
  // Maximum line lengths by content type
  MAX_LINE_LENGTH: {
    ARTICLES: '65ch',         // Characters, not pixels
    CAPTIONS: '45ch',
    BUTTONS: '20ch',
    HEADINGS: '40ch'
  }
} as const

// ============================================================================
// SPACING RULES
// ============================================================================

export const SPACING_RULES = {
  // Touch target minimums (accessibility)
  TOUCH_TARGETS: {
    MIN_SIZE: '44px',         // iOS/Android minimum
    RECOMMENDED: '48px',      // Our standard button height
    LARGE: '56px'            // Large buttons/important actions
  },
  
  // Vertical rhythm rules
  VERTICAL_RHYTHM: {
    MIN_BETWEEN_SECTIONS: '48px',
    MIN_BETWEEN_ELEMENTS: '16px',
    MIN_PARAGRAPH_SPACING: '16px'
  },
  
  // Horizontal spacing
  HORIZONTAL_SPACING: {
    MIN_MARGIN: '16px',       // Minimum page margins
    RECOMMENDED_MARGIN: '24px', // Standard page margins
    MAX_CONTENT_WIDTH: '896px'  // Ties back to reading width
  }
} as const

// ============================================================================
// GRID RULES
// ============================================================================

export const GRID_RULES = {
  // Maximum columns before cognitive overload
  MAX_COLUMNS: {
    MOBILE: 1,               // Always single column on mobile
    TABLET: 2,               // Max 2 columns on tablet
    DESKTOP: 4,              // Max 4 columns on desktop (rare)
    RECOMMENDED: 3           // 3 columns is usually optimal
  },
  
  // Grid usage guidelines
  RECOMMENDED_USAGE: {
    CARDS: 'auto',           // Let system decide (1→2→3 columns)
    METRICS: 'dashboard',    // 1→2→4 for dashboard metrics
    CONTENT: 2,              // Max 2 columns for content
    NAVIGATION: 1            // Always single column for nav
  }
} as const

// ============================================================================
// ACCESSIBILITY RULES
// ============================================================================

export const ACCESSIBILITY_RULES = {
  // Color contrast minimums
  CONTRAST_RATIOS: {
    NORMAL_TEXT: 4.5,        // WCAG AA standard
    LARGE_TEXT: 3.0,         // 18px+ or 14px+ bold
    UI_COMPONENTS: 3.0       // Buttons, form controls
  },
  
  // Focus indicators
  FOCUS_INDICATORS: {
    MIN_OUTLINE: '2px',
    REQUIRED_OFFSET: '2px',
    REQUIRED_VISIBILITY: true
  }
} as const

// ============================================================================
// RULE ENFORCEMENT FUNCTIONS
// ============================================================================

export function validateContainerUsage(
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'fluid', 
  useCase: string, 
  override?: { reason: string; approvedBy: string }
): { allowed: boolean; warning?: string; error?: string } {
  
  // Handle fluid containers (no restrictions)
  if (size === 'fluid') {
    return { allowed: true }
  }
  
  // Check if use case is allowed for this container size
  const allowedUseCases = CONTAINER_RULES.ALLOWED_USAGE[size as keyof typeof CONTAINER_RULES.ALLOWED_USAGE]
  
  if (!allowedUseCases?.includes(useCase)) {
    // Check if this is a restricted size requiring override
    if (size === 'lg' || size === 'xl' || size === 'full') {
      if (!override) {
        return {
          allowed: false,
          error: `Container size '${size}' requires explicit override for use case '${useCase}'. Allowed cases: ${allowedUseCases?.join(', ')}`
        }
      }
      
      return {
        allowed: true,
        warning: `Using restricted container '${size}' for '${useCase}'. Reason: ${override.reason}. Approved by: ${override.approvedBy}`
      }
    }
    
    return {
      allowed: false,
      error: `Use case '${useCase}' not allowed for container '${size}'. Use 'md' for consumer content.`
    }
  }
  
  // Warn if not using recommended default
  if (useCase.includes('consumer') || useCase.includes('general') || useCase.includes('article')) {
    if (size !== 'md') {
      return {
        allowed: true,
        warning: `Consider using 'md' container for consumer content to prevent eye strain.`
      }
    }
  }
  
  return { allowed: true }
}

export function validateReadingWidth(width: number): { valid: boolean; recommendation?: string } {
  const maxWidth = parseInt(READING_WIDTH_RULES.CONTENT_MAX_WIDTH.CONSUMER_FACING)
  
  if (width > maxWidth) {
    return {
      valid: false,
      recommendation: `Content width ${width}px exceeds maximum ${maxWidth}px. Use 'md' container (896px) for optimal reading experience.`
    }
  }
  
  return { valid: true }
}

export function validateTouchTarget(size: number): { valid: boolean; recommendation?: string } {
  const minSize = parseInt(SPACING_RULES.TOUCH_TARGETS.MIN_SIZE)
  
  if (size < minSize) {
    return {
      valid: false,
      recommendation: `Touch target ${size}px is below minimum ${minSize}px. Use design system button heights (48px+).`
    }
  }
  
  return { valid: true }
}

// ============================================================================
// USAGE EXAMPLES & VIOLATIONS
// ============================================================================

export const USAGE_EXAMPLES = {
  // ✅ CORRECT USAGE
  CORRECT: {
    consumer_article: {
      container: 'md',
      useCase: 'articles',
      reasoning: 'Optimal reading width, prevents eye strain'
    },
    
    user_dashboard: {
      container: 'md', 
      useCase: 'user_dashboards',
      reasoning: 'Consumer-facing, comfortable reading width'
    },
    
    data_table_admin: {
      container: 'lg',
      useCase: 'data_tables',
      override: {
        reason: 'Wide table requires horizontal space for data visibility',
        approvedBy: 'UX Team'
      },
      reasoning: 'Exception approved for data tables'
    }
  },
  
  // ❌ VIOLATIONS
  VIOLATIONS: {
    consumer_content_too_wide: {
      container: 'xl',
      useCase: 'articles',
      problem: 'Causes eye strain, violates reading width rules',
      solution: 'Use "md" container instead'
    },
    
    no_override_for_wide_content: {
      container: 'lg',
      useCase: 'marketing_pages',
      problem: 'Large container without proper justification',
      solution: 'Use "md" container or provide override with reason'
    }
  }
} as const

// ============================================================================
// EXPORT VALIDATION HELPERS
// ============================================================================

export const designSystemRules = {
  READING_WIDTH_RULES,
  CONTAINER_RULES,
  TYPOGRAPHY_RULES,
  SPACING_RULES,
  GRID_RULES,
  ACCESSIBILITY_RULES,
  validateContainerUsage,
  validateReadingWidth,
  validateTouchTarget,
  USAGE_EXAMPLES
} as const

export type DesignSystemRules = typeof designSystemRules
