/**
 * Color System - Semantic Tokens
 * 
 * Based on shadcn/ui approach:
 * Always pair bg-{token} with text-{token}-foreground
 * 
 * Example:
 *   bg-primary text-primary-foreground
 *   bg-destructive text-destructive-foreground
 * 
 * The system automatically handles contrast - no manual calculations needed.
 */

// ============================================
// NEUTRAL SCALE (Gray)
// ============================================
export const neutral = {
  gray1: "hsl(0, 0%, 99%)",   // App background
  gray2: "hsl(0, 0%, 98%)",   // Subtle background
  gray3: "hsl(0, 0%, 94%)",   // UI element background
  gray4: "hsl(0, 0%, 91%)",   // Hovered UI element background
  gray5: "hsl(0, 0%, 88%)",   // Active / Selected UI element background
  gray6: "hsl(0, 0%, 85%)",   // Subtle borders and separators
  gray7: "hsl(0, 0%, 81%)",   // UI element border and focus rings
  gray8: "hsl(0, 0%, 73%)",   // Hovered UI element border
  gray9: "hsl(0, 0%, 55%)",   // Solid backgrounds
  gray10: "hsl(0, 0%, 51%)",  // Hovered solid backgrounds
  gray11: "hsl(0, 0%, 39%)",  // Low-contrast text
  gray12: "hsl(0, 0%, 13%)",  // High-contrast text
}

export const neutralDark = {
  gray1: "hsl(0, 0%, 7%)",    // App background
  gray2: "hsl(0, 0%, 10%)",   // Subtle background
  gray3: "hsl(0, 0%, 13%)",   // UI element background
  gray4: "hsl(0, 0%, 16%)",   // Hovered UI element background
  gray5: "hsl(0, 0%, 19%)",   // Active / Selected UI element background
  gray6: "hsl(0, 0%, 23%)",   // Subtle borders and separators
  gray7: "hsl(0, 0%, 28%)",   // UI element border and focus rings
  gray8: "hsl(0, 0%, 38%)",   // Hovered UI element border
  gray9: "hsl(0, 0%, 43%)",   // Solid backgrounds
  gray10: "hsl(0, 0%, 48%)",  // Hovered solid backgrounds
  gray11: "hsl(0, 0%, 71%)",  // Low-contrast text
  gray12: "hsl(0, 0%, 93%)",  // High-contrast text
}

// ============================================
// OVERLAY SCALES (Alpha)
// ============================================
export const blackA = {
  blackA1: "hsla(0, 0%, 0%, 0.05)",
  blackA2: "hsla(0, 0%, 0%, 0.1)",
  blackA3: "hsla(0, 0%, 0%, 0.15)",
  blackA4: "hsla(0, 0%, 0%, 0.2)",
  blackA5: "hsla(0, 0%, 0%, 0.3)",
  blackA6: "hsla(0, 0%, 0%, 0.4)",
  blackA7: "hsla(0, 0%, 0%, 0.5)",
  blackA8: "hsla(0, 0%, 0%, 0.6)",
  blackA9: "hsla(0, 0%, 0%, 0.7)",
  blackA10: "hsla(0, 0%, 0%, 0.8)",
  blackA11: "hsla(0, 0%, 0%, 0.9)",
  blackA12: "hsla(0, 0%, 0%, 0.95)",
}

export const whiteA = {
  whiteA1: "hsla(0, 0%, 100%, 0.05)",
  whiteA2: "hsla(0, 0%, 100%, 0.1)",
  whiteA3: "hsla(0, 0%, 100%, 0.15)",
  whiteA4: "hsla(0, 0%, 100%, 0.2)",
  whiteA5: "hsla(0, 0%, 100%, 0.3)",
  whiteA6: "hsla(0, 0%, 100%, 0.4)",
  whiteA7: "hsla(0, 0%, 100%, 0.5)",
  whiteA8: "hsla(0, 0%, 100%, 0.6)",
  whiteA9: "hsla(0, 0%, 100%, 0.7)",
  whiteA10: "hsla(0, 0%, 100%, 0.8)",
  whiteA11: "hsla(0, 0%, 100%, 0.9)",
  whiteA12: "hsla(0, 0%, 100%, 0.95)",
}

