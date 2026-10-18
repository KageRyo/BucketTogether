import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createAuthOptions } from './options'
import { LocalFileRepository } from '../data/local-file-repository'

afterEach(() => vi.unstubAllEnvs())
describe('authentication boundaries', () => {
  it('disables credentials in production and configures all three OAuth providers', () => {
    vi.stubEnv('NODE_ENV', 'production')
    for (const key of [
      'LINE_CHANNEL_ID',
      'LINE_CHANNEL_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'DISCORD_CLIENT_ID',
      'DISCORD_CLIENT_SECRET',
    ])
      vi.stubEnv(key, 'configured')
    expect(createAuthOptions().providers.map((p) => p.id)).toEqual(['line', 'discord', 'google'])
  })
  it('revokes existing tokens when the application account is deleted', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'bucket-auth-'))
    try {
      const repository = new LocalFileRepository(path.join(dir, 'data.json'))
      const user = await repository.resolveOAuthUser({
        provider: 'google',
        providerAccountId: 'delete',
        displayName: 'Delete',
      })
      const options = createAuthOptions(undefined, () => repository)
      const token = { userId: user.id, sessionId: 'session' }
      const jwt = options.callbacks!.jwt!
      expect(await jwt({ token } as Parameters<typeof jwt>[0])).toMatchObject({ userId: user.id })
      await repository.deleteAccount(user.id)
      expect(await jwt({ token } as Parameters<typeof jwt>[0])).not.toHaveProperty('userId')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
