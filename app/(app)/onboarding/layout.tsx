/**
 * Onboarding Layout
 * Wraps onboarding flow with progress tracking
 */

import { Container, Section } from '@/components/design-system'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Container size="md">
        <Section spacing="xl">
          {children}
        </Section>
      </Container>
    </div>
  )
}
