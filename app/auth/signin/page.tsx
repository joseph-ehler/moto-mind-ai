'use client'

export default function SignIn() {
  return (
    <main style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui',
      maxWidth: '400px',
      margin: '4rem auto'
    }}>
      <h1>Sign In</h1>
      <p>Welcome to MotoMind</p>
      <a 
        href="/api/auth/signin/google"
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          background: '#4285f4',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          marginTop: '1rem'
        }}
      >
        Sign in with Google
      </a>
    </main>
  )
}
