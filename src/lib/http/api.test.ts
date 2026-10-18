import { describe, expect, it } from 'vitest'
import { readJsonObject, apiErrorResponse } from './api'
import { DataError } from '../data/errors'
describe('API request boundaries', () => {
  it('accepts object JSON and rejects arrays, invalid JSON and oversized bodies', async () => {
    const request = (body: string) =>
      new Request('http://localhost/api/test', { method: 'POST', body })
    expect(await readJsonObject(request('{"title":"Shared"}'))).toEqual({ title: 'Shared' })
    for (const body of ['[]', 'null', '{', JSON.stringify({ title: 'x'.repeat(65536) })])
      await expect(readJsonObject(request(body))).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      })
  })
  it('returns a retryable 429 and a non-success conflict response', async () => {
    const limited = apiErrorResponse(new DataError('RATE_LIMITED', 'Slow down'))
    expect(limited.status).toBe(429)
    expect(limited.headers.get('Retry-After')).toBe('60')
    expect(apiErrorResponse(new DataError('CONFLICT', 'Stale')).status).toBe(409)
  })
})
