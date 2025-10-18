'use client'

import { useState } from 'react'
import { AuthForm } from '@/components/auth/AuthForm'
import { Button } from '@/components/ui'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold">
          {mode === 'signin' ? 'Log in' : 'Sign up'}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b">
        <button
          onClick={() => setMode('signin')}
          className={`flex-1 py-4 text-center font-medium transition-colors relative ${
            mode === 'signin'
              ? 'text-foreground'
              : 'text-muted-foreground'
          }`}
        >
          Sign In
          {mode === 'signin' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setMode('signup')}
          className={`flex-1 py-4 text-center font-medium transition-colors relative ${
            mode === 'signup'
              ? 'text-foreground'
              : 'text-muted-foreground'
          }`}
        >
          Sign Up
          {mode === 'signup' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto p-6">
          <AuthForm 
            mode={mode} 
            callbackUrl="/track" 
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-sm text-muted-foreground border-t">
        <p>
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline hover:text-foreground">
            Terms
          </a>
          {' & '}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}
