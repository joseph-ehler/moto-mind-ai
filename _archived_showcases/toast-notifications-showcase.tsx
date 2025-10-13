/**
 * Toast Notifications Showcase
 */

import React, { useState } from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  BaseCard,
  ToastProvider,
  useToast,
  usePromiseToast,
  usePersistentToast
} from '@/components/design-system'

function ToastShowcaseContent() {
  const toast = useToast()
  const promiseToast = usePromiseToast()
  const persistentToast = usePersistentToast()
  const [uploadProgress, setUploadProgress] = useState(0)

  // Simulate async operation
  const simulateAsync = () => {
    return new Promise((resolve, reject) => {
      const random = Math.random()
      setTimeout(() => {
        if (random > 0.3) {
          resolve({ data: 'Success!' })
        } else {
          reject(new Error('Network timeout'))
        }
      }, 2000)
    })
  }

  // Simulate upload with progress
  const simulateUpload = () => {
    const id = toast.showToast({
      variant: 'info',
      title: 'Uploading...',
      description: 'Please wait',
      duration: 0
    })

    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(progress)
      
      if (progress >= 100) {
        clearInterval(interval)
        toast.dismissToast(id)
        toast.success('Upload complete!', 'Your file has been uploaded successfully')
        setUploadProgress(0)
      }
    }, 500)
  }

  return (
    <>
      <Head>
        <title>Toast Notifications - MotoMind Design System</title>
        <meta name="description" content="Toast notification components" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        <Container size="md" useCase="articles">
          <Section spacing="xl">
            <Stack spacing="2xl">
              
              {/* Page Title */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-black mb-4">Toast Notifications</h1>
                <p className="text-lg text-black/60">Feedback system with auto-dismiss, actions, and stacking</p>
              </div>

              {/* 1. Basic Variants */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">1. Basic Variants</h2>
                <p className="text-sm text-black/60">Success, error, warning, and info toasts</p>
                
                <BaseCard padding="lg">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => toast.success('Changes saved', 'Your vehicle details have been updated')}
                      className="px-4 py-3 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Show Success
                    </button>
                    <button
                      onClick={() => toast.error('Failed to save', 'Please check your connection and try again')}
                      className="px-4 py-3 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Show Error
                    </button>
                    <button
                      onClick={() => toast.warning('Low fuel warning', 'Your vehicle is running low on fuel')}
                      className="px-4 py-3 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Show Warning
                    </button>
                    <button
                      onClick={() => toast.info('Maintenance due', 'Oil change recommended in 500 miles')}
                      className="px-4 py-3 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Show Info
                    </button>
                  </div>
                </BaseCard>
              </Stack>

              {/* 2. With Actions */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">2. With Actions (Undo)</h2>
                <p className="text-sm text-black/60">Toasts with action buttons</p>
                
                <BaseCard padding="lg">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => toast.success(
                        'Vehicle deleted',
                        'Honda Civic has been removed',
                        { label: 'Undo', onClick: () => alert('Undo clicked!') }
                      )}
                      className="px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Delete with Undo
                    </button>
                    <button
                      onClick={() => toast.info(
                        'New update available',
                        'Version 2.0 is ready to install',
                        { label: 'Update Now', onClick: () => alert('Updating...') }
                      )}
                      className="px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Update with Action
                    </button>
                  </div>
                </BaseCard>
              </Stack>

              {/* 3. Auto-dismiss & Durations */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">3. Auto-dismiss & Durations</h2>
                <p className="text-sm text-black/60">Control how long toasts stay visible</p>
                
                <BaseCard padding="lg">
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => toast.showToast({
                        variant: 'success',
                        title: 'Quick toast',
                        description: 'Dismisses in 2 seconds',
                        duration: 2000
                      })}
                      className="px-4 py-3 text-sm font-medium border border-black/10 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      2 Seconds
                    </button>
                    <button
                      onClick={() => toast.showToast({
                        variant: 'info',
                        title: 'Normal toast',
                        description: 'Default 5 seconds',
                        duration: 5000
                      })}
                      className="px-4 py-3 text-sm font-medium border border-black/10 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      5 Seconds
                    </button>
                    <button
                      onClick={() => persistentToast({
                        variant: 'warning',
                        title: 'Persistent toast',
                        description: 'Stays until dismissed'
                      })}
                      className="px-4 py-3 text-sm font-medium border border-black/10 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Persistent
                    </button>
                  </div>
                </BaseCard>
              </Stack>

              {/* 4. Stack Multiple Toasts */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">4. Stack Multiple Toasts</h2>
                <p className="text-sm text-black/60">Show multiple toasts at once</p>
                
                <BaseCard padding="lg">
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        toast.success('First toast')
                        setTimeout(() => toast.info('Second toast'), 300)
                        setTimeout(() => toast.warning('Third toast'), 600)
                      }}
                      className="px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Show 3 Toasts
                    </button>
                    <button
                      onClick={() => toast.dismissAll()}
                      className="px-4 py-3 text-sm font-medium border border-black/10 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Dismiss All
                    </button>
                  </div>
                </BaseCard>
              </Stack>

              {/* ELITE FEATURES */}
              <div className="text-center py-8 border-y border-black/10">
                <h2 className="text-3xl font-bold text-black mb-2">⚡ Elite Features</h2>
                <p className="text-lg text-black/60">Advanced toast patterns</p>
              </div>

              {/* 5. Promise Toast */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">5. Promise Toast</h2>
                <p className="text-sm text-black/60">Auto-updates based on promise state</p>
                
                <BaseCard padding="lg">
                  <button
                    onClick={() => {
                      promiseToast(
                        simulateAsync(),
                        {
                          loading: 'Saving changes...',
                          success: 'Changes saved successfully!',
                          error: (err) => `Failed: ${err.message}`
                        }
                      )
                    }}
                    className="px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Try Promise Toast (70% success rate)
                  </button>
                  <p className="text-xs text-black/40 mt-2">
                    Shows loading → then success or error based on promise result
                  </p>
                </BaseCard>
              </Stack>

              {/* 6. Progress Toast */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">6. Progress Toast</h2>
                <p className="text-sm text-black/60">Show operation progress</p>
                
                <BaseCard padding="lg">
                  <button
                    onClick={simulateUpload}
                    className="px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Simulate Upload with Progress
                  </button>
                  {uploadProgress > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-black/60">Uploading...</span>
                        <span className="font-medium text-black">{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </BaseCard>
              </Stack>

              {/* 7. Custom Icons */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">7. Custom Icons</h2>
                <p className="text-sm text-black/60">Use your own icons</p>
                
                <BaseCard padding="lg">
                  <button
                    onClick={() => toast.showToast({
                      variant: 'success',
                      title: 'Vehicle added',
                      description: '2024 Tesla Model 3',
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )
                    })}
                    className="px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Show Custom Icon Toast
                  </button>
                </BaseCard>
              </Stack>

              {/* 8. Real-world Examples */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">8. Real-world Examples</h2>
                <p className="text-sm text-black/60">Common use cases</p>
                
                <BaseCard padding="lg">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => toast.success(
                        'Maintenance logged',
                        'Oil change recorded for Honda Civic',
                        { label: 'View', onClick: () => alert('Navigate to maintenance') }
                      )}
                      className="px-4 py-3 text-sm font-medium border border-black/10 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="font-semibold mb-1">Maintenance Logged</div>
                      <div className="text-xs text-black/60">With view action</div>
                    </button>
                    <button
                      onClick={() => toast.error(
                        'Connection lost',
                        'Reconnecting to server...',
                        { label: 'Retry', onClick: () => toast.info('Retrying...') }
                      )}
                      className="px-4 py-3 text-sm font-medium border border-black/10 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="font-semibold mb-1">Connection Error</div>
                      <div className="text-xs text-black/60">With retry action</div>
                    </button>
                    <button
                      onClick={() => toast.warning(
                        'Inspection due',
                        'Annual inspection expires in 7 days'
                      )}
                      className="px-4 py-3 text-sm font-medium border border-black/10 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="font-semibold mb-1">Reminder</div>
                      <div className="text-xs text-black/60">Inspection alert</div>
                    </button>
                    <button
                      onClick={() => toast.info(
                        'Backup complete',
                        'All data synced to cloud'
                      )}
                      className="px-4 py-3 text-sm font-medium border border-black/10 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="font-semibold mb-1">Sync Complete</div>
                      <div className="text-xs text-black/60">Cloud backup</div>
                    </button>
                  </div>
                </BaseCard>
              </Stack>

              {/* Usage Guidelines */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">Usage Guidelines</h2>
                
                <Stack spacing="md">
                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">When to Use</p>
                      <p className="text-sm text-black/60">
                        • <strong>Success:</strong> Confirm successful actions (saved, deleted, created)
                        <br />
                        • <strong>Error:</strong> Show errors that need attention
                        <br />
                        • <strong>Warning:</strong> Alert about potential issues
                        <br />
                        • <strong>Info:</strong> Neutral notifications and updates
                        <br />
                        • <strong>Actions:</strong> Provide quick actions like Undo, View, Retry
                      </p>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">Best Practices</p>
                      <p className="text-sm text-black/60">
                        ✅ Keep messages concise (title + short description)
                        <br />
                        ✅ Use actions for reversible operations (Undo)
                        <br />
                        ✅ Set appropriate durations (errors longer, success shorter)
                        <br />
                        ✅ Don't overuse - avoid toast fatigue
                        <br />
                        ✅ Position consistently (top-right recommended)
                        <br />
                        ✅ Stack limit of 3-5 toasts
                        <br />
                        ❌ Don't use for critical errors (use modals instead)
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

export default function ToastNotificationsShowcasePage() {
  return (
    <ToastProvider position="top-right" maxToasts={5}>
      <ToastShowcaseContent />
    </ToastProvider>
  )
}
