import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { assertSameOrigin, enforceRateLimit } from './security'
import { getDataRepository } from '@/lib/data'
import { DataError } from '@/lib/data'

class UnauthorizedError extends Error {}

export async function requireApiUserId(request?: Request): Promise<string> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new UnauthorizedError('未授權，請先登入')
  }
  if (!(await getDataRepository().getUserById(session.user.id)))
    throw new UnauthorizedError('帳號已失效')
  if (request && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    assertSameOrigin(request)
    const invite = request.url.includes('invite') || request.url.includes('/join')
    const account = request.url.includes('/account')
    await enforceRateLimit(
      getDataRepository(),
      `${invite ? 'invite' : account ? 'account' : 'write'}:${session.user.id}`,
      account ? 5 : invite ? 10 : 60,
    )
  }
  return session.user.id
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  try {
    const reader = request.body?.getReader()
    if (!reader) throw new DataError('VALIDATION_ERROR', '缺少請求內容')
    const chunks: Uint8Array[] = []
    let size = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 65536) {
          await reader.cancel()
          throw new DataError('VALIDATION_ERROR', '請求內容過大')
        }
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new DataError('VALIDATION_ERROR', '請求內容格式錯誤')
    }
    return body as Record<string, unknown>
  } catch (error) {
    if (error instanceof DataError) {
      throw error
    }
    throw new DataError('VALIDATION_ERROR', '無法解析請求內容')
  }
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  if (error instanceof DataError) {
    const status = {
      RATE_LIMITED: 429,
      NOT_FOUND: 404,
      FORBIDDEN: 403,
      CONFLICT: 409,
      VALIDATION_ERROR: 400,
    }[error.code]
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status, headers: status === 429 ? { 'Retry-After': '60' } : undefined },
    )
  }

  console.error(
    JSON.stringify({ event: 'api_error', kind: error instanceof Error ? error.name : 'unknown' }),
  )
  return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export function expectedVersion(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1)
    throw new DataError('VALIDATION_ERROR', '缺少有效的資料版本')
  return value
}
