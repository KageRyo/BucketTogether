import CredentialsProvider from 'next-auth/providers/credentials'
import LineProvider from 'next-auth/providers/line'
import type { NextAuthOptions } from 'next-auth'
import type { Provider } from 'next-auth/providers/index'
import { getDataRepository } from '@/lib/data'

export const isLineLoginEnabled = Boolean(
  process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET,
)

const providers: Provider[] = [
  CredentialsProvider({
    name: '帳號密碼',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: '密碼', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) {
        return null
      }

      const user = await getDataRepository().authenticateCredentials(
        credentials.email,
        credentials.password,
      )

      if (!user) {
        return null
      }

      return {
        id: user.id,
        email: user.email,
        name: user.displayName,
        image: user.pictureUrl,
        role: user.role,
        authProvider: user.authProvider,
      }
    },
  }),
]

if (isLineLoginEnabled) {
  providers.push(LineProvider({
    clientId: process.env.LINE_CHANNEL_ID!,
    clientSecret: process.env.LINE_CHANNEL_SECRET!,
    authorization: { params: { scope: 'profile openid email' } },
  }))
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET
    || (process.env.NODE_ENV !== 'production' ? 'bucket-together-local-development-only' : undefined),
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account?.provider === 'credentials' && user) {
        token.userId = user.id
        token.role = user.role
        token.authProvider = user.authProvider
      }

      if (account?.provider === 'line' && profile) {
        const lineProfile = profile as {
          sub?: string
          name?: string
          picture?: string
          email?: string
        }

        if (lineProfile.sub) {
          const appUser = await getDataRepository().upsertLineUser({
            lineId: lineProfile.sub,
            displayName: lineProfile.name || token.name || 'LINE User',
            pictureUrl: lineProfile.picture || token.picture,
            email: lineProfile.email || token.email,
          })
          token.userId = appUser.id
          token.role = appUser.role
          token.authProvider = appUser.authProvider
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token.userId && token.role && token.authProvider) {
        session.user.id = token.userId
        session.user.role = token.role
        session.user.authProvider = token.authProvider
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}
