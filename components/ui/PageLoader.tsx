/**
 * Page Loader Component
 * 
 * Beautiful branded loading animation for page transitions
 * Features animated gradient, pulse effect, and motion lines
 */

'use client'

import React from 'react'
import { Car } from 'lucide-react'

interface PageLoaderProps {
  message?: string
  fullScreen?: boolean
}

export function PageLoader({ 
  message = 'Loading...', 
  fullScreen = true 
}: PageLoaderProps) {
  return (
    <div 
      className={`
        flex items-center justify-center
        ${fullScreen ? 'fixed inset-0 z-50 bg-white' : 'w-full h-full min-h-[400px]'}
      `}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Animated Car Icon with Gradient */}
        <div className="relative">
          {/* Outer pulse ring */}
          <div className="absolute inset-0 -m-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 animate-ping" />
          </div>
          
          {/* Middle rotating gradient ring */}
          <div className="absolute inset-0 -m-2">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30 animate-spin" 
                 style={{ animationDuration: '3s' }} 
            />
          </div>
          
          {/* Icon container */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
            <Car className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-semibold text-gray-900 animate-pulse">
            {message}
          </p>
          
          {/* Animated dots */}
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        {/* Motion lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-1/3 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-slide-right" />
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-slide-right" 
               style={{ animationDelay: '0.5s' }} 
          />
          <div className="absolute top-2/3 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-pink-500 to-transparent animate-slide-right" 
               style={{ animationDelay: '1s' }} 
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-right {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        .animate-slide-right {
          animation: slide-right 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// Compact version for inline loading states
export function CompactLoader({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30 animate-spin" />
        <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
          <Car className="w-5 h-5 text-purple-600 animate-pulse" />
        </div>
      </div>
      {message && (
        <p className="text-sm font-medium text-gray-600">{message}</p>
      )}
    </div>
  )
}

// Skeleton loader for content
export function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  )
}
