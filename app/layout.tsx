import '@/styles/globals.css'
import { SessionProvider } from '@/app/providers'
import { NativeRouteDetector } from '@/components/auth/NativeRouteDetector'

export const metadata = {
  title: 'MotoMind - Fresh Start',
  description: 'Vehicle maintenance tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <NativeRouteDetector />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
