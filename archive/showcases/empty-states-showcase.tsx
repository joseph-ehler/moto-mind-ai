/**
 * Empty States Showcase
 */

import React, { useState } from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  BaseCard,
  EmptyState,
  SearchEmptyState,
  ErrorEmptyState,
  FirstTimeEmptyState,
  CompactEmptyState,
  SmartEmptyState,
  EnhancedErrorEmptyState,
  EmptyStateIllustrations,
  IllustrationEmptyState
} from '@/components/design-system'
import { Car, FileText, Calendar, Sparkles, Check } from 'lucide-react'

export default function EmptyStatesShowcasePage() {
  const [retryCount, setRetryCount] = useState(0)
  return (
    <>
      <Head>
        <title>Empty States - MotoMind Design System</title>
        <meta name="description" content="Empty state components" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        <Container size="md" useCase="articles">
          <Section spacing="xl">
            <Stack spacing="2xl">
              
              {/* Page Title */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-black mb-4">Empty States</h1>
                <p className="text-lg text-black/60">11 elite empty state patterns + advanced features</p>
              </div>

              {/* 1. Basic Empty State */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">1. Basic Empty State</h2>
                <p className="text-sm text-black/60">General empty state with icon and actions</p>
                
                <BaseCard>
                  <EmptyState
                    icon={<Car className="w-12 h-12" />}
                    title="No vehicles yet"
                    description="Add your first vehicle to start tracking maintenance, fuel, and more."
                    action={{
                      label: 'Add Vehicle',
                      onClick: () => alert('Add Vehicle clicked')
                    }}
                    secondaryAction={{
                      label: 'Learn More',
                      onClick: () => alert('Learn More clicked')
                    }}
                  />
                </BaseCard>
              </Stack>

              {/* Elite Features Demo */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">⚡ Elite Features Demo</h2>
                <p className="text-sm text-black/60">Keyboard shortcuts, animations, and analytics</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BaseCard>
                    <EmptyState
                      icon={<Car className="w-12 h-12" />}
                      title="With Keyboard Shortcuts"
                      description="Press Enter or Escape to trigger actions"
                      keyboardShortcuts
                      iconAnimation="pulse"
                      onView={(name) => console.log('Viewed:', name)}
                      action={{
                        label: 'Primary',
                        onClick: () => alert('Enter pressed or clicked!')
                      }}
                      secondaryAction={{
                        label: 'Cancel',
                        onClick: () => alert('Escape pressed or clicked!')
                      }}
                    />
                  </BaseCard>

                  <BaseCard>
                    <EmptyState
                      icon={<Sparkles className="w-12 h-12" />}
                      title="Bouncing Icon"
                      description="Icon with bounce animation"
                      iconAnimation="bounce"
                      size="sm"
                      action={{
                        label: 'Get Started',
                        onClick: () => alert('Started')
                      }}
                    />
                  </BaseCard>
                </div>
              </Stack>

              {/* 2. Search Empty State */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">2. Search Empty State</h2>
                <p className="text-sm text-black/60">No search results with suggestions</p>
                
                <BaseCard>
                  <SearchEmptyState
                    query="honda covic"
                    suggestions={['honda civic', 'honda accord', 'toyota corolla']}
                    onClearSearch={() => alert('Clear search')}
                    onSuggestionClick={(suggestion) => alert(`Clicked: ${suggestion}`)}
                  />
                </BaseCard>
              </Stack>

              {/* 3. Error Empty State */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">3. Error Empty State</h2>
                <p className="text-sm text-black/60">Something went wrong</p>
                
                <BaseCard>
                  <ErrorEmptyState
                    title="Failed to load vehicles"
                    description="We couldn't fetch your vehicles. Please check your connection and try again."
                    errorCode="ERR_NETWORK_TIMEOUT"
                    onRetry={() => alert('Retry clicked')}
                    onGoBack={() => alert('Go Back clicked')}
                  />
                </BaseCard>
              </Stack>

              {/* 4. First Time Empty State */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">4. First Time Empty State</h2>
                <p className="text-sm text-black/60">Welcome/onboarding experience</p>
                
                <BaseCard>
                  <FirstTimeEmptyState
                    icon={<Sparkles className="w-12 h-12" />}
                    title="Welcome to MotoMind"
                    description="The smart way to track and manage all your vehicles in one place"
                    features={[
                      { icon: <Car className="w-5 h-5" />, text: 'Track unlimited vehicles' },
                      { icon: <Calendar className="w-5 h-5" />, text: 'Schedule maintenance reminders' },
                      { icon: <FileText className="w-5 h-5" />, text: 'Store documents securely' },
                      { icon: <Check className="w-5 h-5" />, text: 'Monitor fuel and costs' }
                    ]}
                    action={{
                      label: 'Add Your First Vehicle',
                      onClick: () => alert('Get Started clicked')
                    }}
                  />
                </BaseCard>
              </Stack>

              {/* 5. Compact Empty State */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">5. Compact Empty State</h2>
                <p className="text-sm text-black/60">For smaller spaces like cards</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BaseCard>
                    <CompactEmptyState
                      icon={<FileText className="w-5 h-5" />}
                      message="No documents yet"
                      action={{
                        label: 'Upload Document',
                        onClick: () => alert('Upload clicked')
                      }}
                    />
                  </BaseCard>

                  <BaseCard>
                    <CompactEmptyState
                      icon={<Calendar className="w-5 h-5" />}
                      message="No events scheduled"
                      action={{
                        label: 'Add Event',
                        onClick: () => alert('Add Event clicked')
                      }}
                    />
                  </BaseCard>
                </div>
              </Stack>

              {/* 6. Size Variants */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">6. Size Variants (sm/md/lg)</h2>
                <p className="text-sm text-black/60">Different sizes for different contexts</p>
                
                <div className="grid grid-cols-1 gap-4">
                  <BaseCard>
                    <EmptyState
                      size="sm"
                      icon={<FileText className="w-12 h-12" />}
                      title="Small Empty State"
                      description="Compact for tight spaces"
                    />
                  </BaseCard>
                  <BaseCard>
                    <EmptyState
                      size="lg"
                      icon={<Car className="w-12 h-12" />}
                      title="Large Empty State"
                      description="More prominent for important sections"
                    />
                  </BaseCard>
                </div>
              </Stack>

              {/* 7. Smart Empty State */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">7. Smart Empty State (Auto-Select)</h2>
                <p className="text-sm text-black/60">Automatically picks the right state</p>
                
                <BaseCard>
                  <SmartEmptyState
                    error={new Error('Network timeout')}
                    title="Failed to load"
                    description="Something went wrong"
                    onRetry={() => alert('Retry clicked')}
                  />
                </BaseCard>
              </Stack>

              {/* 8. Enhanced Error with Copy */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">8. Enhanced Error (Copy Error Code)</h2>
                <p className="text-sm text-black/60">Click error code to copy • Shows support after 3 retries</p>
                
                <BaseCard>
                  <EnhancedErrorEmptyState
                    title="Failed to load vehicles"
                    description="We couldn't fetch your vehicles. Please check your connection."
                    errorCode="ERR_NETWORK_TIMEOUT"
                    retryCount={retryCount}
                    onRetry={() => setRetryCount(retryCount + 1)}
                    onContactSupport={() => alert('Opening support...')}
                  />
                </BaseCard>
                <p className="text-xs text-black/40 text-center">
                  Retry count: {retryCount} (Support link appears after 3 retries)
                </p>
              </Stack>

              {/* 9. Illustration Empty State */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">9. Illustration Empty State (Premium)</h2>
                <p className="text-sm text-black/60">Pre-built SVG illustrations</p>
                
                <BaseCard>
                  <IllustrationEmptyState
                    illustration={<EmptyStateIllustrations.NoVehicles />}
                    title="Build Your Fleet"
                    description="Start tracking vehicles, maintenance, and more"
                    action={{
                      label: 'Add First Vehicle',
                      onClick: () => alert('Add Vehicle')
                    }}
                  />
                </BaseCard>

                <div className="grid grid-cols-2 gap-4">
                  <BaseCard>
                    <IllustrationEmptyState
                      illustration={<EmptyStateIllustrations.NoDocuments />}
                      title="No Documents"
                      description="Upload your first document"
                    />
                  </BaseCard>
                  <BaseCard>
                    <IllustrationEmptyState
                      illustration={<EmptyStateIllustrations.Success />}
                      title="All Done!"
                      description="Your changes have been saved"
                    />
                  </BaseCard>
                </div>
              </Stack>

              {/* Usage Guidelines */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">Usage Guidelines</h2>
                
                <Stack spacing="md">
                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">When to Use</p>
                      <p className="text-sm text-black/60">
                        • <strong>Basic Empty State:</strong> Lists, collections, general "no data" scenarios
                        <br />
                        • <strong>Search Empty State:</strong> Search results pages, filtered lists
                        <br />
                        • <strong>Error Empty State:</strong> Failed data fetches, network errors
                        <br />
                        • <strong>First Time Empty State:</strong> Onboarding, new users, feature discovery
                        <br />
                        • <strong>Compact Empty State:</strong> Cards, sidebars, small sections
                      </p>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">Best Practices</p>
                      <p className="text-sm text-black/60">
                        ✅ Always provide context (why it's empty)
                        <br />
                        ✅ Include a clear call-to-action
                        <br />
                        ✅ Use friendly, encouraging copy
                        <br />
                        ✅ Match icon to context
                        <br />
                        ✅ Keep descriptions concise
                      </p>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">Design Principles</p>
                      <p className="text-sm text-black/60">
                        • Centered layout for prominence
                        <br />
                        • Generous whitespace (min-h-[400px])
                        <br />
                        • Subtle icon backgrounds (slate-100)
                        <br />
                        • Max-width constraints for readability
                        <br />
                        • Primary action prominence
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
