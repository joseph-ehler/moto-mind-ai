'use client'

/**
 * Unified Authentication Form
 * 
 * shadcn/ui implementation with 3 methods:
 * - Google OAuth
 * - Magic Link (email)
 * - Credentials (username/password)
 */

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Input,
  Label,
  Separator
} from '@/components/ui'
import { Mail, Loader2 } from 'lucide-react'
import { PasswordInput } from './PasswordInput'
import { WelcomeBack } from './ui/WelcomeBack'
import { RateLimitMessage } from './ui/RateLimitMessage'
import { registerUser } from '@/lib/auth/services/user-registration'
import { validatePassword } from '@/lib/auth/services/password-service'
import { useLastLogin, saveLastLoginMethod } from '@/lib/auth/hooks/useLastLogin'
import { useLastUser, saveLastUserEmail } from '@/lib/auth/hooks/useLastUser'
import type { LoginMethod } from '@/lib/auth/services/login-preferences'

type AuthMode = 'signin' | 'signup' | 'magic-link'

interface AuthFormProps {
  mode?: AuthMode
  callbackUrl?: string
}

export function AuthForm({ mode: initialMode = 'signin', callbackUrl }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [rateLimited, setRateLimited] = useState<{
    active: boolean
    retryAfterMinutes: number
    type: 'login' | 'reset' | 'verify' | 'magic_link'
  } | null>(null)

  // Track last user (instant - no email needed)
  const { email: lastEmail, lastMethod: lastUserMethod } = useLastUser()
  
  // Track last login method for current email
  const { lastMethod, loading: loadingLastMethod } = useLastLogin(email)
  
  // Pre-fill email if we have a last user
  useEffect(() => {
    if (lastEmail && !email) {
      setEmail(lastEmail)
    }
  }, [lastEmail]) // Only run once on mount

  // Use last user's method if no email entered yet, otherwise use current
  const displayMethod = email ? lastMethod : lastUserMethod

  // Debug logging
  useEffect(() => {
    console.log('[AuthForm Debug]', {
      email,
      lastEmail,
      lastMethod,
      lastUserMethod,
      displayMethod,
      loadingLastMethod,
      hasEmail: !!email
    })
  }, [email, lastEmail, lastMethod, lastUserMethod, displayMethod, loadingLastMethod])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    try {
      // Save method and email before redirect
      if (email) {
        saveLastLoginMethod(email, 'google')
        saveLastUserEmail(email)
      }
      await signIn('google', { callbackUrl: callbackUrl || '/dashboard' })
    } catch (err) {
      setError('Failed to sign in with Google')
      setIsLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: callbackUrl || '/dashboard',
      })

      if (result?.error) {
        setError('Failed to send magic link')
      } else {
        saveLastLoginMethod(email, 'email')
        saveLastUserEmail(email)
        setMagicLinkSent(true)
      }
    } catch (err) {
      setError('Failed to send magic link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setRateLimited(null)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: callbackUrl || '/dashboard',
      })

      if (result?.error) {
        // Check if it's a rate limit error
        if (result.error.includes('Too many')) {
          const match = result.error.match(/(\d+) minutes/)
          const minutes = match ? parseInt(match[1]) : 15
          setRateLimited({
            active: true,
            retryAfterMinutes: minutes,
            type: 'login'
          })
        } else {
          setError('Invalid email or password')
        }
      } else if (result?.url) {
        saveLastLoginMethod(email, 'credentials')
        saveLastUserEmail(email)
        window.location.href = result.url
      }
    } catch (err) {
      setError('Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const validation = validatePassword(password)
    if (!validation.valid) {
      setError(validation.errors[0])
      setIsLoading(false)
      return
    }

    try {
      const result = await registerUser({ email, password, name })

      if (!result.success) {
        setError(result.error || 'Failed to create account')
        setIsLoading(false)
        return
      }

      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: callbackUrl || '/dashboard',
      })

      if (signInResult?.error) {
        setError('Account created but sign in failed. Please try signing in.')
      } else if (signInResult?.url) {
        saveLastLoginMethod(email, 'credentials')
        saveLastUserEmail(email)
        window.location.href = signInResult.url
      }
    } catch (err) {
      setError('Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  // Magic Link Sent State
  if (magicLinkSent) {
    return (
      <Card>
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription className="text-base">
            We sent a magic link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Click the link in the email to sign in. The link expires in 10 minutes.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setMagicLinkSent(false)
              setEmail('')
            }}
          >
            Send another link
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Welcome Back Message */}
      {displayMethod && !loadingLastMethod && (
        <WelcomeBack 
          email={email || lastEmail!} 
          lastMethod={displayMethod} 
          className="mb-4" 
        />
      )}

      {/* Google OAuth Button */}
      <Button
        variant={displayMethod === 'google' ? 'default' : 'outline'}
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        {displayMethod === 'google' && <span className="mr-2">✓</span>}
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      {/* Forms */}
      {mode === 'magic-link' ? (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading || !email}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Sending...' : 'Send Magic Link'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="underline hover:text-primary"
            >
              Sign in with password
            </button>
          </p>
        </form>
      ) : mode === 'signup' ? (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <PasswordInput
            value={password}
            onChange={setPassword}
            label="Password"
            required
            showStrength
            autoComplete="new-password"
            disabled={isLoading}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading || !email || !password}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="underline hover:text-primary"
            >
              Sign in
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleCredentialsSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <PasswordInput
              value={password}
              onChange={setPassword}
              label="Password"
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
            <div className="text-right">
              <a 
                href="/auth/reset-password" 
                className="text-sm text-muted-foreground hover:text-primary underline"
              >
                Forgot password?
              </a>
            </div>
          </div>

          {rateLimited?.active && (
            <RateLimitMessage 
              retryAfterMinutes={rateLimited.retryAfterMinutes}
              type={rateLimited.type}
            />
          )}

          {error && !rateLimited?.active && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !email || !password || rateLimited?.active}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="space-y-2 text-center text-sm">
            <p className="text-muted-foreground">
              <button
                type="button"
                onClick={() => setMode('magic-link')}
                className="underline hover:text-primary"
              >
                Use magic link instead
              </button>
            </p>

            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="underline hover:text-primary"
              >
                Sign up
              </button>
            </p>
          </div>
        </form>
      )}
    </div>
  )
}
