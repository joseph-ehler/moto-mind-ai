/**
 * Cards Showcase
 * 
 * Built using the mandatory MotoMind Design System foundation
 * Demonstrates all card variants with live examples
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
  BaseCard,
  InteractiveCard,
  ColoredCard,
  MetricCard,
  FeatureCard,
  AlertCard,
  ProductCard,
  TestimonialCard
} from '@/components/design-system'
import { 
  Layers,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Rocket,
  Heart
} from 'lucide-react'

export default function CardsShowcasePage() {
  const [dismissedAlert, setDismissedAlert] = useState<string | null>(null)

  return (
    <>
      <Head>
        <title>Cards Showcase - MotoMind Design System</title>
        <meta name="description" content="Comprehensive card components built on accessibility foundation" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Container size="lg" useCase="data_tables" override={{ reason: "Wide showcase needs space for examples", approvedBy: "Design System" }}>
          <Section spacing="xl">
            <Stack spacing="xl">
              
              {/* Hero */}
              <div className="text-center py-16">
                <Layers className="w-16 h-16 mx-auto mb-6 text-primary" />
                <Heading level="hero">Cards System</Heading>
                <Text size="xl" className="mt-6 text-gray-600 max-w-3xl mx-auto">
                  Comprehensive card components with accessibility built-in.
                  Focus states, interaction patterns, and ColoredBox integration.
                </Text>
              </div>

              {/* Base Card */}
              <Stack spacing="lg">
                <Heading level="title">Base Card</Heading>
                <Text>
                  Foundation for all cards. Supports elevation, borders, and padding variants.
                </Text>
                
                <Grid columns={3} gap="lg">
                  <BaseCard elevation="flat" border="default">
                    <Heading level="subtitle">Flat</Heading>
                    <Text size="sm" className="text-gray-600">
                      No shadow, minimal depth
                    </Text>
                  </BaseCard>

                  <BaseCard elevation="low">
                    <Heading level="subtitle">Low Elevation</Heading>
                    <Text size="sm" className="text-gray-600">
                      Subtle shadow, slight depth
                    </Text>
                  </BaseCard>

                  <BaseCard elevation="high">
                    <Heading level="subtitle">High Elevation</Heading>
                    <Text size="sm" className="text-gray-600">
                      Deep shadow, floats above
                    </Text>
                  </BaseCard>
                </Grid>
              </Stack>

              {/* Interactive Card */}
              <Stack spacing="lg">
                <Heading level="title">Interactive Card (Clickable)</Heading>
                <Text>
                  Focus ring, hover states, and keyboard navigation built-in.
                </Text>
                
                <Grid columns={3} gap="lg">
                  <InteractiveCard
                    onClick={() => alert('Card 1 clicked!')}
                    ariaLabel="View card 1 details"
                  >
                    <Heading level="subtitle">Click Me</Heading>
                    <Text size="sm" className="text-gray-600">
                      Try clicking or using Tab + Enter
                    </Text>
                  </InteractiveCard>

                  <InteractiveCard
                    onClick={() => alert('Card 2 clicked!')}
                    ariaLabel="View card 2 details"
                    elevation="medium"
                  >
                    <Heading level="subtitle">Hover Effect</Heading>
                    <Text size="sm" className="text-gray-600">
                      Hover to see scale animation
                    </Text>
                  </InteractiveCard>

                  <InteractiveCard
                    onClick={() => alert('Card 3 clicked!')}
                    ariaLabel="View card 3 details"
                    border="accent"
                  >
                    <Heading level="subtitle">Accent Border</Heading>
                    <Text size="sm" className="text-gray-600">
                      With primary color border
                    </Text>
                  </InteractiveCard>
                </Grid>
              </Stack>

              {/* Colored Card */}
              <Stack spacing="lg">
                <Heading level="title">Colored Card (ColoredBox)</Heading>
                <Text>
                  Automatic contrast with foreground colors. Accessibility guaranteed.
                </Text>
                
                <Grid columns={2} gap="lg" className="lg:grid-cols-4">
                  <ColoredCard variant="primary">
                    <Heading level="subtitle">Primary</Heading>
                    <Text size="sm">
                      White text automatically applied
                    </Text>
                  </ColoredCard>

                  <ColoredCard variant="secondary">
                    <Heading level="subtitle">Secondary</Heading>
                    <Text size="sm">
                      Muted background with proper contrast
                    </Text>
                  </ColoredCard>

                  <ColoredCard variant="destructive">
                    <Heading level="subtitle">Destructive</Heading>
                    <Text size="sm">
                      Error states with white text
                    </Text>
                  </ColoredCard>

                  <ColoredCard variant="muted">
                    <Heading level="subtitle">Muted</Heading>
                    <Text size="sm">
                      Subtle, low-emphasis content
                    </Text>
                  </ColoredCard>
                </Grid>
              </Stack>

              {/* Metric Card */}
              <Stack spacing="lg">
                <Heading level="title">Metric Card</Heading>
                <Text>
                  Display key metrics with trends and icons.
                </Text>
                
                <Grid columns={3} gap="lg">
                  <MetricCard
                    label="Total Revenue"
                    value="$124,500"
                    subtitle="Last 30 days"
                    trend={{ value: "+12.5%", direction: "up" }}
                    icon={<TrendingUp className="w-5 h-5" />}
                  />

                  <MetricCard
                    label="Active Users"
                    value="1,234"
                    subtitle="Currently online"
                    trend={{ value: "-3.2%", direction: "down" }}
                    icon={<Heart className="w-5 h-5" />}
                  />

                  <MetricCard
                    label="Conversion Rate"
                    value="3.45%"
                    subtitle="Average this week"
                    trend={{ value: "0.0%", direction: "neutral" }}
                    icon={<Zap className="w-5 h-5" />}
                  />
                </Grid>
              </Stack>

              {/* Feature Card */}
              <Stack spacing="lg">
                <Heading level="title">Feature Card</Heading>
                <Text>
                  Highlight features with icons and optional links.
                </Text>
                
                <Grid columns={3} gap="lg">
                  <FeatureCard
                    icon={<Zap className="w-6 h-6" />}
                    title="Lightning Fast"
                    description="Optimized performance with GPU-accelerated animations and 60fps guaranteed."
                  />

                  <FeatureCard
                    icon={<Shield className="w-6 h-6" />}
                    title="Secure by Default"
                    description="Built-in security best practices and WCAG AA compliance from the ground up."
                    link={{ label: "Learn more", href: "#security" }}
                  />

                  <FeatureCard
                    icon={<Rocket className="w-6 h-6" />}
                    title="Production Ready"
                    description="Battle-tested components used in production by thousands of applications."
                    link={{ label: "Get started", href: "#docs" }}
                  />
                </Grid>
              </Stack>

              {/* Alert Card */}
              <Stack spacing="lg">
                <Heading level="title">Alert Card</Heading>
                <Text>
                  Contextual alerts with actions and dismissal.
                </Text>
                
                <Stack spacing="md">
                  {dismissedAlert !== 'info' && (
                    <AlertCard
                      variant="info"
                      title="New feature available"
                      description="We've added dark mode support. Check your settings to enable it."
                      action={{
                        label: "View settings",
                        onClick: () => alert('Navigate to settings')
                      }}
                      dismissible
                      onDismiss={() => setDismissedAlert('info')}
                    />
                  )}

                  {dismissedAlert !== 'success' && (
                    <AlertCard
                      variant="success"
                      title="Profile updated successfully"
                      description="Your changes have been saved and will be visible immediately."
                      dismissible
                      onDismiss={() => setDismissedAlert('success')}
                    />
                  )}

                  {dismissedAlert !== 'warning' && (
                    <AlertCard
                      variant="warning"
                      title="Action required"
                      description="Your subscription expires in 7 days. Renew now to avoid service interruption."
                      action={{
                        label: "Renew subscription",
                        onClick: () => alert('Navigate to billing')
                      }}
                      dismissible
                      onDismiss={() => setDismissedAlert('warning')}
                    />
                  )}

                  {dismissedAlert !== 'error' && (
                    <AlertCard
                      variant="error"
                      title="Payment failed"
                      description="We couldn't process your payment. Please update your payment method."
                      action={{
                        label: "Update payment",
                        onClick: () => alert('Navigate to payment')
                      }}
                      dismissible
                      onDismiss={() => setDismissedAlert('error')}
                    />
                  )}
                </Stack>
              </Stack>

              {/* Product Card */}
              <Stack spacing="lg">
                <Heading level="title">Product Card</Heading>
                <Text>
                  E-commerce product display with image, pricing, and badges.
                </Text>
                
                <Grid columns={3} gap="lg">
                  <ProductCard
                    image="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop"
                    imageAlt="Classic Watch"
                    title="Classic Watch"
                    description="Elegant timepiece with leather strap and Swiss movement"
                    price="$299"
                    badge="Sale"
                    onClick={() => alert('View product')}
                  />

                  <ProductCard
                    image="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop"
                    imageAlt="Designer Sunglasses"
                    title="Designer Sunglasses"
                    description="UV protection with polarized lenses and premium frame"
                    price="$159"
                    badge="New"
                    onClick={() => alert('View product')}
                  />

                  <ProductCard
                    image="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=300&fit=crop"
                    imageAlt="Leather Shoes"
                    title="Leather Shoes"
                    description="Handcrafted Italian leather with comfortable sole"
                    price="$349"
                    onClick={() => alert('View product')}
                  />
                </Grid>
              </Stack>

              {/* Testimonial Card */}
              <Stack spacing="lg">
                <Heading level="title">Testimonial Card</Heading>
                <Text>
                  Customer reviews with ratings and author details.
                </Text>
                
                <Grid columns={3} gap="lg">
                  <TestimonialCard
                    quote="This design system saved us months of development time. The accessibility features are unmatched."
                    author={{
                      name: "Sarah Chen",
                      title: "Head of Engineering",
                      avatar: "https://i.pravatar.cc/150?img=1"
                    }}
                    rating={5}
                  />

                  <TestimonialCard
                    quote="Finally, a design system that prioritizes accessibility without sacrificing aesthetics. Love it!"
                    author={{
                      name: "Marcus Rodriguez",
                      title: "Product Designer"
                    }}
                    rating={5}
                  />

                  <TestimonialCard
                    quote="The documentation is crystal clear and the components are production-ready out of the box."
                    author={{
                      name: "Emily Thompson",
                      title: "Frontend Developer",
                      avatar: "https://i.pravatar.cc/150?img=5"
                    }}
                    rating={4}
                  />
                </Grid>
              </Stack>

              {/* Accessibility Features */}
              <BaseCard elevation="medium" border="accent" padding="lg">
                <Stack spacing="md">
                  <Heading level="title">✅ Accessibility Features</Heading>
                  <Grid columns={2} gap="md">
                    <div>
                      <Text className="font-semibold">Keyboard Navigation</Text>
                      <Text size="sm" className="text-gray-600">Tab, Enter, Space all work perfectly</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">Focus Rings</Text>
                      <Text size="sm" className="text-gray-600">WCAG-compliant focus indicators</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">ARIA Labels</Text>
                      <Text size="sm" className="text-gray-600">Screen reader support built-in</Text>
                    </div>
                    <div>
                      <Text className="font-semibold">Color Contrast</Text>
                      <Text size="sm" className="text-gray-600">Automatic with ColoredBox</Text>
                    </div>
                  </Grid>
                </Stack>
              </BaseCard>

            </Stack>
          </Section>
        </Container>
      </div>
    </>
  )
}
