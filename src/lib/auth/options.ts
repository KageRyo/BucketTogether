import { randomUUID } from 'node:crypto'
import CredentialsProvider from 'next-auth/providers/credentials'
import LineProvider from 'next-auth/providers/line'
import DiscordProvider from 'next-auth/providers/discord'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'
import type { Provider } from 'next-auth/providers/index'
import { getDataRepository, type DataRepository, type OAuthProvider } from '@/lib/data'

export interface LinkContext {
  userId: string
  provider: OAuthProvider
  sessionId: string
}
export function createAuthOptions(
  link?: LinkContext,
  repository: () => DataRepository = getDataRepository,
): NextAuthOptions {
  const providers: Provider[] = []
  if (process.env.NODE_ENV !== 'production')
    providers.push(
      CredentialsProvider({
        name: '本地測試帳號',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: '密碼', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials.password) return null
          const user = await repository().authenticateCredentials(
            credentials.email,
            credentials.password,
          )
          return user
            ? {
                id: user.id,
                email: user.email,
                name: user.displayName,
                image: user.pictureUrl,
                role: user.role,
                authProvider: user.authProvider,
              }
            : null
        },
      }),
    )
  if (process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET)
    providers.push(
      LineProvider({
        clientId: process.env.LINE_CHANNEL_ID,
        clientSecret: process.env.LINE_CHANNEL_SECRET,
        authorization: { params: { scope: 'profile openid' } },
      }),
    )
  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET)
    providers.push(
      DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        authorization: { params: { scope: 'identify email', prompt: 'consent' } },
      }),
    )
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: { params: { prompt: 'select_account' } },
      }),
    )
  return {
    providers,
    secret:
      process.env.NEXTAUTH_SECRET ||
      (process.env.NODE_ENV !== 'production'
        ? 'bucket-together-local-development-only'
        : undefined),
    logger: {
      error(code) {
        console.error(JSON.stringify({ event: 'auth_error', code }))
      },
      warn(code) {
        console.warn(JSON.stringify({ event: 'auth_warning', code }))
      },
      debug() {},
    },
    pages: { signIn: '/login', error: '/login' },
    session: { strategy: 'jwt', maxAge: 30 * 86400 },
    callbacks: {
      async jwt({ token, account, user }) {
        if (account?.provider === 'credentials' && user) {
          token.userId = user.id
          token.sessionId = randomUUID()
        } else if (account && ['line', 'discord', 'google'].includes(account.provider)) {
          const appUser = await repository().resolveOAuthUser(
            {
              provider: account.provider as OAuthProvider,
              providerAccountId: account.providerAccountId,
              displayName: user?.name || '使用者',
              pictureUrl: user?.image,
              email: user?.email,
            },
            link?.provider === account.provider ? link.userId : undefined,
          )
          token.userId = appUser.id
          token.sessionId = link?.sessionId ?? randomUUID()
        }
        // Re-read the application account on every request: deleted users and
        // changed platform roles must not remain authorized by an old JWT.
        const current = token.userId ? await repository().getUserById(token.userId) : null
        if (!current) {
          delete token.userId
          delete token.sessionId
          delete token.role
          delete token.authProvider
        } else {
          token.role = current.role
          token.authProvider = current.authProvider
          token.name = current.displayName
          token.email = current.email
          token.picture = current.pictureUrl
        }
        return token
      },
      async session({ session, token }) {
        if (token.userId && token.role && token.authProvider) {
          session.user = {
            ...session.user,
            id: token.userId,
            role: token.role,
            authProvider: token.authProvider,
          }
        } else session.user = undefined
        return session
      },
    },
  }
}
export const authOptions = createAuthOptions()
