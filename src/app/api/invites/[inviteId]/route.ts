import { NextResponse } from 'next/server'
import { DataError, getDataRepository } from '@/lib/data'
import { apiErrorResponse, readJsonObject, requireApiUserId } from '@/lib/http/api'

interface RouteParams {
  params: Promise<{ inviteId: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { inviteId } = await params
    const body = await readJsonObject(request)
    if (body.action !== 'accept' && body.action !== 'reject') {
      throw new DataError('VALIDATION_ERROR', '動作必須為 accept 或 reject')
    }
    await getDataRepository().respondToInvite(userId, inviteId, body.action)
    return NextResponse.json({ message: body.action === 'accept' ? '已接受邀請' : '已拒絕邀請' })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
