import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      tenant_id: string
    } & DefaultSession['user']
  }

  interface User {
    tenant_id?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    tenant_id?: string
  }
}
