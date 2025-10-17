/**
 * Security Settings Page
 * /settings/security
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui'
import { Shield, Key, Smartphone, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function SecuritySettingsPage() {
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
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">New sign-in detected</p>
                <p className="text-xs text-muted-foreground">
                  Today at 9:33 AM from San Francisco, United States
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center pt-2">
              No suspicious activity detected
            </p>
          </div>
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
