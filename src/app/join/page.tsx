'use client'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { InvitePreview } from '@/lib/data'
import { apiRequest } from '@/lib/http/client'

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener('hashchange', callback)
    window.removeEventListener('storage', callback)
  }
}
function readToken(): string {
  const fragment = window.location.hash.slice(1)
  try {
    return fragment || sessionStorage.getItem('bucket-invite') || ''
  } catch {
    return fragment
  }
}
export default function JoinPage() {
  const { status } = useSession()
  const router = useRouter()
  const token = useSyncExternalStore(subscribe, readToken, () => null)
  const [result, setResult] = useState<{
    token: string
    preview?: InvitePreview
    error?: string
  } | null>(null)
  const preview = result?.token === token ? result.preview : undefined
  const error = result?.token === token ? result.error : undefined
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (token && window.location.hash) {
      try {
        sessionStorage.setItem('bucket-invite', token)
        window.history.replaceState(null, '', '/join')
      } catch {
        /* Keep the fragment when tab storage is unavailable. */
      }
    }
  }, [token])
  useEffect(() => {
    if (status !== 'authenticated' || !token) return
    const controller = new AbortController()
    apiRequest<InvitePreview>('/api/join/preview', {
      method: 'POST',
      body: JSON.stringify({ token }),
      signal: controller.signal,
    })
      .then((preview) => setResult({ token, preview }))
      .catch((e) => {
        if (!controller.signal.aborted) setResult({ token, error: e.message })
      })
    return () => controller.abort()
  }, [status, token])
  const accept = async () => {
    if (!token || !preview) return
    setBusy(true)
    setResult({ token, preview })
    try {
      const { listId } = await apiRequest<{ listId: string }>('/api/join', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
      sessionStorage.removeItem('bucket-invite')
      router.push(`/lists/${listId}`)
      router.refresh()
    } catch (e) {
      setResult({ token, preview, error: e instanceof Error ? e.message : '無法接受邀請' })
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="ts-container is-narrow" style={{ padding: '3rem 1rem' }}>
      <div className="ts-box">
        <div className="ts-content">
          <h1 className="ts-header is-large">一起完成目標</h1>
          {error && <p role="alert">{error}</p>}
          {token === null || status === 'loading' ? (
            <p>載入邀請中…</p>
          ) : !token ? (
            <p>請開啟朋友分享的完整邀請連結。</p>
          ) : status !== 'authenticated' ? (
            <>
              <p>登入後即可查看並確認邀請。</p>
              <Link className="ts-button is-primary" href="/login?callbackUrl=/join">
                登入並查看邀請
              </Link>
            </>
          ) : preview ? (
            <>
              <h2>{preview.title}</h2>
              <p>
                你將以「{preview.role === 'editor' ? '可編輯' : '僅查看'}
                」權限加入。若已是成員，保留原有權限。
              </p>
              <button
                className="ts-button is-primary"
                disabled={busy}
                onClick={() => void accept()}
              >
                {busy ? '加入中…' : '接受邀請'}
              </button>
            </>
          ) : (
            !error && <p>正在確認邀請…</p>
          )}
          <p>
            <Link href="/lists">返回我的清單</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
