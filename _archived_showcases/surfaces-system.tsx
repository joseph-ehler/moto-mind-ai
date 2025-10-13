/**
 * Comprehensive Surface System Showcase
 * Demo built USING surfaces throughout
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
  Button
} from '@/components/design-system'
import {
  Surface,
  Card,
  CardHeader,
  CardContent,
  CardFooter
} from '@/components/design-system'

export default function SurfacesSystemPage() {
  return (
    <>
      <Head>
        <title>Surface System</title>
        <meta name="description" content="Comprehensive surface system with elevation" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <Container size="md" useCase="articles">
          <Section spacing="xl">
            <Stack spacing="xl">
              
              {/* Hero */}
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 text-primary">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <Text className="text-sm font-medium">Design System</Text>
                </div>
                <Heading level="hero" className="mb-6">Surface System</Heading>
                <Text className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Accessible containers with elevation, borders, and shadows that create clear visual hierarchy.
                </Text>
              </div>

              {/* What is a Surface - Card */}
              <Card>
                <CardHeader>
                  <Heading level="title">What is a Surface?</Heading>
                  <Text className="text-muted-foreground">
                    Accessible containers with proper contrast
                  </Text>
                </CardHeader>
                <CardContent>
                  <Stack spacing="sm">
                    <Text>
                      A surface is a container with:
                    </Text>
                    <Text className="ml-4">• <strong>Elevation</strong> - Shadow depth for hierarchy</Text>
                    <Text className="ml-4">• <strong>Border</strong> - Default for contrast and accessibility</Text>
                    <Text className="ml-4">• <strong>Rounded corners</strong> - Modern, friendly appearance</Text>
                    <Text className="ml-4">• <strong>Background</strong> - Distinct from page background</Text>
                  </Stack>
                </CardContent>
              </Card>

              {/* Elevation Levels */}
              <Card>
                <CardHeader>
                  <Stack spacing="sm">
                    <Heading level="title">Elevation Levels</Heading>
                    <Text className="text-muted-foreground">
                      8 standard levels creating depth through shadows
                    </Text>
                  </Stack>
                </CardHeader>
                <CardContent>
                  <Grid columns={2} gap="lg">
                    
                    <Surface elevation={0} border="default" className="p-6 hover:scale-[1.02] transition-transform">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-600">0</div>
                        <div className="flex-1">
                          <Text className="font-semibold mb-1">Page Background</Text>
                          <Text className="text-sm text-muted-foreground">
                            No shadow • Inline content
                          </Text>
                        </div>
                      </div>
                    </Surface>

                    <Surface elevation={1} className="p-6 hover:scale-[1.02] transition-transform">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-600">1</div>
                        <div className="flex-1">
                          <Text className="font-semibold mb-1">Cards</Text>
                          <Text className="text-sm text-muted-foreground">
                            Most common • Standard elevation
                          </Text>
                        </div>
                      </div>
                    </Surface>

                    <Surface elevation={2} className="p-6 hover:scale-[1.02] transition-transform">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center font-bold text-purple-600">2</div>
                        <div className="flex-1">
                          <Text className="font-semibold mb-1">Raised Cards</Text>
                          <Text className="text-sm text-muted-foreground">
                            Selected states • Emphasis
                          </Text>
                        </div>
                      </div>
                    </Surface>

                    <Surface elevation={3} className="p-6 hover:scale-[1.02] transition-transform">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center font-bold text-green-600">3</div>
                        <div className="flex-1">
                          <Text className="font-semibold mb-1">Menus</Text>
                          <Text className="text-sm text-muted-foreground">
                            Dropdowns • Popovers • Context
                          </Text>
                        </div>
                      </div>
                    </Surface>

                    <Surface elevation={4} className="p-6 hover:scale-[1.02] transition-transform">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center font-bold text-orange-600">4</div>
                        <div className="flex-1">
                          <Text className="font-semibold mb-1">App Bars</Text>
                          <Text className="text-sm text-muted-foreground">
                            Navigation • Toolbars • Headers
                          </Text>
                        </div>
                      </div>
                    </Surface>

                    <Surface elevation={8} className="p-6 hover:scale-[1.02] transition-transform">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center font-bold text-pink-600">8</div>
                        <div className="flex-1">
                          <Text className="font-semibold mb-1">Navigation</Text>
                          <Text className="text-sm text-muted-foreground">
                            Drawers • Side sheets • Bottom nav
                          </Text>
                        </div>
                      </div>
                    </Surface>

                    <Surface elevation={16} className="p-6 hover:scale-[1.02] transition-transform">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">16</div>
                        <div className="flex-1">
                          <Text className="font-semibold mb-1">Modals</Text>
                          <Text className="text-sm text-muted-foreground">
                            Dialogs • Overlays • Focus states
                          </Text>
                        </div>
                      </div>
                    </Surface>

                    <Surface elevation={24} className="p-6 hover:scale-[1.02] transition-transform">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center font-bold text-red-600">24</div>
                        <div className="flex-1">
                          <Text className="font-semibold mb-1">Tooltips</Text>
                          <Text className="text-sm text-muted-foreground">
                            Highest • Always on top
                          </Text>
                        </div>
                      </div>
                    </Surface>

                  </Grid>
                </CardContent>
              </Card>

              {/* Border Variants */}
              <Card>
                <CardHeader>
                  <Stack spacing="sm">
                    <Heading level="title">Border Variants</Heading>
                    <Text className="text-muted-foreground">
                      Borders are DEFAULT for accessibility • Remove only when needed
                    </Text>
                  </Stack>
                </CardHeader>
                <CardContent>
                  <Grid columns={3} gap="lg">
                    <Surface 
                      elevation={2} 
                      className="p-8 text-center group hover:scale-105 transition-transform"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <div className="text-2xl">✓</div>
                      </div>
                      <Text className="font-semibold mb-2">Default Border</Text>
                      <Text className="text-sm text-muted-foreground">
                        Standard • Accessible • Recommended
                      </Text>
                    </Surface>

                    <Surface 
                      elevation={2} 
                      border="accent"
                      className="p-8 text-center group hover:scale-105 transition-transform"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <div className="text-2xl">★</div>
                      </div>
                      <Text className="font-semibold mb-2">Accent Border</Text>
                      <Text className="text-sm text-muted-foreground">
                        2px primary • Emphasis • Focus
                      </Text>
                    </Surface>

                    <Surface 
                      elevation={2} 
                      border="none"
                      className="p-8 text-center bg-muted/50 group hover:scale-105 transition-transform"
                    >
                      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <div className="text-2xl">⚠</div>
                      </div>
                      <Text className="font-semibold mb-2">No Border</Text>
                      <Text className="text-sm text-muted-foreground">
                        Use sparingly • May reduce contrast
                      </Text>
                    </Surface>
                  </Grid>
                </CardContent>
              </Card>

              {/* Rounded Corners */}
              <Card>
                <CardHeader>
                  <Stack spacing="sm">
                    <Heading level="title">Rounded Corners</Heading>
                    <Text className="text-muted-foreground">
                      From sharp edges to pill shapes
                    </Text>
                  </Stack>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Surface 
                        elevation={2} 
                        rounded="none"
                        className="h-24 flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Text className="font-medium">None</Text>
                      </Surface>
                      <Text className="text-sm text-center text-muted-foreground">Sharp • Modern</Text>
                    </div>

                    <div className="space-y-3">
                      <Surface 
                        elevation={2} 
                        rounded="sm"
                        className="h-24 flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Text className="font-medium">Small</Text>
                      </Surface>
                      <Text className="text-sm text-center text-muted-foreground">Subtle • Minimal</Text>
                    </div>

                    <div className="space-y-3">
                      <Surface 
                        elevation={2} 
                        rounded="md"
                        className="h-24 flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Text className="font-medium">Medium</Text>
                      </Surface>
                      <Text className="text-sm text-center text-muted-foreground">Standard • Clean</Text>
                    </div>

                    <div className="space-y-3">
                      <Surface 
                        elevation={2} 
                        rounded="lg"
                        border="accent"
                        className="h-24 flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Text className="font-semibold">Large ✅</Text>
                      </Surface>
                      <Text className="text-sm text-center text-muted-foreground">Default • Friendly</Text>
                    </div>

                    <div className="space-y-3">
                      <Surface 
                        elevation={2} 
                        rounded="xl"
                        className="h-24 flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Text className="font-medium">X-Large</Text>
                      </Surface>
                      <Text className="text-sm text-center text-muted-foreground">Smooth • Playful</Text>
                    </div>

                    <div className="space-y-3">
                      <Surface 
                        elevation={2} 
                        rounded="full"
                        className="h-24 flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Text className="font-medium">Full</Text>
                      </Surface>
                      <Text className="text-sm text-center text-muted-foreground">Pill • Badges</Text>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interactive Surfaces */}
              <Card>
                <CardHeader>
                  <Stack spacing="sm">
                    <Heading level="title">Interactive Surfaces</Heading>
                    <Text className="text-muted-foreground">
                      Hover effects for clickable elements
                    </Text>
                  </Stack>
                </CardHeader>
                <CardContent>
                  <Grid columns={2} gap="lg">
                    <Surface 
                      elevation={1} 
                      interactive 
                      className="p-10 text-center group"
                    >
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">👆</div>
                      <Text className="font-semibold mb-2">Hover Me</Text>
                      <Text className="text-sm text-muted-foreground">
                        Shadow increases • Cursor changes
                      </Text>
                    </Surface>

                    <Surface 
                      elevation={2} 
                      interactive 
                      border="accent"
                      className="p-10 text-center group"
                    >
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">⭐</div>
                      <Text className="font-semibold mb-2">Accent + Interactive</Text>
                      <Text className="text-sm text-muted-foreground">
                        Emphasis + Feedback
                      </Text>
                    </Surface>
                  </Grid>
                </CardContent>
              </Card>

              {/* Card Components - Card */}
              <Card>
                <CardHeader>
                  <Heading level="title">Card Components</Heading>
                  <Text className="text-muted-foreground">
                    Pre-built surface patterns for common use cases
                  </Text>
                </CardHeader>
                <CardContent>
                  <Grid columns="auto" gap="md">
                    
                    <Card>
                      <CardContent className="p-6">
                        <Text className="font-medium">Simple Card</Text>
                        <Text className="text-sm text-muted-foreground mt-2">
                          Just content, no header
                        </Text>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <Text className="font-semibold">Card with Header</Text>
                        <Text className="text-sm text-muted-foreground">
                          Structured content
                        </Text>
                      </CardHeader>
                      <CardContent>
                        <Text className="text-sm">
                          Header provides context, content holds the details.
                        </Text>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <Text className="font-semibold">Full Card</Text>
                        <Text className="text-sm text-muted-foreground">
                          With all sections
                        </Text>
                      </CardHeader>
                      <CardContent>
                        <Text className="text-sm">
                          Header, content, and footer for complete card structure.
                        </Text>
                      </CardContent>
                      <CardFooter>
                        <Button size="sm">Action</Button>
                      </CardFooter>
                    </Card>

                  </Grid>
                </CardContent>
              </Card>

              {/* Usage Rules */}
              <Card className="border-2">
                <CardHeader>
                  <Stack spacing="sm">
                    <Heading level="title">Usage Guidelines</Heading>
                    <Text className="text-muted-foreground">
                      Best practices for accessible and effective surfaces
                    </Text>
                  </Stack>
                </CardHeader>
                <CardContent>
                  <Grid columns={2} gap="lg">
                    <Surface elevation={2} className="p-6 bg-green-50/50 border-green-300">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">✓</div>
                        <Text className="font-bold text-green-900">Do</Text>
                      </div>
                      <Stack spacing="sm">
                        <Text className="text-sm text-green-900">✓ Use elevation to show hierarchy</Text>
                        <Text className="text-sm text-green-900">✓ Keep borders for accessibility</Text>
                        <Text className="text-sm text-green-900">✓ Child surfaces at higher elevation</Text>
                        <Text className="text-sm text-green-900">✓ Consistent rounded corners</Text>
                        <Text className="text-sm text-green-900">✓ Interactive props for clickables</Text>
                      </Stack>
                    </Surface>

                    <Surface elevation={2} className="p-6 bg-red-50/50 border-red-300">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">✕</div>
                        <Text className="font-bold text-red-900">Don't</Text>
                      </div>
                      <Stack spacing="sm">
                        <Text className="text-sm text-red-900">✕ Nest surfaces at same elevation</Text>
                        <Text className="text-sm text-red-900">✕ Remove borders without reason</Text>
                        <Text className="text-sm text-red-900">✕ Use elevation for decoration</Text>
                        <Text className="text-sm text-red-900">✕ Mix too many rounded styles</Text>
                        <Text className="text-sm text-red-900">✕ Skip elevation levels randomly</Text>
                      </Stack>
                    </Surface>
                  </Grid>
                </CardContent>
              </Card>

              {/* Hierarchy Example */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <Stack spacing="sm">
                    <Heading level="title">Visual Hierarchy in Action</Heading>
                    <Text className="text-muted-foreground">
                      How surfaces nest to create depth • Each level increases elevation
                    </Text>
                  </Stack>
                </CardHeader>
                <CardContent className="p-8">
                  <Surface elevation={0} border="default" className="p-8 bg-muted/20">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-xs font-bold">0</div>
                      <Text className="font-semibold">Page Background</Text>
                    </div>
                    
                    <Surface elevation={1} className="p-6 mb-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded bg-blue-200 flex items-center justify-center text-xs font-bold">1</div>
                        <Text className="font-semibold">Main Card Container</Text>
                      </div>
                      
                      <Grid columns={2} gap="md">
                        <Surface elevation={2} className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded bg-purple-200 flex items-center justify-center text-xs font-bold">2</div>
                            <Text className="text-sm font-semibold">Nested Item</Text>
                          </div>
                          <Text className="text-xs text-muted-foreground">Higher elevation = more prominent</Text>
                        </Surface>
                        
                        <Surface elevation={2} className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded bg-purple-200 flex items-center justify-center text-xs font-bold">2</div>
                            <Text className="text-sm font-semibold">Nested Item</Text>
                          </div>
                          <Text className="text-xs text-muted-foreground">Same level = equal importance</Text>
                        </Surface>
                      </Grid>
                    </Surface>
                  </Surface>
                </CardContent>
              </Card>

            </Stack>
          </Section>
        </Container>
      </div>
    </>
  )
}
