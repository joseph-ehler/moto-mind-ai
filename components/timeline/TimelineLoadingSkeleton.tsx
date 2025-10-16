/**
 * Timeline Loading Skeleton
 * 
 * Shows placeholder content while timeline is loading
 * Better UX than spinners - shows expected structure
 */

'use client'

import { motion } from 'framer-motion'
import { Stack } from '@/components/design-system'

export function TimelineLoadingSkeleton() {
  return (
    <Stack spacing="md">
      {/* Month header skeleton */}
      <motion.div
        initial={false}
        className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="text-right space-y-2">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Date header skeleton */}
      <div className="mb-4 px-2">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Event card skeletons */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={false}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-start gap-4">
            {/* Icon skeleton */}
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-3">
              {/* Title */}
              <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
              
              {/* Metadata */}
              <div className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              </div>
              
              {/* Description */}
              <div className="space-y-2 pt-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </Stack>
  )
}

export function EventCardSkeleton() {
  return (
    <motion.div
      initial={false}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
    >
      <div className="flex items-start gap-4">
        {/* Icon skeleton */}
        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
        
        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
