import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDataRepository } from '@/lib/data'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const lists = (await getDataRepository().listLists(session.user.id)).slice(0, 6)

  return (
    <div className="ts-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="ts-header is-large" style={{ marginBottom: '2rem' }}>
        <span className="ts-icon is-hand-wave-icon"></span>
        歡迎回來，{session.user.name}！
      </div>

      <div className="ts-grid is-2-columns is-relaxed" style={{ marginBottom: '2rem' }}>
        <div className="column">
          <Link href="/lists/new" className="ts-box is-link">
            <div className="ts-content">
              <div className="ts-icon is-big is-plus-icon" style={{ color: 'var(--app-primary)' }}></div>
              <h3 className="ts-header" style={{ marginTop: '0.5rem' }}>建立新清單</h3>
              <p className="ts-text is-secondary">開始規劃共同目標</p>
            </div>
          </Link>
        </div>
        <div className="column">
          <Link href="/invites" className="ts-box is-link">
            <div className="ts-content">
              <div className="ts-icon is-big is-envelope-icon" style={{ color: 'var(--app-primary)' }}></div>
              <h3 className="ts-header" style={{ marginTop: '0.5rem' }}>邀請通知</h3>
              <p className="ts-text is-secondary">查看待處理的清單邀請</p>
            </div>
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="ts-header"><span className="ts-icon is-list-icon"></span>我的清單</div>
        {lists.length > 0 && <Link href="/lists" className="ts-text is-link is-small">查看全部</Link>}
      </div>

      {lists.length > 0 ? (
        <div className="ts-grid is-3-columns is-relaxed">
          {lists.map((list) => (
            <div key={list.id} className="column">
              <Link href={`/lists/${list.id}`} className="ts-box is-link" style={{ textDecoration: 'none' }}>
                <div className="ts-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <h3 className="ts-header">{list.title}</h3>
                    {!list.isOwner && <span className="ts-badge is-small">{list.memberRole}</span>}
                  </div>
                  <p className="ts-text is-secondary is-small">{list.description || '暫無描述'}</p>
                  <div className="ts-meta is-secondary" style={{ marginTop: '0.5rem' }}>
                    <span className="item">{list.completedCount} / {list.itemCount} 完成</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="ts-box">
          <div className="ts-content is-center-aligned" style={{ padding: '3rem' }}>
            <span className="ts-icon is-huge is-inbox-icon"></span>
            <h3 className="ts-header" style={{ marginTop: '1rem' }}>還沒有任何清單</h3>
            <p className="ts-text is-secondary">建立第一個共享目標清單吧！</p>
          </div>
        </div>
      )}
    </div>
  )
}
