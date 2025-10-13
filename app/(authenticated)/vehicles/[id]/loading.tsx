/**
 * Loading UI for Vehicle Details Page
 * 
 * Shown automatically by Next.js during route transitions
 * Uses React Suspense boundary
 */

import { PageLoader } from '@/components/ui/PageLoader'

export default function Loading() {
  return <PageLoader message="Loading vehicle..." />
}
