import { tokenHash } from '../data/validation'
import { DataError } from '../data/errors'
import type { DataRepository } from '../data/repository'

export function assertSameOrigin(request: Request): void {
  const expected = new URL(process.env.NEXTAUTH_URL || request.url).origin
  if (request.headers.get('origin') !== expected)
    throw new DataError('FORBIDDEN', '請從本站重新操作')
}
export async function enforceRateLimit(
  repository: DataRepository,
  key: string,
  limit: number,
  seconds = 60,
) {
  if (!(await repository.consumeRateLimit(tokenHash(key), limit, seconds)))
    throw new DataError('RATE_LIMITED', '操作過於頻繁，請稍後再試')
}
