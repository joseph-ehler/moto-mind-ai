/**
 * Profile Settings Page
 * /settings/profile
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name: string
  createdAt: string
  loginMethod: string
  loginCount: number
  lastLogin: string
}

export default function ProfileSettingsPage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')
      
      const data = await response.json()
      setProfile(data.profile)
      setName(data.profile.name)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      
      if (!response.ok) throw new Error('Failed to save')
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save profile:', error)
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
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ''}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isSaving && saveSuccess && <CheckCircle2 className="mr-2 h-4 w-4" />}
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
            </Button>
            {saveSuccess && (
              <span className="text-sm text-green-600 font-medium">
                Changes saved successfully
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>
            Your account activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Login Method</p>
              <p className="text-lg font-semibold capitalize">
                {profile?.loginMethod || 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Logins</p>
              <p className="text-lg font-semibold">
                {profile?.loginCount || 0}
              </p>
            </div>
            <div className="space-y-1 col-span-2">
              <p className="text-sm text-muted-foreground">Last Login</p>
              <p className="text-lg font-semibold">
                {profile?.lastLogin 
                  ? new Date(profile.lastLogin).toLocaleString()
                  : 'Never'
                }
              </p>
            </div>
            <div className="space-y-1 col-span-2">
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-lg font-semibold">
                {profile?.createdAt 
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : 'Unknown'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
