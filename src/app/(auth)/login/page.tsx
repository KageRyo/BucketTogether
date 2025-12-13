'use client'

import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function LoginPage() {
  const handleLineLogin = () => {
    signIn('line', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="ts-container is-narrow" style={{ paddingTop: '6rem' }}>
      <div className="ts-center">
        {/* Logo */}
        <span 
          className="ts-icon is-huge is-list-check-icon" 
          style={{ color: 'var(--ts-primary-500)' }}
        ></span>
        <h1 className="ts-header is-large" style={{ marginTop: '1rem' }}>
          登入 BucketTogether
        </h1>
        <p className="ts-text is-secondary" style={{ marginBottom: '2rem' }}>
          使用 LINE 帳號快速登入，開始與親友一起規劃願望清單
        </p>
      </div>

      {/* Login Card */}
      <div className="ts-box" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="ts-content">
          <div className="ts-center">
            <button
              onClick={handleLineLogin}
              className="ts-button is-fluid is-large"
              style={{ 
                backgroundColor: '#06c755', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span className="ts-icon is-brands is-line-icon"></span>
              使用 LINE 登入
            </button>
          </div>

          <div className="ts-divider is-section" style={{ margin: '1.5rem 0' }}>
            <span className="ts-text is-secondary is-small">安全登入</span>
          </div>

          <div className="ts-text is-secondary is-small is-center-aligned">
            <p>
              點擊登入即表示您同意我們的
              <Link href="/terms" className="ts-text is-link">服務條款</Link>
              與
              <Link href="/privacy" className="ts-text is-link">隱私權政策</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Back to Home */}
      <div className="ts-center" style={{ marginTop: '2rem' }}>
        <Link href="/" className="ts-text is-link">
          <span className="ts-icon is-arrow-left-icon"></span>
          返回首頁
        </Link>
      </div>
    </div>
  )
}
