import { NextResponse } from 'next/server'
import { getDataRepository } from '@/lib/data'
import { apiErrorResponse, requireApiUserId } from '@/lib/http/api'
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  try {
    const userId = await requireApiUserId(request)
    const { id, inviteId } = await params
    await getDataRepository().revokeInviteLink(userId, id, inviteId)
    return NextResponse.json({ message: '邀請已撤銷' })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
