/**
 * Server-Side Authentication Utilities
 * 
 * Use these functions in:
 * - API routes
 * - Server components
 * - Server actions
 */

import { getServerSession } from 'next-auth'
import { authOptions } from './config'
import { redirect } from 'next/navigation'
import { NextApiRequest, NextApiResponse } from 'next'

/**
 * Get the current session (server-side)
 * Returns null if not authenticated
 */
export async function getSession() {
  return await getServerSession(authOptions)
}

/**
 * Require authentication (server component)
 * Redirects to sign-in if not authenticated
 */
export async function requireAuth() {
  const session = await getSession()
  
  if (!session?.user?.tenantId) {
    redirect('/auth/signin')
  }
  
  return session
}

/**
 * Get current user with tenant info (server-side)
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession()
  
  if (!session?.user?.tenantId) {
    return null
  }
  
  return {
    email: session.user.email!,
    tenantId: session.user.tenantId,
    role: session.user.role,
  }
}

/**
 * Require authentication (API route)
 * Returns 401 if not authenticated
 */
export async function requireAuthApi(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ tenantId: string; email: string; role: string } | null> {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.tenantId) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required'
    })
    return null
  }
  
  return {
    email: session.user.email!,
    tenantId: session.user.tenantId,
    role: session.user.role,
  }
}

/**
 * Check if user has permission (role-based)
 */
export function hasPermission(
  userRole: string,
  requiredRole: 'owner' | 'admin' | 'member' | 'viewer'
): boolean {
  const roleHierarchy = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  }
  
  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole]
}
