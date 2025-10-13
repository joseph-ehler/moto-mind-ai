/**
 * Loading States & Skeletons Showcase
 */

import React, { useState } from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  BaseCard,
  Spinner,
  Skeleton,
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
  InlineLoader,
  LoadingOverlay,
  ProgressBar,
  DotsLoader,
  PulseLoader,
  // Elite features
  SmartLoader,
  SkeletonTransition,
  DelayedSpinner,
  LoadingWithRetry,
  ProfileSkeleton,
  VehicleCardSkeleton,
  MaintenanceListSkeleton,
  EventTimelineSkeleton,
  SkeletonAvatar,
  SkeletonText,
  SkeletonButton,
  TrackedSkeleton
} from '@/components/design-system'

export default function LoadingStatesShowcasePage() {
  const [showOverlay, setShowOverlay] = useState(false)
  const [progress, setProgress] = useState(45)
  const [isLoading, setIsLoading] = useState(true)
  const [showRetry, setShowRetry] = useState(false)
  const [retryError, setRetryError] = useState<Error | null>(null)

  return (
    <>
      <Head>
        <title>Loading States & Skeletons - MotoMind Design System</title>
        <meta name="description" content="Loading state components" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        <Container size="md" useCase="articles">
          <Section spacing="xl">
            <Stack spacing="2xl">
              
              {/* Page Title */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-black mb-4">Loading States & Skeletons</h1>
                <p className="text-lg text-black/60">30+ components including elite features</p>
              </div>

              {/* 1. Spinners */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">1. Spinners</h2>
                <p className="text-sm text-black/60">Classic circular loaders in multiple sizes</p>
                
                <BaseCard padding="lg">
                  <div className="flex flex-wrap items-center gap-8">
                    <Spinner size="xs" />
                    <Spinner size="sm" />
                    <Spinner size="md" />
                    <Spinner size="lg" />
                    <Spinner size="xl" />
                    <Spinner size="md" label="Loading..." />
                  </div>
                </BaseCard>
              </Stack>

              {/* 2. Skeletons */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">2. Skeletons</h2>
                <p className="text-sm text-black/60">Content placeholders</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="md">
                    <Skeleton width="60%" height="24px" />
                    <Skeleton width="100%" height="16px" />
                    <Skeleton width="80%" height="16px" />
                    <div className="flex gap-4 mt-4">
                      <Skeleton variant="circular" width="40px" height="40px" />
                      <Skeleton variant="rectangular" width="100px" height="40px" />
                    </div>
                  </Stack>
                </BaseCard>
              </Stack>

              {/* 3. Card Skeleton */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">3. Card Skeleton</h2>
                <p className="text-sm text-black/60">Loading card structure</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CardSkeleton showImage lines={3} />
                  <CardSkeleton showImage lines={2} showActions />
                </div>
              </Stack>

              {/* 4. List Skeleton */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">4. List Skeleton</h2>
                <p className="text-sm text-black/60">Loading list items</p>
                
                <BaseCard padding="lg">
                  <ListSkeleton items={4} showAvatar />
                </BaseCard>
              </Stack>

              {/* 5. Table Skeleton */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">5. Table Skeleton</h2>
                <p className="text-sm text-black/60">Loading tabular data</p>
                
                <TableSkeleton rows={5} columns={4} />
              </Stack>

              {/* 6. Inline Loader */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">6. Inline Loader</h2>
                <p className="text-sm text-black/60">Small inline loading indicators</p>
                
                <BaseCard>
                  <InlineLoader text="Loading more vehicles..." />
                </BaseCard>
              </Stack>

              {/* 7. Loading Overlay */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">7. Loading Overlay</h2>
                <p className="text-sm text-black/60">Block interaction while loading</p>
                
                <div className="relative">
                  <BaseCard padding="lg">
                    <Stack spacing="md">
                      <h3 className="text-lg font-semibold text-black">Sample Content</h3>
                      <p className="text-sm text-black/60">
                        This content will be covered by an overlay when loading.
                      </p>
                      <button
                        onClick={() => {
                          setShowOverlay(true)
                          setTimeout(() => setShowOverlay(false), 2000)
                        }}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity w-fit"
                      >
                        Show Loading Overlay (2s)
                      </button>
                    </Stack>
                    <LoadingOverlay visible={showOverlay} text="Saving changes..." />
                  </BaseCard>
                </div>
              </Stack>

              {/* 8. Progress Bar */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">8. Progress Bar</h2>
                <p className="text-sm text-black/60">Linear progress indicators</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="xl">
                    <ProgressBar value={progress} showPercentage label="Upload Progress" />
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setProgress(Math.max(0, progress - 10))}
                        className="px-3 py-1.5 text-sm border border-black/10 rounded-lg hover:bg-slate-50"
                      >
                        -10%
                      </button>
                      <button
                        onClick={() => setProgress(Math.min(100, progress + 10))}
                        className="px-3 py-1.5 text-sm border border-black/10 rounded-lg hover:bg-slate-50"
                      >
                        +10%
                      </button>
                    </div>

                    <ProgressBar indeterminate label="Processing..." />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <ProgressBar value={75} size="sm" />
                      <ProgressBar value={75} size="md" />
                      <ProgressBar value={75} size="lg" />
                    </div>
                  </Stack>
                </BaseCard>
              </Stack>

              {/* 9. Dots Loader */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">9. Dots Loader</h2>
                <p className="text-sm text-black/60">Three dots animation</p>
                
                <BaseCard padding="lg">
                  <div className="flex flex-wrap items-center gap-8">
                    <DotsLoader size="sm" />
                    <DotsLoader size="md" />
                    <DotsLoader size="lg" />
                    <div className="bg-black px-4 py-2 rounded-lg">
                      <DotsLoader size="md" color="white" />
                    </div>
                  </div>
                </BaseCard>
              </Stack>

              {/* 10. Pulse Loader */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">10. Pulse Loader</h2>
                <p className="text-sm text-black/60">Pulsing circle animation</p>
                
                <BaseCard padding="lg">
                  <div className="flex items-center gap-8">
                    <PulseLoader size="sm" />
                    <PulseLoader size="md" />
                    <PulseLoader size="lg" />
                  </div>
                </BaseCard>
              </Stack>

              {/* ELITE FEATURES */}
              <div className="text-center py-8 border-y border-black/10">
                <h2 className="text-3xl font-bold text-black mb-2">⚡ Elite Features</h2>
                <p className="text-lg text-black/60">Advanced loading patterns for premium UX</p>
              </div>

              {/* 11. Smart Loader */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">11. Smart Loader</h2>
                <p className="text-sm text-black/60">Auto-selects appropriate skeleton</p>
                
                <BaseCard padding="lg">
                  <SmartLoader isLoading={true} type="card">
                    <div>Actual content here</div>
                  </SmartLoader>
                </BaseCard>
              </Stack>

              {/* 12. Skeleton Transition */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">12. Skeleton Transition</h2>
                <p className="text-sm text-black/60">Smooth crossfade between skeleton and content</p>
                
                <BaseCard padding="lg">
                  <button
                    onClick={() => setIsLoading(!isLoading)}
                    className="mb-4 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg"
                  >
                    Toggle Loading
                  </button>
                  <SkeletonTransition
                    isLoading={isLoading}
                    skeleton={<CardSkeleton showImage lines={2} />}
                  >
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                      <h3 className="text-lg font-semibold text-black mb-2">Content Loaded!</h3>
                      <p className="text-sm text-black/60">This smoothly fades in when loading completes.</p>
                    </div>
                  </SkeletonTransition>
                </BaseCard>
              </Stack>

              {/* 13. Delayed Spinner */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">13. Delayed Spinner</h2>
                <p className="text-sm text-black/60">Prevents loading flash for quick loads</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="sm">
                    <p className="text-sm text-black/60">
                      Only shows after 300ms delay, stays visible for minimum 500ms
                    </p>
                    <DelayedSpinner size="md" label="Loading..." delay={300} minDuration={500} />
                  </Stack>
                </BaseCard>
              </Stack>

              {/* 14. Loading with Retry */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">14. Loading with Retry</h2>
                <p className="text-sm text-black/60">Transitions to error state with retry button</p>
                
                <div className="relative">
                  <BaseCard padding="lg">
                    <Stack spacing="md">
                      <h3 className="text-lg font-semibold text-black">Sample Content</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowRetry(true)
                            setRetryError(null)
                          }}
                          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg"
                        >
                          Show Loading
                        </button>
                        <button
                          onClick={() => {
                            setShowRetry(true)
                            setRetryError(new Error('Network timeout'))
                          }}
                          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg"
                        >
                          Show Error
                        </button>
                      </div>
                    </Stack>
                    <LoadingWithRetry
                      visible={showRetry}
                      error={retryError}
                      onRetry={() => {
                        setRetryError(null)
                        setShowRetry(false)
                      }}
                      retryCount={1}
                    />
                  </BaseCard>
                </div>
              </Stack>

              {/* 15. Skeleton Presets */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">15. Skeleton Presets</h2>
                <p className="text-sm text-black/60">Pre-built skeletons for common patterns</p>
                
                <Stack spacing="md">
                  <ProfileSkeleton />
                </Stack>
              </Stack>

              {/* 16. App-Specific Skeletons */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">16. App-Specific Skeletons</h2>
                <p className="text-sm text-black/60">Skeletons matching your actual components</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <VehicleCardSkeleton />
                  <div>
                    <MaintenanceListSkeleton />
                  </div>
                </div>
                <EventTimelineSkeleton />
              </Stack>

              {/* 17. Skeleton Composer */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">17. Skeleton Composer</h2>
                <p className="text-sm text-black/60">Build custom skeletons with composable parts</p>
                
                <BaseCard padding="lg">
                  <div className="flex gap-4">
                    <SkeletonAvatar size="lg" />
                    <Stack spacing="sm" className="flex-1">
                      <SkeletonText lines={2} />
                      <SkeletonButton width="120px" />
                    </Stack>
                  </div>
                </BaseCard>
              </Stack>

              {/* 18. Performance Tracking */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">18. Performance Tracking</h2>
                <p className="text-sm text-black/60">Track loading durations for analytics</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="sm">
                    <TrackedSkeleton
                      width="100%"
                      height="60px"
                      onLoadStart={() => console.log('Skeleton shown')}
                      onLoadEnd={(duration) => console.log(`Loaded in ${duration}ms`)}
                    />
                    <p className="text-xs text-black/40">Check console for tracking logs</p>
                  </Stack>
                </BaseCard>
              </Stack>

              {/* Usage Guidelines */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">Usage Guidelines</h2>
                
                <Stack spacing="md">
                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">When to Use</p>
                      <p className="text-sm text-black/60">
                        • <strong>Spinners:</strong> Simple, quick loads ({"<"}1s)
                        <br />
                        • <strong>Skeletons:</strong> Page loads, show content structure
                        <br />
                        • <strong>Card/List/Table:</strong> Specific content types
                        <br />
                        • <strong>Inline Loader:</strong> "Load more" pagination
                        <br />
                        • <strong>Overlay:</strong> Block UI during saves/deletes
                        <br />
                        • <strong>Progress Bar:</strong> File uploads, long operations
                        <br />
                        • <strong>Dots/Pulse:</strong> Minimal, ambient indicators
                      </p>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">Best Practices</p>
                      <p className="text-sm text-black/60">
                        ✅ Use skeletons over spinners for better UX
                        <br />
                        ✅ Match skeleton to actual content structure
                        <br />
                        ✅ Show progress for operations {">"}3 seconds
                        <br />
                        ✅ Add staggered animations for lists
                        <br />
                        ✅ Use overlays sparingly (blocking)
                        <br />
                        ✅ Always provide aria-labels for screen readers
                      </p>
                    </Stack>
                  </BaseCard>
                </Stack>
              </Stack>

            </Stack>
          </Section>
        </Container>
      </div>
    </>
  )
}