// ============================================
// PRIMARY SCALE (Blue - CTA/Primary Actions)
// ============================================
export const blue = {
  blue1: "hsl(210, 100%, 99%)",
  blue2: "hsl(207, 100%, 98%)",
  blue3: "hsl(205, 92%, 95%)",
  blue4: "hsl(203, 100%, 92%)",
  blue5: "hsl(206, 100%, 88%)",
  blue6: "hsl(207, 93%, 83%)",
  blue7: "hsl(207, 85%, 76%)",
  blue8: "hsl(206, 82%, 65%)",
  blue9: "hsl(206, 100%, 50%)",  // Solid background - USE WHITE TEXT
  blue10: "hsl(207, 96%, 48%)",  // Hovered solid - USE WHITE TEXT
  blue11: "hsl(208, 88%, 43%)",  // Low-contrast text on light bg
  blue12: "hsl(216, 71%, 23%)",  // High-contrast text on light bg
}

export const blueDark = {
  blue1: "hsl(215, 42%, 9%)",
  blue2: "hsl(218, 39%, 11%)",
  blue3: "hsl(212, 69%, 16%)",
  blue4: "hsl(209, 100%, 19%)",
  blue5: "hsl(207, 100%, 23%)",
  blue6: "hsl(209, 79%, 30%)",
  blue7: "hsl(211, 66%, 37%)",
  blue8: "hsl(211, 65%, 45%)",
  blue9: "hsl(206, 100%, 50%)",  // Solid background - USE WHITE TEXT
  blue10: "hsl(210, 100%, 62%)", // Hovered solid - USE DARK TEXT
  blue11: "hsl(210, 100%, 72%)", // Low-contrast text on dark bg
  blue12: "hsl(205, 100%, 88%)", // High-contrast text on dark bg
}

// ============================================
// TEXT OVER COLOR RULES
// ============================================

/**
 * Get the appropriate text color for a given background step
 * 
 * @param step - The color step (1-12)
 * @param colorName - The color name (e.g., 'blue', 'green', 'red')
 * @param isDark - Whether dark mode is active
 * @returns Tailwind CSS class for text color
 */
export function getTextColor(
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
  colorName: string,
  isDark = false
): string {
  // Light colors that need dark text on step 9-10
  const lightColors = ['yellow', 'lime', 'mint', 'amber', 'sky']
  const isLightColor = lightColors.includes(colorName)

  if (step >= 1 && step <= 5) {
    // Light backgrounds: use step 11 or 12 text (dark text in light mode)
    return isDark ? 'text-white' : 'text-gray-900'
  }
  
  if (step >= 6 && step <= 8) {
    // Border colors: use step 11 or 12 text
    return isDark ? 'text-white' : 'text-gray-900'
  }
  
  if (step === 9 || step === 10) {
    // Solid backgrounds
    if (isLightColor) {
      // Light colors need dark text
      return 'text-gray-900'
    } else {
      // Most colors need white text
      return 'text-white'
    }
  }
  
  if (step === 11 || step === 12) {
    // Text colors (already designed for contrast)
    return '' // No override needed
  }

  // Default fallback
  return isDark ? 'text-white' : 'text-gray-900'
}

/**
 * Color step usage guide
 */
export const stepUsage = {
  1: { name: "App background", textColor: "step-12" },
  2: { name: "Subtle background", textColor: "step-12" },
  3: { name: "UI element background", textColor: "step-12" },
  4: { name: "Hovered UI element background", textColor: "step-12" },
  5: { name: "Active / Selected UI element background", textColor: "step-12" },
  6: { name: "Subtle borders and separators", textColor: "step-12" },
  7: { name: "UI element border and focus rings", textColor: "step-12" },
  8: { name: "Hovered UI element border", textColor: "step-12" },
  9: { name: "Solid backgrounds", textColor: "white (or dark for light colors)" },
  10: { name: "Hovered solid backgrounds", textColor: "white (or dark for light colors)" },
  11: { name: "Low-contrast text", textColor: "n/a - this is text" },
  12: { name: "High-contrast text", textColor: "n/a - this is text" },
}

/**
 * WCAG Contrast Requirements
 * - AA Normal Text: 4.5:1
 * - AA Large Text: 3:1
 * - AAA Normal Text: 7:1
 * - AAA Large Text: 4.5:1
 */
export const contrastRatios = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
}

/**
 * Helper to determine if a combination is accessible
 */
export function isAccessible(
  contrastRatio: number,
  level: 'AA' | 'AAA' = 'AA',
  textSize: 'normal' | 'large' = 'normal'
): boolean {
  const requirement = level === 'AA' 
    ? (textSize === 'normal' ? contrastRatios.AA_NORMAL : contrastRatios.AA_LARGE)
    : (textSize === 'normal' ? contrastRatios.AAA_NORMAL : contrastRatios.AAA_LARGE)
  
  return contrastRatio >= requirement
}
