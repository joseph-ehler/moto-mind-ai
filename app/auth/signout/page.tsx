'use client'

/**
 * Sign Out Confirmation Page
 * 
 * Friendly confirmation after user signs out
 */

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Container, Section, Stack, Heading } from '@/components/design-system'
import { Card, CardContent, Button } from '@/components/ui'
import { LogOut } from 'lucide-react'
import Link from 'next/link'

export default function SignOutPage() {
  useEffect(() => {
    // Sign out when page loads
    signOut({ redirect: false })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
      <Container size="sm" useCase="forms">
        <Section spacing="xl">
          <div className="py-32">
            <Stack spacing="xl">
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <LogOut className="h-8 w-8 text-purple-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">You've been signed out</h2>
                    <p className="text-muted-foreground">
                      Thanks for using MotoMind. See you next time!
                    </p>
                  </div>

                  <div className="space-y-3 pt-4">
                    <Link href="/auth/signin" className="block">
                      <Button className="w-full">
                        Sign in again
                      </Button>
                    </Link>
                    
                    <Link href="/" className="block">
                      <Button variant="outline" className="w-full">
                        Go to homepage
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </Stack>
          </div>
        </Section>
      </Container>
    </div>
  )
}
