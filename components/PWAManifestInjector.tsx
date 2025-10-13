'use client'

import { useEffect } from 'react'

export function PWAManifestInjector() {
  useEffect(() => {
    // Inject manifest link immediately
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link')
      link.rel = 'manifest'
      link.href = '/manifest.json'
      document.head.appendChild(link)
      console.log('[PWA] Manifest link injected')
    }
    
    // Inject theme color
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = '#2563eb'
      document.head.appendChild(meta)
    }
    
    // Inject apple touch icon
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const apple = document.createElement('link')
      apple.rel = 'apple-touch-icon'
      apple.href = '/icons/apple-touch-icon.png'
      document.head.appendChild(apple)
    }
  }, [])
  
  return null
}
