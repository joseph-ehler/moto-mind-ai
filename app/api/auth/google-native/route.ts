/**
 * Google Native Auth Backend Exchange
 * 
 * Exchanges Google ID token for Supabase session.
 * This runs on the backend with service role access,
 * avoiding nonce issues that happen client-side.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with SERVICE ROLE
// This bypasses RLS and can properly handle token exchange
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { idToken, serverAuthCode } = await request.json()
    
    console.log('[Native Auth API] 📥 Received auth request')
    console.log('[Native Auth API] Has ID token:', !!idToken)
    console.log('[Native Auth API] Has server auth code:', !!serverAuthCode)
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing idToken' },
        { status: 400 }
      )
    }

    // Exchange Google ID token for Supabase session
    // Backend can handle this without nonce issues
    console.log('[Native Auth API] 🔄 Exchanging with Supabase...')
    
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    })

    if (error) {
      console.error('[Native Auth API] ❌ Supabase error:', error.message)
      console.error('[Native Auth API] Error details:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('[Native Auth API] ✅ Session created for:', data.user?.email)

    // Return the session tokens
    return NextResponse.json({
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
        expires_in: data.session?.expires_in,
      },
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name || data.user?.user_metadata?.full_name,
        avatar: data.user?.user_metadata?.avatar_url || data.user?.user_metadata?.picture,
      }
    })

  } catch (error: any) {
    console.error('[Native Auth API] ❌ Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    )
  }
}
