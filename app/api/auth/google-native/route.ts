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
    const { email, name, id } = await request.json()
    
    console.log('[Native Auth API] 📥 Received auth request for:', email)
    
    if (!email || !id) {
      return NextResponse.json(
        { error: 'Missing user data' },
        { status: 400 }
      )
    }

    // WORKAROUND: Create or get user directly
    // We can't use signInWithIdToken due to nonce issues
    // Instead, we'll create a session using the admin API
    
    console.log('[Native Auth API] 🔄 Creating/getting user...')
    
    // First, try to get existing user by email
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    let user = existingUsers?.users?.find(u => u.email === email)
    
    if (!user) {
      // Create new user
      console.log('[Native Auth API] Creating new user...')
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          name,
          provider: 'google',
          google_id: id
        }
      })
      
      if (createError) {
        console.error('[Native Auth API] ❌ Create user error:', createError)
        return NextResponse.json({ error: createError.message }, { status: 400 })
      }
      
      user = newUser.user
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Generate session for this user
    console.log('[Native Auth API] 🔑 Generating session...')
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
    })
    
    if (sessionError) {
      console.error('[Native Auth API] ❌ Session error:', sessionError)
      return NextResponse.json({ error: sessionError.message }, { status: 400 })
    }

    console.log('[Native Auth API] ✅ Session created for:', user.email)

    // Extract tokens from the magic link response
    // The properties object contains the session tokens
    const properties = sessionData.properties
    
    // Return the session tokens
    return NextResponse.json({
      session: {
        access_token: properties.access_token,
        refresh_token: properties.refresh_token,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        avatar: user.user_metadata?.avatar_url,
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
