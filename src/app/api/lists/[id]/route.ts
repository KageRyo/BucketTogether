import { NextResponse } from 'next/server'
import { getDataRepository } from '@/lib/data'
import { apiErrorResponse, optionalString, readJsonObject, requireApiUserId } from '@/lib/http/api'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { id } = await params
    const list = await getDataRepository().getList(userId, id)
    return NextResponse.json({ data: list })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { id } = await params
    const body = await readJsonObject(request)
    const list = await getDataRepository().updateList(userId, id, {
      title: optionalString(body.title),
      description: body.description === null ? null : optionalString(body.description),
      isPublic: typeof body.isPublic === 'boolean'
        ? body.isPublic
        : typeof body.is_public === 'boolean' ? body.is_public : undefined,
    })
    return NextResponse.json({ data: list, message: '清單更新成功' })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { id } = await params
    await getDataRepository().deleteList(userId, id)
    return NextResponse.json({ message: '清單已刪除' })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
