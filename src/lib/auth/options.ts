import LineProvider from 'next-auth/providers/line'
import type { NextAuthOptions } from 'next-auth'
import { createSupabaseAdmin } from '@/lib/supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_CHANNEL_ID!,
      clientSecret: process.env.LINE_CHANNEL_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // 首次登入時儲存 LINE 資訊並同步到 Supabase
      if (account && profile) {
        const lineProfile = profile as { sub?: string; name?: string; picture?: string; email?: string }
        token.lineId = lineProfile.sub
        token.accessToken = account.access_token

        // 同步使用者到 Supabase
        try {
          const supabase = createSupabaseAdmin()
          
          // 檢查使用者是否已存在
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('line_id', lineProfile.sub || '')
            .single()

          if (existingUser) {
            // 更新現有使用者
            await supabase
              .from('users')
              .update({
                display_name: lineProfile.name || (token.name as string) || 'User',
                picture_url: lineProfile.picture || (token.picture as string) || null,
                email: lineProfile.email || (token.email as string) || null,
              })
              .eq('line_id', lineProfile.sub || '')
            
            token.supabaseUserId = existingUser.id
          } else {
            // 建立新使用者
            const { data: newUser } = await supabase
              .from('users')
              .insert({
                line_id: lineProfile.sub || '',
                display_name: lineProfile.name || (token.name as string) || 'User',
                picture_url: lineProfile.picture || (token.picture as string) || null,
                email: lineProfile.email || (token.email as string) || null,
              })
              .select('id')
              .single()

            if (newUser) {
              token.supabaseUserId = newUser.id
            }
          }
        } catch (error) {
          console.error('同步使用者到 Supabase 失敗:', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      // 將 LINE ID 和 Supabase User ID 加入 session
      if (session.user) {
        (session.user as any).lineId = token.lineId as string
        (session.user as any).supabaseUserId = token.supabaseUserId as string
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
