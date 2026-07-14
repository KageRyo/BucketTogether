'use client'

import { FormEvent, useEffect, useState } from 'react'
import { getProviders, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lineEnabled, setLineEnabled] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getProviders().then((providers) => setLineEnabled(Boolean(providers?.line)))
  }, [])

  const handleCredentialsLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      callbackUrl: '/dashboard',
      redirect: false,
    })

    setIsLoading(false)
    if (!result?.ok) {
      setError('帳號或密碼錯誤')
      return
    }

    router.push(result.url || '/dashboard')
    router.refresh()
  }

  return (
    <div className="ts-container is-narrow" style={{ paddingTop: '4rem', paddingBottom: '3rem' }}>
      <div className="ts-center">
        <span className="ts-icon is-huge is-list-check-icon" style={{ color: 'var(--app-primary)' }}></span>
        <h1 className="ts-header is-large" style={{ marginTop: '1rem' }}>登入 BucketTogether</h1>
        <p className="ts-text is-secondary" style={{ marginBottom: '2rem' }}>
          本地開發可使用測試帳號，正式環境可啟用 LINE 登入
        </p>
      </div>

      <div className="ts-box" style={{ maxWidth: '420px', margin: '0 auto' }}>
        <div className="ts-content">
          <form onSubmit={handleCredentialsLogin} className="ts-wrap is-vertical" style={{ gap: '1rem' }}>
            <div>
              <label className="ts-text is-small is-bold" htmlFor="email">Email</label>
              <div className="ts-input is-fluid" style={{ marginTop: '0.35rem' }}>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="alex@bucket.local"
                  required
                />
              </div>
            </div>
            <div>
              <label className="ts-text is-small is-bold" htmlFor="password">密碼</label>
              <div className="ts-input is-fluid" style={{ marginTop: '0.35rem' }}>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            </div>

            {error && <div className="ts-notice is-negative"><div className="content">{error}</div></div>}

            <button type="submit" className="ts-button is-primary is-fluid" disabled={isLoading}>
              {isLoading && <span className="ts-icon is-spinning is-spinner-icon"></span>}
              使用帳號密碼登入
            </button>

            {process.env.NODE_ENV !== 'production' && (
              <details className="ts-text is-secondary is-small">
                <summary>查看本地測試帳號</summary>
                <div style={{ marginTop: '0.5rem' }}>
                  <div><code>alex@bucket.local</code> / <code>Tester123!</code></div>
                  <div><code>jamie@bucket.local</code> / <code>Tester123!</code></div>
                  <div><code>admin@bucket.local</code> / <code>Admin123!</code></div>
                </div>
              </details>
            )}
          </form>

          {lineEnabled && (
            <>
              <div className="ts-divider is-section" style={{ margin: '1.5rem 0' }}>
                <span className="ts-text is-secondary is-small">或</span>
              </div>
              <button
                type="button"
                onClick={() => signIn('line', { callbackUrl: '/dashboard' })}
                className="ts-button is-line is-fluid"
              >
                <span className="ts-icon is-brands is-line-icon"></span>
                使用 LINE 登入
              </button>
            </>
          )}

          <p className="ts-text is-secondary is-small is-center-aligned" style={{ marginTop: '1.5rem' }}>
            登入即表示同意 <Link href="/terms" className="ts-text is-link">服務條款</Link>
            與 <Link href="/privacy" className="ts-text is-link">隱私權政策</Link>
          </p>
        </div>
      </div>

      <div className="ts-center" style={{ marginTop: '2rem' }}>
        <Link href="/" className="ts-text is-link">返回首頁</Link>
      </div>
    </div>
  )
}
