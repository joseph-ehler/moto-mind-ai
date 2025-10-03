import React from 'react'
import Head from 'next/head'
import { StandardCard, StandardCardHeader, StandardCardContent } from '@/components/ui/StandardCard'
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { Button } from '@/components/ui/button'
import { Plus, Settings, Car, Fuel, Wrench, Activity, CheckCircle } from 'lucide-react'

export default function DesignSystemShowcase() {
  return (
    <>
      <Head>
        <title>Design System Components - MotoMind</title>
        <meta name="description" content="Showcase of standardized UI components" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          
          {/* Test PageHeader - Our Core Component */}
          <PageHeader 
            title="Design System Test"
            subtitle="Testing our actual standardized components for broken patterns"
            action={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Test Action
              </Button>
            }
          />

          <Stack spacing="lg">
            
            {/* Test 1: StandardCard Variants */}
            <StandardCard>
              <StandardCardHeader 
                title="StandardCard Test" 
                subtitle="Testing our actual card component"
              />
              <StandardCardContent>
                <Stack spacing="md">
                  
                  {/* Basic Card */}
                  <StandardCard>
                    <StandardCardContent>
                      <SectionHeader title="Basic Card Content" />
                      <p className="text-gray-600 text-sm mt-4">
                        This tests StandardCard with just content - no header.
                      </p>
                    </StandardCardContent>
                  </StandardCard>

                  {/* Card with Header and Action */}
                  <StandardCard>
                    <StandardCardHeader 
                      title="Card with Header" 
                      subtitle="Testing header with action"
                    >
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </StandardCardHeader>
                    <StandardCardContent>
                      <p className="text-gray-600 text-sm">
                        This tests StandardCardHeader with action button.
                      </p>
                    </StandardCardContent>
                  </StandardCard>

                  {/* Premium Variant */}
                  <StandardCard variant="premium">
                    <StandardCardHeader 
                      title="Premium Card Test" 
                      subtitle="Testing premium variant styling"
                    />
                    <StandardCardContent>
                      <p className="text-gray-600 text-sm">
                        This tests the premium variant with rounded-3xl borders.
                      </p>
                    </StandardCardContent>
                  </StandardCard>

                </Stack>
              </StandardCardContent>
            </StandardCard>

            {/* Test 2: SectionHeader Variants */}
            <StandardCard>
              <StandardCardHeader 
                title="SectionHeader Test" 
                subtitle="Testing our section header component"
              />
              <StandardCardContent>
                <Stack spacing="md">
                  
                  {/* Simple SectionHeader */}
                  <SectionHeader title="Simple Section Header" />
                  
                  {/* SectionHeader with Subtitle */}
                  <SectionHeader 
                    title="Section with Subtitle" 
                    subtitle="This section has additional context"
                  />
                  
                  {/* SectionHeader with Action */}
                  <SectionHeader 
                    title="Section with Action" 
                    action={
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        View All
                      </button>
                    }
                  />

                  {/* SectionHeader with Complex Action */}
                  <SectionHeader 
                    title="Section with Status Badge" 
                    action={
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/10 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </div>
                    }
                  />

                </Stack>
              </StandardCardContent>
            </StandardCard>

            {/* Test 3: Stack Component */}
            <StandardCard>
              <StandardCardHeader 
                title="Stack Component Test" 
                subtitle="Testing our spacing utility"
              />
              <StandardCardContent>
                <Stack spacing="md">
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <SectionHeader title="Stack Spacing Test" />
                    <Stack spacing="sm">
                      <div className="bg-blue-100 p-3 rounded text-sm">Stack Item 1</div>
                      <div className="bg-blue-100 p-3 rounded text-sm">Stack Item 2</div>
                      <div className="bg-blue-100 p-3 rounded text-sm">Stack Item 3</div>
                    </Stack>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <SectionHeader title="Large Stack Spacing" />
                    <Stack spacing="lg">
                      <div className="bg-green-100 p-3 rounded text-sm">Large Gap Item 1</div>
                      <div className="bg-green-100 p-3 rounded text-sm">Large Gap Item 2</div>
                    </Stack>
                  </div>

                </Stack>
              </StandardCardContent>
            </StandardCard>

            {/* Test 4: Real Implementation Examples */}
            <StandardCard>
              <StandardCardHeader 
                title="Real Implementation Test" 
                subtitle="Testing components as they're used in the app"
              />
              <StandardCardContent>
                <Stack spacing="md">
                  
                  {/* PhotosCard Pattern */}
                  <StandardCard variant="premium">
                    <SectionHeader title="Photos" />
                    <StandardCardContent>
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
                      </div>
                    </StandardCardContent>
                  </StandardCard>

                  {/* Vehicle Status Pattern */}
                  <StandardCard variant="premium">
                    <SectionHeader 
                      title="Vehicle Status"
                      action={
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/10 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          All Good
                        </div>
                      }
                    />
                    <StandardCardContent>
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
                    </StandardCardContent>
                  </StandardCard>

                  {/* Timeline Pattern */}
                  <StandardCard variant="premium">
                    <SectionHeader 
                      title="Vehicle Timeline"
                      action={
                        <div className="text-sm text-gray-500">
                          3 events
                        </div>
                      }
                    />
                    <StandardCardContent>
                      <Stack spacing="sm">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Activity className="w-5 h-5 text-blue-600" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Dashboard Snapshot</div>
                            <div className="text-xs text-gray-500">2 days ago</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Fuel className="w-5 h-5 text-green-600" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Fuel Fill-up</div>
                            <div className="text-xs text-gray-500">1 week ago</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Wrench className="w-5 h-5 text-orange-600" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Service Record</div>
                            <div className="text-xs text-gray-500">2 weeks ago</div>
                          </div>
                        </div>
                      </Stack>
                    </StandardCardContent>
                  </StandardCard>

                </Stack>
              </StandardCardContent>
            </StandardCard>

            {/* Test 5: Component Status */}
            <StandardCard>
              <StandardCardHeader 
                title="Design System Status" 
                subtitle="Current implementation state"
              />
              <StandardCardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <SectionHeader title="✅ Working Components" />
                    <Stack spacing="sm">
                      <div className="text-sm text-gray-600">• StandardCard (standard + premium)</div>
                      <div className="text-sm text-gray-600">• StandardCardHeader</div>
                      <div className="text-sm text-gray-600">• StandardCardContent</div>
                      <div className="text-sm text-gray-600">• PageHeader</div>
                      <div className="text-sm text-gray-600">• SectionHeader</div>
                      <div className="text-sm text-gray-600">• Stack (spacing utility)</div>
                    </Stack>
                  </div>

                  <div>
                    <SectionHeader title="🔄 Implementation Progress" />
                    <Stack spacing="sm">
                      <div className="text-sm text-gray-600">• VehicleTimeline.tsx ✅</div>
                      <div className="text-sm text-gray-600">• PhotosCard.tsx ✅</div>
                      <div className="text-sm text-gray-600">• vehicles/dynamic-demo.tsx ✅</div>
                      <div className="text-sm text-gray-600">• Modal headers 🔄</div>
                      <div className="text-sm text-gray-600">• SmartCard headers 🔄</div>
                      <div className="text-sm text-gray-600">• 15+ more components 📝</div>
                    </Stack>
                  </div>

                </div>
              </StandardCardContent>
            </StandardCard>

          </Stack>

        </div>
      </div>
    </>
  )
}
