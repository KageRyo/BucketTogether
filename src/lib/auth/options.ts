import LineProvider from 'next-auth/providers/line'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_CHANNEL_ID!,
      clientSecret: process.env.LINE_CHANNEL_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // 首次登入時儲存 LINE 資訊
      if (account && profile) {
        token.lineId = (profile as any).sub
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      // 將 LINE ID 加入 session
      if (session.user) {
        (session.user as any).lineId = token.lineId
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
