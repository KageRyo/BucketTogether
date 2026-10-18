'use client'
import { useCallback, useEffect, useState } from 'react'
import type { CreatedInviteLink, InviteLink } from '@/lib/data'
import { apiRequest } from '@/lib/http/client'

export function InviteLinks({ listId }: { listId: string }) {
  const [links, setLinks] = useState<InviteLink[]>([])
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const endpoint = `/api/lists/${listId}/invite-links`
  const refresh = useCallback(async () => {
    setLinks(await apiRequest<InviteLink[]>(endpoint))
  }, [endpoint])
  useEffect(() => {
    const controller = new AbortController()
    apiRequest<InviteLink[]>(endpoint, { signal: controller.signal })
      .then(setLinks)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message)
      })
    return () => controller.abort()
  }, [endpoint])
  const create = async () => {
    setBusy(true)
    setError('')
    setCopied(false)
    try {
      const invite = await apiRequest<CreatedInviteLink>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ role }),
      })
      // Fragment keeps the bearer token out of server access logs and referrers.
      setUrl(`${window.location.origin}/join#${invite.token}`)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '建立失敗')
    } finally {
      setBusy(false)
    }
  }
  const revoke = async (id: string) => {
    setBusy(true)
    setError('')
    try {
      await apiRequest(`${endpoint}/${id}`, { method: 'DELETE' })
      setUrl('')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '撤銷失敗')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section aria-label="邀請連結" style={{ marginTop: '1rem' }}>
      <p>連結七天內有效，限一人使用。接受前不會取得清單權限。</p>
      <div className="app-actions">
        <div className="ts-select">
          <select
            aria-label="邀請角色"
            value={role}
            onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
          >
            <option value="editor">可編輯</option>
            <option value="viewer">僅查看</option>
          </select>
        </div>
        <button
          className="ts-button is-primary"
          type="button"
          disabled={busy}
          onClick={() => void create()}
        >
          建立邀請連結
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {url && (
        <div style={{ marginTop: '1rem' }}>
          <label htmlFor="invite-url">請複製此連結分享給朋友</label>
          <div className="ts-input is-fluid">
            <input id="invite-url" readOnly value={url} onFocus={(e) => e.target.select()} />
          </div>
          <button
            type="button"
            className="ts-button is-small"
            onClick={() => {
              void navigator.clipboard
                .writeText(url)
                .then(() => setCopied(true))
                .catch(() => setError('請選取上方連結手動複製'))
            }}
          >
            {copied ? '已複製' : '複製連結'}
          </button>
        </div>
      )}
      <ul className="app-invite-links">
        {links.map((link) => (
          <li key={link.id}>
            {link.role === 'editor' ? '可編輯' : '僅查看'} ·{' '}
            {link.revokedAt
              ? '已撤銷'
              : link.acceptedAt
                ? '已使用'
                : `有效至 ${new Date(link.expiresAt).toLocaleDateString('zh-TW')}`}
            {!link.revokedAt && !link.acceptedAt && (
              <button
                type="button"
                className="ts-button is-small is-ghost"
                disabled={busy}
                onClick={() => void revoke(link.id)}
              >
                撤銷
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
