import { NextResponse } from 'next/server'
import { getDataRepository, ITEM_PRIORITIES, type ItemPriority } from '@/lib/data'
import { apiErrorResponse, optionalString, readJsonObject, requireApiUserId } from '@/lib/http/api'

interface RouteParams {
  params: Promise<{ id: string }>
}

function priority(value: unknown): ItemPriority | null | undefined {
  if (value === null) return null
  return typeof value === 'string' && ITEM_PRIORITIES.includes(value as ItemPriority)
    ? value as ItemPriority
    : undefined
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { id } = await params
    const items = await getDataRepository().listItems(userId, id)
    return NextResponse.json({ data: items })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { id } = await params
    const body = await readJsonObject(request)
    const item = await getDataRepository().createItem(userId, id, {
      title: optionalString(body.title) || '',
      description: optionalString(body.description),
      categoryId: optionalString(body.categoryId),
      priority: priority(body.priority),
      dueDate: optionalString(body.dueDate),
    })
    return NextResponse.json({ data: item, message: '項目新增成功' }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
