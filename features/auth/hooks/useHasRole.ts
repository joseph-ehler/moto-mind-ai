/**
 * useHasRole Hook
 * 
 * Check if the current user has a specific role or higher in the role hierarchy.
 * 
 * Role hierarchy (highest to lowest):
 * - owner (4)
 * - admin (3)
 * - member (2)
 * - viewer (1)
 */

'use client'

import { useAuth } from './useAuth'

export function useHasRole(
  requiredRole: 'owner' | 'admin' | 'member' | 'viewer'
): boolean {
  const { user } = useAuth()
  
  if (!user) return false
  
  const roleHierarchy = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  }
  
  return (
    roleHierarchy[user.role as keyof typeof roleHierarchy] >=
    roleHierarchy[requiredRole]
  )
}
