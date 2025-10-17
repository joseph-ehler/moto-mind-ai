/**
 * Heroes Showcase
 * 
 * STRICTLY follows MotoMind Layout System
 * Proper Container widths (md for content, lg only with override)
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
  BaseCard,
  MarketingHero,
  PageHero,
  DashboardHero,
  FeatureHero,
  EmptyStateHero
} from '@/components/design-system'
import { Rocket, Car, Plus, Camera, Inbox } from 'lucide-react'

export default function HeroesShowcasePage() {
  return (
    <>
      <Head>
        <title>Heroes - MotoMind Design System</title>
        <meta name="description" content="Hero components for marketing and internal pages" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Page Intro */}
        <Container size="md" useCase="articles">
          <Section spacing="xl">
            <Stack spacing="lg" className="text-center">
              <Heading level="hero">Hero Components</Heading>
              <Text size="xl" className="text-gray-600 max-w-2xl mx-auto">
                Marketing and internal heroes. All use proper Container widths (md default).
              </Text>
            </Stack>
          </Section>
        </Container>

        {/* Marketing Hero - Centered */}
        <div className="border-t pt-16">
          <MarketingHero
            badge="New Feature"
            headline="Build faster with MotoMind"
            subheadline="A comprehensive design system with accessibility built-in. From simple forms to complex dashboards."
            primaryCTA={{
              label: "Get Started",
              onClick: () => alert('Get started!')
            }}
            secondaryCTA={{
              label: "View Docs",
              onClick: () => alert('View docs')
            }}
            visual={
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                <Rocket className="w-24 h-24 text-primary" />
              </div>
            }
            layout="centered"
          />
        </div>

        {/* Marketing Hero - Split */}
        <div className="border-t pt-16">
          <MarketingHero
            headline="Track your fleet effortlessly"
            subheadline="Complete vehicle management with maintenance tracking, document storage, and timeline history."
            primaryCTA={{
              label: "Start Free Trial",
              onClick: () => alert('Trial!')
            }}
            secondaryCTA={{
              label: "Watch Demo",
              onClick: () => alert('Demo')
            }}
            visual={
              <div className="aspect-square bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center">
                <Car className="w-32 h-32 text-blue-600" />
              </div>
            }
            layout="split"
          />
        </div>

        {/* Page Hero */}
        <div className="border-t pt-16">
          <PageHero
            breadcrumbs={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Vehicles', href: '/vehicles' },
              { label: '2024 Toyota Camry' }
            ]}
            icon={<Car className="w-6 h-6" />}
            title="2024 Toyota Camry"
            description="Track maintenance, view history, and manage documents for this vehicle."
            actions={
              <>
                <button className="px-4 py-2 border rounded-lg font-medium">
                  Edit
                </button>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
                  Add Event
                </button>
              </>
            }
          />

          <Container size="md" useCase="articles">
            <Section spacing="md">
              <BaseCard padding="lg">
                <Text>Page content goes here...</Text>
              </BaseCard>
            </Section>
          </Container>
        </div>

        {/* Dashboard Hero */}
        <div className="border-t pt-16">
          <DashboardHero
            title="Fleet Overview"
            description="Monitor your entire fleet at a glance"
            metrics={[
              { label: 'Total Vehicles', value: '24', change: '+2', trend: 'up' },
              { label: 'Active', value: '22', change: '0', trend: 'neutral' },
              { label: 'Maintenance Due', value: '3', change: '-1', trend: 'down' }
            ]}
            actions={
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
                Add Vehicle
              </button>
            }
          />

          <Container size="md" useCase="articles">
            <Section spacing="md">
              <BaseCard padding="lg">
                <Text>Dashboard content...</Text>
              </BaseCard>
            </Section>
          </Container>
        </div>

        {/* Feature Hero */}
        <div className="border-t pt-16">
          <FeatureHero
            badge="Beta"
            feature="OCR Scanning"
            headline="Scan documents instantly"
            description="Use your phone camera to capture and extract data from vehicle documents, receipts, and registration papers."
            cta={{
              label: "Try it now",
              onClick: () => alert('Try scanning!')
            }}
            visual={
              <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                <Camera className="w-24 h-24 text-purple-600" />
              </div>
            }
          />

          <Container size="md" useCase="articles">
            <Section spacing="md">
              <BaseCard padding="lg">
                <Text>Feature details...</Text>
              </BaseCard>
            </Section>
          </Container>
        </div>

        {/* Empty State Hero */}
        <div className="border-t pt-16">
          <EmptyStateHero
            icon={<Inbox className="w-12 h-12" />}
            title="No vehicles yet"
            description="Start by adding your first vehicle to track maintenance, store documents, and view history."
            action={{
              label: "Add Your First Vehicle",
              onClick: () => alert('Add vehicle!')
            }}
            secondaryAction={{
              label: "Import from CSV",
              onClick: () => alert('Import!')
            }}
          />
        </div>

        {/* Design System Rules */}
        <div className="border-t pt-16">
          <Container size="md" useCase="articles">
            <Section spacing="xl">
              <Stack spacing="lg">
                <Heading level="title">✅ Design System Rules Followed</Heading>
                
                <Grid columns={2} gap="md">
                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <Text className="font-semibold">Container Widths</Text>
                      <Text size="sm" className="text-gray-600">
                        • md (default) for content
                        <br />
                        • lg only with override
                        <br />
                        • Proper useCase specified
                      </Text>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <Text className="font-semibold">Layout Components</Text>
                      <Text size="sm" className="text-gray-600">
                        • Section for spacing
                        <br />
                        • Stack for vertical
                        <br />
                        • Grid/Flex for layouts
                      </Text>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <Text className="font-semibold">Typography</Text>
                      <Text size="sm" className="text-gray-600">
                        • Heading with levels
                        <br />
                        • Text with sizes
                        <br />
                        • No raw HTML elements
                      </Text>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <Text className="font-semibold">Accessibility</Text>
                      <Text size="sm" className="text-gray-600">
                        • Focus rings on buttons
                        <br />
                        • Proper contrast
                        <br />
                        • Semantic HTML
                      </Text>
                    </Stack>
                  </BaseCard>
                </Grid>
              </Stack>
            </Section>
          </Container>
        </div>
      </div>
    </>
  )
}
