/**
 * Security Settings Page
 * /settings/security
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui'
import { Shield, Key, Smartphone, AlertTriangle, Loader2, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface SecurityEvent {
  type: string
  title: string
  description: string
  timestamp: string
  severity: 'info' | 'warning' | 'danger'
  location: {
    city: string | null
    country: string | null
    flag: string | null
  } | null
}

export default function SecuritySettingsPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      fetchSecurityEvents()
    }
  }, [session])

  const fetchSecurityEvents = async () => {
    try {
      const response = await fetch('/api/user/security-events')
      if (!response.ok) throw new Error('Failed to fetch events')
      
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error('Failed to fetch security events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
      case 'danger':
        return <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      default:
        return <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
    }
  }
  return (
    <div className="space-y-6">
      {/* Password */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Password
              </CardTitle>
              <CardDescription>
                Change your password or reset it
              </CardDescription>
            </div>
            <Link href="/auth/reset-password">
              <Button variant="outline" size="sm">
                Change Password
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Last changed: Never (Google OAuth only)
          </p>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled>
              Enable 2FA
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              🚧 Coming soon: Authenticator app support (TOTP)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Alerts
          </CardTitle>
          <CardDescription>
            Recent security events on your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getSeverityIcon(event.severity)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </span>
                      {event.location && event.location.city && (
                        <span>
                          {event.location.flag} {event.location.city}, {event.location.country}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No security events recorded
            </p>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions Link */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="font-semibold">Manage Active Sessions</p>
              <p className="text-sm text-muted-foreground">
                See all devices where you're signed in and sign out remotely
              </p>
            </div>
            <Link href="/settings/sessions">
              <Button size="sm">
                View Sessions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
