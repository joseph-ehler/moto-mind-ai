'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The verification token has expired or has already been used.',
    Default: 'An error occurred during authentication.',
  }

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

  return (
    <main style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui',
      maxWidth: '600px',
      margin: '4rem auto'
    }}>
      <h1 style={{ color: '#e53e3e' }}>Authentication Error</h1>
      <p style={{ marginTop: '1rem' }}>{message}</p>
      
      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        background: '#f7fafc',
        borderRadius: '4px',
        fontSize: '0.875rem'
      }}>
        <p><strong>Error Code:</strong> {error || 'Unknown'}</p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Debug Info:</strong> Check the server logs for more details.
        </p>
      </div>

      <a 
        href="/auth/signin"
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          background: '#4285f4',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          marginTop: '2rem'
        }}
      >
        Try Again
      </a>
    </main>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
