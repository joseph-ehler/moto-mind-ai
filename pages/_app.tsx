import type { AppProps } from 'next/app'
import { PWAManifestInjector } from '@/components/PWAManifestInjector'
import { PWAInstallPrompt, OfflineIndicator } from '@/components/PWAInstallPrompt'
import { SupabaseAuthProvider } from '@/components/auth/SupabaseAuthProvider'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SupabaseAuthProvider>
      <PWAManifestInjector />
      <PWAInstallPrompt />
      <OfflineIndicator />
      <Component {...pageProps} />
    </SupabaseAuthProvider>
  )
}
