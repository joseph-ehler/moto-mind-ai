/**
 * PWA INSTALL PROMPT
 * 
 * Prompts users to install the app for offline mode.
 * Shows different UI for iOS (manual) vs Chrome/Edge (automatic).
 * 
 * Features:
 * - Detects iOS vs Chrome/Edge
 * - Shows appropriate install instructions
 * - Dismissable with localStorage memory
 * - Tracks install events
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Stack,
  Flex,
  Card,
  Button,
  Heading,
  Text
} from '@/components/design-system'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const daysSinceDismiss = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      
      // Show again after 7 days
      if (daysSinceDismiss < 7) {
        setIsDismissed(true)
        return
      }
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Listen for beforeinstallprompt (Chrome/Edge)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      console.log('[PWA] App installed')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Show install prompt
    await deferredPrompt.prompt()

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice
    console.log('[PWA] User choice:', outcome)

    if (outcome === 'accepted') {
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
    setIsDismissed(true)
  }

  // Don't show if installed or dismissed
  if (isInstalled || isDismissed) {
    return null
  }

  // Don't show if no prompt available and not iOS
  if (!deferredPrompt && !isIOS) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <Card className="shadow-lg border-2 border-blue-500">
        <Stack spacing="md">
          <Flex justify="between" align="start">
            <Stack spacing="xs">
              <Flex align="center" gap="sm">
                <span className="text-2xl">📱</span>
                <Heading level="subsection">Install MotoMind</Heading>
              </Flex>
              <Text className="text-sm text-gray-600">
                Get offline mode, faster loading, and app-like experience
              </Text>
            </Stack>

            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </Flex>

          {/* Benefits */}
          <Stack spacing="xs">
            <Flex align="center" gap="xs">
              <span className="text-green-600">✓</span>
              <Text className="text-sm">Capture at gas stations with no signal</Text>
            </Flex>
            <Flex align="center" gap="xs">
              <span className="text-green-600">✓</span>
              <Text className="text-sm">Background sync when back online</Text>
            </Flex>
            <Flex align="center" gap="xs">
              <span className="text-green-600">✓</span>
              <Text className="text-sm">Push notifications for reminders</Text>
            </Flex>
            <Flex align="center" gap="xs">
              <span className="text-green-600">✓</span>
              <Text className="text-sm">Instant loading, app-like experience</Text>
            </Flex>
          </Stack>

          {/* Install button (Chrome/Edge) */}
          {deferredPrompt && (
            <Flex gap="sm">
              <Button
                variant="primary"
                size="md"
                onClick={handleInstall}
                className="flex-1"
              >
                Install Now
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={handleDismiss}
              >
                Later
              </Button>
            </Flex>
          )}

          {/* iOS instructions */}
          {isIOS && (
            <Stack spacing="sm" className="pt-2 border-t">
              <Text className="text-sm font-medium">To install on iOS:</Text>
              <Stack spacing="xs">
                <Flex align="start" gap="xs">
                  <span className="text-blue-600">1.</span>
                  <Text className="text-sm">
                    Tap the <strong>Share</strong> button{' '}
                    <span className="inline-block">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .9 2 2z"/>
                      </svg>
                    </span>
                  </Text>
                </Flex>
                <Flex align="start" gap="xs">
                  <span className="text-blue-600">2.</span>
                  <Text className="text-sm">
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                  </Text>
                </Flex>
                <Flex align="start" gap="xs">
                  <span className="text-blue-600">3.</span>
                  <Text className="text-sm">
                    Tap <strong>"Add"</strong> in the top right
                  </Text>
                </Flex>
              </Stack>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="w-full mt-2"
              >
                Got it, thanks
              </Button>
            </Stack>
          )}
        </Stack>
      </Card>
    </div>
  )
}

/**
 * Offline indicator banner
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 px-4 py-2 z-50">
      <Container size="lg">
        <Flex align="center" justify="center" gap="sm">
          <span className="text-xl">⚠️</span>
          <Text className="text-sm font-medium">
            You're offline. Your captures will sync when you're back online.
          </Text>
        </Flex>
      </Container>
    </div>
  )
}

/**
 * Sync status indicator
 */
export function SyncStatusIndicator() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [queueSize, setQueueSize] = useState(0)

  useEffect(() => {
    // Listen for sync status from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'sync-started') {
        setIsSyncing(true)
      }
      if (event.data.type === 'sync-completed') {
        setIsSyncing(false)
        setQueueSize(0)
      }
      if (event.data.type === 'queue-size') {
        setQueueSize(event.data.size)
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [])

  if (!isSyncing && queueSize === 0) return null

  return (
    <div className="fixed bottom-20 right-4 z-40 animate-slide-up">
      <Card className="shadow-lg">
        <Flex align="center" gap="sm">
          {isSyncing && (
            <>
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <Text className="text-sm font-medium">Syncing...</Text>
            </>
          )}
          {!isSyncing && queueSize > 0 && (
            <>
              <span className="text-yellow-500">⏳</span>
              <Text className="text-sm font-medium">
                {queueSize} item{queueSize > 1 ? 's' : ''} queued
              </Text>
            </>
          )}
        </Flex>
      </Card>
    </div>
  )
}
