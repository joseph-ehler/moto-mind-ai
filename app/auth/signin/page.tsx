'use client'

import { signIn } from 'next-auth/react'

export default function SignIn() {
  const handleSignIn = async () => {
    console.log('Sign in button clicked')
    try {
      const result = await signIn('google', { 
        callbackUrl: '/',
        redirect: true 
      })
      console.log('SignIn result:', result)
    } catch (error) {
      console.error('SignIn error:', error)
    }
  }

  return (
    <main style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui',
      maxWidth: '400px',
      margin: '4rem auto'
    }}>
      <h1>Sign In</h1>
      <p>Welcome to MotoMind</p>
      <button 
        onClick={handleSignIn}
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          background: '#4285f4',
          color: 'white',
          textDecoration: 'none',
          border: 'none',
          borderRadius: '4px',
          marginTop: '1rem',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Sign in with Google
      </button>
    </main>
  )
}
