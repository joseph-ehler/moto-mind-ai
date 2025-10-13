/**
 * Responsive Typography Components
 * 
 * Built on the MotoMind Design System foundation
 * Uses mandatory layout system patterns
 */

import React from 'react'
import { cn } from '@/lib/design-system'
import { responsiveTypography, type SemanticTypography } from '@/lib/design-system/typography'

// ============================================================================
// ENHANCED HEADING COMPONENT
// ============================================================================

interface HeadingProps {
  children: React.ReactNode
  level?: 'display-xl' | 'display-lg' | 'display-md' | 'hero' | 'title' | 'subtitle'
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  semantic?: SemanticTypography
  align?: 'left' | 'center' | 'right'
  color?: 'primary' | 'secondary' | 'muted' | 'inverse' | 'success' | 'warning' | 'danger'
  maxWidth?: 'none' | 'heading' | 'prose'
  className?: string
}

export function Heading({
  children,
  level = 'title',
  as,
  semantic,
  align = 'left',
  color = 'primary',
  maxWidth = 'heading',
  className
}: HeadingProps) {
  // Map levels to HTML elements and typography classes
  const levelMapping = {
    'display-xl': { element: 'h1' as const, class: 'display-xl' },
    'display-lg': { element: 'h1' as const, class: 'display-lg' },
    'display-md': { element: 'h1' as const, class: 'display-md' },
    'hero': { element: 'h1' as const, class: 'heading-h1' },
    'title': { element: 'h2' as const, class: 'heading-h2' },
    'subtitle': { element: 'h3' as const, class: 'heading-h3' }
  }

  const config = levelMapping[level]
  const Component = as || config.element
  const typographyClass = semantic ? responsiveTypography.getTypographyClass(semantic) : config.class

  // Color classes
  const colorClasses = {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    muted: 'text-gray-600',
    inverse: 'text-white',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    danger: 'text-red-700'
  }

  // Max width classes
  const maxWidthClasses = {
    none: '',
    heading: 'max-w-[40ch]',
    prose: 'max-w-[65ch]'
  }

  // Alignment classes
  const alignClasses = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto'
  }

  return (
    <Component
      className={cn(
        // Apply responsive typography
        typographyClass === 'display-xl' && 'text-[clamp(2.5rem,8vw,6rem)] leading-[0.9] font-bold tracking-tighter',
        typographyClass === 'display-lg' && 'text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.9] font-bold tracking-tight',
        typographyClass === 'display-md' && 'text-[clamp(2rem,5vw,3.75rem)] leading-[1.0] font-bold tracking-tight',
        typographyClass === 'heading-h1' && 'text-[clamp(1.875rem,4vw,2.25rem)] leading-[1.2] font-bold tracking-tight',
        typographyClass === 'heading-h2' && 'text-[clamp(1.5rem,3vw,1.875rem)] leading-[1.2] font-semibold',
        typographyClass === 'heading-h3' && 'text-[clamp(1.25rem,2.5vw,1.5rem)] leading-[1.2] font-semibold',
        
        // Color
        colorClasses[color],
        
        // Max width for optimal reading
        maxWidthClasses[maxWidth],
        
        // Alignment
        alignClasses[align],
        
        className
      )}
    >
      {children}
    </Component>
  )
}

// ============================================================================
// ENHANCED TEXT COMPONENT
// ============================================================================

interface TextProps {
  children: React.ReactNode
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs'
  variant?: 'body' | 'lead' | 'caption' | 'overline'
  color?: 'primary' | 'secondary' | 'muted' | 'inverse' | 'success' | 'warning' | 'danger'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  align?: 'left' | 'center' | 'right' | 'justify'
  maxWidth?: 'none' | 'prose' | 'narrow' | 'wide'
  as?: 'p' | 'span' | 'div'
  className?: string
}

export function Text({
  children,
  size = 'md',
  variant = 'body',
  color = 'primary',
  weight = 'normal',
  align = 'left',
  maxWidth = 'prose',
  as = 'p',
  className
}: TextProps) {
  const Component = as

  // Size classes with fluid scaling
  const sizeClasses = {
    xl: 'text-[clamp(1.125rem,2vw,1.25rem)] leading-[1.5]',
    lg: 'text-[clamp(1rem,1.5vw,1.125rem)] leading-[1.5]',
    md: 'text-[clamp(1rem,1vw,1rem)] leading-[1.5]',
    sm: 'text-[clamp(0.875rem,1vw,0.875rem)] leading-[1.4]',
    xs: 'text-[clamp(0.75rem,1vw,0.75rem)] leading-[1.4]'
  }

  // Variant-specific styling
  const variantClasses = {
    body: '',
    lead: 'font-medium',
    caption: 'text-gray-600',
    overline: 'uppercase tracking-wider font-medium text-gray-500'
  }

  // Color classes
  const colorClasses = {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    muted: 'text-gray-600',
    inverse: 'text-white',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    danger: 'text-red-700'
  }

  // Weight classes
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  }

  // Alignment classes
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify'
  }

  // Max width classes for optimal reading
  const maxWidthClasses = {
    none: '',
    narrow: 'max-w-[45ch]',
    prose: 'max-w-[65ch]',
    wide: 'max-w-[75ch]'
  }

  return (
    <Component
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        colorClasses[color],
        weightClasses[weight],
        alignClasses[align],
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </Component>
  )
}

