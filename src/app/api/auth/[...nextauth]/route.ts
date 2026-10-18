import NextAuth from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import { createAuthOptions } from '@/lib/auth/options'
import { createLinkIntent, linkCookieName, readLinkIntent } from '@/lib/auth/link-intent'
import { enforceRateLimit } from '@/lib/http/security'
import { apiErrorResponse } from '@/lib/http/api'
import { getDataRepository } from '@/lib/data'

async function handler(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const { nextauth } = await context.params
  const isCallback = nextauth[0] === 'callback'
  const isOAuthStart =
    nextauth[0] === 'signin' &&
    request.method === 'POST' &&
    ['line', 'discord', 'google'].includes(nextauth[1])
  const intentCookie = request.cookies.get(linkCookieName)?.value
  let link
  if ((isCallback || isOAuthStart) && intentCookie) {
    link = await readLinkIntent(
      intentCookie,
      await getToken({ req: request, secret: createAuthOptions().secret }),
      isCallback ? request.nextUrl.searchParams.get('state') : undefined,
    )
    if (!link || link.provider !== nextauth[1]) {
      const response = NextResponse.redirect(new URL('/settings?error=link', request.url), 303)
      response.cookies.delete(linkCookieName)
      return response
    }
  }
  if ((nextauth[0] === 'signin' && request.method === 'POST') || isCallback) {
    try {
      // Vercel overwrites x-real-ip; do not use arbitrary forwarded-for values.
      // Without a trusted proxy use one shared, conservative bucket.
      const client =
        process.env.VERCEL === '1' ? request.headers.get('x-real-ip') || 'unknown' : 'local'
      await enforceRateLimit(
        getDataRepository(),
        `auth:${client}`,
        process.env.NODE_ENV === 'production' ? 30 : 300,
      )
    } catch (error) {
      return apiErrorResponse(error)
    }
  }
  const response = await NextAuth(createAuthOptions(isCallback ? link || undefined : undefined))(
    request,
    context,
  )
  if (isOAuthStart && intentCookie && link) {
    const location =
      response.headers.get('location') ||
      (
        await response
          .clone()
          .json()
          .catch(() => ({}))
      ).url
    const state =
      typeof location === 'string' ? new URL(location, request.url).searchParams.get('state') : null
    if (!state) {
      const failed = NextResponse.json({ url: new URL('/settings?error=link', request.url).href })
      failed.cookies.delete(linkCookieName)
      return failed
    }
    const cookie = await createLinkIntent({ ...link, oauthState: state })
    response.headers.append(
      'Set-Cookie',
      `${linkCookieName}=${cookie}; Path=/; Max-Age=300; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
    )
  }
  if (isCallback && intentCookie)
    response.headers.append(
      'Set-Cookie',
      `${linkCookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
    )
  return response
}
export { handler as GET, handler as POST }
