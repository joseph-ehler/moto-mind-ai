'use client'

/**
 * SMS Verification Page
 * 
 * Handles SMS magic link verification (6-digit code)
 * URL: /auth/verify-sms?phone=...
 */

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Stack, Heading, Text } from '@/components/design-system'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react'

export default function VerifySmsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone') || ''
  
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string>('')
  const [resending, setResending] = useState(false)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Auto-focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  // Handle code input
  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when complete
    if (value && index === 5) {
      const fullCode = [...newCode.slice(0, 5), value].join('')
      verifyCode(fullCode)
    }
  }

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setCode(newCode)
      verifyCode(pastedData)
    }
  }

  // Verify code
  const verifyCode = async (fullCode: string) => {
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setStatus('verifying')
    setError('')

    try {
      // TODO: Implement SMS verification endpoint
      // For now, simulate verification
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simulate success
      setStatus('success')
      setTimeout(() => {
        router.push('/track')
      }, 1500)
    } catch (err: any) {
      console.error('[VerifySms] Error:', err)
      setStatus('error')
      setError(err.message || 'Invalid verification code. Please try again.')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }

  // Resend code
  const handleResend = async () => {
    if (!phone) {
      setError('Phone number missing')
      return
    }

    setResending(true)
    setError('')

    try {
      const response = await fetch('/api/auth/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const result = await response.json()

      if (result.success) {
        setStatus('idle')
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        setError(result.error || 'Failed to resend code')
      }
    } catch (err: any) {
      console.error('[VerifySms] Resend error:', err)
      setError(err.message || 'Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  const formatPhone = (phone: string) => {
    // Format +12025551234 as +1 (202) 555-1234
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  const isVerifying = status === 'verifying'
  const isSuccess = status === 'success'
  const isError = status === 'error'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Container size="md">
        <Stack spacing="xl" className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Smartphone className="w-8 h-8 text-blue-600" />
            </div>
            <Heading level="title">Verify Your Phone</Heading>
            <Text className="text-gray-600 mt-2">
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-gray-900">
                {formatPhone(phone)}
              </span>
            </Text>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Enter Verification Code</CardTitle>
              <CardDescription>
                Check your text messages for the code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Stack spacing="lg">
                {/* Code Input */}
                <div 
                  className="flex gap-2 justify-center"
                  onPaste={handlePaste}
                >
                  {code.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={isVerifying || isSuccess}
                      className="w-12 h-12 text-center text-lg font-semibold"
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Status Messages */}
                {isVerifying && (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <Text className="text-sm">Verifying...</Text>
                  </div>
                )}

                {isSuccess && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">Success!</p>
                      <p className="text-sm text-green-700">Redirecting to your dashboard...</p>
                    </div>
                  </div>
                )}

                {isError && error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Resend Button */}
                {!isSuccess && (
                  <div className="text-center">
                    <Text className="text-sm text-gray-600 mb-2">
                      Didn't receive a code?
                    </Text>
                    <Button
                      onClick={handleResend}
                      disabled={resending}
                      variant="ghost"
                      size="sm"
                    >
                      {resending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Resend Code
                    </Button>
                  </div>
                )}

                {/* Back Button */}
                <Button
                  onClick={() => router.push('/signin')}
                  variant="outline"
                  className="w-full"
                  disabled={isVerifying}
                >
                  Use Different Method
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Help Text */}
          <Text className="text-center text-xs text-gray-500">
            Standard messaging rates may apply
          </Text>
        </Stack>
      </Container>
    </div>
  )
}
