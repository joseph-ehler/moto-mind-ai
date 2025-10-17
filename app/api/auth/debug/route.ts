/**
 * Debug API for Auth System
 * GET /api/auth/debug
 * 
 * Tests all auth components and reports status
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLastLoginMethod, trackLogin } from '@/lib/auth/services/login-preferences'

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

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: {}
  }

  try {
    // 1. Check if user_login_preferences table exists
    const { data: tables, error: tableError } = await supabase
      .from('user_login_preferences')
      .select('*')
      .limit(1)

    results.checks.table_exists = {
      status: !tableError ? 'PASS' : 'FAIL',
      error: tableError?.message,
      hint: tableError ? 'Run migration: 20251017_01_auth_enhancements_day1_fixed.sql' : null
    }

    // 2. Check if we can write to the table
    const testEmail = `test-${Date.now()}@example.com`
    const trackResult = await trackLogin(testEmail, 'google')
    
    results.checks.can_write = {
      status: trackResult.success ? 'PASS' : 'FAIL',
      error: trackResult.error,
      test_email: testEmail
    }

    // 3. Check if we can read from the table
    const readResult = await getLastLoginMethod(testEmail)
    
    results.checks.can_read = {
      status: readResult === 'google' ? 'PASS' : 'FAIL',
      expected: 'google',
      actual: readResult,
      hint: readResult !== 'google' ? 'Read function may have issues' : null
    }

    // 4. Clean up test data
    await supabase
      .from('user_login_preferences')
      .delete()
      .eq('user_id', testEmail)

    // 5. Check auth_rate_limits table
    const { error: rateLimitError } = await supabase
      .from('auth_rate_limits')
      .select('*')
      .limit(1)

    results.checks.rate_limits_table = {
      status: !rateLimitError ? 'PASS' : 'FAIL',
      error: rateLimitError?.message
    }

    // 6. Check environment variables
    results.checks.environment = {
      status: 'INFO',
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nextauth_url: !!process.env.NEXTAUTH_URL,
      nextauth_secret: !!process.env.NEXTAUTH_SECRET
    }

    // Summary
    const allPassed = Object.values(results.checks)
      .filter((check: any) => check.status !== 'INFO')
      .every((check: any) => check.status === 'PASS')

    results.summary = {
      all_tests_passed: allPassed,
      total_checks: Object.keys(results.checks).length,
      passed: Object.values(results.checks).filter((c: any) => c.status === 'PASS').length,
      failed: Object.values(results.checks).filter((c: any) => c.status === 'FAIL').length
    }

    return NextResponse.json(results, { status: allPassed ? 200 : 500 })

  } catch (error) {
    return NextResponse.json({
      error: 'Debug check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      results
    }, { status: 500 })
  }
}
