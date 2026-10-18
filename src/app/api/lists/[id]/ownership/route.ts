import { NextResponse } from 'next/server'
import { DataError, getDataRepository } from '@/lib/data'
import { apiErrorResponse, expectedVersion, readJsonObject, requireApiUserId } from '@/lib/http/api'
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireApiUserId(request)
    const body = await readJsonObject(request)
    if (typeof body.newOwnerId !== 'string' || !body.newOwnerId)
      throw new DataError('VALIDATION_ERROR', '請選擇接任的擁有者')
    const list = await getDataRepository().transferOwnership(
      userId,
      (await params).id,
      body.newOwnerId,
      expectedVersion(body.expectedVersion),
    )
    return NextResponse.json({ data: list })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
