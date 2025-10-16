/**
 * Spacing System Showcase
 * 
 * Built using the mandatory MotoMind Design System foundation
 * Demonstrates consistent spacing scale and usage patterns
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
import { Ruler, Grid3x3, Layers, Maximize2 } from 'lucide-react'

export default function SpacingSystemPage() {
  return (
    <>
      <Head>
        <title>Spacing System - MotoMind Design System</title>
        <meta name="description" content="Consistent spacing scale with 4px base unit for visual rhythm and hierarchy" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* 🚨 MANDATORY: Using Container with proper useCase */}
        <Container size="md" useCase="articles">
          
          {/* 🚨 MANDATORY: Using Section for consistent spacing */}
          <Section spacing="xl">
            
            {/* 🚨 MANDATORY: Using Stack for vertical rhythm */}
            <Stack spacing="xl">
              
              {/* Hero Section */}
              <div className="text-center">
                <Ruler className="w-16 h-16 mx-auto mb-6 text-blue-600" />
                <Heading level="hero">Spacing System</Heading>
                <Text size="xl" className="mt-6 text-gray-600 max-w-3xl mx-auto">
                  Consistent spacing creates visual rhythm and hierarchy.
                  Our 4px-based scale ensures harmony across all components.
                </Text>
              </div>

              {/* Key Features */}
              <Grid columns="auto" gap="md">
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Grid3x3 className="w-8 h-8 mx-auto text-blue-600" />
                    <Heading level="subtitle">4px Base Unit</Heading>
                    <Text size="sm">
                      All spacing values are multiples of 4px for perfect alignment
                    </Text>
                  </Stack>
                </Card>
                
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Layers className="w-8 h-8 mx-auto text-green-600" />
                    <Heading level="subtitle">Consistent Scale</Heading>
                    <Text size="sm">
                      14 levels from 0px to 96px following a logical progression
                    </Text>
                  </Stack>
                </Card>
                
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Maximize2 className="w-8 h-8 mx-auto text-purple-600" />
                    <Heading level="subtitle">Named Tokens</Heading>
                    <Text size="sm">
                      Semantic names (xs, sm, md, lg, xl) for common patterns
                    </Text>
                  </Stack>
                </Card>
              </Grid>

              {/* Spacing Scale */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Spacing Scale</Heading>
                  <Text>
                    Our spacing scale uses a 4px base unit with 14 levels.
                    Each level serves a specific purpose in the visual hierarchy.
                  </Text>
                  
                  <Stack spacing="sm">
                    {/* 0 */}
                    <div className="flex items-center gap-4 p-3 rounded-lg border">
                      <Text className="font-mono font-bold text-primary w-12">0</Text>
                      <div className="w-24">
                        <div className="h-6 bg-gray-200 rounded" style={{ width: '0px' }}></div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <Text className="text-sm font-mono">0px</Text>
                        <Text className="text-sm font-mono text-gray-600">0rem</Text>
                        <Text className="text-sm text-gray-600">No space</Text>
                      </div>
                    </div>

                    {/* 1 */}
                    <div className="flex items-center gap-4 p-3 rounded-lg border">
                      <Text className="font-mono font-bold text-primary w-12">1</Text>
                      <div className="w-24">
                        <div className="h-6 bg-primary rounded" style={{ width: '4px' }}></div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <Text className="text-sm font-mono">4px</Text>
                        <Text className="text-sm font-mono text-gray-600">0.25rem</Text>
                        <Text className="text-sm text-gray-600">Tight spacing</Text>
                      </div>
                    </div>

                    {/* 2 */}
                    <div className="flex items-center gap-4 p-3 rounded-lg border">
                      <Text className="font-mono font-bold text-primary w-12">2</Text>
                      <div className="w-24">
                        <div className="h-6 bg-primary rounded" style={{ width: '8px' }}></div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <Text className="text-sm font-mono">8px</Text>
                        <Text className="text-sm font-mono text-gray-600">0.5rem</Text>
                        <Text className="text-sm text-gray-600">Small gaps</Text>
                      </div>
                    </div>

                    {/* 4 */}
                    <div className="flex items-center gap-4 p-3 rounded-lg border bg-blue-50">
                      <Text className="font-mono font-bold text-primary w-12">4</Text>
                      <div className="w-24">
                        <div className="h-6 bg-primary rounded" style={{ width: '16px' }}></div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <Text className="text-sm font-mono">16px</Text>
                        <Text className="text-sm font-mono text-gray-600">1rem</Text>
                        <Text className="text-sm text-gray-600"><strong>Base spacing (most common)</strong></Text>
                      </div>
                    </div>

                    {/* 6 */}
                    <div className="flex items-center gap-4 p-3 rounded-lg border">
                      <Text className="font-mono font-bold text-primary w-12">6</Text>
                      <div className="w-24">
                        <div className="h-6 bg-primary rounded" style={{ width: '24px' }}></div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <Text className="text-sm font-mono">24px</Text>
                        <Text className="text-sm font-mono text-gray-600">1.5rem</Text>
                        <Text className="text-sm text-gray-600">Relaxed spacing</Text>
                      </div>
                    </div>

                    {/* 8 */}
                    <div className="flex items-center gap-4 p-3 rounded-lg border">
                      <Text className="font-mono font-bold text-primary w-12">8</Text>
                      <div className="w-24">
                        <div className="h-6 bg-primary rounded" style={{ width: '32px' }}></div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <Text className="text-sm font-mono">32px</Text>
                        <Text className="text-sm font-mono text-gray-600">2rem</Text>
                        <Text className="text-sm text-gray-600">Loose spacing</Text>
                      </div>
                    </div>

                    {/* 12 */}
                    <div className="flex items-center gap-4 p-3 rounded-lg border">
                      <Text className="font-mono font-bold text-primary w-12">12</Text>
                      <div className="w-24">
                        <div className="h-6 bg-primary rounded" style={{ width: '48px' }}></div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <Text className="text-sm font-mono">48px</Text>
                        <Text className="text-sm font-mono text-gray-600">3rem</Text>
                        <Text className="text-sm text-gray-600">Large sections</Text>
                      </div>
                    </div>

                    {/* 16 */}
                    <div className="flex items-center gap-4 p-3 rounded-lg border">
                      <Text className="font-mono font-bold text-primary w-12">16</Text>
                      <div className="w-24">
                        <div className="h-6 bg-primary rounded" style={{ width: '64px' }}></div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <Text className="text-sm font-mono">64px</Text>
                        <Text className="text-sm font-mono text-gray-600">4rem</Text>
                        <Text className="text-sm text-gray-600">Major sections</Text>
                      </div>
                    </div>

                    {/* 24 */}
                    <div className="flex items-center gap-4 p-3 rounded-lg border">
                      <Text className="font-mono font-bold text-primary w-12">24</Text>
                      <div className="w-24">
                        <div className="h-6 bg-primary rounded" style={{ width: '96px' }}></div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <Text className="text-sm font-mono">96px</Text>
                        <Text className="text-sm font-mono text-gray-600">6rem</Text>
                        <Text className="text-sm text-gray-600">Hero spacing</Text>
                      </div>
                    </div>
                  </Stack>
                </Stack>
              </Card>

              {/* Named Spacing Tokens */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Named Spacing Tokens</Heading>
                  <Text>
                    Use semantic names for common spacing patterns.
                    These make code more readable and maintainable.
                  </Text>
                  
                  <Grid columns={2} gap="lg">
                    <div className="space-y-3">
                      <Text className="font-semibold text-sm text-gray-600">space-xs (4px)</Text>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <Text size="sm">Minimal spacing between tightly related elements</Text>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Text className="font-semibold text-sm text-gray-600">space-sm (8px)</Text>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <Text size="sm">Small spacing within components</Text>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Text className="font-semibold text-sm text-gray-600">space-md (16px)</Text>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <Text size="sm">Default spacing - most common use case</Text>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Text className="font-semibold text-sm text-gray-600">space-lg (24px)</Text>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <Text size="sm">Comfortable spacing between sections</Text>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Text className="font-semibold text-sm text-gray-600">space-xl (32px)</Text>
                      <div className="bg-pink-50 p-4 rounded-lg">
                        <Text size="sm">Large spacing for major sections</Text>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Text className="font-semibold text-sm text-gray-600">space-2xl (48px)</Text>
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <Text size="sm">Extra large spacing for distinct sections</Text>
                      </div>
                    </div>
                  </Grid>
                </Stack>
              </Card>

              {/* Stack Component Examples */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Stack Component</Heading>
                  <Text>
                    The Stack component applies consistent vertical spacing.
                    Use different spacing values based on content hierarchy.
                  </Text>
                  
                  <Grid columns={2} gap="lg">
                    {/* XS */}
                    <div>
                      <Text className="font-semibold mb-3">Stack spacing="xs"</Text>
                      <Card className="p-4">
                        <Stack spacing="xs">
                          <div className="h-10 bg-blue-100 rounded flex items-center justify-center">
                            <Text size="sm">Item 1</Text>
                          </div>
                          <div className="h-10 bg-blue-100 rounded flex items-center justify-center">
                            <Text size="sm">Item 2</Text>
                          </div>
                          <div className="h-10 bg-blue-100 rounded flex items-center justify-center">
                            <Text size="sm">Item 3</Text>
                          </div>
                        </Stack>
                      </Card>
                    </div>

                    {/* SM */}
                    <div>
                      <Text className="font-semibold mb-3">Stack spacing="sm"</Text>
                      <Card className="p-4">
                        <Stack spacing="sm">
                          <div className="h-10 bg-green-100 rounded flex items-center justify-center">
                            <Text size="sm">Item 1</Text>
                          </div>
                          <div className="h-10 bg-green-100 rounded flex items-center justify-center">
                            <Text size="sm">Item 2</Text>
                          </div>
                          <div className="h-10 bg-green-100 rounded flex items-center justify-center">
                            <Text size="sm">Item 3</Text>
                          </div>
                        </Stack>
                      </Card>
                    </div>

                    {/* MD */}
                    <div>
                      <Text className="font-semibold mb-3">Stack spacing="md"</Text>
                      <Card className="p-4">
                        <Stack spacing="md">
                          <div className="h-10 bg-purple-100 rounded flex items-center justify-center">
                            <Text size="sm">Item 1</Text>
                          </div>
                          <div className="h-10 bg-purple-100 rounded flex items-center justify-center">
                            <Text size="sm">Item 2</Text>
                          </div>
                          <div className="h-10 bg-purple-100 rounded flex items-center justify-center">
                            <Text size="sm">Item 3</Text>
                          </div>
                        </Stack>
                      </Card>
                    </div>

                    {/* LG */}
                    <div>
                      <Text className="font-semibold mb-3">Stack spacing="lg"</Text>
                      <Card className="p-4">
                        <Stack spacing="lg">
                          <div className="h-10 bg-orange-100 rounded flex items-center justify-center">
                            <Text size="sm">Item 1</Text>
                          </div>
                          <div className="h-10 bg-orange-100 rounded flex items-center justify-center">
                            <Text size="sm">Item 2</Text>
                          </div>
                          <div className="h-10 bg-orange-100 rounded flex items-center justify-center">
                            <Text size="sm">Item 3</Text>
                          </div>
                        </Stack>
                      </Card>
                    </div>
                  </Grid>
                </Stack>
              </Card>

              {/* Common Patterns */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Common Spacing Patterns</Heading>
                  <Text>
                    Different spacing values for different content relationships.
                    Tighter spacing shows stronger relationships.
                  </Text>
                  
                  <Grid columns={2} gap="lg">
                    <Stack spacing="md">
                      <Heading level="subtitle">Within a Component (sm → md)</Heading>
                      <Card className="p-6 bg-blue-50">
                        <Text className="font-bold text-lg mb-2">Card Title</Text>
                        <Text className="text-gray-600 mb-4">Card description with moderate spacing between elements for visual grouping.</Text>
                        <div className="flex gap-2">
                          <div className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Primary</div>
                          <div className="px-4 py-2 bg-blue-200 rounded text-sm">Secondary</div>
                        </div>
                      </Card>
                    </Stack>

                    <Stack spacing="md">
                      <Heading level="subtitle">Between Sections (xl → 2xl)</Heading>
                      <div className="space-y-8">
                        <Card className="p-6 bg-green-50">
                          <Text className="font-semibold">Section 1</Text>
                          <Text className="text-sm text-gray-600 mt-2">Large spacing separates major sections</Text>
                        </Card>
                        <Card className="p-6 bg-green-50">
                          <Text className="font-semibold">Section 2</Text>
                          <Text className="text-sm text-gray-600 mt-2">Creating clear visual hierarchy</Text>
                        </Card>
                      </div>
                    </Stack>
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
