/**
 * Design System Page Template
 * 
 * Copy this template for any new page to ensure design system compliance
 */

import React from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  Grid,
  Flex,
  Card,
  Button,
  Heading,
  Text,
  MetricCard
} from '@/components/design-system'

interface PageProps {
  // Define your props here
}

export default function TemplatePage({}: PageProps) {
  return (
    <>
      <Head>
        <title>Page Title - MotoMind</title>
        <meta name="description" content="Page description" />
      </Head>

      {/* 🚨 MANDATORY: All content must be wrapped in Container */}
      <Container size="md" useCase="articles"> {/* Adjust useCase as needed */}
        
        {/* 🚨 MANDATORY: Use Section for consistent spacing */}
        <Section spacing="lg">
          
          {/* 🚨 MANDATORY: Use Stack for vertical rhythm */}
          <Stack spacing="xl">
            
            {/* 🚨 MANDATORY: Use Heading component, not raw HTML */}
            <div className="text-center">
              <Heading level="hero">Page Title</Heading>
              <Text className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                Page description or subtitle
              </Text>
            </div>

            {/* Example: Content sections */}
            <Stack spacing="lg">
              
              {/* Example: Card grid */}
              <div>
                <Heading level="title">Section Title</Heading>
                <Text className="mt-2 mb-6">Section description</Text>
                
                <Grid columns="auto" gap="md">
                  <Card className="p-6">
                    <Stack spacing="md">
                      <Heading level="subtitle">Card Title</Heading>
                      <Text>Card content goes here</Text>
                      <Button>Action</Button>
                    </Stack>
                  </Card>
                  
                  <Card className="p-6">
                    <Stack spacing="md">
                      <Heading level="subtitle">Card Title</Heading>
                      <Text>Card content goes here</Text>
                      <Button variant="outline">Action</Button>
                    </Stack>
                  </Card>
                </Grid>
              </div>

              {/* Example: Metrics dashboard */}
              <div>
                <Heading level="title">Metrics</Heading>
                <Grid columns="dashboard" gap="md" className="mt-6">
                  <MetricCard
                    title="Total Users"
                    value="1,234"
                    trend={{ value: '+12%', direction: 'up' }}
                  />
                  <MetricCard
                    title="Revenue"
                    value="$12,345"
                    trend={{ value: '+8%', direction: 'up' }}
                  />
                  <MetricCard
                    title="Growth"
                    value="23%"
                    trend={{ value: '-2%', direction: 'down' }}
                  />
                </Grid>
              </div>

              {/* Example: Two-column layout */}
              <Grid columns={2} gap="xl">
                <Stack spacing="md">
                  <Heading level="subtitle">Left Column</Heading>
                  <Text>Left column content</Text>
                </Stack>
                
                <Stack spacing="md">
                  <Heading level="subtitle">Right Column</Heading>
                  <Text>Right column content</Text>
                </Stack>
              </Grid>

              {/* Example: Action buttons */}
              <Flex justify="center" gap="md">
                <Button variant="primary">Primary Action</Button>
                <Button variant="outline">Secondary Action</Button>
              </Flex>

            </Stack>
          </Stack>
        </Section>
      </Container>
    </>
  )
}

/* 
🚨 DESIGN SYSTEM CHECKLIST:
✅ All imports from @/components/design-system
✅ Container wraps all content
✅ Proper useCase specified
✅ No raw HTML headings/paragraphs
✅ No manual spacing classes
✅ Layout uses Grid/Stack/Flex components
✅ Typography uses Heading/Text components
✅ UX rules respected (md container for consumer content)
✅ Semantic structure maintained
*/
