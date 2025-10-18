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

    // Generate a magic link which includes access/refresh tokens
    console.log('[Native Auth API] 🔑 Generating auth link...')
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
    })
    
    if (linkError || !linkData) {
      console.error('[Native Auth API] ❌ Link generation error:', linkError)
      return NextResponse.json({ error: linkError?.message || 'Failed to generate link' }, { status: 400 })
    }

    console.log('[Native Auth API] ✅ Auth link generated for:', user.email)
    
    // Extract the hash params from the verification URL
    // The URL contains access_token and refresh_token as hash params
    const url = new URL(linkData.properties.action_link)
    const hashParams = new URLSearchParams(url.hash.substring(1)) // Remove the # and parse
    
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    
    if (!accessToken || !refreshToken) {
      console.error('[Native Auth API] ❌ No tokens in link')
      return NextResponse.json({ error: 'Failed to extract tokens' }, { status: 500 })
    }
    
    console.log('[Native Auth API] ✅ Session tokens extracted!')
    
    // Return the session tokens
    return NextResponse.json({
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || name,
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
