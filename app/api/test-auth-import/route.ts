import { NextResponse } from 'next/server'

export async function GET() {
  const results: any = {
    supabaseServer: 'not tested',
    authOptions: 'not tested',
    error: null
  }
  
  try {
    // Test 1: Can we import getSupabaseServer?
    const { getSupabaseServer } = await import('@/lib/supabase-server')
    results.supabaseServer = 'imported successfully'
    
    // Test 2: Can we call getSupabaseServer?
    try {
      const client = getSupabaseServer()
      results.supabaseServer = 'client created successfully'
    } catch (error) {
      results.supabaseServer = `client creation failed: ${error}`
    }
    
    // Test 3: Can we import authOptions?
    try {
      const { authOptions } = await import('@/features/auth')
      results.authOptions = 'imported successfully'
    } catch (error) {
      results.authOptions = `import failed: ${error}`
    }
    
    return NextResponse.json({
      status: 'completed',
      results,
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      results,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
