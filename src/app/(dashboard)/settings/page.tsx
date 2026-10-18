'use client'
import { useEffect, useState } from 'react'
import { getProviders, signIn, signOut, useSession } from 'next-auth/react'
import { apiRequest } from '@/lib/http/client'
import type { OAuthProvider } from '@/lib/data'
const names: Record<string, string> = { line: 'LINE', discord: 'Discord', google: 'Google' }
export default function SettingsPage() {
  const { data: session } = useSession()
  const [identities, setIdentities] = useState<{ provider: OAuthProvider }[]>([])
  const [providers, setProviders] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const hasLinkError = new URLSearchParams(window.location.search).has('error')
    Promise.all([apiRequest<{ provider: OAuthProvider }[]>('/api/account'), getProviders()])
      .then(([accounts, available]) => {
        if (hasLinkError) setError('綁定未完成，請重新操作。')
        setIdentities(accounts)
        setProviders(Object.keys(available || {}).filter((id) => names[id]))
        setReady(true)
      })
      .catch(() => setError('無法載入帳號資料，請重新整理。'))
  }, [])
  const link = async (provider: string) => {
    setBusy(true)
    setError('')
    try {
      await apiRequest('/api/account/link', { method: 'POST', body: JSON.stringify({ provider }) })
      await signIn(provider, { callbackUrl: '/settings' })
    } catch (e) {
      setError(e instanceof Error ? e.message : '綁定失敗')
      setBusy(false)
    }
  }
  const deleteAccount = async () => {
    setBusy(true)
    setError('')
    try {
      await apiRequest('/api/account', { method: 'DELETE', body: JSON.stringify({ confirmation }) })
      sessionStorage.removeItem('bucket-invite')
      await signOut({ callbackUrl: '/' })
    } catch (e) {
      setError(e instanceof Error ? e.message : '刪除失敗')
      setBusy(false)
    }
  }
  return (
    <div className="ts-container is-narrow" style={{ padding: '2rem 1rem' }}>
      <h1 className="ts-header is-large">帳號設定</h1>
      {error && <p role="alert">{error}</p>}
      <section className="ts-box" style={{ margin: '1.5rem 0' }}>
        <div className="ts-content">
          <h2 className="ts-header">個人資料</h2>
          <p>{session?.user?.name}</p>
          <p>{session?.user?.email || '未提供 Email'}</p>
        </div>
      </section>
      <section className="ts-box">
        <div className="ts-content">
          <h2 className="ts-header">登入方式</h2>
          <p>綁定後，可以使用不同平台登入同一帳號。相同 Email 不會自動合併帳號。</p>
          {!ready ? (
            <p>載入中…</p>
          ) : (
            <div className="app-stack">
              {providers.map((provider) => (
                <div key={provider} className="app-actions">
                  <span>{names[provider]}</span>
                  {identities.some((i) => i.provider === provider) ? (
                    <span>已綁定</span>
                  ) : (
                    <button
                      type="button"
                      className="ts-button is-outlined"
                      disabled={busy}
                      onClick={() => void link(provider)}
                    >
                      綁定 {names[provider]}
                    </button>
                  )}
                </div>
              ))}
              {!providers.length && <p>目前使用本地測試帳號。</p>}
            </div>
          )}
        </div>
      </section>
      <section className="ts-box is-negative" style={{ margin: '1.5rem 0' }}>
        <div className="ts-content app-stack">
          <h2 className="ts-header">刪除帳號</h2>
          <p>
            這會永久刪除你的帳號、登入綁定及你擁有的所有清單，並退出其他人的清單。其他清單中的共同編輯內容會保留，作者與完成者改為匿名。備份中的資料依備份保留期間到期移除。
          </p>
          <label>
            輸入 DELETE 確認
            <input
              className="app-field"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className="ts-button is-negative"
            disabled={busy || confirmation !== 'DELETE'}
            onClick={() => void deleteAccount()}
          >
            永久刪除帳號與擁有的清單
          </button>
        </div>
      </section>
      <button
        type="button"
        className="ts-button is-outlined"
        disabled={busy}
        onClick={() => void signOut({ callbackUrl: '/' })}
      >
        登出
      </button>
    </div>
  )
}
