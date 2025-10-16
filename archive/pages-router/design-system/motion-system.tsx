/**
 * Motion & Animation System Showcase
 * 
 * Built using the mandatory MotoMind Design System foundation
 * Documents animation tokens, timing, and accessibility
 */

import React, { useState } from 'react'
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
import { Zap, Clock, Eye, Accessibility } from 'lucide-react'

export default function MotionSystemPage() {
  const [demoActive, setDemoActive] = useState<string | null>(null)

  const durations = [
    { name: 'fast', ms: '150ms', use: 'Micro-interactions, hover states', example: 'transition-[150ms]' },
    { name: 'normal', ms: '200ms', use: 'Default animations, most use cases', example: 'transition-[200ms]' },
    { name: 'slow', ms: '300ms', use: 'Complex animations, page transitions', example: 'transition-[300ms]' },
  ]

  const easings = [
    { name: 'ease', value: 'ease', use: 'Natural movement, default', css: 'ease' },
    { name: 'ease-in', value: 'ease-in', use: 'Start slow, speed up', css: 'ease-in' },
    { name: 'ease-out', value: 'ease-out', use: 'Start fast, slow down (recommended)', css: 'ease-out' },
    { name: 'ease-in-out', value: 'ease-in-out', use: 'Smooth both ends', css: 'ease-in-out' },
    { name: 'linear', value: 'linear', use: 'Constant speed, mechanical', css: 'linear' },
  ]

  const animationTypes = [
    { name: 'Fade', example: 'opacity', property: 'opacity' },
    { name: 'Scale', example: 'transform: scale', property: 'scale' },
    { name: 'Slide', example: 'transform: translate', property: 'translate' },
    { name: 'Rotate', example: 'transform: rotate', property: 'rotate' },
  ]

  return (
    <>
      <Head>
        <title>Motion & Animation System - MotoMind Design System</title>
        <meta name="description" content="Animation tokens, timing functions, and accessibility guidelines" />
      </Head>

      <div className="min-h-screen bg-white">
        <Container size="md" useCase="articles">
          <Section spacing="xl">
            <Stack spacing="xl">
              
              {/* Hero Section */}
              <div className="text-center">
                <Zap className="w-16 h-16 mx-auto mb-6 text-blue-600" />
                <Heading level="hero">Motion & Animation</Heading>
                <Text size="xl" className="mt-6 text-gray-600 max-w-3xl mx-auto">
                  Purposeful motion enhances usability and delight.
                  Our animation system ensures consistency and accessibility.
                </Text>
              </div>

              {/* Key Principles */}
              <Grid columns="auto" gap="md">
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Clock className="w-8 h-8 mx-auto text-blue-600" />
                    <Heading level="subtitle">Purposeful</Heading>
                    <Text size="sm">
                      Every animation has a purpose - guide attention, provide feedback
                    </Text>
                  </Stack>
                </Card>
                
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Zap className="w-8 h-8 mx-auto text-green-600" />
                    <Heading level="subtitle">Performant</Heading>
                    <Text size="sm">
                      Use transform and opacity only - 60fps guaranteed
                    </Text>
                  </Stack>
                </Card>
                
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Accessibility className="w-8 h-8 mx-auto text-purple-600" />
                    <Heading level="subtitle">Accessible</Heading>
                    <Text size="sm">
                      Respect prefers-reduced-motion for users with vestibular disorders
                    </Text>
                  </Stack>
                </Card>
              </Grid>

              {/* Duration Scale */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Duration Scale</Heading>
                  <Text>
                    Three durations cover all animation needs.
                    Use fast for micro-interactions, normal for most cases, slow for complex animations.
                  </Text>
                  
                  <Stack spacing="md">
                    {durations.map((duration) => (
                      <div key={duration.name} className="border rounded-lg p-4 hover:bg-gray-50">
                        <Grid columns={3} gap="md">
                          <div>
                            <Text className="font-semibold">{duration.name}</Text>
                            <Text size="sm" className="text-gray-600">{duration.ms}</Text>
                          </div>
                          <Text size="sm" className="text-gray-600">{duration.use}</Text>
                          <code className="text-sm font-mono bg-gray-100 px-3 py-1 rounded justify-self-end">
                            {duration.example}
                          </code>
                        </Grid>
                      </div>
                    ))}
                  </Stack>
                </Stack>
              </Card>

              {/* Easing Functions */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Easing Functions</Heading>
                  <Text>
                    Easing controls acceleration. Use ease-out for most cases - it feels most natural.
                  </Text>
                  
                  <Stack spacing="md">
                    {easings.map((easing) => (
                      <div key={easing.name} className="border rounded-lg p-4">
                        <Grid columns={3} gap="md">
                          <div>
                            <Text className="font-semibold">{easing.name}</Text>
                            <code className="text-xs font-mono text-gray-600">{easing.css}</code>
                          </div>
                          <Text size="sm" className="text-gray-600">{easing.use}</Text>
                          <button
                            onClick={() => setDemoActive(easing.name)}
                            className="justify-self-end px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Demo
                          </button>
                        </Grid>
                        {demoActive === easing.name && (
                          <div className="mt-4 h-12 bg-gray-100 rounded relative overflow-hidden">
                            <div
                              key={demoActive}
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-8 bg-blue-600 rounded"
                              style={{
                                animation: `slideRight 1s ${easing.css} forwards`
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </Stack>
                </Stack>
              </Card>

              {/* Animation Types */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Animation Types</Heading>
                  <Text>
                    Only animate transform and opacity for 60fps performance.
                    Avoid animating layout properties (width, height, margin, padding).
                  </Text>
                  
                  <Grid columns={2} gap="lg">
                    {animationTypes.map((type) => (
                      <div key={type.name} className="border rounded-lg p-6">
                        <Stack spacing="sm">
                          <Heading level="subtitle">{type.name}</Heading>
                          <Text size="sm" className="text-gray-600">{type.example}</Text>
                          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {type.property}
                          </code>
                        </Stack>
                      </div>
                    ))}
                  </Grid>
                </Stack>
              </Card>

              {/* Common Patterns */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Common Animation Patterns</Heading>
                  <Text>
                    Reusable animation patterns for consistent user experience.
                  </Text>
                  
                  <Stack spacing="md">
                    {/* Hover Scale */}
                    <div className="border rounded-lg p-6">
                      <Text className="font-semibold mb-3">Hover Scale (Cards, Buttons)</Text>
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg transition-transform duration-200 hover:scale-105">
                        Hover Me
                      </button>
                      <div className="mt-3 bg-gray-900 p-3 rounded overflow-x-auto">
                        <code className="text-sm text-gray-100 font-mono">
                          {`className="transition-transform duration-200 hover:scale-105"`}
                        </code>
                      </div>
                    </div>

                    {/* Fade In */}
                    <div className="border rounded-lg p-6">
                      <Text className="font-semibold mb-3">Fade In (Loading States)</Text>
                      <div className="p-4 bg-gray-50 rounded animate-in fade-in duration-300">
                        Content fades in smoothly
                      </div>
                      <div className="mt-3 bg-gray-900 p-3 rounded overflow-x-auto">
                        <code className="text-sm text-gray-100 font-mono">
                          {`className="animate-in fade-in duration-300"`}
                        </code>
                      </div>
                    </div>

                    {/* Slide In */}
                    <div className="border rounded-lg p-6">
                      <Text className="font-semibold mb-3">Slide In (Modals, Drawers)</Text>
                      <div className="p-4 bg-gray-50 rounded animate-in slide-in-from-bottom duration-300">
                        Slides in from bottom
                      </div>
                      <div className="mt-3 bg-gray-900 p-3 rounded overflow-x-auto">
                        <code className="text-sm text-gray-100 font-mono">
                          {`className="animate-in slide-in-from-bottom duration-300"`}
                        </code>
                      </div>
                    </div>
                  </Stack>
                </Stack>
              </Card>

              {/* Reduced Motion */}
              <Card className="p-8 bg-yellow-50 border-2 border-yellow-600">
                <Stack spacing="lg">
                  <div className="flex items-center gap-2">
                    <Accessibility className="w-8 h-8 text-yellow-600" />
                    <Heading level="title" className="text-yellow-900">Reduced Motion (CRITICAL)</Heading>
                  </div>
                  <Text className="text-yellow-900">
                    Users with vestibular disorders can experience nausea from animations.
                    ALWAYS respect prefers-reduced-motion.
                  </Text>
                  
                  <div className="bg-white p-6 rounded-lg border-2 border-yellow-600">
                    <Text className="font-semibold mb-3">Implementation</Text>
                    <div className="bg-gray-900 p-4 rounded overflow-x-auto">
                      <pre className="text-sm text-gray-100 font-mono">
<code>{`/* In your CSS */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Or use Tailwind's motion utilities */
<div className="motion-safe:animate-bounce">
  Only animates if user allows motion
</div>

<div className="motion-reduce:transition-none">
  No transitions for reduced motion users
</div>`}</code>
                      </pre>
                    </div>
                  </div>
                </Stack>
              </Card>

              {/* Performance Guidelines */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Performance Guidelines</Heading>
                  <Text>
                    Follow these rules to ensure smooth 60fps animations.
                  </Text>
                  
                  <Grid columns={2} gap="lg">
                    {/* Do */}
                    <div className="border-2 border-green-700 bg-green-50 p-6 rounded-lg">
                      <Stack spacing="sm">
                        <Text className="font-bold text-gray-900">✅ Animate These (GPU-accelerated)</Text>
                        <Text size="sm" className="text-gray-900">• <code>opacity</code></Text>
                        <Text size="sm" className="text-gray-900">• <code>transform: translate</code></Text>
                        <Text size="sm" className="text-gray-900">• <code>transform: scale</code></Text>
                        <Text size="sm" className="text-gray-900">• <code>transform: rotate</code></Text>
                      </Stack>
                    </div>

                    {/* Don't */}
                    <div className="border-2 border-red-700 bg-red-50 p-6 rounded-lg">
                      <Stack spacing="sm">
                        <Text className="font-bold text-gray-900">❌ Don't Animate These (Reflow/Repaint)</Text>
                        <Text size="sm" className="text-gray-900">• <code>width / height</code></Text>
                        <Text size="sm" className="text-gray-900">• <code>margin / padding</code></Text>
                        <Text size="sm" className="text-gray-900">• <code>top / left / right / bottom</code></Text>
                        <Text size="sm" className="text-gray-900">• <code>border-width</code></Text>
                      </Stack>
                    </div>
                  </Grid>
                </Stack>
              </Card>

              {/* Usage Rules */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Usage Rules</Heading>
                  <Text>
                    When to use animation and when to avoid it.
                  </Text>
                  
                  <Grid columns={2} gap="lg">
                    <div className="border-2 border-green-700 bg-green-50 p-6 rounded-lg">
                      <Stack spacing="sm">
                        <Text className="font-bold text-gray-900">✅ Do</Text>
                        <Text size="sm" className="text-gray-900">✓ Provide feedback for user actions</Text>
                        <Text size="sm" className="text-gray-900">✓ Guide attention to important changes</Text>
                        <Text size="sm" className="text-gray-900">✓ Show state transitions clearly</Text>
                        <Text size="sm" className="text-gray-900">✓ Use subtle animations (under 300ms)</Text>
                        <Text size="sm" className="text-gray-900">✓ Respect prefers-reduced-motion</Text>
                      </Stack>
                    </div>

                    <div className="border-2 border-red-700 bg-red-50 p-6 rounded-lg">
                      <Stack spacing="sm">
                        <Text className="font-bold text-gray-900">✕ Don't</Text>
                        <Text size="sm" className="text-gray-900">✕ Animate everything (visual noise)</Text>
                        <Text size="sm" className="text-gray-900">✕ Use long durations (over 400ms)</Text>
                        <Text size="sm" className="text-gray-900">✕ Animate on page load without reason</Text>
                        <Text size="sm" className="text-gray-900">✕ Delay user interactions with animations</Text>
                        <Text size="sm" className="text-gray-900">✕ Ignore reduced motion preferences</Text>
                      </Stack>
                    </div>
                  </Grid>
                </Stack>
              </Card>

            </Stack>
          </Section>
        </Container>
      </div>

      <style jsx>{`
        @keyframes slideRight {
          from {
            left: 0;
          }
          to {
            left: calc(100% - 3rem);
          }
        }
      `}</style>
    </>
  )
}
