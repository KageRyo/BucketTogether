import { NextResponse } from 'next/server'
import { getDataRepository } from '@/lib/data'
import { apiErrorResponse, requireApiUserId } from '@/lib/http/api'

export async function GET() {
  try {
    const userId = await requireApiUserId()
    const invites = await getDataRepository().listPendingInvites(userId)
    return NextResponse.json({ data: invites })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
