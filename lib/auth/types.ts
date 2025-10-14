/**
 * Authentication Type Definitions
 */

declare module 'next-auth' {
  interface Session {
    user: {
      email: string
      name?: string | null
      image?: string | null
      tenantId: string
      role: 'owner' | 'admin' | 'member' | 'viewer'
    }
  }

  interface User {
    email: string
    name?: string | null
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    email?: string
    tenantId?: string
    role?: 'owner' | 'admin' | 'member' | 'viewer'
    userId?: string
  }
}

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface AuthUser {
  email: string
  tenantId: string
  role: UserRole
}

export interface Tenant {
  id: string
  name: string
  isActive: boolean
  subscriptionTier: 'free' | 'pro' | 'enterprise'
  createdAt: string
}

export interface UserTenant {
  id: string
  userId: string
  tenantId: string
  role: UserRole
  createdAt: string
}
