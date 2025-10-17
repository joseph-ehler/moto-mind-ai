/**
 * Color System Showcase
 * 
 * Built using the mandatory MotoMind Design System foundation
 * Based on shadcn/ui semantic color tokens
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
import { Palette, Eye, CheckCircle2 } from 'lucide-react'

export default function ColorSystemPage() {
  return (
    <>
      <Head>
        <title>Color System - MotoMind Design System</title>
        <meta name="description" content="Semantic color tokens with automatic contrast" />
      </Head>

      <div className="min-h-screen bg-white">
        <Container size="md" useCase="articles">
          <Section spacing="xl">
            <Stack spacing="xl">
              
              {/* Hero Section */}
              <div className="text-center">
                <Palette className="w-16 h-16 mx-auto mb-6 text-blue-600" />
                <Heading level="hero">Color System</Heading>
                <Text size="xl" className="mt-6 text-gray-600 max-w-3xl mx-auto">
                  Use semantic color tokens that automatically handle contrast.
                  Every background has a matching foreground color.
                </Text>
              </div>

              {/* Critical Rule */}
              <Card className="p-8 bg-red-50 border-2 border-red-600">
                <Stack spacing="md">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xl">
                      !
                    </div>
                    <Heading level="title" className="text-red-900">CRITICAL: Accessibility Rule</Heading>
                  </div>
                  <Text className="text-lg text-red-900">
                    Every element inside a colored background MUST explicitly use the foreground token.
                  </Text>
                  <div className="bg-white p-6 rounded-lg border-2 border-red-600">
                    <Stack spacing="md">
                      <div>
                        <Text className="font-bold text-green-700 mb-2">✅ CORRECT</Text>
                        <pre className="text-sm font-mono bg-green-50 p-3 rounded">
<code>{`<div className="bg-destructive p-4">
  <Heading className="text-destructive-foreground">Error</Heading>
  <Text className="text-destructive-foreground">Message</Text>
</div>`}</code>
                        </pre>
                      </div>
                      <div>
                        <Text className="font-bold text-red-700 mb-2">❌ WRONG - Fails accessibility!</Text>
                        <pre className="text-sm font-mono bg-red-50 p-3 rounded">
