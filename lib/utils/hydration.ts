/**
 * Hydration Utilities
 * 
 * Utilities to prevent hydration mismatches in Next.js
 */

import React, { useEffect, useState } from 'react'

/**
 * Hook to prevent hydration mismatches
 * Returns false on server-side and initial client render,
 * then true after hydration is complete
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}
