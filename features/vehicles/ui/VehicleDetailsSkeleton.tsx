/**
 * Vehicle Details Skeleton Loader
 * 
 * Shows the page structure while data is loading
 * Matches actual page layout for seamless transition
 */

'use client'

import React from 'react'
import { AppNavigation } from '@/components/app/AppNavigation'
import { Container, Stack } from '@/components/design-system'

export function VehicleDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <AppNavigation />

      {/* Hero Section - Match VehicleHeaderV2 dimensions exactly */}
      <div className="w-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 py-6 sm:py-8 md:py-12 min-h-[500px] sm:min-h-[600px] animate-pulse">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Stack spacing="lg">
            {/* Back Button & Actions Row */}
            <div className="flex items-center justify-between">
              <div className="h-9 w-32 bg-white/10 rounded-xl" />
              <div className="flex items-center gap-2">
                <div className="h-9 w-20 bg-white/10 rounded-lg" />
                <div className="h-9 w-20 bg-white/10 rounded-lg" />
              </div>
            </div>

            {/* Vehicle Photo Skeleton - Match aspect ratio */}
            <div className="w-full aspect-[21/9] rounded-2xl bg-white/5 border-2 border-dashed border-white/20">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/10" />
              </div>
            </div>

            {/* Vehicle Title Skeleton */}
            <Stack spacing="md">
              <div className="h-10 sm:h-12 w-3/4 sm:w-2/3 bg-white/20 rounded-lg" />
              
              {/* Full name + License plate */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-6 w-48 bg-white/15 rounded" />
                <div className="h-6 w-20 bg-white/15 rounded-lg border border-white/20" />
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-16 bg-white/15 rounded" />
                  <div className="h-7 w-24 bg-white/20 rounded" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-16 bg-white/15 rounded" />
                  <div className="h-7 w-24 bg-white/20 rounded" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-16 bg-white/15 rounded" />
                  <div className="h-7 w-24 bg-white/20 rounded" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-16 bg-white/15 rounded" />
                  <div className="h-7 w-24 bg-white/20 rounded" />
                </div>
              </div>
            </Stack>
          </Stack>
        </div>
      </div>

      {/* Main Content */}
      <Container size="md" useCase="general_content">
        <div className="py-6 space-y-6 animate-pulse">

          {/* AI Insights Card Skeleton */}
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl shadow-sm p-6 space-y-3">
            <div className="h-5 w-1/3 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 rounded" />
          </div>

          {/* Tab Navigation Skeleton */}
          <div className="bg-gray-100 rounded-lg p-1.5 flex gap-2">
            <div className="h-10 w-28 bg-white rounded-md shadow-sm" />
            <div className="h-10 w-36 bg-gray-200/50 rounded-md" />
            <div className="h-10 w-32 bg-gray-200/50 rounded-md" />
            <div className="h-10 w-28 bg-gray-200/50 rounded-md" />
          </div>

          {/* Content Cards Skeleton */}
          <div className="space-y-4">
            {/* Card 1 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-4 w-40 bg-gray-200 rounded" />
              </div>
              {/* Content */}
              <div className="p-6 space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 rounded" />
                <div className="h-4 w-4/6 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
              <div className="p-6 space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-4 w-36 bg-gray-200 rounded" />
              </div>
              <div className="p-6 space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-4/5 bg-gray-200 rounded" />
                <div className="h-4 w-3/5 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-4 w-44 bg-gray-200 rounded" />
              </div>
              <div className="p-6 space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-4 w-36 bg-gray-200 rounded" />
              </div>
              <div className="p-6 space-y-4">
                {/* Timeline items */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </Container>
    </div>
  )
}
