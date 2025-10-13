/**
 * Responsive Design System Showcase
 * 
 * Built using the mandatory MotoMind Design System foundation
 * Documents breakpoints, mobile-first approach, and responsive patterns
 */

import React from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  Grid,
  Heading,
  Text,
  Card
} from '@/components/design-system'
import { Smartphone, Tablet, Monitor, Maximize2 } from 'lucide-react'

export default function ResponsiveSystemPage() {
  const breakpoints = [
    { name: 'sm', size: '640px', device: 'Mobile landscape, small tablets', icon: Smartphone },
    { name: 'md', size: '768px', device: 'Tablets, large phones', icon: Tablet },
    { name: 'lg', size: '1024px', device: 'Laptops, small desktops', icon: Monitor },
    { name: 'xl', size: '1280px', device: 'Desktops', icon: Monitor },
    { name: '2xl', size: '1536px', device: 'Large desktops, ultrawide', icon: Maximize2 },
  ]

  const containerSizes = [
    { name: 'sm', maxWidth: '640px', use: 'Narrow content, forms' },
    { name: 'md', maxWidth: '768px', use: 'Articles, reading (DEFAULT)' },
    { name: 'lg', maxWidth: '1024px', use: 'Dashboards, data tables' },
    { name: 'xl', maxWidth: '1280px', use: 'Full-width layouts' },
    { name: 'full', maxWidth: '100%', use: 'Edge-to-edge content' },
  ]

  return (
    <>
      <Head>
        <title>Responsive Design System - MotoMind Design System</title>
        <meta name="description" content="Breakpoints, mobile-first patterns, and responsive layout guidelines" />
      </Head>

      <div className="min-h-screen bg-white">
        <Container size="md" useCase="articles">
          <Section spacing="xl">
            <Stack spacing="xl">
              
              {/* Hero Section */}
              <div className="text-center">
                <Maximize2 className="w-16 h-16 mx-auto mb-6 text-blue-600" />
                <Heading level="hero">Responsive Design</Heading>
                <Text size="xl" className="mt-6 text-gray-600 max-w-3xl mx-auto">
                  Mobile-first approach ensures great experiences on all devices.
                  Our breakpoint system adapts layouts seamlessly.
                </Text>
              </div>

              {/* Key Principles */}
              <Grid columns="auto" gap="md">
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Smartphone className="w-8 h-8 mx-auto text-blue-600" />
                    <Heading level="subtitle">Mobile First</Heading>
                    <Text size="sm">
                      Start with mobile, progressively enhance for larger screens
                    </Text>
                  </Stack>
                </Card>
                
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Tablet className="w-8 h-8 mx-auto text-green-600" />
                    <Heading level="subtitle">Content Over Chrome</Heading>
                    <Text size="sm">
                      Optimize for content visibility, reduce UI chrome on mobile
                    </Text>
                  </Stack>
                </Card>
                
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Monitor className="w-8 h-8 mx-auto text-purple-600" />
                    <Heading level="subtitle">Fluid Layouts</Heading>
                    <Text size="sm">
                      Use relative units and flexbox for smooth adaptation
                    </Text>
                  </Stack>
                </Card>
              </Grid>

              {/* Breakpoints Scale */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Breakpoint Scale</Heading>
                  <Text>
                    Five breakpoints cover all devices. Mobile-first means base styles apply to all screens,
                    then use breakpoints to enhance for larger devices.
                  </Text>
                  
                  <Stack spacing="md">
                    {breakpoints.map((bp) => {
                      const IconComponent = bp.icon
                      return (
                        <div key={bp.name} className="flex items-center gap-6 p-4 rounded-lg border hover:bg-gray-50">
                          <IconComponent className="w-8 h-8 text-gray-700" />
                          <div className="flex-1">
                            <Text className="font-semibold">{bp.name} ({bp.size})</Text>
                            <Text size="sm" className="text-gray-600">{bp.device}</Text>
                          </div>
                          <code className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                            {bp.name}:
                          </code>
                        </div>
                      )
                    })}
                  </Stack>

                  <div className="bg-blue-50 border border-blue-600 p-4 rounded-lg">
                    <Text className="font-semibold mb-2 text-blue-900">Mobile-First Usage</Text>
                    <div className="bg-white p-3 rounded font-mono text-sm">
                      {`// Base styles = mobile (< 640px)
className="text-sm p-2"

// Add tablet styles
className="text-sm md:text-base p-2 md:p-4"

// Add desktop styles  
className="text-sm md:text-base lg:text-lg p-2 md:p-4 lg:p-6"`}
                    </div>
                  </div>
                </Stack>
              </Card>

              {/* Container Sizes */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Container Sizes</Heading>
                  <Text>
                    Container component enforces max-widths for optimal reading and usability.
                    Use size="md" (768px) as default for content.
                  </Text>
                  
                  <Stack spacing="md">
                    {containerSizes.map((size) => (
                      <div key={size.name} className="border rounded-lg p-4">
                        <Grid columns={3} gap="md">
                          <div>
                            <Text className="font-semibold">{size.name}</Text>
                            <Text size="sm" className="text-gray-600">{size.maxWidth}</Text>
                          </div>
                          <Text size="sm" className="text-gray-600">{size.use}</Text>
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded justify-self-end">
                            size="{size.name}"
                          </code>
                        </Grid>
                      </div>
                    ))}
                  </Stack>

                  <div className="bg-white p-6 rounded-lg border-2">
                    <Text className="font-semibold mb-3">Example Usage</Text>
                    <div className="bg-gray-900 p-4 rounded overflow-x-auto">
                      <pre className="text-sm text-gray-100 font-mono">
<code>{`import { Container } from '@/components/design-system'

// Default for articles/content
<Container size="md" useCase="articles">
  <YourContent />
</Container>

// Wide layouts for data tables
<Container 
  size="lg" 
  useCase="data_tables"
  override={{
    reason: "Data table needs horizontal space",
    approvedBy: "UX Team"
  }}
>
  <DataTable />
</Container>`}</code>
                      </pre>
                    </div>
                  </div>
                </Stack>
              </Card>

              {/* Responsive Patterns */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Common Responsive Patterns</Heading>
                  <Text>
                    Proven patterns for adapting layouts across breakpoints.
                  </Text>
                  
                  <Stack spacing="lg">
                    {/* Stack to Grid */}
                    <div>
                      <Text className="font-semibold mb-3">Stack → Grid (Mobile to Desktop)</Text>
                      <Text size="sm" className="text-gray-600 mb-3">
                        Vertical stack on mobile, grid on larger screens
                      </Text>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <Grid columns={1} gap="sm" className="md:grid-cols-2 lg:grid-cols-3">
                          <div className="bg-blue-100 p-4 rounded text-center">Item 1</div>
                          <div className="bg-blue-100 p-4 rounded text-center">Item 2</div>
                          <div className="bg-blue-100 p-4 rounded text-center">Item 3</div>
                        </Grid>
                      </div>
                      <div className="mt-2 bg-gray-900 p-3 rounded overflow-x-auto">
                        <code className="text-sm text-gray-100 font-mono">
                          {`<Grid columns={1} className="md:grid-cols-2 lg:grid-cols-3">`}
                        </code>
                      </div>
                    </div>

                    {/* Responsive Typography */}
                    <div>
                      <Text className="font-semibold mb-3">Responsive Typography</Text>
                      <Text size="sm" className="text-gray-600 mb-3">
                        Smaller text on mobile, larger on desktop
                      </Text>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <Text className="text-sm md:text-base lg:text-lg">
                          This text scales: 14px → 16px → 18px
                        </Text>
                      </div>
                      <div className="mt-2 bg-gray-900 p-3 rounded overflow-x-auto">
                        <code className="text-sm text-gray-100 font-mono">
                          {`className="text-sm md:text-base lg:text-lg"`}
                        </code>
                      </div>
                    </div>

                    {/* Responsive Padding */}
                    <div>
                      <Text className="font-semibold mb-3">Responsive Spacing</Text>
                      <Text size="sm" className="text-gray-600 mb-3">
                        Tighter spacing on mobile, more room on desktop
                      </Text>
                      <div className="border rounded-lg bg-blue-100 p-4 md:p-6 lg:p-8">
                        <Text>Padding: 16px → 24px → 32px</Text>
                      </div>
                      <div className="mt-2 bg-gray-900 p-3 rounded overflow-x-auto">
                        <code className="text-sm text-gray-100 font-mono">
                          {`className="p-4 md:p-6 lg:p-8"`}
                        </code>
                      </div>
                    </div>

                    {/* Hide/Show Elements */}
                    <div>
                      <Text className="font-semibold mb-3">Conditional Visibility</Text>
                      <Text size="sm" className="text-gray-600 mb-3">
                        Show/hide elements based on screen size
                      </Text>
                      <Stack spacing="sm">
                        <div className="border rounded-lg p-4 bg-blue-50 md:hidden">
                          <Text className="text-blue-900">Mobile only (hidden on md+)</Text>
                        </div>
                        <div className="hidden md:block border rounded-lg p-4 bg-green-50">
                          <Text className="text-green-900">Desktop only (hidden on mobile)</Text>
                        </div>
                      </Stack>
                      <div className="mt-2 bg-gray-900 p-3 rounded overflow-x-auto">
                        <code className="text-sm text-gray-100 font-mono">
                          {`className="md:hidden" // Hide on tablet+
className="hidden md:block" // Show on tablet+`}
                        </code>
                      </div>
                    </div>
                  </Stack>
                </Stack>
              </Card>

              {/* Mobile-First Rules */}
              <Card className="p-8 bg-blue-50 border-2 border-blue-600">
                <Stack spacing="lg">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-8 h-8 text-blue-600" />
                    <Heading level="title" className="text-blue-900">Mobile-First Rules</Heading>
                  </div>
                  <Text className="text-blue-900">
                    Always start with mobile styles, then enhance for larger screens.
                  </Text>
                  
                  <div className="bg-white p-6 rounded-lg border-2 border-blue-600">
                    <Stack spacing="sm">
                      <Text className="font-semibold">✅ Mobile-First (Correct)</Text>
                      <div className="bg-gray-900 p-3 rounded">
                        <code className="text-sm text-green-400 font-mono">
                          {`// Base = mobile, add tablet/desktop
className="text-sm md:text-base lg:text-lg"`}
                        </code>
                      </div>
                      
                      <Text className="font-semibold mt-4">❌ Desktop-First (Wrong)</Text>
                      <div className="bg-gray-900 p-3 rounded">
                        <code className="text-sm text-red-400 font-mono">
                          {`// Base = desktop, override for mobile (BAD)
className="text-lg md:text-base sm:text-sm"`}
                        </code>
                      </div>
                    </Stack>
                  </div>
                </Stack>
              </Card>

              {/* Touch Targets */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Touch Target Sizes</Heading>
                  <Text>
                    Mobile users need larger touch targets. Minimum 44px for accessibility.
                  </Text>
                  
                  <Grid columns={3} gap="md">
                    <div className="border rounded-lg p-4 text-center">
                      <button className="w-10 h-10 bg-red-100 border-2 border-red-600 rounded">
                        <Text size="sm" className="text-red-900">40px</Text>
                      </button>
                      <Text size="sm" className="mt-2 text-red-900 font-semibold">Too Small</Text>
                    </div>
                    
                    <div className="border rounded-lg p-4 text-center">
                      <button className="w-11 h-11 bg-green-100 border-2 border-green-600 rounded">
                        <Text size="sm" className="text-green-900">44px</Text>
                      </button>
                      <Text size="sm" className="mt-2 text-green-900 font-semibold">Minimum</Text>
                    </div>
                    
                    <div className="border rounded-lg p-4 text-center">
                      <button className="w-12 h-12 bg-blue-100 border-2 border-blue-600 rounded">
                        <Text size="sm" className="text-blue-900">48px</Text>
                      </button>
                      <Text size="sm" className="mt-2 text-blue-900 font-semibold">Optimal</Text>
                    </div>
                  </Grid>
                </Stack>
              </Card>

              {/* Usage Rules */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Usage Rules</Heading>
                  <Text>
                    Guidelines for responsive design implementation.
                  </Text>
                  
                  <Grid columns={2} gap="lg">
                    <div className="border-2 border-green-700 bg-green-50 p-6 rounded-lg">
                      <Stack spacing="sm">
                        <Text className="font-bold text-gray-900">✅ Do</Text>
                        <Text size="sm" className="text-gray-900">✓ Start with mobile styles first</Text>
                        <Text size="sm" className="text-gray-900">✓ Use Container component for max-width</Text>
                        <Text size="sm" className="text-gray-900">✓ Test on real devices, not just browser</Text>
                        <Text size="sm" className="text-gray-900">✓ Use touch-friendly sizes (44px min)</Text>
                        <Text size="sm" className="text-gray-900">✓ Progressively enhance for larger screens</Text>
                      </Stack>
                    </div>

                    <div className="border-2 border-red-700 bg-red-50 p-6 rounded-lg">
                      <Stack spacing="sm">
                        <Text className="font-bold text-gray-900">✕ Don't</Text>
                        <Text size="sm" className="text-gray-900">✕ Start with desktop-first approach</Text>
                        <Text size="sm" className="text-gray-900">✕ Use fixed pixel widths for layouts</Text>
                        <Text size="sm" className="text-gray-900">✕ Rely only on browser responsive mode</Text>
                        <Text size="sm" className="text-gray-900">✕ Use small touch targets (under 44px)</Text>
                        <Text size="sm" className="text-gray-900">✕ Hide important content on mobile</Text>
                      </Stack>
                    </div>
                  </Grid>
                </Stack>
              </Card>

            </Stack>
          </Section>
        </Container>
      </div>
    </>
  )
}
