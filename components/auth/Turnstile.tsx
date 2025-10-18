'use client'

/**
 * Cloudflare Turnstile CAPTCHA Component
 * 
 * Smart CAPTCHA that only shows when risk is detected
 * Lightweight alternative to reCAPTCHA
 */

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: TurnstileOptions) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
      getResponse: (widgetId: string) => string
    }
  }
}

interface TurnstileOptions {
  sitekey: string
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
  callback?: (token: string) => void
  'error-callback'?: () => void
  'expired-callback'?: () => void
}

interface TurnstileProps {
  siteKey: string
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
  className?: string
}

export function Turnstile({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className = '',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string>()
  const [isLoaded, setIsLoaded] = useState(false)
  const [scriptError, setScriptError] = useState(false)

  // Load Turnstile script
  useEffect(() => {
    // Check if already loaded
    if (window.turnstile) {
      setIsLoaded(true)
      return
    }

    // Load script
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    
    script.onload = () => {
      setIsLoaded(true)
    }
    
    script.onerror = () => {
      console.error('[Turnstile] Failed to load Cloudflare Turnstile script')
      setScriptError(true)
      onError?.()
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup: remove script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [onError])

  // Render widget when script loads
  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile) {
      return
    }

    // Clear any existing widget
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current)
      } catch (error) {
        console.error('[Turnstile] Error removing widget:', error)
      }
    }

    // Render new widget
    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: (token: string) => {
          console.log('[Turnstile] CAPTCHA verified')
          onVerify(token)
        },
        'error-callback': () => {
          console.error('[Turnstile] CAPTCHA error')
          onError?.()
        },
        'expired-callback': () => {
          console.warn('[Turnstile] CAPTCHA expired')
          onExpire?.()
        },
      })
    } catch (error) {
      console.error('[Turnstile] Error rendering widget:', error)
      setScriptError(true)
      onError?.()
    }

    // Cleanup on unmount
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch (error) {
          console.error('[Turnstile] Error removing widget:', error)
        }
      }
    }
  }, [isLoaded, siteKey, theme, size, onVerify, onError, onExpire])

  if (scriptError) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <p className="text-sm text-yellow-800">
          ⚠️ CAPTCHA temporarily unavailable. Please try again.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-pulse text-sm text-gray-500">Loading security check...</div>
      </div>
    )
  }

  return <div ref={containerRef} className={className} />
}
