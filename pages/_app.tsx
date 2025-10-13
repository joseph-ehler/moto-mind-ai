import type { AppProps } from 'next/app'
import { PWAManifestInjector } from '@/components/PWAManifestInjector'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <PWAManifestInjector />
      <Component {...pageProps} />
    </>
  )
}
