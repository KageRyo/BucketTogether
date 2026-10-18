import { describe, expect, it } from 'vitest'
import { createLinkIntent, readLinkIntent } from './link-intent'

describe('explicit identity linking', () => {
  it('binds an encrypted short-lived intent to the initiating user and session', async () => {
    const context = {
      userId: 'owner',
      sessionId: 'initiating-session',
      provider: 'google' as const,
    }
    const cookie = await createLinkIntent(context)
    expect(
      await readLinkIntent(cookie, { userId: 'owner', sessionId: 'initiating-session' }),
    ).toEqual(context)
    expect(
      await readLinkIntent(cookie, { userId: 'other', sessionId: 'initiating-session' }),
    ).toBeNull()
    expect(await readLinkIntent(cookie, { userId: 'owner', sessionId: 'other-session' })).toBeNull()
    expect(
      await readLinkIntent(cookie + 'tampered', {
        userId: 'owner',
        sessionId: 'initiating-session',
      }),
    ).toBeNull()
    expect(await readLinkIntent(cookie, null)).toBeNull()
    expect(await readLinkIntent(cookie, context, 'oauth-state')).toBeNull()
    const bound = await createLinkIntent({ ...context, oauthState: 'oauth-state' })
    expect(await readLinkIntent(bound, context, 'oauth-state')).toMatchObject(context)
    expect(await readLinkIntent(bound, context, 'different-state')).toBeNull()
    expect(await readLinkIntent(bound, context, null)).toBeNull()
  })
})
