'use client'

import { useRef, useState } from 'react'

export function ListExport({ listId }: { listId: string }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const downloading = useRef(false)

  const download = async (format: 'json' | 'csv') => {
    if (downloading.current) return
    downloading.current = true
    setPending(true)
    setError('')
    try {
      const response = await fetch(`/api/lists/${listId}/export?format=${format}`, { cache: 'no-store' })
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(result.error || '匯出失敗，請稍後重試')
      }
      const url = URL.createObjectURL(await response.blob())
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1]
        || `bucket-list-${listId}.${format}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '匯出失敗')
    } finally {
      downloading.current = false
      setPending(false)
    }
  }

  return (
    <section className="ts-box" aria-label="匯出清單" style={{ marginBottom: '1.5rem' }}>
      <div className="ts-content">
        <h2 className="ts-header">匯出清單</h2>
        <p className="ts-text is-secondary is-small">
          下載已儲存的完整清單：JSON 保留分類與中繼資料，CSV 適合試算表。匯出不會刪除資料，也不包含成員或邀請資訊。單檔上限 4 MiB。
        </p>
        <div className="ts-wrap" style={{ gap: '0.5rem', marginTop: '0.75rem' }}>
          <button type="button" className="ts-button is-outlined" disabled={pending} onClick={() => void download('json')}>下載 JSON</button>
          <button type="button" className="ts-button is-outlined" disabled={pending} onClick={() => void download('csv')}>下載 CSV</button>
        </div>
        {pending && <p role="status">正在準備下載…</p>}
        {error && <p role="alert" className="ts-text is-negative">{error}</p>}
      </div>
    </section>
  )
}
