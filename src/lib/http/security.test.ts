import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertSameOrigin, enforceRateLimit } from './security'
import { safeCallbackUrl } from './callback-url'
import { LocalFileRepository } from '../data/local-file-repository'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})
describe('request security', () => {
  it('rejects missing or cross-site origins and uses the configured canonical origin', () => {
    vi.stubEnv('NEXTAUTH_URL', 'https://bucket.example.com')
    expect(() =>
      assertSameOrigin(
        new Request('http://internal/api/lists', {
          headers: { origin: 'https://bucket.example.com' },
        }),
      ),
    ).not.toThrow()
    for (const origin of [null, 'https://evil.example', 'null'])
      expect(() =>
        assertSameOrigin(
          new Request('http://internal/api/lists', { headers: origin ? { origin } : {} }),
        ),
      ).toThrow()
  })
  it('prevents external callback redirects but preserves internal join paths', () => {
    for (const value of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      '/\nevil.example',
      null,
    ])
      expect(safeCallbackUrl(value)).toBe('/dashboard')
    expect(safeCallbackUrl('/join')).toBe('/join')
  })
  it('returns a rate-limit error and permits requests after window expiry', async () => {
    vi.useFakeTimers()
    const repo = new LocalFileRepository('/unused-rate-limit-test')
    await enforceRateLimit(repo, 'test', 1, 60)
    await expect(enforceRateLimit(repo, 'test', 1, 60)).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    })
    vi.advanceTimersByTime(61000)
    await expect(enforceRateLimit(repo, 'test', 1, 60)).resolves.toBeUndefined()
  })
})
