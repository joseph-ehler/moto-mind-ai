import './globals.css'
import { SessionProvider } from '@/app/providers'

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
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
