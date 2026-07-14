import { NextResponse } from 'next/server'
import { DataError, getDataRepository, INVITABLE_ROLES, type MemberRole } from '@/lib/data'
import { apiErrorResponse, readJsonObject, requireApiUserId } from '@/lib/http/api'

interface RouteParams {
  params: Promise<{ id: string; membershipId: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { id, membershipId } = await params
    const body = await readJsonObject(request)
    const role = body.role
    if (typeof role !== 'string' || !INVITABLE_ROLES.includes(role as Exclude<MemberRole, 'owner'>)) {
      throw new DataError('VALIDATION_ERROR', '角色必須為 editor 或 viewer')
    }
    const member = await getDataRepository().updateMemberRole(
      userId,
      id,
      membershipId,
      role as Exclude<MemberRole, 'owner'>,
    )
    return NextResponse.json({ data: member, message: '成員角色已更新' })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { id, membershipId } = await params
    await getDataRepository().removeMember(userId, id, membershipId)
    return NextResponse.json({ message: '成員已移除' })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
