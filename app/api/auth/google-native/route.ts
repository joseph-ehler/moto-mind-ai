/**
 * Google Native SDK Backend Handler
 * 
 * Exchanges Google ID token for NextAuth session
 * Creates user in database if needed
 */

import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { getSupabaseClient } from '@/lib/supabase/client'
import { cookies } from 'next/headers'
import { encode } from 'next-auth/jwt'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const supabase = getSupabaseClient()

export async function POST(request: NextRequest) {
  try {
    const {  idToken, email, name, imageUrl, googleId } = await request.json()
    
    console.log('[Google Native API] Received token for:', email)
    
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    
    const payload = ticket.getPayload()
    
    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: 'Invalid Google token' },
        { status: 401 }
      )
    }
    
    console.log('[Google Native API] ✅ Token verified:', payload.email)
    
    // Upsert user in database
    const { data: user, error: upsertError } = await supabase
      .from('user_tenants')
      .upsert({
        email: payload.email,
        name: name || payload.name,
        avatar_url: imageUrl || payload.picture,
        email_verified: payload.email_verified || false,
        provider: 'google',
        provider_id: googleId || payload.sub,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select('id, email, name, avatar_url')
      .single()
    
    if (upsertError) {
      console.error('[Google Native API] ❌ Database error:', upsertError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }
    
    console.log('[Google Native API] ✅ User upserted:', user.id)
    
    // Create NextAuth session token
    const sessionToken = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
        picture: user.avatar_url
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })
    
    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/'
    })
    
    console.log('[Google Native API] ✅ Session created')
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatar_url
      }
    })
    
  } catch (error: any) {
    console.error('[Google Native API] ❌ Error:', error)
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    )
  }
}