// ============================================================================
// PROSE COMPONENT (FOR LONG-FORM CONTENT)
// ============================================================================

interface ProseProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Prose({ children, size = 'md', className }: ProseProps) {
  const sizeClasses = {
    sm: 'prose-sm',
    md: 'prose',
    lg: 'prose-lg'
  }

  return (
    <div
      className={cn(
        'prose prose-gray max-w-none',
        sizeClasses[size],
        // Responsive typography
        'prose-headings:text-[clamp(1.25rem,2.5vw,1.5rem)]',
        'prose-p:text-[clamp(1rem,1vw,1rem)]',
        'prose-p:leading-[1.6]',
        'prose-p:max-w-[65ch]',
        // Spacing
        'prose-headings:mt-8 prose-headings:mb-4',
        'prose-p:mb-6',
        'prose-li:mb-2',
        // Links
        'prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline',
        className
      )}
    >
      {children}
    </div>
  )
}

// ============================================================================
// DISPLAY TEXT COMPONENT (FOR HERO SECTIONS)
// ============================================================================

interface DisplayTextProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  gradient?: boolean
  className?: string
}

export function DisplayText({ 
  children, 
  size = 'lg', 
  gradient = false,
  className 
}: DisplayTextProps) {
  const sizeClasses = {
    sm: 'text-[clamp(1.75rem,4vw,3rem)]',
    md: 'text-[clamp(2rem,5vw,3.75rem)]',
    lg: 'text-[clamp(2.25rem,6vw,4.5rem)]',
    xl: 'text-[clamp(2.5rem,8vw,6rem)]'
  }

  return (
    <h1
      className={cn(
        sizeClasses[size],
        'leading-[0.9] font-bold tracking-tighter',
        gradient && 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
        !gradient && 'text-gray-900',
        className
      )}
    >
      {children}
    </h1>
  )
}

// ============================================================================
// LABEL COMPONENT (FOR FORMS AND UI)
// ============================================================================

interface LabelProps {
  children: React.ReactNode
  required?: boolean
  disabled?: boolean
  className?: string
}

export function Label({ children, required, disabled, className }: LabelProps) {
  return (
    <label
      className={cn(
        'text-[clamp(0.875rem,1vw,0.875rem)] leading-[1.2] font-medium tracking-wide',
        'text-gray-700',
        disabled && 'text-gray-400 cursor-not-allowed',
        className
      )}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}

// ============================================================================
// CAPTION COMPONENT
// ============================================================================

interface CaptionProps {
  children: React.ReactNode
  className?: string
}

export function Caption({ children, className }: CaptionProps) {
  return (
    <p
      className={cn(
        'text-[clamp(0.75rem,1vw,0.8125rem)] leading-[1.4]',
        'text-gray-600 max-w-[40ch]',
        className
      )}
    >
      {children}
    </p>
  )
}

// ============================================================================
// OVERLINE COMPONENT (FOR CATEGORIES, LABELS)
// ============================================================================

interface OverlineProps {
  children: React.ReactNode
  className?: string
}

export function Overline({ children, className }: OverlineProps) {
  return (
    <p
      className={cn(
        'text-[clamp(0.6875rem,1vw,0.75rem)] leading-[1.0]',
        'uppercase tracking-wider font-medium text-gray-500',
        className
      )}
    >
      {children}
    </p>
  )
}

// ============================================================================
// RESPONSIVE TEXT COMPONENT (CONTAINER-BASED)
// ============================================================================

interface ResponsiveTextProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveText({ children, className }: ResponsiveTextProps) {
  return (
    <p
      className={cn(
        // Container-based responsive text
        'text-sm leading-normal',
        '@sm:text-base @sm:leading-relaxed',
        '@md:text-lg @md:leading-relaxed',
        '@lg:text-xl @lg:leading-loose',
        'max-w-[65ch]',
        className
      )}
    >
      {children}
    </p>
  )
}

// ============================================================================
// TYPOGRAPHY SHOWCASE COMPONENT
// ============================================================================

interface TypographyShowcaseProps {
  className?: string
}

export function TypographyShowcase({ className }: TypographyShowcaseProps) {
  return (
    <div className={cn('space-y-8', className)}>
      <DisplayText size="xl">Display Extra Large</DisplayText>
      <DisplayText size="lg">Display Large</DisplayText>
      <DisplayText size="md">Display Medium</DisplayText>
      
      <Heading level="hero">Hero Heading</Heading>
      <Heading level="title">Title Heading</Heading>
      <Heading level="subtitle">Subtitle Heading</Heading>
      
      <Text size="xl" variant="lead">
        Lead text - larger and more prominent for introductions
      </Text>
      
      <Text size="lg">
        Large body text - comfortable for extended reading
      </Text>
      
      <Text size="md">
        Medium body text - the standard size for most content
      </Text>
      
      <Text size="sm" variant="caption">
        Small caption text - for less important information
      </Text>
      
      <Overline>Category Label</Overline>
      
      <Caption>
        This is a caption with optimal character width for readability
      </Caption>
    </div>
  )
}
