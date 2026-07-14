import { NextResponse } from 'next/server'
import { getDataRepository } from '@/lib/data'
import { apiErrorResponse, optionalString, readJsonObject, requireApiUserId } from '@/lib/http/api'

// GET /api/lists - 取得當前使用者可查看的清單
export async function GET() {
  try {
    const userId = await requireApiUserId()
    const lists = await getDataRepository().listLists(userId)
    return NextResponse.json({ data: lists })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

// POST /api/lists - 建立清單與初始分類
export async function POST(request: Request) {
  try {
    const userId = await requireApiUserId()
    const body = await readJsonObject(request)
    const categories = Array.isArray(body.categories)
      ? body.categories.flatMap((category) => {
          if (!category || typeof category !== 'object' || Array.isArray(category)) return []
          const record = category as Record<string, unknown>
          const name = optionalString(record.name)
          if (!name) return []
          return [{ name, color: optionalString(record.color) }]
        })
      : []

    const list = await getDataRepository().createList(userId, {
      title: optionalString(body.title) || '',
      description: optionalString(body.description),
      categories,
    })

    return NextResponse.json({ data: list, message: '清單建立成功' }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
