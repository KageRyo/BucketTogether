import { NextResponse } from 'next/server'
import { DataError, getDataRepository } from '@/lib/data'
import { apiErrorResponse, readJsonObject, requireApiUserId } from '@/lib/http/api'
export async function POST(request: Request) {
  try {
    const userId = await requireApiUserId(request)
    const { token } = await readJsonObject(request)
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token))
      throw new DataError('VALIDATION_ERROR', '邀請連結格式不正確')
    return NextResponse.json({ data: await getDataRepository().getInvitePreview(userId, token) })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
