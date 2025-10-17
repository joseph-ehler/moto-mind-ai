/**
 * Notifications Settings Page
 * /settings/notifications
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui'
import { Mail, Bell, Shield, Loader2, CheckCircle2 } from 'lucide-react'

interface NotificationSettings {
  emailNotifications: boolean
  securityAlerts: boolean
  newDeviceLogin: boolean
  unusualActivity: boolean
  passwordChanged: boolean
  sessionExpired: boolean
}

export default function NotificationsSettingsPage() {
  const { data: session } = useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    securityAlerts: true,
    newDeviceLogin: true,
    unusualActivity: true,
    passwordChanged: true,
    sessionExpired: false,
  })

  useEffect(() => {
    if (session?.user?.email) {
      fetchPreferences()
    }
  }, [session])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/notifications')
      if (!response.ok) throw new Error('Failed to fetch preferences')
      
      const data = await response.json()
      setSettings(data.preferences)
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: settings })
      })
      
      if (!response.ok) throw new Error('Failed to save')
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose what you want to be notified about via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your account
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={() => handleToggle('emailNotifications')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Alerts
          </CardTitle>
          <CardDescription>
            Get notified about important security events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="security-alerts">All Security Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Master switch for all security notifications
              </p>
            </div>
            <Switch
              id="security-alerts"
              checked={settings.securityAlerts}
              onCheckedChange={() => handleToggle('securityAlerts')}
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="new-device">New Device Login</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when signing in from a new device
                </p>
              </div>
              <Switch
                id="new-device"
                checked={settings.newDeviceLogin}
                onCheckedChange={() => handleToggle('newDeviceLogin')}
                disabled={!settings.securityAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="unusual-activity">Unusual Activity</Label>
                <p className="text-sm text-muted-foreground">
                  Alert for suspicious login patterns
                </p>
              </div>
              <Switch
                id="unusual-activity"
                checked={settings.unusualActivity}
                onCheckedChange={() => handleToggle('unusualActivity')}
                disabled={!settings.securityAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="password-changed">Password Changed</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when your password is changed
                </p>
              </div>
              <Switch
                id="password-changed"
                checked={settings.passwordChanged}
                onCheckedChange={() => handleToggle('passwordChanged')}
                disabled={!settings.securityAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="session-expired">Session Expiration</Label>
                <p className="text-sm text-muted-foreground">
                  Notify before your session expires
                </p>
              </div>
              <Switch
                id="session-expired"
                checked={settings.sessionExpired}
                onCheckedChange={() => handleToggle('sessionExpired')}
                disabled={!settings.securityAlerts}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!isSaving && saveSuccess && <CheckCircle2 className="mr-2 h-4 w-4" />}
          {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Preferences'}
        </Button>
        {saveSuccess && (
          <span className="text-sm text-green-600 font-medium">
            Preferences saved
          </span>
        )}
      </div>

      {/* Info */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">About Security Alerts</p>
              <p>
                We recommend keeping all security alerts enabled to protect your account. 
                You can always review your security activity in the Active Sessions page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
