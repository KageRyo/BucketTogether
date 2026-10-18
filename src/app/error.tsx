'use client'
import { useEffect } from 'react'
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('page_error', { digest: error.digest || 'client' })
  }, [error])
  return (
    <main className="ts-container is-narrow" style={{ padding: '3rem 1rem' }}>
      <h1>暫時無法載入</h1>
      <p>
        請稍後重試。若持續發生，請聯絡我們並提供時間{error.digest ? `及識別碼 ${error.digest}` : ''}
        。
      </p>
      <button className="ts-button is-primary" onClick={reset}>
        重試
      </button>
    </main>
  )
}
