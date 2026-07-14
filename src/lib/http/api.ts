import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { DataError } from '@/lib/data'

class UnauthorizedError extends Error {}

export async function requireApiUserId(): Promise<string> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new UnauthorizedError('未授權，請先登入')
  }
  return session.user.id
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json()
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
      NOT_FOUND: 404,
      FORBIDDEN: 403,
      CONFLICT: 409,
      VALIDATION_ERROR: 400,
    }[error.code]
    return NextResponse.json({ error: error.message }, { status })
  }

  console.error('未預期的 API 錯誤:', error)
  return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}
