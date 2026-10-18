import { decode, encode } from 'next-auth/jwt'
import type { JWT } from 'next-auth/jwt'
import type { LinkContext } from './options'
export type LinkIntent = LinkContext & { oauthState?: string }
export const linkCookieName =
  process.env.NODE_ENV === 'production' ? '__Host-bucket-link' : 'bucket-link'
function secret() {
  const value =
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== 'production' ? 'bucket-together-local-development-only' : undefined)
  if (!value) throw new Error('NEXTAUTH_SECRET is required')
  return `${value}:link-intent`
}
export function createLinkIntent(context: LinkIntent) {
  return encode({ token: { ...context }, secret: secret(), maxAge: 300 })
}
export async function readLinkIntent(
  value: string,
  session: JWT | null,
  oauthState?: string | null,
): Promise<LinkIntent | null> {
  try {
    const intent = await decode({ token: value, secret: secret() })
    if (
      !intent ||
      !session?.userId ||
      !session.sessionId ||
      intent.userId !== session.userId ||
      intent.sessionId !== session.sessionId ||
      !['line', 'discord', 'google'].includes(String(intent.provider))
    )
      return null
    if (
      oauthState !== undefined &&
      (!oauthState || !intent.oauthState || intent.oauthState !== oauthState)
    )
      return null
    return {
      ...(typeof intent.oauthState === 'string' ? { oauthState: intent.oauthState } : {}),
      userId: session.userId,
      sessionId: session.sessionId,
      provider: intent.provider as LinkContext['provider'],
    }
  } catch {
    return null
  }
}
