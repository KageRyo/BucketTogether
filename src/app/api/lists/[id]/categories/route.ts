import { NextResponse } from 'next/server'
import { getDataRepository } from '@/lib/data'
import { apiErrorResponse, optionalString, readJsonObject, requireApiUserId } from '@/lib/http/api'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const userId = await requireApiUserId()
    const { id } = await params
    const body = await readJsonObject(request)
    const category = await getDataRepository().createCategory(
      userId,
      id,
      optionalString(body.name) || '',
      optionalString(body.color),
    )
    return NextResponse.json({ data: category, message: '分類已建立' }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
