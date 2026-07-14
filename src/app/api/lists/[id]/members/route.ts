import { NextResponse } from 'next/server'
import { getDataRepository, INVITABLE_ROLES, type MemberRole } from '@/lib/data'
import { apiErrorResponse, optionalString, readJsonObject, requireApiUserId } from '@/lib/http/api'

interface RouteParams {
  params: Promise<{ id: string }>
}

function memberRole(value: unknown): Exclude<MemberRole, 'owner'> {
  return typeof value === 'string' && INVITABLE_ROLES.includes(value as Exclude<MemberRole, 'owner'>)
    ? value as Exclude<MemberRole, 'owner'>
    : 'editor'
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { id } = await params
    const members = await getDataRepository().listMembers(userId, id)
    return NextResponse.json({ data: members })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { id } = await params
    const body = await readJsonObject(request)
    const member = await getDataRepository().inviteMember(
      userId,
      id,
      optionalString(body.email) || '',
      memberRole(body.role),
    )
    return NextResponse.json({ data: member, message: '邀請已發送' }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
