'use client'

/**
 * Email Verification Page
 * 
 * Verifies user's email using token from email link
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Section, Stack, Heading } from '@/components/design-system'
import { Card, CardContent, Button } from '@/components/ui'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

type VerificationState = 'verifying' | 'success' | 'error'

export default function VerifyEmailPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [state, setState] = useState<VerificationState>('verifying')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    verifyEmail()
  }, [token])

  const verifyEmail = async () => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setState('success')
        setEmail(data.email)
        
        // Redirect to sign-in after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin?verified=true')
        }, 3000)
      } else {
        setState('error')
        setError(data.error || 'Verification failed')
      }
    } catch (err) {
      setState('error')
      setError('Something went wrong. Please try again.')
    }
  }

  // Verifying state
  if (state === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex items-center justify-center">
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Verifying your email</h2>
                <p className="text-sm text-muted-foreground">Please wait...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (state === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
        <Container size="sm" useCase="forms">
          <Section spacing="xl">
            <div className="py-32">
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Email Verified!</h2>
                    <p className="text-muted-foreground">
                      Your email <strong>{email}</strong> has been successfully verified.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Redirecting to sign in...
                    </p>
                  </div>

                  <Link href="/auth/signin">
                    <Button className="w-full">
                      Continue to Sign In
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </Section>
        </Container>
      </div>
    )
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
      <Container size="sm" useCase="forms">
        <Section spacing="xl">
          <div className="py-32">
            <Card className="border-0 shadow-2xl">
              <CardContent className="p-8 text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Verification Failed</h2>
                  <p className="text-muted-foreground">
                    {error || 'This verification link is invalid or has expired.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <Link href="/api/auth/verify-email/resend" className="block">
                    <Button variant="outline" className="w-full">
                      Resend Verification Email
                    </Button>
                  </Link>
                  
                  <Link href="/auth/signin" className="block">
                    <Button variant="ghost" className="w-full">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>
      </Container>
    </div>
  )
}
