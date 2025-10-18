/**
 * Settings Layout
 * 
 * Layout for all settings pages with navigation tabs
 */

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Container, Section, Stack, Heading } from '@/components/design-system'
import { Button } from '@/components/ui'
import { User, Shield, Bell, Key } from 'lucide-react'

const settingsTabs = [
  {
    name: 'Profile',
    href: '/settings/profile',
    icon: User,
    description: 'Manage your account settings'
  },
  {
    name: 'Security',
    href: '/settings/security',
    icon: Shield,
    description: 'Password, 2FA, and security settings'
  },
  {
    name: 'Active Sessions',
    href: '/settings/sessions',
    icon: Key,
    description: 'Manage devices and active sessions'
  },
  {
    name: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
    description: 'Email and security alerts'
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      <Container size="md" useCase="articles">
        <Section spacing="xl">
          <div className="py-12">
            <Stack spacing="xl">
              {/* Header */}
              <div className="space-y-2">
                <Heading level="hero">Settings</Heading>
                <p className="text-muted-foreground">
                  Manage your account settings and preferences
                </p>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b">
                <nav className="flex gap-4 overflow-x-auto pb-px">
                  {settingsTabs.map((tab) => {
                    const isActive = pathname === tab.href
                    const Icon = tab.icon

                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        className={`
                          flex items-center gap-2 px-4 py-3 border-b-2 transition-colors
                          whitespace-nowrap
                          ${isActive 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                          }
                        `}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{tab.name}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* Page Content */}
              <div className="mt-6">
                {children}
              </div>
            </Stack>
          </div>
        </Section>
      </Container>
    </div>
  )
}
