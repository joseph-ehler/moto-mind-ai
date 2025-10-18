/**
 * Active Sessions Page
 * /settings/sessions
 * 
 * Shows all active sessions with device info and sign out options
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Container, Section, Stack, Heading, Text } from '@/components/design-system'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui'
import { Loader2, Monitor, Smartphone, Tablet, MapPin, Clock, Shield, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Session {
  id: string
  deviceInfo: {
    deviceName: string
    browser: string
    browserVersion: string
    os: string
    osVersion: string
    deviceType: string
  }
  ipAddress: string
  location: {
    country: string
    city: string
    flag: string
  } | null
  lastActive: string
  createdAt: string
  isCurrent?: boolean
}

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isTerminating, setIsTerminating] = useState(false)
  const [terminatingId, setTerminatingId] = useState<string | null>(null)
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('')

  // Get user ID from session
  const { data: session } = useSession()
  const userId = session?.user?.email || ''

  useEffect(() => {
    // Get device ID from cookie
    const deviceId = document.cookie
      .split('; ')
      .find(row => row.startsWith('device_id='))
      ?.split('=')[1]
    
    if (deviceId) {
      setCurrentDeviceId(deviceId)
    }
  }, [])

  useEffect(() => {
    if (userId) {
      fetchSessions()
    }
  }, [userId])

  const fetchSessions = async () => {
    if (!userId) return

    try {
      const response = await fetch(`/api/auth/sessions?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()

      // Mark current session by device_id
      const sessionsWithCurrent = data.sessions.map((s: Session) => ({
        ...s,
        isCurrent: s.deviceInfo.deviceName && currentDeviceId ? 
          s.id.includes(currentDeviceId) || s.deviceInfo.deviceName === 'Current Device' :
          false
      }))

      setSessions(sessionsWithCurrent)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      setError('Failed to load sessions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    setTerminatingId(sessionId)
    
    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId))
      }
    } catch (error) {
      console.error('Failed to terminate session:', error)
    } finally {
      setTerminatingId(null)
    }
  }

  const handleTerminateAllOthers = async () => {
    setIsTerminating(true)

    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        // Refresh sessions to show updated list
        await fetchSessions()
      }
    } catch (error) {
      console.error('Failed to terminate sessions:', error)
    } finally {
      setIsTerminating(false)
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-8 w-8" />
      case 'tablet':
        return <Tablet className="h-8 w-8" />
      default:
        return <Monitor className="h-8 w-8" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Container size="md" useCase="articles">
        <Section spacing="xl">
          <div className="py-12">
            <Stack spacing="xl">
              {/* Header */}
              <div className="space-y-2">
                <Heading level="hero">Active Sessions</Heading>
                <Text className="text-muted-foreground">
                  Manage devices that are signed in to your account
                </Text>
              </div>

              {/* Security Notice */}
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-orange-900">
                        Review your active sessions
                      </p>
                      <p className="text-sm text-orange-700">
                        If you see a session you don't recognize, sign it out immediately and change your password.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sign Out All Button */}
              {sessions.length > 1 && (
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={handleTerminateAllOthers}
                    disabled={isTerminating}
                  >
                    {isTerminating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing out...
                      </>
                    ) : (
                      `Sign out all other devices (${sessions.length - 1})`
                    )}
                  </Button>
                </div>
              )}

              {/* Sessions List */}
              <div className="space-y-4">
                {sessions.map((session) => (
                  <Card key={session.id} className={session.isCurrent ? 'border-green-200 bg-green-50/50' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {/* Device Icon */}
                          <div className={`rounded-lg p-3 ${
                            session.isCurrent 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {getDeviceIcon(session.deviceInfo.deviceType)}
                          </div>

                          {/* Device Info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">
                                {session.deviceInfo.deviceName}
                              </CardTitle>
                              {session.isCurrent && (
                                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                                  Current device
                                </span>
                              )}
                            </div>
                            <CardDescription>
                              {session.deviceInfo.browser} {session.deviceInfo.browserVersion} • {' '}
                              {session.deviceInfo.os} {session.deviceInfo.osVersion}
                            </CardDescription>
                          </div>
                        </div>

                        {/* Sign Out Button */}
                        {!session.isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTerminateSession(session.id)}
                            disabled={terminatingId === session.id}
                          >
                            {terminatingId === session.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing out...
                              </>
                            ) : (
                              'Sign out'
                            )}
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Location */}
                      {session.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {session.location.flag} {session.location.city}, {session.location.country}
                          </span>
                        </div>
                      )}

                      {/* IP Address */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span>IP: {session.ipAddress}</span>
                      </div>

                      {/* Last Active */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          Last active {formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })}
                        </span>
                      </div>

                      {/* First Seen */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          First seen {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {sessions.length === 0 && (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <CardTitle className="mb-2">No active sessions</CardTitle>
                    <CardDescription>
                      You don't have any active sessions at the moment.
                    </CardDescription>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </div>
        </Section>
      </Container>
    </div>
  )
}
