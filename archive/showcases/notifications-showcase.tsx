import React from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  BaseCard,
  InlineAlert,
  NotificationBadge,
  NotificationCenter,
  NotificationBell,
  SystemBanner,
  type Notification
} from '@/components/design-system'

export default function NotificationsShowcasePage() {
  const [showSystemBanner, setShowSystemBanner] = React.useState(true)
  const [showNotificationCenter, setShowNotificationCenter] = React.useState(false)

  // Sample notifications with grouping and priorities
  const [notifications, setNotifications] = React.useState<Notification[]>([
    // URGENT PRIORITY
    {
      id: '1',
      title: 'Critical: Engine overheating detected',
      message: 'Your Honda Civic engine temperature is dangerously high. Pull over immediately.',
      timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
      read: false,
      variant: 'error',
      priority: 'urgent',
      group: 'Alerts',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
      actions: [
        { label: 'View Details', onClick: () => alert('Engine details'), variant: 'primary' },
        { label: 'Call Support', onClick: () => alert('Calling...') }
      ]
    },
    
    // HIGH PRIORITY - GROUPED
    {
      id: '2',
      title: 'Oil change overdue',
      message: 'Your Honda Civic is 200 miles past the recommended oil change',
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      read: false,
      variant: 'warning',
      priority: 'high',
      group: 'Maintenance Reminders',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      actions: [
        { label: 'Schedule Service', onClick: () => alert('Scheduling...'), variant: 'primary' }
      ]
    },
    {
      id: '3',
      title: 'Tire rotation due',
      message: 'Toyota Camry needs tire rotation at 45,000 miles',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      variant: 'warning',
      priority: 'high',
      group: 'Maintenance Reminders',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    },
    {
      id: '4',
      title: 'Brake inspection recommended',
      message: 'Ford F-150 has reached 30,000 miles - brake inspection suggested',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      read: true,
      variant: 'warning',
      priority: 'normal',
      group: 'Maintenance Reminders',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    },

    // NORMAL PRIORITY
    {
      id: '5',
      title: 'Document uploaded successfully',
      message: 'Your insurance document has been uploaded and verified',
      timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
      read: false,
      variant: 'success',
      priority: 'normal',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    {
      id: '6',
      title: 'Trip completed',
      message: 'Your 45-mile trip to San Francisco has been logged',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: true,
      variant: 'info',
      priority: 'normal',
      group: 'Trip Updates',
      actions: [
        { label: 'View Report', onClick: () => alert('Report'), variant: 'primary' }
      ]
    },
    {
      id: '7',
      title: 'Trip started',
      message: 'Your trip to Oakland has begun',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      read: true,
      variant: 'info',
      priority: 'low',
      group: 'Trip Updates'
    },
    
    // LOW PRIORITY
    {
      id: '8',
      title: 'Weekly summary available',
      message: 'Your weekly mileage and fuel report is ready to view',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true,
      variant: 'info',
      priority: 'low'
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      <Head>
        <title>Notifications & Alerts - MotoMind Design System</title>
        <meta name="description" content="Comprehensive notification and alert components" />
      </Head>

      {/* System Banner at top */}
      {showSystemBanner && (
        <SystemBanner
          variant="info"
          message="🎉 New feature: Real-time vehicle diagnostics are now available!"
          action={{
            label: 'Learn More',
            onClick: () => alert('Learn more clicked')
          }}
          onDismiss={() => setShowSystemBanner(false)}
          position="top"
          sticky={true}
        />
      )}

      <div className="min-h-screen bg-slate-50">
        <Container size="md" useCase="articles">
          <Section spacing="xl">
            <Stack spacing="2xl">
              
              {/* Page Title */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-black mb-4">Notifications & Alerts</h1>
                <p className="text-lg text-black/60">Keep users informed with comprehensive notification system</p>
              </div>

              {/* 1. Inline Alerts */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">1. Inline Alerts</h2>
                <p className="text-sm text-black/60">Contextual alerts for page sections and forms</p>
                
                <Stack spacing="md">
                  <InlineAlert
                    variant="info"
                    title="Information"
                    message="Your vehicle data has been synced successfully."
                    dismissible
                  />

                  <InlineAlert
                    variant="success"
                    title="Success!"
                    message="Your maintenance schedule has been updated."
                    actions={[
                      { label: 'View Schedule', onClick: () => alert('View'), variant: 'primary' },
                      { label: 'Dismiss', onClick: () => {} }
                    ]}
                    dismissible
                  />

                  <InlineAlert
                    variant="warning"
                    title="Warning"
                    message="Your insurance documents will expire in 30 days. Please upload new documents."
                    actions={[
                      { label: 'Upload Now', onClick: () => alert('Upload'), variant: 'primary' }
                    ]}
                  />

                  <InlineAlert
                    variant="error"
                    title="Error"
                    message="Failed to sync vehicle data. Please check your internet connection and try again."
                    actions={[
                      { label: 'Retry', onClick: () => alert('Retry'), variant: 'primary' },
                      { label: 'Contact Support', onClick: () => {} }
                    ]}
                    dismissible
                  />
                </Stack>
              </Stack>

              {/* 2. Notification Badge */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">2. Notification Badges</h2>
                <p className="text-sm text-black/60">Count indicators and status dots</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="md">
                    <div>
                      <h3 className="text-sm font-semibold text-black mb-4">Count Badges</h3>
                      <div className="flex items-center gap-6 flex-wrap">
                        <NotificationBadge count={5} variant="primary" size="sm" />
                        <NotificationBadge count={12} variant="success" size="md" />
                        <NotificationBadge count={150} variant="error" size="lg" max={99} />
                        <NotificationBadge count={3} variant="warning" />
                        <NotificationBadge count={0} variant="neutral" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-black mb-4">Dot Indicators</h3>
                      <div className="flex items-center gap-6">
                        <NotificationBadge dot variant="primary" size="sm" />
                        <NotificationBadge dot variant="success" size="md" />
                        <NotificationBadge dot variant="error" size="lg" pulse />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-black mb-4">With Icons</h3>
                      <div className="flex items-center gap-6">
                        <NotificationBadge count={5} variant="error">
                          <NotificationBell size="lg" />
                        </NotificationBadge>
                        
                        <NotificationBadge dot variant="success" pulse>
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                        </NotificationBadge>
                      </div>
                    </div>
                  </Stack>
                </BaseCard>
              </Stack>

              {/* 3. Notification Bell */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">3. Notification Bell</h2>
                <p className="text-sm text-black/60">Bell icon with badge for triggering notification center</p>
                
                <BaseCard padding="lg">
                  <div className="flex items-center justify-center gap-8 py-8">
                    <div className="text-center">
                      <NotificationBell
                        count={unreadCount}
                        onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                        size="lg"
                      />
                      <p className="text-xs text-black/60 mt-2">With count</p>
                    </div>

                    <div className="text-center">
                      <NotificationBell showDot size="lg" onClick={() => {}} />
                      <p className="text-xs text-black/60 mt-2">With dot</p>
                    </div>

                    <div className="text-center">
                      <NotificationBell size="lg" onClick={() => {}} />
                      <p className="text-xs text-black/60 mt-2">No indicator</p>
                    </div>
                  </div>
                </BaseCard>
              </Stack>

              {/* 4. Notification Center */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">4. Notification Center</h2>
                <p className="text-sm text-black/60">Dropdown panel with grouping, priorities, keyboard nav & animations</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="md">
                    <div className="flex flex-col items-center gap-4">
                      <button
                        onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                      >
                        {showNotificationCenter ? 'Hide' : 'Show'} Notification Center
                      </button>

                      {showNotificationCenter && (
                        <div className="w-full max-w-md">
                          <NotificationCenter
                            notifications={notifications}
                            onNotificationClick={(notification) => {
                              alert(`Clicked: ${notification.title}`)
                            }}
                            onMarkAsRead={(id) => {
                              setNotifications(prev =>
                                prev.map(n => n.id === id ? { ...n, read: true } : n)
                              )
                            }}
                            onMarkAllAsRead={() => {
                              setNotifications(prev =>
                                prev.map(n => ({ ...n, read: true }))
                              )
                            }}
                            onClearAll={() => {
                              setNotifications([])
                            }}
                            enableGrouping={true}
                            enableKeyboardNav={true}
                            showAnimations={true}
                          />
                        </div>
                      )}
                    </div>

                    {/* Feature Highlights */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mt-4">
                      <h4 className="text-sm font-semibold text-black mb-3">✨ Elite Features Demo:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-black/70">
                        <div>
                          <strong className="text-primary">📁 Grouping:</strong>
                          <ul className="mt-1 space-y-1 text-xs">
                            <li>• Click "Maintenance Reminders (3)" to expand/collapse</li>
                            <li>• "Trip Updates (2)" group</li>
                            <li>• "Alerts (1)" group</li>
                          </ul>
                        </div>
                        <div>
                          <strong className="text-primary">⚡ Priority Sorting:</strong>
                          <ul className="mt-1 space-y-1 text-xs">
                            <li>• <span className="inline-block w-12 px-1 py-0.5 bg-red-500 text-white text-xs rounded">Urgent</span> at top</li>
                            <li>• <span className="inline-block w-12 px-1 py-0.5 bg-orange-500 text-white text-xs rounded">High</span> badge on items</li>
                            <li>• Auto-sorted by priority</li>
                          </ul>
                        </div>
                        <div>
                          <strong className="text-primary">⌨️ Keyboard Nav:</strong>
                          <ul className="mt-1 space-y-1 text-xs">
                            <li>• Focus the panel (click inside)</li>
                            <li>• Use ↑↓ arrow keys to navigate</li>
                            <li>• Press Enter to select</li>
                          </ul>
                        </div>
                        <div>
                          <strong className="text-primary">🎬 Animations:</strong>
                          <ul className="mt-1 space-y-1 text-xs">
                            <li>• Slide-in effects on items</li>
                            <li>• Smooth expand/collapse</li>
                            <li>• Visual selection ring</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Stack>
                </BaseCard>
              </Stack>

              {/* 5. System Banner */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">5. System Banner</h2>
                <p className="text-sm text-black/60">Full-width announcement banners</p>
                
                <Stack spacing="md">
                  <div className="rounded-lg overflow-hidden">
                    <SystemBanner
                      variant="success"
                      message="Your payment was successful. Thank you for your purchase!"
                      icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      dismissible
                    />
                  </div>

                  <div className="rounded-lg overflow-hidden">
                    <SystemBanner
                      variant="warning"
                      message="Scheduled maintenance on Sunday, March 15th from 2:00 AM - 4:00 AM PST"
                      action={{
                        label: 'View Details',
                        onClick: () => alert('Details')
                      }}
                      dismissible
                    />
                  </div>

                  <div className="rounded-lg overflow-hidden">
                    <SystemBanner
                      variant="error"
                      message="Critical: Your subscription has expired. Renew now to maintain access."
                      action={{
                        label: 'Renew Now',
                        onClick: () => alert('Renew')
                      }}
                    />
                  </div>

                  <div className="rounded-lg overflow-hidden">
                    <SystemBanner
                      variant="neutral"
                      message="We use cookies to enhance your experience. By continuing, you agree to our cookie policy."
                      action={{
                        label: 'Accept',
                        onClick: () => alert('Accepted')
                      }}
                      dismissible
                    />
                  </div>
                </Stack>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Note:</strong> The system banner at the top of this page is an example of a sticky banner with the "info" variant.
                  </p>
                </div>
              </Stack>

              {/* Usage Guidelines */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">Usage Guidelines</h2>
                
                <Stack spacing="md">
                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">When to Use Each Component</p>
                      <p className="text-sm text-black/60">
                        • <strong>Inline Alerts:</strong> Form validation, section-specific messages, contextual feedback
                        <br />
                        • <strong>Badges:</strong> Counts, status indicators, unread markers
                        <br />
                        • <strong>Notification Bell:</strong> Trigger for notification center, app header
                        <br />
                        • <strong>Notification Center:</strong> App-level notifications, activity feed
                        <br />
                        • <strong>System Banner:</strong> Site-wide announcements, critical updates, cookie consent
                      </p>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">Best Practices</p>
                      <p className="text-sm text-black/60">
                        ✅ Use appropriate variant colors (success, warning, error, info)
                        <br />
                        ✅ Keep messages concise and actionable
                        <br />
                        ✅ Provide clear actions or next steps
                        <br />
                        ✅ Make dismissible when appropriate
                        <br />
                        ✅ Show timestamps for time-sensitive notifications
                        <br />
                        ✅ Group similar notifications together
                        <br />
                        ✅ Limit notification count displays (e.g., 99+)
                      </p>
                    </Stack>
                  </BaseCard>
                </Stack>
              </Stack>

            </Stack>
          </Section>
        </Container>
      </div>
    </>
  )
}
