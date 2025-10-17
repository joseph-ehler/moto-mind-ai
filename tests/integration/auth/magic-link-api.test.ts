/**
 * Magic Link API Integration Tests
 * 
 * Tests for /api/auth/magic-link/send and /api/auth/magic-link/verify
 */

import { POST as sendMagicLink } from '@/app/api/auth/magic-link/send/route'
import { POST as verifyMagicLink } from '@/app/api/auth/magic-link/verify/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/auth/services/magic-link-service')
jest.mock('@/lib/auth/services/rate-limiter')

const magicLinkService = require('@/lib/auth/services/magic-link-service')
const rateLimiter = require('@/lib/auth/services/rate-limiter')

describe('Magic Link API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    rateLimiter.getClientIp.mockReturnValue('127.0.0.1')
  })

  describe('POST /api/auth/magic-link/send', () => {
    it('should send magic link successfully', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60000)
      
      magicLinkService.createMagicLink.mockResolvedValue({
        success: true,
        token: 'test-token-123',
        expiresAt
      })

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link/send', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' })
      })

      const response = await sendMagicLink(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.expiresAt).toBeDefined()
      expect(data.message).toContain('sent')
      
      expect(magicLinkService.createMagicLink).toHaveBeenCalledWith(
        'test@example.com',
        '127.0.0.1'
      )
    })

    it('should return 400 if email is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/magic-link/send', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await sendMagicLink(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Email is required')
    })

    it('should return 429 when rate limited', async () => {
      magicLinkService.createMagicLink.mockResolvedValue({
        success: false,
        error: 'Too many magic link requests. Please try again in 45 minutes.'
      })

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link/send', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' })
      })

      const response = await sendMagicLink(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Too many')
    })

    it('should handle service errors', async () => {
      magicLinkService.createMagicLink.mockRejectedValue(
        new Error('Service error')
      )

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link/send', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' })
      })

      const response = await sendMagicLink(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to send')
    })
  })

  describe('POST /api/auth/magic-link/verify', () => {
    it('should verify valid token successfully', async () => {
      magicLinkService.verifyMagicLink.mockResolvedValue({
        success: true,
        email: 'test@example.com'
      })

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link/verify', {
        method: 'POST',
        body: JSON.stringify({ token: 'valid-token' })
      })

      const response = await verifyMagicLink(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.email).toBe('test@example.com')
      expect(data.message).toContain('verified')
      
      expect(magicLinkService.verifyMagicLink).toHaveBeenCalledWith(
        'valid-token',
        '127.0.0.1'
      )
    })

    it('should return 400 if token is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/magic-link/verify', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await verifyMagicLink(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Token is required')
      expect(data.errorCode).toBe('INVALID')
    })

    it('should return 410 for expired token', async () => {
      magicLinkService.verifyMagicLink.mockResolvedValue({
        success: false,
        error: 'This link has expired',
        errorCode: 'EXPIRED'
      })

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link/verify', {
        method: 'POST',
        body: JSON.stringify({ token: 'expired-token' })
      })

      const response = await verifyMagicLink(request)
      const data = await response.json()

      expect(response.status).toBe(410) // Gone
      expect(data.success).toBe(false)
      expect(data.errorCode).toBe('EXPIRED')
    })

    it('should return 400 for used token', async () => {
      magicLinkService.verifyMagicLink.mockResolvedValue({
        success: false,
        error: 'This link has already been used',
        errorCode: 'USED'
      })

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link/verify', {
        method: 'POST',
        body: JSON.stringify({ token: 'used-token' })
      })

      const response = await verifyMagicLink(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errorCode).toBe('USED')
    })

    it('should return 400 for invalid token', async () => {
      magicLinkService.verifyMagicLink.mockResolvedValue({
        success: false,
        error: 'Invalid or expired link',
        errorCode: 'INVALID'
      })

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link/verify', {
        method: 'POST',
        body: JSON.stringify({ token: 'invalid-token' })
      })

      const response = await verifyMagicLink(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errorCode).toBe('INVALID')
    })

    it('should handle service errors', async () => {
      magicLinkService.verifyMagicLink.mockRejectedValue(
        new Error('Service error')
      )

      const request = new NextRequest('http://localhost:3000/api/auth/magic-link/verify', {
        method: 'POST',
        body: JSON.stringify({ token: 'test-token' })
      })

      const response = await verifyMagicLink(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.errorCode).toBe('INVALID')
    })
  })

  describe('Complete Magic Link Flow', () => {
    it('should complete full send → verify flow', async () => {
      const token = 'complete-flow-token'
      const email = 'test@example.com'
      const expiresAt = new Date(Date.now() + 15 * 60000)

      // Step 1: Send magic link
      magicLinkService.createMagicLink.mockResolvedValue({
        success: true,
        token,
        expiresAt
      })

      const sendRequest = new NextRequest('http://localhost:3000/api/auth/magic-link/send', {
        method: 'POST',
        body: JSON.stringify({ email })
      })

      const sendResponse = await sendMagicLink(sendRequest)
      const sendData = await sendResponse.json()

      expect(sendData.success).toBe(true)

      // Step 2: Verify magic link
      magicLinkService.verifyMagicLink.mockResolvedValue({
        success: true,
        email
      })

      const verifyRequest = new NextRequest('http://localhost:3000/api/auth/magic-link/verify', {
        method: 'POST',
        body: JSON.stringify({ token })
      })

      const verifyResponse = await verifyMagicLink(verifyRequest)
      const verifyData = await verifyResponse.json()

      expect(verifyData.success).toBe(true)
      expect(verifyData.email).toBe(email)
    })

    it('should reject second verification attempt (one-time use)', async () => {
      const token = 'one-time-token'

      // First verification - success
      magicLinkService.verifyMagicLink.mockResolvedValueOnce({
        success: true,
        email: 'test@example.com'
      })

      const request1 = new NextRequest('http://localhost:3000/api/auth/magic-link/verify', {
        method: 'POST',
        body: JSON.stringify({ token })
      })

      const response1 = await verifyMagicLink(request1)
      const data1 = await response1.json()

      expect(data1.success).toBe(true)

      // Second verification - should fail (already used)
      magicLinkService.verifyMagicLink.mockResolvedValueOnce({
        success: false,
        error: 'This link has already been used',
        errorCode: 'USED'
      })

      const request2 = new NextRequest('http://localhost:3000/api/auth/magic-link/verify', {
        method: 'POST',
        body: JSON.stringify({ token })
      })

      const response2 = await verifyMagicLink(request2)
      const data2 = await response2.json()

      expect(data2.success).toBe(false)
      expect(data2.errorCode).toBe('USED')
    })
  })
})
