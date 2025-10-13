/**
 * Loading Skeleton Components (ELITE FEATURE)
 * Beautiful loading states while content loads
 */

import * as React from 'react'
import { Stack } from '../primitives/Layout'

export interface SkeletonProps {
  /** Width of skeleton (CSS value or 'full') */
  width?: string | 'full'
  /** Height of skeleton */
  height?: string
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  /** Custom className */
  className?: string
}

/**
 * Base skeleton element
 */
export function Skeleton({
  width = 'full',
  height = '1rem',
  rounded = 'md',
  className = ''
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }

  const widthClass = width === 'full' ? 'w-full' : ''
  const widthStyle = width !== 'full' ? { width } : {}

  return (
    <div
      className={`
        bg-slate-200 animate-pulse
        ${widthClass}
        ${roundedClasses[rounded]}
        ${className}
      `}
      style={{ height, ...widthStyle }}
      aria-hidden="true"
      role="presentation"
    />
  )
}

/**
 * Text skeleton (single line)
 */
export function SkeletonText({ width = '100%' }: { width?: string }) {
  return <Skeleton width={width} height="1rem" rounded="sm" />
}

/**
 * Heading skeleton
 */
export function SkeletonHeading({ level = '2' }: { level?: '1' | '2' | '3' }) {
  const heights = {
    '1': '2rem',
    '2': '1.5rem',
    '3': '1.25rem'
  }

  return <Skeleton width="60%" height={heights[level]} rounded="sm" />
}

/**
 * Avatar/circle skeleton
 */
export function SkeletonCircle({ size = '3rem' }: { size?: string }) {
  return (
    <div style={{ width: size, height: size }}>
      <Skeleton width="full" height={size} rounded="full" />
    </div>
  )
}

/**
 * Button skeleton
 */
export function SkeletonButton() {
  return <Skeleton width="6rem" height="2.5rem" rounded="lg" />
}

/**
 * Image skeleton
 */
export function SkeletonImage({ 
  width = 'full',
  aspectRatio = '16/9' 
}: { 
  width?: string
  aspectRatio?: string 
}) {
  return (
    <div
      className={width === 'full' ? 'w-full' : ''}
      style={{ 
        width: width !== 'full' ? width : undefined,
        aspectRatio 
      }}
    >
      <Skeleton width="full" height="100%" rounded="lg" />
    </div>
  )
}

/**
 * Pre-built skeleton for form fields
 */
export function SkeletonForm({ fields = 3 }: { fields?: number }) {
  return (
    <Stack spacing="md">
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton width="30%" height="0.875rem" rounded="sm" />
          <Skeleton width="full" height="2.5rem" rounded="lg" />
        </div>
      ))}
    </Stack>
  )
}

/**
 * Pre-built skeleton for card content
 */
export function SkeletonCard() {
  return (
    <Stack spacing="md">
      <SkeletonImage aspectRatio="16/9" />
      <SkeletonHeading level="2" />
      <Stack spacing="sm">
        <SkeletonText width="100%" />
        <SkeletonText width="90%" />
        <SkeletonText width="75%" />
      </Stack>
      <div className="flex gap-2 mt-2">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </Stack>
  )
}

/**
 * Pre-built skeleton for list items
 */
export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <Stack spacing="md">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonCircle size="2.5rem" />
          <div className="flex-1 space-y-2">
            <SkeletonText width="40%" />
            <SkeletonText width="60%" />
          </div>
        </div>
      ))}
    </Stack>
  )
}

/**
 * Pre-built skeleton for table rows
 */
export function SkeletonTable({ 
  rows = 5,
  columns = 4
}: { 
  rows?: number
  columns?: number
}) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} width="80%" height="1rem" rounded="sm" />
        ))}
      </div>
      
      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="grid gap-4" 
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton key={colIndex} width="100%" height="1rem" rounded="sm" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Full overlay skeleton (for Modal/Drawer loading states)
 */
export function SkeletonOverlay({ variant = 'form' }: { variant?: 'form' | 'card' | 'list' | 'table' }) {
  const variants = {
    form: <SkeletonForm fields={5} />,
    card: <SkeletonCard />,
    list: <SkeletonList items={6} />,
    table: <SkeletonTable rows={8} columns={5} />
  }

  return (
    <div className="p-6">
      <Stack spacing="lg">
        <SkeletonHeading level="1" />
        <SkeletonText width="70%" />
        <div className="mt-4">
          {variants[variant]}
        </div>
      </Stack>
    </div>
  )
}
