/**
 * Design System Index
 * 
 * Central hub for all design system documentation
 */

import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import {
  Container,
  Section,
  Stack,
  Grid,
  Heading,
  Text,
  Card
} from '@/components/design-system'
import { 
  Palette,
  Type,
  Ruler,
  Layout,
  Smile,
  Zap,
  Maximize2,
  Layers,
  CheckCircle2
} from 'lucide-react'

export default function DesignSystemIndexPage() {
  const systems = [
    {
      title: 'Color System',
      description: 'Semantic color tokens with automatic contrast and accessibility',
      href: '/color-system',
      icon: Palette,
      status: 'complete',
      topics: ['shadcn tokens', 'ColoredBox components', 'WCAG compliance', 'Dark mode']
    },
    {
      title: 'Typography System',
      description: 'Fluid responsive typography with optimal reading experience',
      href: '/typography-system',
      icon: Type,
      status: 'complete',
      topics: ['Fluid scaling', 'Heading levels', 'Text sizes', 'Line height']
    },
    {
      title: 'Spacing System',
      description: '4px-based scale for consistent spacing and rhythm',
      href: '/spacing-system',
      icon: Ruler,
      status: 'complete',
      topics: ['4px base unit', '14 levels', 'Named tokens', 'Stack/Grid']
    },
    {
      title: 'Surface System',
      description: 'Elevation, borders, and shadows for visual hierarchy',
      href: '/surfaces-system',
      icon: Layers,
      status: 'complete',
      topics: ['8 elevation levels', 'Border variants', 'Rounded corners', 'Interactive states']
    },
    {
      title: 'Icons System',
      description: 'Lucide React icon library with consistent sizing',
      href: '/icons-system',
      icon: Smile,
      status: 'complete',
      topics: ['Lucide React', 'Size scale', 'Semantic icons', 'Accessibility']
    },
    {
      title: 'Motion & Animation',
      description: 'Animation tokens, timing, and performance guidelines',
      href: '/motion-system',
      icon: Zap,
      status: 'complete',
      topics: ['Duration scale', 'Easing functions', 'Reduced motion', 'Performance']
    },
    {
      title: 'Responsive Design',
      description: 'Breakpoints, mobile-first patterns, and adaptive layouts',
      href: '/responsive-system',
      icon: Maximize2,
      status: 'complete',
      topics: ['Breakpoints', 'Mobile-first', 'Touch targets', 'Container sizes']
    },
    {
      title: 'Layout System',
      description: 'Container, Grid, Stack, and Section components',
      href: '/layout-system',
      icon: Layout,
      status: 'documented',
      topics: ['Container', 'Grid', 'Stack', 'Section', 'Mandatory usage']
    },
  ]

  return (
    <>
      <Head>
        <title>Design System Index - MotoMind</title>
        <meta name="description" content="Complete design system documentation and guidelines" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <Container size="lg" useCase="data_tables">
          <Section spacing="xl">
            <Stack spacing="xl">
              
              {/* Hero */}
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="w-4 h-4" />
                  <Text className="text-sm font-medium">Complete & Documented</Text>
                </div>
                <Heading level="hero">MotoMind Design System</Heading>
                <Text size="xl" className="mt-6 text-gray-600 max-w-3xl mx-auto">
                  Comprehensive, accessible, and battle-tested design foundations.
                  Built with shadcn/ui, Tailwind CSS, and React.
                </Text>
              </div>

              {/* System Cards */}
              <Grid columns={2} gap="lg" className="lg:grid-cols-3">
                {systems.map((system) => {
                  const IconComponent = system.icon
                  return (
                    <Link key={system.href} href={system.href}>
                      <Card className="p-6 h-full hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
                        <Stack spacing="md">
                          <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <IconComponent className="w-6 h-6 text-primary" />
                            </div>
                            {system.status === 'complete' && (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          
                          <div>
                            <Heading level="subtitle" className="mb-2">{system.title}</Heading>
                            <Text size="sm" className="text-gray-600">
                              {system.description}
                            </Text>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {system.topics.map((topic) => (
                              <span 
                                key={topic}
                                className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-700"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </Stack>
                      </Card>
                    </Link>
                  )
                })}
              </Grid>

              {/* Key Features */}
              <Card className="p-8 bg-blue-50 border-2 border-blue-600">
                <Stack spacing="lg">
                  <Heading level="title">What Makes It Special</Heading>
                  
                  <Grid columns={2} gap="lg">
                    <Stack spacing="sm">
                      <Text className="font-semibold">✅ Accessibility Built-In</Text>
                      <Text size="sm" className="text-gray-700">
                        ColoredBox components ensure WCAG compliance automatically.
                        Impossible to create poor contrast.
                      </Text>
                    </Stack>

                    <Stack spacing="sm">
                      <Text className="font-semibold">✅ Mobile-First</Text>
                      <Text size="sm" className="text-gray-700">
                        All components start mobile, progressively enhance.
                        Touch-friendly sizes by default.
                      </Text>
                    </Stack>

                    <Stack spacing="sm">
                      <Text className="font-semibold">✅ Consistent Tokens</Text>
                      <Text size="sm" className="text-gray-700">
                        4px spacing, semantic colors, standardized sizes.
                        Visual harmony across the entire app.
                      </Text>
                    </Stack>

                    <Stack spacing="sm">
                      <Text className="font-semibold">✅ Performant</Text>
                      <Text size="sm" className="text-gray-700">
                        Animations use GPU-accelerated properties.
                        60fps guaranteed, respects reduced motion.
                      </Text>
                    </Stack>

                    <Stack spacing="sm">
                      <Text className="font-semibold">✅ Type-Safe</Text>
                      <Text size="sm" className="text-gray-700">
                        Full TypeScript support with intelligent autocomplete.
                        Catch errors at compile time.
                      </Text>
                    </Stack>

                    <Stack spacing="sm">
                      <Text className="font-semibold">✅ Enforced</Text>
                      <Text size="sm" className="text-gray-700">
                        ESLint rules prevent accessibility violations.
                        Mandatory layout system ensures consistency.
                      </Text>
                    </Stack>
                  </Grid>
                </Stack>
              </Card>

              {/* Quick Start */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Quick Start</Heading>
                  
                  <div className="bg-gray-900 p-6 rounded-lg overflow-x-auto">
                    <pre className="text-sm text-gray-100 font-mono">
<code>{`import {
  Container,
  Section,
  Stack,
  Grid,
  Card,
  Heading,
  Text,
  ColoredBox,
  DestructiveBox
} from '@/components/design-system'

export default function MyPage() {
  return (
    <Container size="md" useCase="articles">
      <Section spacing="xl">
        <Stack spacing="xl">
          <Heading level="hero">Page Title</Heading>
          <Text size="xl">Description text</Text>
          
          <Grid columns={2} gap="lg">
            <Card className="p-6">
              <Heading level="subtitle">Card 1</Heading>
              <Text>Content</Text>
            </Card>
            
            <DestructiveBox className="p-6 rounded-lg">
              <Heading level="subtitle">Error Alert</Heading>
              <Text>Automatic white text on red!</Text>
            </DestructiveBox>
          </Grid>
        </Stack>
      </Section>
    </Container>
  )
}`}</code>
                    </pre>
                  </div>
                </Stack>
              </Card>

              {/* Documentation */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Documentation</Heading>
                  
                  <Grid columns={2} gap="md">
                    <div>
                      <Text className="font-semibold mb-2">Core Guidelines</Text>
                      <Stack spacing="xs">
                        <Text size="sm" className="text-gray-700">• /lib/design-system/COLOR_RULES.md</Text>
                        <Text size="sm" className="text-gray-700">• /lib/design-system/ACCESSIBILITY_ENFORCEMENT.md</Text>
                        <Text size="sm" className="text-gray-700">• /ACCESSIBILITY_BUILT_IN.md</Text>
                      </Stack>
                    </div>

                    <div>
                      <Text className="font-semibold mb-2">Component Source</Text>
                      <Stack spacing="xs">
                        <Text size="sm" className="text-gray-700">• /components/design-system/</Text>
                        <Text size="sm" className="text-gray-700">• /lib/design-system/tokens.ts</Text>
                        <Text size="sm" className="text-gray-700">• /lib/design-system/colors.ts</Text>
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
