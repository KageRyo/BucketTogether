import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createAuthOptions } from '@/lib/auth/options'
import { createLinkIntent, linkCookieName } from '@/lib/auth/link-intent'
import { apiErrorResponse, readJsonObject, requireApiUserId } from '@/lib/http/api'
import { DataError, type OAuthProvider } from '@/lib/data'

export async function POST(request: NextRequest) {
  try {
    const userId = await requireApiUserId(request)
    const body = await readJsonObject(request)
    const provider = body.provider as OAuthProvider
    const options = createAuthOptions()
    if (
      !['line', 'discord', 'google'].includes(provider) ||
      !options.providers.some((p) => p.id === provider)
    )
      throw new DataError('VALIDATION_ERROR', '登入方式尚未開放')
    const session = await getToken({ req: request, secret: options.secret })
    if (!session?.sessionId) throw new DataError('FORBIDDEN', '請重新登入後再綁定')
    const response = NextResponse.json({ data: { provider } })
    response.cookies.set(
      linkCookieName,
      await createLinkIntent({ userId, sessionId: session.sessionId, provider }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 300,
      },
    )
    return response
  } catch (error) {
    return apiErrorResponse(error)
  }
}
