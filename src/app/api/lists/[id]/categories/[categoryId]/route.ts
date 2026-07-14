import { NextResponse } from 'next/server'
import { getDataRepository } from '@/lib/data'
import { apiErrorResponse, optionalString, readJsonObject, requireApiUserId } from '@/lib/http/api'

interface RouteParams {
  params: Promise<{ id: string; categoryId: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { id, categoryId } = await params
    const body = await readJsonObject(request)
    const category = await getDataRepository().updateCategory(userId, id, categoryId, {
      name: optionalString(body.name),
      color: optionalString(body.color),
    })
    return NextResponse.json({ data: category, message: '分類已更新' })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { id, categoryId } = await params
    await getDataRepository().deleteCategory(userId, id, categoryId)
    return NextResponse.json({ message: '分類已刪除' })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
