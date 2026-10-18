export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}
export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const result = (await response.json().catch(() => ({}))) as { data?: T; error?: string }
  if (!response.ok) throw new ApiError(result.error || '操作失敗，請稍後重試', response.status)
  return result.data as T
}