<code>{`<div className="bg-destructive text-destructive-foreground p-4">
  <Heading>Error</Heading> {/* Dark text on red! */}
  <Text>Message</Text>
</div>`}</code>
                        </pre>
                      </div>
                    </Stack>
                  </div>
                  <Text size="sm" className="text-red-900">
                    <strong>Why:</strong> Child components (Heading, Text) may have default text colors that override parent inheritance. You MUST explicitly add the foreground class to EVERY text element.
                  </Text>
                </Stack>
              </Card>

              {/* Available Tokens */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Available Color Tokens</Heading>
                  <Text>
                    These semantic tokens work everywhere - components automatically adapt to light/dark mode.
                  </Text>
                  
                  <Stack spacing="md">
                    {/* Primary */}
                    <div className="bg-primary p-6 rounded-lg">
                      <Stack spacing="sm">
                        <div className="flex items-center justify-between">
                          <Heading level="subtitle" className="text-primary-foreground">primary</Heading>
                          <code className="text-sm font-mono bg-white/10 px-2 py-1 rounded text-primary-foreground">bg-primary text-primary-foreground</code>
                        </div>
                        <Text size="sm" className="text-primary-foreground">
                          Primary actions, main buttons, important elements
                        </Text>
                      </Stack>
                    </div>

                    {/* Secondary */}
                    <div className="bg-secondary p-6 rounded-lg border">
                      <Stack spacing="sm">
                        <div className="flex items-center justify-between">
                          <Heading level="subtitle" className="text-secondary-foreground">secondary</Heading>
                          <code className="text-sm font-mono bg-black/5 px-2 py-1 rounded text-secondary-foreground">bg-secondary text-secondary-foreground</code>
                        </div>
                        <Text size="sm" className="text-secondary-foreground">
                          Secondary actions, alternative buttons
                        </Text>
                      </Stack>
                    </div>

                    {/* Destructive */}
                    <div className="bg-destructive p-6 rounded-lg">
                      <Stack spacing="sm">
                        <div className="flex items-center justify-between">
                          <Heading level="subtitle" className="text-destructive-foreground">destructive</Heading>
                          <code className="text-sm font-mono bg-white/10 px-2 py-1 rounded text-destructive-foreground">bg-destructive text-destructive-foreground</code>
                        </div>
                        <Text size="sm" className="text-destructive-foreground">
                          Delete buttons, error states, warnings
                        </Text>
                      </Stack>
                    </div>

                    {/* Muted */}
                    <div className="bg-muted p-6 rounded-lg border">
                      <Stack spacing="sm">
                        <div className="flex items-center justify-between">
                          <Heading level="subtitle" className="text-muted-foreground">muted</Heading>
                          <code className="text-sm font-mono bg-black/5 px-2 py-1 rounded text-muted-foreground">bg-muted text-muted-foreground</code>
                        </div>
                        <Text size="sm" className="text-muted-foreground">
                          Muted backgrounds, disabled states, secondary info
                        </Text>
                      </Stack>
                    </div>

                    {/* Accent */}
                    <div className="bg-accent p-6 rounded-lg border">
                      <Stack spacing="sm">
                        <div className="flex items-center justify-between">
                          <Heading level="subtitle" className="text-accent-foreground">accent</Heading>
                          <code className="text-sm font-mono bg-black/5 px-2 py-1 rounded text-accent-foreground">bg-accent text-accent-foreground</code>
                        </div>
                        <Text size="sm" className="text-accent-foreground">
                          Highlighted elements, hover states
                        </Text>
                      </Stack>
                    </div>

                    {/* Card */}
                    <div className="bg-card p-6 rounded-lg border">
                      <Stack spacing="sm">
                        <div className="flex items-center justify-between">
                          <Heading level="subtitle" className="text-card-foreground">card</Heading>
                          <code className="text-sm font-mono bg-black/5 px-2 py-1 rounded text-card-foreground">bg-card text-card-foreground</code>
                        </div>
                        <Text size="sm" className="text-card-foreground">
                          Card surfaces, elevated content
                        </Text>
                      </Stack>
                    </div>
                  </Stack>
                </Stack>
              </Card>

              {/* Real Examples */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Real-World Examples</Heading>
                  <Text>
                    See these tokens in action. Notice how contrast is always correct.
                  </Text>
                  
                  <Stack spacing="lg">
                    {/* Buttons */}
                    <div>
                      <Text className="font-semibold mb-3">Buttons</Text>
                      <Stack spacing="sm">
                        <button className="px-4 py-2 bg-primary rounded-lg w-full text-left">
                          <Text className="font-semibold text-primary-foreground">Primary Button</Text>
                        </button>
                        <button className="px-4 py-2 bg-secondary rounded-lg border w-full text-left">
                          <Text className="font-semibold text-secondary-foreground">Secondary Button</Text>
                        </button>
                        <button className="px-4 py-2 bg-destructive rounded-lg w-full text-left">
                          <Text className="font-semibold text-destructive-foreground">Delete Button</Text>
                        </button>
                      </Stack>
                    </div>

                    {/* Alerts */}
                    <div>
                      <Text className="font-semibold mb-3">Alert Messages</Text>
                      <Stack spacing="sm">
                        <div className="bg-primary p-4 rounded-lg">
                          <Text className="font-semibold mb-1 text-primary-foreground">Information</Text>
                          <Text size="sm" className="text-primary-foreground">Your profile has been updated successfully.</Text>
                        </div>
                        <div className="bg-destructive p-4 rounded-lg">
                          <Text className="font-semibold mb-1 text-destructive-foreground">Error</Text>
                          <Text size="sm" className="text-destructive-foreground">Unable to save changes. Please try again.</Text>
                        </div>
                        <div className="bg-muted p-4 rounded-lg border">
                          <Text className="font-semibold mb-1 text-muted-foreground">Note</Text>
                          <Text size="sm" className="text-muted-foreground">This action cannot be undone.</Text>
                        </div>
                      </Stack>
                    </div>

                    {/* Cards */}
                    <div>
                      <Text className="font-semibold mb-3">Cards</Text>
                      <Grid columns={2} gap="md">
                        <div className="bg-card text-card-foreground border p-4 rounded-lg">
                          <Text className="font-semibold mb-2 text-card-foreground">Default Card</Text>
                          <Text size="sm" className="text-card-foreground/80">Uses card background and foreground</Text>
                        </div>
                        <div className="bg-accent text-accent-foreground border p-4 rounded-lg">
                          <Text className="font-semibold mb-2 text-accent-foreground">Accent Card</Text>
                          <Text size="sm" className="text-accent-foreground/80">Uses accent for emphasis</Text>
                        </div>
                      </Grid>
                    </div>
                  </Stack>
                </Stack>
              </Card>

              {/* Usage Rules */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Usage Rules</Heading>
                  <Text>
                    Simple guidelines for using color tokens correctly.
                  </Text>
                  
                  <Grid columns={2} gap="lg">
                    {/* Do */}
                    <div className="border-2 border-green-700 bg-green-50 p-6 rounded-lg">
                      <Stack spacing="sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                          <Text className="font-bold text-gray-900">Do</Text>
                        </div>
                        <Text size="sm" className="text-gray-900">✓ Add foreground class to EVERY text element</Text>
                        <Text size="sm" className="text-gray-900">✓ Explicitly set text color on Heading, Text, etc.</Text>
                        <Text size="sm" className="text-gray-900">✓ Use semantic names (primary, destructive)</Text>
                        <Text size="sm" className="text-gray-900">✓ Test contrast in browser DevTools</Text>
                      </Stack>
                    </div>

                    {/* Don't */}
                    <div className="border-2 border-red-700 bg-red-50 p-6 rounded-lg">
                      <Stack spacing="sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-white text-sm font-bold">
                            ✕
                          </div>
                          <Text className="font-bold text-gray-900">Don't</Text>
                        </div>
                        <Text size="sm" className="text-gray-900">✕ Rely on CSS inheritance for text color</Text>
                        <Text size="sm" className="text-gray-900">✕ Use bg-blue-500 or text-red-600</Text>
                        <Text size="sm" className="text-gray-900">✕ Forget foreground on headings/emphasis</Text>
                        <Text size="sm" className="text-gray-900">✕ Hardcode color values</Text>
                      </Stack>
                    </div>
                  </Grid>
                </Stack>
              </Card>

              {/* Utility Tokens */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Utility Tokens</Heading>
                  <Text>
                    Additional tokens for borders and other elements.
                  </Text>
                  
                  <Stack spacing="sm">
                    <div className="border border-border p-4 rounded-lg">
                      <Grid columns={2} gap="md">
                        <Text className="font-mono font-bold text-sm">border</Text>
                        <Text size="sm" className="text-muted-foreground">Default border color</Text>
                      </Grid>
                    </div>
                    <div className="border border-input p-4 rounded-lg">
                      <Grid columns={2} gap="md">
                        <Text className="font-mono font-bold text-sm">input</Text>
                        <Text size="sm" className="text-muted-foreground">Input field borders</Text>
                      </Grid>
                    </div>
                    <div className="border-2 border-ring p-4 rounded-lg">
                      <Grid columns={2} gap="md">
                        <Text className="font-mono font-bold text-sm">ring</Text>
                        <Text size="sm" className="text-muted-foreground">Focus rings (use with ring-ring)</Text>
                      </Grid>
                    </div>
                  </Stack>
                </Stack>
              </Card>

            </Stack>
          </Section>
        </Container>
      </div>
    </>
  )
}
