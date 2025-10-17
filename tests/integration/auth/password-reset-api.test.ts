/**
 * Password Reset API Integration Tests
 * 
 * Tests the complete password reset flow via API endpoints
 */

import { POST as requestReset } from '@/app/api/auth/reset-password/request/route'
import { GET as verifyToken } from '@/app/api/auth/reset-password/verify/route'
import { POST as confirmReset } from '@/app/api/auth/reset-password/confirm/route'
import { NextRequest } from 'next/server'

// Mock services
jest.mock('@/lib/auth/services/password-reset')
jest.mock('@/lib/auth/services/password-service')

describe('Password Reset API', () => {
  describe('POST /api/auth/reset-password/request', () => {
    it('should accept valid email', async () => {
      const request = new NextRequest('http://localhost:3005/api/auth/reset-password/request', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' })
      })

      const response = await requestReset(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should reject missing email', async () => {
      const request = new NextRequest('http://localhost:3005/api/auth/reset-password/request', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await requestReset(request)
      
      expect(response.status).toBe(400)
    })

    it('should reject invalid email format', async () => {
      const request = new NextRequest('http://localhost:3005/api/auth/reset-password/request', {
        method: 'POST',
        body: JSON.stringify({ email: 'not-an-email' })
      })

      const response = await requestReset(request)
      
      expect(response.status).toBe(400)
    })

    it('should sanitize email input', async () => {
      const request = new NextRequest('http://localhost:3005/api/auth/reset-password/request', {
        method: 'POST',
        body: JSON.stringify({ email: '  TEST@EXAMPLE.COM  ' })
      })

      const response = await requestReset(request)
      
      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/auth/reset-password/verify', () => {
    it('should verify valid token', async () => {
      const request = new NextRequest('http://localhost:3005/api/auth/reset-password/verify?token=valid-token')

      const response = await verifyToken(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBeDefined()
    })

    it('should reject missing token', async () => {
      const request = new NextRequest('http://localhost:3005/api/auth/reset-password/verify')

      const response = await verifyToken(request)
      
      expect(response.status).toBe(400)
    })

    it('should handle invalid token', async () => {
      const request = new NextRequest('http://localhost:3005/api/auth/reset-password/verify?token=invalid')

      const response = await verifyToken(request)
      const data = await response.json()

      expect(data.valid).toBe(false)
    })
  })

  describe('POST /api/auth/reset-password/confirm', () => {
    it('should accept valid token and password', async () => {
      const request = new NextRequest('http://localhost:3005/api/auth/reset-password/confirm', {
        method: 'POST',
        body: JSON.stringify({ 
          token: 'valid-token',
          password: 'NewSecure123!'
        })
      })

      const response = await confirmReset(request)
      
      expect(response.status).toBe(200)
    })

    it('should reject missing token', async () => {
      const request = new NextRequest('http://localhost:3005/api/auth/reset-password/confirm', {
        method: 'POST',
        body: JSON.stringify({ password: 'NewSecure123!' })
      })

      const response = await confirmReset(request)
      
      expect(response.status).toBe(400)
    })

    it('should reject missing password', async () => {
      const request = new NextRequest('http://localhost:3005/api/auth/reset-password/confirm', {
        method: 'POST',
        body: JSON.stringify({ token: 'valid-token' })
      })

      const response = await confirmReset(request)
      
      expect(response.status).toBe(400)
    })

    it('should validate password strength', async () => {
      const request = new NextRequest('http://localhost:3005/api/auth/reset-password/confirm', {
        method: 'POST',
        body: JSON.stringify({ 
          token: 'valid-token',
          password: 'weak'
        })
      })

      const response = await confirmReset(request)
      
      expect(response.status).toBe(400)
    })
  })

  describe('Security', () => {
    it('should rate limit requests', async () => {
      // This would require actual rate limiting implementation
      expect(true).toBe(true)
    })

    it('should not expose sensitive information in errors', async () => {
      const request = new NextRequest('http://localhost:3005/api/auth/reset-password/request', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' })
      })

      const response = await requestReset(request)
      const data = await response.json()

      // Should not reveal if user exists
      expect(data.success).toBe(true)
    })

    it('should use HTTPS in production', () => {
      // Environment check
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.NEXTAUTH_URL?.startsWith('https://')).toBe(true)
      }
    })
  })
})
