/**
 * Magic Links Test Page
 * 
 * Simple UI for testing email and phone magic links
 * Navigate to: http://localhost:3005/test-magic-links
 */

'use client'

import { useState } from 'react'
import { Container, Stack, Heading, Text } from '@/components/design-system'
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Mail, Phone, Loader2, CheckCircle2, XCircle } from 'lucide-react'

export default function TestMagicLinksPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [emailResult, setEmailResult] = useState<any>(null)
  const [phoneResult, setPhoneResult] = useState<any>(null)

  const testEmail = async () => {
    if (!email) {
      alert('Please enter an email address')
      return
    }

    setEmailLoading(true)
    setEmailResult(null)

    try {
      const response = await fetch('/api/auth/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      setEmailResult(data)
    } catch (error: any) {
      setEmailResult({ success: false, error: error.message })
    } finally {
      setEmailLoading(false)
    }
  }

  const testPhone = async () => {
    if (!phone) {
      alert('Please enter a phone number')
      return
    }

    setPhoneLoading(true)
    setPhoneResult(null)

    try {
      const response = await fetch('/api/auth/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()
      setPhoneResult(data)
    } catch (error: any) {
      setPhoneResult({ success: false, error: error.message })
    } finally {
      setPhoneLoading(false)
    }
  }

  return (
    <Container size="md">
      <Stack spacing="xl" className="py-12">
        <div>
          <Heading level="hero">🧪 Magic Links Test Lab</Heading>
          <Text className="text-gray-600 mt-2">
            Test email and phone magic link authentication
          </Text>
        </div>

        {/* Email Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Magic Link
            </CardTitle>
            <CardDescription>
              Send a magic link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Stack spacing="md">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && testEmail()}
                  className="flex-1"
                />
                <Button
                  onClick={testEmail}
                  disabled={emailLoading || !email}
                >
                  {emailLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Email'
                  )}
                </Button>
              </div>

              {emailResult && (
                <div className={`p-4 rounded-lg ${
                  emailResult.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-2">
                    {emailResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        emailResult.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {emailResult.success ? 'Success!' : 'Error'}
                      </p>
                      <p className={`text-sm mt-1 ${
                        emailResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {emailResult.message || emailResult.error}
                      </p>
                      {emailResult.rateLimitInfo && (
                        <p className="text-xs mt-2 text-gray-600">
                          Rate limit: {emailResult.rateLimitInfo.remaining} attempts remaining
                        </p>
                      )}
                      {emailResult.success && (
                        <p className="text-xs mt-2 font-medium text-green-800">
                          📧 Check your inbox for the magic link!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Phone Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Magic Link (SMS)
            </CardTitle>
            <CardDescription>
              Send a verification code to your phone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Stack spacing="md">
              <div className="flex gap-2">
                <Input
                  type="tel"
                  placeholder="+12025551234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && testPhone()}
                  className="flex-1"
                />
                <Button
                  onClick={testPhone}
                  disabled={phoneLoading || !phone}
                >
                  {phoneLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send SMS'
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                ⚠️ Requires Twilio phone number. Format: +1234567890 (E.164)
              </p>

              {phoneResult && (
                <div className={`p-4 rounded-lg ${
                  phoneResult.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-2">
                    {phoneResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        phoneResult.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {phoneResult.success ? 'Success!' : 'Error'}
                      </p>
                      <p className={`text-sm mt-1 ${
                        phoneResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {phoneResult.message || phoneResult.error}
                      </p>
                      {phoneResult.formattedPhone && (
                        <p className="text-xs mt-2 text-gray-600">
                          Sent to: {phoneResult.formattedPhone}
                        </p>
                      )}
                      {phoneResult.rateLimitInfo && (
                        <p className="text-xs mt-2 text-gray-600">
                          Rate limit: {phoneResult.rateLimitInfo.remaining} attempts remaining
                        </p>
                      )}
                      {phoneResult.success && (
                        <p className="text-xs mt-2 font-medium text-green-800">
                          📱 Check your phone for the 6-digit code!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack spacing="sm" className="text-sm text-blue-800">
              <div>
                <strong>Email (Resend):</strong> Already configured ✅
              </div>
              <div>
                <strong>Phone (Twilio):</strong> Need to complete setup
                <ol className="list-decimal ml-6 mt-2 space-y-1">
                  <li>Go to Twilio Console</li>
                  <li>Buy a phone number with SMS (~$1/month)</li>
                  <li>Add to .env.local: TWILIO_PHONE_NUMBER=+1234567890</li>
                  <li>Restart dev server</li>
                  <li>If trial: Verify recipient phone in console</li>
                </ol>
              </div>
              <div>
                <strong>Database:</strong> Run migration first
                <pre className="bg-blue-100 p-2 rounded mt-1 text-xs">
                  npm run db:migrate
                </pre>
              </div>
            </Stack>
          </CardContent>
        </Card>

        {/* Documentation Link */}
        <div className="text-center">
          <Text className="text-sm text-gray-600">
            See <strong>docs/MAGIC_LINKS_TESTING_GUIDE.md</strong> for detailed testing instructions
          </Text>
        </div>
      </Stack>
    </Container>
  )
}
