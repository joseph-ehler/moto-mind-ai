/**
 * Test Environment Setup
 * 
 * Sets up environment variables and mocks for tests
 */

// Set test environment variables
process.env.RESEND_API_KEY = 'test-resend-key'
process.env.RESEND_FROM_EMAIL = 'test@example.com'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NEXTAUTH_URL = 'http://localhost:3005'
process.env.NEXTAUTH_SECRET = 'test-secret-key'
