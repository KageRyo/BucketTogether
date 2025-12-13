import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="ts-app-layout is-full is-horizontal">
      {/* Sidebar */}
      <div className="cell" style={{ width: '240px', backgroundColor: 'white', borderRight: '1px solid var(--ts-gray-200)' }}>
        <div className="ts-content">
          {/* Logo */}
          <Link href="/dashboard" className="ts-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
            <span className="ts-icon is-list-check-icon" style={{ color: 'var(--ts-primary-500)' }}></span>
            BucketTogether
          </Link>

          {/* Navigation */}
          <nav>
            <div className="ts-menu is-start-icon">
              <Link href="/dashboard" className="item">
                <span className="ts-icon is-house-icon"></span>
                首頁
              </Link>
              <Link href="/lists" className="item">
                <span className="ts-icon is-list-icon"></span>
                我的清單
              </Link>
              <Link href="/lists/new" className="item">
                <span className="ts-icon is-plus-icon"></span>
                建立清單
              </Link>
              <Link href="/invites" className="item">
                <span className="ts-icon is-envelope-icon"></span>
                邀請通知
              </Link>
            </div>

            <div className="ts-divider" style={{ margin: '1rem 0' }}></div>

            <div className="ts-menu is-start-icon">
              <Link href="/settings" className="item">
                <span className="ts-icon is-gear-icon"></span>
                設定
              </Link>
              <Link href="/api/auth/signout" className="item">
                <span className="ts-icon is-right-from-bracket-icon"></span>
                登出
              </Link>
            </div>
          </nav>
        </div>

        {/* User Info */}
        <div className="ts-content" style={{ position: 'absolute', bottom: 0, width: '240px' }}>
          <div className="ts-box">
            <div className="ts-content is-dense">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {session.user?.image && (
                  <img 
                    src={session.user.image} 
                    alt="avatar" 
                    style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                  />
                )}
                <div>
                  <div className="ts-text is-bold is-small">{session.user?.name}</div>
                  <div className="ts-text is-secondary is-tiny">{session.user?.email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="cell is-fluid" style={{ backgroundColor: 'var(--ts-gray-50)', overflow: 'auto' }}>
        {children}
      </div>
    </div>
  )
}
