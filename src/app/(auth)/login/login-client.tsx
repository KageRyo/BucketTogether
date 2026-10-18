'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { getProviders, signIn, type ClientSafeProvider } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const names: Record<string, string> = { line: 'LINE', discord: 'Discord', google: 'Google' }
export function LoginClient({
  callbackUrl,
  initialError,
}: {
  callbackUrl: string
  initialError: boolean
}) {
  const router = useRouter()
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider>>({})
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(
    initialError ? '登入未完成。請重試；若正在綁定帳號，請先確認該登入方式未綁定其他帳號。' : '',
  )
  useEffect(() => {
    getProviders()
      .then((data) => {
        setProviders(data || {})
        setReady(true)
      })
      .catch(() => {
        setError('無法載入登入方式，請重新整理。')
        setReady(true)
      })
  }, [])
  const credentialsLogin = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await signIn('credentials', { email, password, callbackUrl, redirect: false })
      if (!result?.ok) throw new Error('帳號或密碼錯誤')
      router.push(callbackUrl)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '登入失敗')
    } finally {
      setBusy(false)
    }
  }
  const oauthLogin = async (provider: string) => {
    setBusy(true)
    setError('')
    try {
      await signIn(provider, { callbackUrl })
    } catch {
      setError('無法開始登入，請重試。')
      setBusy(false)
    }
  }
  return (
    <main className="ts-container is-narrow" style={{ padding: '3rem 1rem' }}>
      <div className="ts-center">
        <h1 className="ts-header is-large">登入 BucketTogether</h1>
        <p>和朋友一起，把想做的事變成共同回憶。</p>
      </div>
      <div className="ts-box" style={{ maxWidth: 440, margin: '2rem auto' }}>
        <div className="ts-content app-stack">
          {error && <p role="alert">{error}</p>}
          {!ready && <p>載入登入方式中…</p>}
          {Object.keys(names)
            .filter((id) => providers[id])
            .map((id) => (
              <button
                key={id}
                type="button"
                className={`ts-button is-fluid is-${id}`}
                disabled={busy}
                onClick={() => void oauthLogin(id)}
              >
                使用 {names[id]} 登入
              </button>
            ))}
          {ready && !Object.keys(providers).length && <p>登入暫時無法使用，請稍後重試。</p>}
          {providers.credentials && (
            <form onSubmit={credentialsLogin} className="app-stack">
              <h2 className="ts-header">本地測試登入</h2>
              <label>
                Email
                <input
                  className="app-field"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                密碼
                <input
                  className="app-field"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <button className="ts-button is-primary" disabled={busy}>
                使用帳號密碼登入
              </button>
              <details>
                <summary>查看本地測試帳號</summary>
                <p>alex@bucket.local ／ Tester123!</p>
                <p>jamie@bucket.local ／ Tester123!</p>
                <p>admin@bucket.local ／ Admin123!</p>
              </details>
            </form>
          )}
          <p className="ts-text is-small">
            登入即表示同意 <Link href="/terms">服務條款</Link> 與{' '}
            <Link href="/privacy">隱私權政策</Link>。
          </p>
        </div>
      </div>
      <p className="ts-center">
        <Link href="/">返回首頁</Link>
      </p>
    </main>
  )
}
