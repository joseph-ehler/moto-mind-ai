/**
 * Authenticated App Layout
 * 
 * All routes in this group require authentication
 */

import { AuthGuard } from '@/lib/auth/components/AuthGuard'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard>{children}</AuthGuard>
}
