import { getDataRepository } from '@/lib/data'
import { exportList } from '@/lib/data/list-export'
import { apiErrorResponse, requireApiUserId } from '@/lib/http/api'
import { enforceRateLimit } from '@/lib/http/security'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireApiUserId()
    const { id } = await params
    const repository = getDataRepository()
    await enforceRateLimit(repository, `export:${userId}`, 10)
    const result = await exportList(repository, userId, id, new URL(request.url).searchParams.get('format') || 'json')
    return new Response(result.body, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    const response = apiErrorResponse(error)
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  }
}
