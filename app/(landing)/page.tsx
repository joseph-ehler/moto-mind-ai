'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Container, Section, Stack, Heading, Text } from '@/components/design-system'
import { Button } from '@/components/ui'
import { Car, MapPin, Smartphone } from 'lucide-react'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/track')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <div className="flex items-center justify-center min-h-screen">
            <Text>Loading...</Text>
          </div>
        </Section>
      </Container>
    )
  }

  if (status === 'authenticated') {
    return null // Will redirect
  }

  return (
    <Container size="md" useCase="articles">
      <Section spacing="lg">
        <div className="min-h-screen flex flex-col justify-center py-12">
          <Stack spacing="xl">
            {/* Hero Section */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Car className="h-16 w-16 text-primary" />
                </div>
              </div>
              
              <Heading level="hero" className="mb-4">
                Welcome to MotoMind
              </Heading>
              
              <Text className="text-xl text-muted-foreground mb-8">
                Automatic vehicle tracking that just works.
                <br />
                Never forget where you parked again.
              </Text>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              <div className="text-center p-6 bg-card rounded-lg border">
                <MapPin className="h-10 w-10 mx-auto mb-4 text-primary" />
                <Heading level="subtitle" className="mb-2">
                  Auto-Track Trips
                </Heading>
                <Text size="sm" className="text-muted-foreground">
                  Automatically tracks your drives when connected to CarPlay
                </Text>
              </div>

              <div className="text-center p-6 bg-card rounded-lg border">
                <Car className="h-10 w-10 mx-auto mb-4 text-primary" />
                <Heading level="subtitle" className="mb-2">
                  Find Your Car
                </Heading>
                <Text size="sm" className="text-muted-foreground">
                  Never forget where you parked with automatic location saving
                </Text>
              </div>

              <div className="text-center p-6 bg-card rounded-lg border">
                <Smartphone className="h-10 w-10 mx-auto mb-4 text-primary" />
                <Heading level="subtitle" className="mb-2">
                  Works Everywhere
                </Heading>
                <Text size="sm" className="text-muted-foreground">
                  Web, iOS, and Android. One app, all platforms
                </Text>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => router.push('/auth/signin')}
                className="w-full sm:w-auto px-8"
              >
                Sign In
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/auth/signin')}
                className="w-full sm:w-auto px-8"
              >
                Create Account
              </Button>
            </div>

            {/* Additional Info */}
            <div className="text-center mt-8">
              <Text size="sm" className="text-muted-foreground">
                Sign in with your Google account to get started
              </Text>
            </div>
          </Stack>
        </div>
      </Section>
    </Container>
  )
}
