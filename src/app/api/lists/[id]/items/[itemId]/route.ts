import { NextResponse } from 'next/server'
import { getDataRepository, ITEM_PRIORITIES, type ItemPriority } from '@/lib/data'
import { apiErrorResponse, optionalString, readJsonObject, requireApiUserId } from '@/lib/http/api'

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>
}

function priority(value: unknown): ItemPriority | null | undefined {
  if (value === null) return null
  return typeof value === 'string' && ITEM_PRIORITIES.includes(value as ItemPriority)
    ? value as ItemPriority
    : undefined
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { id, itemId } = await params
    const body = await readJsonObject(request)
    const item = await getDataRepository().updateItem(userId, id, itemId, {
      title: optionalString(body.title),
      description: body.description === null ? null : optionalString(body.description),
      categoryId: body.categoryId === null ? null : optionalString(body.categoryId),
      priority: priority(body.priority),
      dueDate: body.dueDate === null ? null : optionalString(body.dueDate),
      isCompleted: typeof body.isCompleted === 'boolean' ? body.isCompleted : undefined,
    })
    return NextResponse.json({ data: item, message: '項目更新成功' })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { id, itemId } = await params
    await getDataRepository().deleteItem(userId, id, itemId)
    return NextResponse.json({ message: '項目已刪除' })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
