'use client'

/**
 * Insights Page
 * 
 * AI-powered analytics and cost intelligence
 * - Spending trends
 * - Predictive maintenance
 * - Cost comparisons
 * - Service history timeline
 */

import React from 'react'
import { Container, Section, Stack, Card, Heading, Text } from '@/components/design-system'
import { TrendingUp } from 'lucide-react'
import { AppNavigation } from '@/components/app/AppNavigation'

export default function InsightsPage() {
  return (
    <>
      <AppNavigation />
      
      <Container size="lg" useCase="dashboard">
        <Section spacing="lg">
          <Stack spacing="xl">
            <Stack spacing="sm">
              <Heading level="hero">Insights</Heading>
              <Text className="text-gray-600">
                AI-powered analytics and cost intelligence for your vehicles
              </Text>
            </Stack>

            <Card>
              <Section spacing="lg">
                <Stack spacing="md" className="items-center text-center">
                  <TrendingUp className="w-12 h-12 text-blue-600" />
                  <Heading level="title">Coming Soon</Heading>
                  <Text className="text-gray-600 max-w-prose">
                    Deep analytics, spending trends, and AI predictions will appear here.
                  </Text>
                </Stack>
              </Section>
            </Card>
          </Stack>
        </Section>
      </Container>

      <div className="h-20 md:h-0" />
    </>
  )
}
