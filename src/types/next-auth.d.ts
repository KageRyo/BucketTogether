import type { DefaultSession } from 'next-auth'
import type { AppRole, AuthProvider } from '@/lib/data'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: AppRole
      authProvider: AuthProvider
    } & DefaultSession['user']
  }

  interface User {
    role: AppRole
    authProvider: AuthProvider
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    role?: AppRole
    authProvider?: AuthProvider
  }
}
