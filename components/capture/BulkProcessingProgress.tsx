/**
 * Bulk Processing Progress Component
 * 
 * Shows progress for multiple photos being processed in parallel
 */

'use client'

import React from 'react'
import { Stack, Flex, Text } from '@/components/design-system'
import { Check, Loader2, AlertCircle } from 'lucide-react'

interface PhotoProgress {
  index: number
  fileName: string
  progress: number  // 0-100
  status: 'pending' | 'processing' | 'complete' | 'error'
  error?: string
}

interface BulkProcessingProgressProps {
  photos: PhotoProgress[]
  totalProgress: number  // 0-100
  isProcessing: boolean
}

export function BulkProcessingProgress({
  photos,
  totalProgress,
  isProcessing
}: BulkProcessingProgressProps) {
  const completedCount = photos.filter(p => p.status === 'complete').length
  const errorCount = photos.filter(p => p.status === 'error').length
  const processingCount = photos.filter(p => p.status === 'processing').length

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div>
        <Flex justify="between" align="center" className="mb-2">
          <Text className="text-sm font-medium text-gray-700">
            {isProcessing ? 'Processing Photos...' : 'Processing Complete'}
          </Text>
          <Text className="text-xs text-gray-500">
            {completedCount} of {photos.length} complete
          </Text>
        </Flex>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${totalProgress}%` }}
          />
        </div>

        {/* Stats */}
        <Flex justify="between" align="center" className="mt-2">
          <Text className="text-xs text-gray-500">
            {Math.round(totalProgress)}% complete
          </Text>
          {errorCount > 0 && (
            <Text className="text-xs text-red-600">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </Text>
          )}
        </Flex>
      </div>

      {/* Individual Photo Progress */}
      <Stack spacing="sm">
        {photos.map((photo) => (
          <div
            key={photo.index}
            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <Flex align="center" gap="sm">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {photo.status === 'complete' && (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                {photo.status === 'processing' && (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                )}
                {photo.status === 'error' && (
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                )}
                {photo.status === 'pending' && (
                  <div className="w-5 h-5 rounded-full bg-gray-300" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <Text className="text-sm font-medium text-gray-900 truncate">
                  {photo.fileName}
                </Text>
                {photo.error && (
                  <Text className="text-xs text-red-600 truncate">
                    {photo.error}
                  </Text>
                )}
                {photo.status === 'processing' && (
                  <Text className="text-xs text-gray-500">
                    {photo.progress}%
                  </Text>
                )}
              </div>

              {/* Progress Bar (for processing) */}
              {photo.status === 'processing' && (
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-200"
                    style={{ width: `${photo.progress}%` }}
                  />
                </div>
              )}
            </Flex>
          </div>
        ))}
      </Stack>
    </div>
  )
}
