import React from 'react'
import Head from 'next/head'
import { StandardCard, StandardCardHeader, StandardCardContent } from '@/components/ui/StandardCard'
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader'
import { Stack, HStack } from '@/components/ui/Stack'
import { Button } from '@/components/ui/button'
import { Plus, Settings, Bell, Car, Fuel, Wrench } from 'lucide-react'

export default function DesignSystemShowcase() {
  return (
    <>
      <Head>
        <title>Design System Components - MotoMind</title>
        <meta name="description" content="Showcase of standardized UI components" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          
          {/* Page Header Example */}
          <PageHeader 
            title="Design System Components"
            subtitle="Standardized UI components for consistent design"
            action={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            }
          />

          <Stack spacing="lg">
            
            {/* Headers Section */}
            <StandardCard>
              <StandardCardHeader 
                title="Headers" 
                subtitle="PageHeader and SectionHeader components"
              />
              <StandardCardContent>
                <Stack spacing="md">
                  
                  {/* PageHeader Examples */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">PageHeader Examples</h3>
                    <Stack spacing="sm">
                      <PageHeader title="Simple Page Title" />
                      
                      <PageHeader 
                        title="Page with Subtitle" 
                        subtitle="This page has a descriptive subtitle"
                      />
                      
                      <PageHeader 
                        title="Page with Action" 
                        subtitle="This page has an action button"
                        action={<Button size="sm">Action</Button>}
                      />
                    </Stack>
                  </div>

                  {/* SectionHeader Examples */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">SectionHeader Examples</h3>
                    <Stack spacing="sm">
                      <SectionHeader title="Simple Section" />
                      
                      <SectionHeader 
                        title="Section with Subtitle" 
                        subtitle="This section has additional context"
                      />
                      
                      <SectionHeader 
                        title="Section with Action" 
                        action={
                          <button className="text-sm text-blue-600 hover:text-blue-700">
                            View All
                          </button>
                        }
                      />
                    </Stack>
                  </div>

                </Stack>
              </StandardCardContent>
            </StandardCard>

            {/* Cards Section */}
            <StandardCard>
              <StandardCardHeader 
                title="Cards" 
                subtitle="StandardCard with variants and layouts"
              />
              <StandardCardContent>
                <Stack spacing="md">
                  
                  {/* Standard Card Examples */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Standard Cards</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Simple Card */}
                      <StandardCard>
                        <StandardCardContent>
                          <h4 className="font-semibold text-gray-900 mb-2">Simple Card</h4>
                          <p className="text-gray-600 text-sm">
                            Basic card with just content, no header.
                          </p>
                        </StandardCardContent>
                      </StandardCard>

                      {/* Card with Header */}
                      <StandardCard>
                        <StandardCardHeader 
                          title="Card with Header" 
                          subtitle="This card has a header section"
                        />
                        <StandardCardContent>
                          <p className="text-gray-600 text-sm">
                            Content goes here with proper spacing.
                          </p>
                        </StandardCardContent>
                      </StandardCard>

                      {/* Card with Action */}
                      <StandardCard>
                        <StandardCardHeader 
                          title="Card with Action" 
                          subtitle="This card has an action button"
                        >
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </StandardCardHeader>
                        <StandardCardContent>
                          <p className="text-gray-600 text-sm">
                            Action buttons can be placed in the header.
                          </p>
                        </StandardCardContent>
                      </StandardCard>

                      {/* Premium Card */}
                      <StandardCard variant="premium">
                        <StandardCardHeader 
                          title="Premium Card" 
                          subtitle="Uses premium variant styling"
                        />
                        <StandardCardContent>
                          <p className="text-gray-600 text-sm">
                            Premium cards have rounded-3xl borders and subtle shadows.
                          </p>
                        </StandardCardContent>
                      </StandardCard>

                    </div>
                  </div>

                </Stack>
              </StandardCardContent>
            </StandardCard>

            {/* Layout Components */}
            <StandardCard>
              <StandardCardHeader 
                title="Layout Components" 
                subtitle="Stack and spacing utilities"
              />
              <StandardCardContent>
                <Stack spacing="md">
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Stack Examples</h3>
                    
                    {/* Vertical Stack */}
                    <div className="mb-6">
                      <h4 className="text-xs font-medium text-gray-600 mb-2">Vertical Stack (space-y-*)</h4>
                      <div className="bg-white p-4 rounded border">
                        <Stack spacing="sm">
                          <div className="bg-blue-100 p-2 rounded text-sm">Item 1</div>
                          <div className="bg-blue-100 p-2 rounded text-sm">Item 2</div>
                          <div className="bg-blue-100 p-2 rounded text-sm">Item 3</div>
                        </Stack>
                      </div>
                    </div>

                    {/* Horizontal Stack */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 mb-2">Horizontal Stack (space-x-*)</h4>
                      <div className="bg-white p-4 rounded border">
                        <HStack spacing="sm">
                          <div className="bg-green-100 p-2 rounded text-sm">Item 1</div>
                          <div className="bg-green-100 p-2 rounded text-sm">Item 2</div>
                          <div className="bg-green-100 p-2 rounded text-sm">Item 3</div>
                        </HStack>
                      </div>
                    </div>

                  </div>

                </Stack>
              </StandardCardContent>
            </StandardCard>

            {/* Real-World Examples */}
            <StandardCard>
              <StandardCardHeader 
                title="Real-World Examples" 
                subtitle="Components as they appear in the application"
              />
              <StandardCardContent>
                <Stack spacing="md">
                  
                  {/* Vehicle Status Card Example */}
                  <StandardCard variant="premium">
                    <SectionHeader 
                      title="Vehicle Status"
                      action={
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/10 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          All Good
                        </div>
                      }
                    />
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Current Mileage</div>
                          <div className="text-2xl font-semibold text-gray-900">52,205 mi</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Next Service</div>
                          <div className="text-2xl font-semibold text-gray-900">55,000 mi</div>
                        </div>
                      </div>
                    </div>
                  </StandardCard>

                  {/* Photos Card Example */}
                  <StandardCard variant="premium">
                    <SectionHeader title="Photos" />
                    <div className="p-6">
                      <div className="flex gap-3 overflow-x-auto">
                        <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Plus className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-shrink-0 w-24 h-24 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Car className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-shrink-0 w-24 h-24 bg-green-100 rounded-lg flex items-center justify-center">
                          <Fuel className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-shrink-0 w-24 h-24 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Wrench className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </div>
                  </StandardCard>

                </Stack>
              </StandardCardContent>
            </StandardCard>

            {/* Implementation Status */}
            <StandardCard>
              <StandardCardHeader 
                title="Implementation Status" 
                subtitle="Progress on design system rollout"
              />
              <StandardCardContent>
                <Stack spacing="sm">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">✅ Completed</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• StandardCard component</li>
                        <li>• PageHeader component</li>
                        <li>• SectionHeader component</li>
                        <li>• Stack layout component</li>
                        <li>• VehicleTimeline.tsx</li>
                        <li>• PhotosCard.tsx</li>
                        <li>• vehicles/dynamic-demo.tsx</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">🔄 In Progress</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Modal headers</li>
                        <li>• SmartCard headers</li>
                        <li>• Navigation headers</li>
                        <li>• Form headers</li>
                        <li>• 15+ more components</li>
                      </ul>
                    </div>

                  </div>

                </Stack>
              </StandardCardContent>
            </StandardCard>

          </Stack>

        </div>
      </div>
    </>
  )
}
