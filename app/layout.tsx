import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { ClientProviders } from './client-providers'
import '../styles/globals.css'
import '../styles/gradients.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MotoMind - AI Vehicle Assistant',
  description: 'Smart vehicle tracking with AI-powered insights',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MotoMind',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var link = document.createElement('link');
                link.rel = 'manifest';
                link.href = '/manifest.json';
                document.head.appendChild(link);
                
                var meta = document.createElement('meta');
                meta.name = 'theme-color';
                meta.content = '#2563eb';
                document.head.appendChild(meta);
                
                var apple = document.createElement('link');
                apple.rel = 'apple-touch-icon';
                apple.href = '/icons/apple-touch-icon.png';
                document.head.appendChild(apple);
              })();
            `,
          }}
        />
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
