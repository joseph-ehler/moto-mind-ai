import type { AppProps } from 'next/app'
import { PWAManifestInjector } from '@/components/PWAManifestInjector'
import { PWAInstallPrompt, OfflineIndicator } from '@/components/PWAInstallPrompt'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <PWAManifestInjector />
      <PWAInstallPrompt />
      <OfflineIndicator />
      <Component {...pageProps} />
    </>
  )
}
