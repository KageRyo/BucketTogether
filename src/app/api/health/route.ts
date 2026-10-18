import { NextResponse } from 'next/server'
import { getDataRepository } from '@/lib/data'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    await getDataRepository().getUserById('00000000-0000-4000-8000-000000000000')
    return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json(
      { status: 'unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
