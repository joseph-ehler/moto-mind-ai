/**
 * Layout Design System Showcase
 * 
 * Interactive showcase of the complete layout system
 * Single scroll page demonstrating grids, flexbox, spacing, and patterns
 */

import React from 'react'
import Head from 'next/head'
import {
  Container,
  Grid,
  Flex,
  Stack,
  Section,
  Columns,
  AspectRatio,
  SidebarLayout,
  DashboardLayout,
  HeroLayout
} from '@/components/design-system/primitives/Layout'
import { Card, MetricCard, Button, Heading, Text } from '@/components/design-system'
import { 
  Layout, 
  Grid3X3, 
  Columns3, 
  AlignLeft, 
  AlignCenter,
  AlignRight,
  Smartphone,
  Tablet,
  Monitor,
  Car,
  Users,
  DollarSign,
  TrendingUp
} from 'lucide-react'

export default function LayoutSystemShowcase() {
  return (
    <>
      <Head>
        <title>Layout System - MotoMind Design System</title>
        <meta name="description" content="Comprehensive layout system for responsive, mobile-first designs" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <HeroLayout height="md" background="gradient">
          <Container size="lg">
            <Stack spacing="lg" align="center">
              <Layout className="w-16 h-16 text-white/80" />
              <Heading level="hero" className="text-white">Layout Design System</Heading>
              <Text className="text-white/90 text-xl max-w-3xl text-center">
                Comprehensive layout system built on CSS Grid, Flexbox, and responsive design principles.
                Mobile-first, accessible, and infinitely flexible.
              </Text>
            </Stack>
          </Container>
        </HeroLayout>

        {/* Container System */}
        <Section spacing="xl" background="white">
          <Container size="xl">
            <Stack spacing="xl">
              <div className="text-center">
                <Heading level="title">Container System</Heading>
                <Text className="mt-4 text-xl text-gray-600">
                  Responsive containers that adapt to different screen sizes
                </Text>
              </div>

              <Stack spacing="lg">
                {/* Container Sizes */}
                <Card className="p-8">
                  <Stack spacing="lg">
                    <Heading level="subtitle">Container Sizes</Heading>
                    
                    <div className="space-y-6">
                      <div>
                        <Text variant="caption" className="mb-2 block font-medium">Small (672px max)</Text>
                        <Container size="sm" className="bg-blue-50 border-2 border-dashed border-blue-200 p-4">
                          <Text className="text-center text-blue-700">Small Container</Text>
                        </Container>
                      </div>
                      
                      <div>
                        <Text variant="caption" className="mb-2 block font-medium">Medium (896px max)</Text>
                        <Container size="md" className="bg-green-50 border-2 border-dashed border-green-200 p-4">
                          <Text className="text-center text-green-700">Medium Container</Text>
                        </Container>
                      </div>
                      
                      <div>
                        <Text variant="caption" className="mb-2 block font-medium">Large (1152px max)</Text>
                        <Container size="lg" className="bg-purple-50 border-2 border-dashed border-purple-200 p-4">
                          <Text className="text-center text-purple-700">Large Container</Text>
                        </Container>
                      </div>
                      
                      <div>
                        <Text variant="caption" className="mb-2 block font-medium">Extra Large (1280px max)</Text>
                        <Container size="xl" className="bg-orange-50 border-2 border-dashed border-orange-200 p-4">
                          <Text className="text-center text-orange-700">Extra Large Container</Text>
                        </Container>
                      </div>
                    </div>
                  </Stack>
                </Card>

                {/* Responsive Breakpoints */}
                <Card className="p-8">
                  <Stack spacing="lg">
                    <Heading level="subtitle">Responsive Breakpoints</Heading>
                    
                    <Grid columns="fit" gap="md">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <Smartphone className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <Text className="font-medium">Small</Text>
                        <Text variant="caption">640px+</Text>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <Tablet className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <Text className="font-medium">Medium</Text>
                        <Text variant="caption">768px+</Text>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <Text className="font-medium">Large</Text>
                        <Text variant="caption">1024px+</Text>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <Text className="font-medium">XL</Text>
                        <Text variant="caption">1280px+</Text>
                      </div>
                    </Grid>
                  </Stack>
                </Card>
              </Stack>
            </Stack>
          </Container>
        </Section>

        {/* Grid System */}
        <Section spacing="xl" background="gray">
          <Container size="xl">
            <Stack spacing="xl">
              <div className="text-center">
                <Heading level="title">Grid System</Heading>
                <Text className="mt-4 text-xl text-gray-600">
                  Powerful CSS Grid system for complex layouts
                </Text>
              </div>

              <Stack spacing="lg">
                {/* Basic Grids */}
                <Card className="p-8">
                  <Stack spacing="lg">
                    <Heading level="subtitle">Basic Grid Layouts</Heading>
                    
                    <div className="space-y-8">
                      <div>
                        <Text variant="caption" className="mb-4 block font-medium">2 Columns</Text>
                        <Grid columns={2} gap="md">
                          <div className="bg-blue-100 p-4 rounded-lg text-center">
                            <Text className="text-blue-700">Column 1</Text>
                          </div>
                          <div className="bg-blue-100 p-4 rounded-lg text-center">
                            <Text className="text-blue-700">Column 2</Text>
                          </div>
                        </Grid>
                      </div>
                      
                      <div>
                        <Text variant="caption" className="mb-4 block font-medium">3 Columns</Text>
                        <Grid columns={3} gap="md">
                          <div className="bg-green-100 p-4 rounded-lg text-center">
                            <Text className="text-green-700">Column 1</Text>
                          </div>
                          <div className="bg-green-100 p-4 rounded-lg text-center">
                            <Text className="text-green-700">Column 2</Text>
                          </div>
                          <div className="bg-green-100 p-4 rounded-lg text-center">
                            <Text className="text-green-700">Column 3</Text>
                          </div>
                        </Grid>
                      </div>
                      
                      <div>
                        <Text variant="caption" className="mb-4 block font-medium">4 Columns</Text>
                        <Grid columns={4} gap="md">
                          <div className="bg-purple-100 p-4 rounded-lg text-center">
                            <Text className="text-purple-700">Col 1</Text>
                          </div>
                          <div className="bg-purple-100 p-4 rounded-lg text-center">
                            <Text className="text-purple-700">Col 2</Text>
                          </div>
                          <div className="bg-purple-100 p-4 rounded-lg text-center">
                            <Text className="text-purple-700">Col 3</Text>
                          </div>
                          <div className="bg-purple-100 p-4 rounded-lg text-center">
                            <Text className="text-purple-700">Col 4</Text>
                          </div>
                        </Grid>
                      </div>
                    </div>
                  </Stack>
                </Card>

                {/* Responsive Grids */}
                <Card className="p-8">
                  <Stack spacing="lg">
                    <Heading level="subtitle">Responsive Grid</Heading>
                    <Text>This grid adapts: 1 column → 2 columns → 3 columns</Text>
                    
                    <Grid columns="auto" gap="md">
                      <MetricCard
                        title="Total Vehicles"
                        value="24"
                        icon={<Car className="w-5 h-5" />}
                      />
                      <MetricCard
                        title="Active Users"
                        value="1,234"
                        icon={<Users className="w-5 h-5" />}
                      />
                      <MetricCard
                        title="Revenue"
                        value="$12,345"
                        icon={<DollarSign className="w-5 h-5" />}
                      />
                      <MetricCard
                        title="Growth"
                        value="+23%"
                        icon={<TrendingUp className="w-5 h-5" />}
                      />
                      <MetricCard
                        title="Efficiency"
                        value="98%"
                        icon={<TrendingUp className="w-5 h-5" />}
                      />
                      <MetricCard
                        title="Satisfaction"
                        value="4.9/5"
                        icon={<Users className="w-5 h-5" />}
                      />
                    </Grid>
                  </Stack>
                </Card>

                {/* Auto-fit Grid */}
                <Card className="p-8">
                  <Stack spacing="lg">
                    <Heading level="subtitle">Auto-fit Grid</Heading>
                    <Text>Automatically fits items based on available space (min 250px per item)</Text>
                    
                    <Grid columns="fit" gap="md">
                      {Array.from({ length: 8 }, (_, i) => (
                        <div key={i} className="bg-orange-100 p-6 rounded-lg text-center">
                          <Text className="text-orange-700 font-medium">Item {i + 1}</Text>
                        </div>
                      ))}
                    </Grid>
                  </Stack>
                </Card>
              </Stack>
            </Stack>
          </Container>
        </Section>

        {/* Flexbox System */}
        <Section spacing="xl" background="white">
          <Container size="xl">
            <Stack spacing="xl">
              <div className="text-center">
                <Heading level="title">Flexbox System</Heading>
                <Text className="mt-4 text-xl text-gray-600">
                  Flexible layouts for alignment and distribution
                </Text>
              </div>

              <Stack spacing="lg">
                {/* Flex Direction */}
                <Card className="p-8">
                  <Stack spacing="lg">
                    <Heading level="subtitle">Flex Direction & Alignment</Heading>
                    
                    <div className="space-y-8">
                      <div>
                        <Text variant="caption" className="mb-4 block font-medium">Row (Horizontal)</Text>
                        <Flex direction="row" justify="between" align="center" gap="md" className="bg-blue-50 p-4 rounded-lg">
                          <div className="bg-blue-200 p-3 rounded">Item 1</div>
                          <div className="bg-blue-200 p-3 rounded">Item 2</div>
                          <div className="bg-blue-200 p-3 rounded">Item 3</div>
                        </Flex>
                      </div>
                      
                      <div>
                        <Text variant="caption" className="mb-4 block font-medium">Column (Vertical)</Text>
                        <Flex direction="col" align="center" gap="md" className="bg-green-50 p-4 rounded-lg">
                          <div className="bg-green-200 p-3 rounded">Item 1</div>
                          <div className="bg-green-200 p-3 rounded">Item 2</div>
                          <div className="bg-green-200 p-3 rounded">Item 3</div>
                        </Flex>
                      </div>
                      
                      <div>
                        <Text variant="caption" className="mb-4 block font-medium">Responsive (Column → Row)</Text>
                        <Flex direction="row" responsive justify="between" align="center" gap="md" className="bg-purple-50 p-4 rounded-lg">
                          <div className="bg-purple-200 p-3 rounded">Item 1</div>
                          <div className="bg-purple-200 p-3 rounded">Item 2</div>
                          <div className="bg-purple-200 p-3 rounded">Item 3</div>
                        </Flex>
                      </div>
                    </div>
                  </Stack>
                </Card>

                {/* Flex Alignment */}
                <Card className="p-8">
                  <Stack spacing="lg">
                    <Heading level="subtitle">Justify Content</Heading>
                    
                    <div className="space-y-6">
                      <div>
                        <Text variant="caption" className="mb-2 block font-medium">Start</Text>
                        <Flex justify="start" gap="sm" className="bg-gray-50 p-4 rounded-lg">
                          <div className="bg-gray-300 p-2 rounded">A</div>
                          <div className="bg-gray-300 p-2 rounded">B</div>
                          <div className="bg-gray-300 p-2 rounded">C</div>
                        </Flex>
                      </div>
                      
                      <div>
                        <Text variant="caption" className="mb-2 block font-medium">Center</Text>
                        <Flex justify="center" gap="sm" className="bg-gray-50 p-4 rounded-lg">
                          <div className="bg-gray-300 p-2 rounded">A</div>
                          <div className="bg-gray-300 p-2 rounded">B</div>
                          <div className="bg-gray-300 p-2 rounded">C</div>
                        </Flex>
                      </div>
                      
                      <div>
                        <Text variant="caption" className="mb-2 block font-medium">Between</Text>
                        <Flex justify="between" gap="sm" className="bg-gray-50 p-4 rounded-lg">
                          <div className="bg-gray-300 p-2 rounded">A</div>
                          <div className="bg-gray-300 p-2 rounded">B</div>
                          <div className="bg-gray-300 p-2 rounded">C</div>
                        </Flex>
                      </div>
                      
                      <div>
                        <Text variant="caption" className="mb-2 block font-medium">Around</Text>
                        <Flex justify="around" gap="sm" className="bg-gray-50 p-4 rounded-lg">
                          <div className="bg-gray-300 p-2 rounded">A</div>
                          <div className="bg-gray-300 p-2 rounded">B</div>
                          <div className="bg-gray-300 p-2 rounded">C</div>
                        </Flex>
                      </div>
                    </div>
                  </Stack>
                </Card>
              </Stack>
            </Stack>
          </Container>
        </Section>

        {/* Stack System */}
        <Section spacing="xl" background="gray">
          <Container size="xl">
            <Stack spacing="xl">
              <div className="text-center">
                <Heading level="title">Stack System</Heading>
                <Text className="mt-4 text-xl text-gray-600">
                  Consistent vertical spacing between elements
                </Text>
              </div>

              <Card className="p-8">
                <Grid columns={2} gap="xl">
                  <Stack spacing="lg">
                    <Heading level="subtitle">Different Stack Spacings</Heading>
                    
                    <div className="space-y-8">
                      <div>
                        <Text variant="caption" className="mb-4 block font-medium">Tight Spacing</Text>
                        <Stack spacing="xs" className="bg-blue-50 p-4 rounded-lg">
                          <div className="bg-blue-200 p-2 rounded">Item 1</div>
                          <div className="bg-blue-200 p-2 rounded">Item 2</div>
                          <div className="bg-blue-200 p-2 rounded">Item 3</div>
                        </Stack>
                      </div>
                      
                      <div>
                        <Text variant="caption" className="mb-4 block font-medium">Normal Spacing</Text>
                        <Stack spacing="md" className="bg-green-50 p-4 rounded-lg">
                          <div className="bg-green-200 p-2 rounded">Item 1</div>
                          <div className="bg-green-200 p-2 rounded">Item 2</div>
                          <div className="bg-green-200 p-2 rounded">Item 3</div>
                        </Stack>
                      </div>
                    </div>
                  </Stack>
                  
                  <Stack spacing="lg">
                    <Heading level="subtitle">Stack Alignment</Heading>
                    
                    <div className="space-y-8">
                      <div>
                        <Text variant="caption" className="mb-4 block font-medium">Center Aligned</Text>
                        <Stack spacing="md" align="center" className="bg-purple-50 p-4 rounded-lg">
                          <div className="bg-purple-200 p-2 rounded w-16">A</div>
                          <div className="bg-purple-200 p-2 rounded w-24">Item B</div>
                          <div className="bg-purple-200 p-2 rounded w-20">C</div>
                        </Stack>
                      </div>
                      
                      <div>
                        <Text variant="caption" className="mb-4 block font-medium">End Aligned</Text>
                        <Stack spacing="md" align="end" className="bg-orange-50 p-4 rounded-lg">
                          <div className="bg-orange-200 p-2 rounded w-16">A</div>
                          <div className="bg-orange-200 p-2 rounded w-24">Item B</div>
                          <div className="bg-orange-200 p-2 rounded w-20">C</div>
                        </Stack>
                      </div>
                    </div>
                  </Stack>
                </Grid>
              </Card>
            </Stack>
          </Container>
        </Section>

        {/* Layout Patterns */}
        <Section spacing="xl" background="white">
          <Container size="xl">
            <Stack spacing="xl">
              <div className="text-center">
                <Heading level="title">Layout Patterns</Heading>
                <Text className="mt-4 text-xl text-gray-600">
                  Pre-built patterns for common layout needs
                </Text>
              </div>

              <Stack spacing="lg">
                {/* Sidebar Layout */}
                <Card className="p-8">
                  <Stack spacing="lg">
                    <Heading level="subtitle">Sidebar Layout</Heading>
                    <Text>Responsive sidebar that collapses on mobile</Text>
                    
                    <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden">
                      <SidebarLayout
                        sidebar={
                          <div className="bg-gray-100 p-4 h-64">
                            <Text className="font-medium mb-4">Sidebar Content</Text>
                            <Stack spacing="sm">
                              <div className="bg-gray-200 p-2 rounded">Nav Item 1</div>
                              <div className="bg-gray-200 p-2 rounded">Nav Item 2</div>
                              <div className="bg-gray-200 p-2 rounded">Nav Item 3</div>
                            </Stack>
                          </div>
                        }
                        className="p-4"
                      >
                        <div className="bg-blue-50 p-6 rounded-lg h-64">
                          <Text className="font-medium">Main Content Area</Text>
                          <Text className="mt-2 text-gray-600">
                            This is the main content area that takes up the remaining space.
                          </Text>
                        </div>
                      </SidebarLayout>
                    </div>
                  </Stack>
                </Card>

                {/* Aspect Ratios */}
                <Card className="p-8">
                  <Stack spacing="lg">
                    <Heading level="subtitle">Aspect Ratios</Heading>
                    <Text>Maintain consistent aspect ratios across different content</Text>
                    
                    <Grid columns={3} gap="md">
                      <div>
                        <Text variant="caption" className="mb-2 block font-medium">Square (1:1)</Text>
                        <AspectRatio ratio="square" className="bg-blue-100 rounded-lg flex items-center justify-center">
                          <Text className="text-blue-700">Square</Text>
                        </AspectRatio>
                      </div>
                      
                      <div>
                        <Text variant="caption" className="mb-2 block font-medium">Video (16:9)</Text>
                        <AspectRatio ratio="video" className="bg-green-100 rounded-lg flex items-center justify-center">
                          <Text className="text-green-700">Video</Text>
                        </AspectRatio>
                      </div>
                      
                      <div>
                        <Text variant="caption" className="mb-2 block font-medium">Photo (4:3)</Text>
                        <AspectRatio ratio="photo" className="bg-purple-100 rounded-lg flex items-center justify-center">
                          <Text className="text-purple-700">Photo</Text>
                        </AspectRatio>
                      </div>
                    </Grid>
                  </Stack>
                </Card>
              </Stack>
            </Stack>
          </Container>
        </Section>

        {/* Footer */}
        <Section spacing="lg" background="gray">
          <Container size="lg">
            <div className="text-center">
              <Text variant="caption">
                Layout Design System - Built with CSS Grid, Flexbox, and Tailwind CSS
              </Text>
            </div>
          </Container>
        </Section>
      </div>
    </>
  )
}
