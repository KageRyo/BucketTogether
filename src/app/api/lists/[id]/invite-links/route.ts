import { NextResponse } from 'next/server'
import { DataError, getDataRepository } from '@/lib/data'
import { apiErrorResponse, readJsonObject, requireApiUserId } from '@/lib/http/api'
type Context = { params: Promise<{ id: string }> }
export async function GET(_request: Request, { params }: Context) {
  try {
    const userId = await requireApiUserId()
    return NextResponse.json({
      data: await getDataRepository().listInviteLinks(userId, (await params).id),
    })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    const userId = await requireApiUserId(request)
    const { role } = await readJsonObject(request)
    if (role !== 'editor' && role !== 'viewer')
      throw new DataError('VALIDATION_ERROR', '請選擇邀請角色')
    return NextResponse.json(
      { data: await getDataRepository().createInviteLink(userId, (await params).id, role) },
      { status: 201 },
    )
  } catch (error) {
    return apiErrorResponse(error)
  }
}
