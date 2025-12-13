'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="ts-container is-narrow" style={{ paddingTop: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="ts-header is-large">
          <span className="ts-icon is-gear-icon"></span>
          設定
        </h1>
        <p className="ts-text is-secondary">管理你的帳號和偏好設定</p>
      </div>

      {/* Profile Section */}
      <div className="ts-box" style={{ marginBottom: '1.5rem' }}>
        <div className="ts-content">
          <h3 className="ts-header">個人資料</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            {session?.user?.image && (
              <img 
                src={session.user.image} 
                alt="avatar" 
                style={{ width: '64px', height: '64px', borderRadius: '50%' }}
              />
            )}
            <div>
              <div className="ts-header">{session?.user?.name || '使用者'}</div>
              <div className="ts-text is-secondary">{session?.user?.email || '透過 LINE 登入'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="ts-box" style={{ marginBottom: '1.5rem' }}>
        <div className="ts-content">
          <h3 className="ts-header">帳號設定</h3>
          
          <div className="ts-menu is-start-icon" style={{ marginTop: '1rem' }}>
            <a href="#" className="item">
              <span className="ts-icon is-bell-icon"></span>
              通知設定
              <span className="ts-badge is-secondary" style={{ marginLeft: 'auto' }}>即將推出</span>
            </a>
            <a href="#" className="item">
              <span className="ts-icon is-palette-icon"></span>
              外觀主題
              <span className="ts-badge is-secondary" style={{ marginLeft: 'auto' }}>即將推出</span>
            </a>
            <a href="#" className="item">
              <span className="ts-icon is-language-icon"></span>
              語言設定
              <span className="ts-text is-secondary" style={{ marginLeft: 'auto' }}>正體中文</span>
            </a>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="ts-box is-negative" style={{ marginBottom: '1.5rem' }}>
        <div className="ts-content">
          <h3 className="ts-header">登出</h3>
          <p className="ts-text is-secondary" style={{ marginBottom: '1rem' }}>
            登出後需要重新使用 LINE 登入
          </p>
          <button 
            onClick={handleSignOut} 
            className="ts-button is-negative is-outlined"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="ts-icon is-spinning is-spinner-icon"></span>
                登出中...
              </>
            ) : (
              <>
                <span className="ts-icon is-right-from-bracket-icon"></span>
                登出帳號
              </>
            )}
          </button>
        </div>
      </div>

      {/* Back Link */}
      <div className="ts-center">
        <Link href="/dashboard" className="ts-text is-link">
          <span className="ts-icon is-arrow-left-icon"></span>
          返回首頁
        </Link>
      </div>
    </div>
  )
}
