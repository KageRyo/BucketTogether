import { NextResponse } from 'next/server'
import { getDataRepository, DataError } from '@/lib/data'
import { apiErrorResponse, readJsonObject, requireApiUserId } from '@/lib/http/api'
export async function GET() {
  try {
    const userId = await requireApiUserId()
    const identities = await getDataRepository().listIdentities(userId)
    return NextResponse.json({
      data: identities.map(({ provider, createdAt }) => ({ provider, createdAt })),
    })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
export async function DELETE(request: Request) {
  try {
    const userId = await requireApiUserId(request)
    const body = await readJsonObject(request)
    if (body.confirmation !== 'DELETE')
      throw new DataError('VALIDATION_ERROR', '請輸入 DELETE 確認刪除')
    await getDataRepository().deleteAccount(userId)
    return NextResponse.json({ message: '帳號已刪除' })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
