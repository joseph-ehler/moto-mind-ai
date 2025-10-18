'use client'

/**
 * Unified Sign-In Page
 * 
 * God-tier auth experience:
 * - Google OAuth (instant, trusted)
 * - Email magic links (passwordless)
 * - SMS magic links (mobile-first)
 * - Smart CAPTCHA (security without friction)
 * - Progressive disclosure (clean UI)
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, setupDeepLinkListener } from '@/lib/auth'
import { Capacitor } from '@capacitor/core'
import { Container, Section, Stack, Heading, Text } from '@/components/design-system'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Turnstile } from '@/components/auth/Turnstile'
import { PhoneInput } from '@/components/auth/PhoneInput'
import { Mail, Smartphone, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

type AuthMethod = 'google' | 'email' | 'sms'
type AuthState = 'idle' | 'loading' | 'success' | 'error' | 'captcha-required'

interface AuthResponse {
  success: boolean
  error?: string
  captchaRequired?: boolean
  riskLevel?: string
  message?: string
}

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State
  const [method, setMethod] = useState<AuthMethod>('google')
  const [state, setState] = useState<AuthState>('idle')
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  
  // Form inputs
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string>('')
  
  // Last login tracking
  const [lastLoginMethod, setLastLoginMethod] = useState<string | null>(null)
  const [isReturningUser, setIsReturningUser] = useState(false)
  const [checkingPreferences, setCheckingPreferences] = useState(false)
  
  // Check for error param on mount
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
      setState('error')
    }
  }, [searchParams])
  
  // Check for returning user from localStorage on mount
  useEffect(() => {
    const lastEmail = localStorage.getItem('motomind_last_email')
    if (lastEmail) {
      setEmail(lastEmail)
      checkLoginPreferences(lastEmail)
    }
  }, [])
  
  // Check login preferences when email is entered
  const checkLoginPreferences = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setLastLoginMethod(null)
      setIsReturningUser(false)
      return
    }
    
    setCheckingPreferences(true)
    
    try {
      const response = await fetch(
        `/api/auth/login-preferences?email=${encodeURIComponent(emailToCheck)}`
      )
      const data = await response.json()
      
      if (data.found && data.lastMethod) {
        setLastLoginMethod(data.lastMethod)
        setIsReturningUser(true)
        
        // Auto-switch to their last method if it's email or SMS
        if (data.lastMethod === 'email' || data.lastMethod === 'sms') {
          setMethod(data.lastMethod)
        }
      } else {
        setLastLoginMethod(null)
        setIsReturningUser(false)
      }
    } catch (err) {
      console.error('[SignIn] Error checking preferences:', err)
      // Silently fail - not critical
    } finally {
      setCheckingPreferences(false)
    }
  }
  
  // Debounced email check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (email) {
        checkLoginPreferences(email)
        // Save to localStorage for next visit
        localStorage.setItem('motomind_last_email', email)
      }
    }, 500) // Wait 500ms after user stops typing
    
    return () => clearTimeout(timer)
  }, [email])
  
  // Setup deep link listener for native OAuth callback
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    
    console.log('[SignIn] Setting up deep link listener...')
    
    let listenerHandle: any = null
    
    const setupListener = async () => {
      listenerHandle = await setupDeepLinkListener(
        () => {
          console.log('[SignIn] OAuth success! Redirecting...')
          setState('success')
          setSuccessMessage('Signed in successfully!')
          router.push('/dashboard')
        },
        (error) => {
          console.error('[SignIn] OAuth error:', error)
          setError(error.message || 'Failed to sign in')
          setState('error')
        }
      )
    }
    
    setupListener()
    
    return () => {
      if (listenerHandle) {
        listenerHandle.remove()
      }
    }
  }, [router])
  
  // Reset state
  const resetState = () => {
    setState('idle')
    setError('')
    setSuccessMessage('')
    setCaptchaToken('')
  }

  // Google OAuth
  const handleGoogleSignIn = async () => {
    setState('loading')
    setError('')
    
    try {
      await signIn()
      // Will redirect to Google
    } catch (err: any) {
      console.error('[SignIn] Google error:', err)
      setError(err.message || 'Failed to sign in with Google')
      setState('error')
    }
  }

  // Email Magic Link
  const handleEmailSignIn = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setState('loading')
    setError('')
    
    try {
      const response = await fetch('/api/auth/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          captchaToken: captchaToken || undefined,
        }),
      })
      
      const result: AuthResponse = await response.json()
      
      if (result.captchaRequired && !captchaToken) {
        setState('captcha-required')
        return
      }
      
      if (result.success) {
        setState('success')
        setSuccessMessage(result.message || 'Check your email for the magic link!')
        setEmail('')
      } else {
        setError(result.error || 'Failed to send email')
        setState('error')
      }
    } catch (err: any) {
      console.error('[SignIn] Email error:', err)
      setError(err.message || 'Something went wrong')
      setState('error')
    }
  }

  // SMS Magic Link
  const handleSmsSignIn = async () => {
    if (!phone) {
      setError('Please enter your phone number')
      return
    }

    // Format phone to E.164 if needed
    const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`

    setState('loading')
    setError('')
    
    try {
      const response = await fetch('/api/auth/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: formattedPhone,
          captchaToken: captchaToken || undefined,
        }),
      })
      
      const result: AuthResponse = await response.json()
      
      if (result.captchaRequired && !captchaToken) {
        setState('captcha-required')
        return
      }
      
      if (result.success) {
        setState('success')
        setSuccessMessage(result.message || 'Check your phone for the verification code!')
        // Redirect to SMS verification page
        router.push(`/auth/verify-sms?phone=${encodeURIComponent(formattedPhone)}`)
      } else {
        setError(result.error || 'Failed to send SMS')
        setState('error')
      }
    } catch (err: any) {
      console.error('[SignIn] SMS error:', err)
      setError(err.message || 'Something went wrong')
      setState('error')
    }
  }

  // Handle CAPTCHA verification
  const handleCaptchaVerify = (token: string) => {
    console.log('[SignIn] CAPTCHA verified')
    setCaptchaToken(token)
    setState('idle')
  }

  const handleCaptchaError = () => {
    setError('CAPTCHA verification failed. Please try again.')
    setState('error')
  }

  // Get Turnstile site key from env
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

  const isLoading = state === 'loading'
  const showCaptcha = state === 'captcha-required' && turnstileSiteKey

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Container size="md">
        <Section spacing="xl">
          <Stack spacing="xl" className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center">
              <Heading level="hero" className="mb-2">
                {isReturningUser ? 'Welcome back!' : 'Welcome to MotoMind'}
              </Heading>
              <Text className="text-gray-600">
                Sign in to track your rides and manage your motorcycles
              </Text>
            </div>

            {/* Welcome back message for returning users */}
            {isReturningUser && lastLoginMethod && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    We remember you!
                  </p>
                  <p className="text-xs text-blue-700">
                    You last signed in with{' '}
                    <span className="font-semibold">
                      {lastLoginMethod === 'google' && 'Google'}
                      {lastLoginMethod === 'email' && 'Email'}
                      {lastLoginMethod === 'sms' && 'SMS'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Choose your preferred sign-in method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Stack spacing="lg">
                  {/* Google OAuth - Always first */}
                  <div>
                    <Button
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="w-full"
                      size="lg"
                      variant="outline"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  {/* Magic Links Tabs */}
                  <Tabs defaultValue="email" onValueChange={(v) => {
                    setMethod(v as AuthMethod)
                    resetState()
                  }}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="email">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </TabsTrigger>
                      <TabsTrigger value="sms">
                        <Smartphone className="w-4 h-4 mr-2" />
                        SMS
                      </TabsTrigger>
                    </TabsList>

                    {/* Email Tab */}
                    <TabsContent value="email">
                      <Stack spacing="md">
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEmailSignIn()}
                            disabled={isLoading}
                          />
                        </div>

                        {showCaptcha && (
                          <Turnstile
                            siteKey={turnstileSiteKey}
                            onVerify={handleCaptchaVerify}
                            onError={handleCaptchaError}
                            theme="auto"
                          />
                        )}

                        <Button
                          onClick={handleEmailSignIn}
                          disabled={isLoading || !email}
                          className="w-full"
                        >
                          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Send Magic Link
                        </Button>
                      </Stack>
                    </TabsContent>

                    {/* SMS Tab */}
                    <TabsContent value="sms">
                      <Stack spacing="md">
                        <PhoneInput
                          value={phone}
                          onChange={setPhone}
                          disabled={isLoading}
                          label="Phone Number"
                          placeholder="(555) 123-4567"
                        />
                        <Text className="text-xs text-gray-500 -mt-2">
                          We'll send you a 6-digit verification code
                        </Text>

                        {showCaptcha && (
                          <Turnstile
                            siteKey={turnstileSiteKey}
                            onVerify={handleCaptchaVerify}
                            onError={handleCaptchaError}
                            theme="auto"
                          />
                        )}

                        <Button
                          onClick={handleSmsSignIn}
                          disabled={isLoading || !phone}
                          className="w-full"
                        >
                          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Send Verification Code
                        </Button>
                      </Stack>
                    </TabsContent>
                  </Tabs>

                  {/* Success Message */}
                  {state === 'success' && successMessage && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-800">{successMessage}</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {state === 'error' && error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {/* CAPTCHA Required Message */}
                  {state === 'captcha-required' && !showCaptcha && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        Security check required. Please configure Turnstile to continue.
                      </p>
                    </div>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Footer */}
            <Text className="text-center text-sm text-gray-500">
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </Text>
          </Stack>
        </Section>
      </Container>
    </div>
  )
}
