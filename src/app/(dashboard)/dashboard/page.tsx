import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const supabase = createSupabaseAdmin()
  const userId = (session.user as any).supabaseUserId

  // 取得使用者的清單
  let lists: any[] = []
  if (userId) {
    const { data: ownedLists } = await supabase
      .from('lists')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(6)

    // 取得每個清單的項目數量
    lists = await Promise.all(
      (ownedLists || []).map(async (list) => {
        const { count } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', list.id)

        return {
          ...list,
          itemCount: count || 0,
        }
      })
    )
  }

  return (
    <div className="ts-container" style={{ paddingTop: '2rem' }}>
      {/* Welcome Header */}
      <div className="ts-header is-large" style={{ marginBottom: '2rem' }}>
        <span className="ts-icon is-hand-wave-icon"></span>
        歡迎回來，{session.user?.name}！
      </div>

      {/* Quick Actions */}
      <div className="ts-grid is-2-columns is-relaxed" style={{ marginBottom: '2rem' }}>
        <div className="column">
          <Link href="/lists/new" className="ts-box is-link">
            <div className="ts-content">
              <div className="ts-icon is-big is-plus-icon" style={{ color: 'var(--ts-primary-500)' }}></div>
              <h3 className="ts-header" style={{ marginTop: '0.5rem' }}>建立新清單</h3>
              <p className="ts-text is-secondary">開始規劃你們的共同目標</p>
            </div>
          </Link>
        </div>
        <div className="column">
          <Link href="/invites" className="ts-box is-link">
            <div className="ts-content">
              <div className="ts-icon is-big is-envelope-icon" style={{ color: 'var(--ts-primary-500)' }}></div>
              <h3 className="ts-header" style={{ marginTop: '0.5rem' }}>邀請通知</h3>
              <p className="ts-text is-secondary">查看待處理的清單邀請</p>
            </div>
          </Link>
        </div>
      </div>

      {/* My Lists Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="ts-header">
          <span className="ts-icon is-list-icon"></span>
          我的清單
        </div>
        {lists.length > 0 && (
          <Link href="/lists" className="ts-text is-link is-small">查看全部</Link>
        )}
      </div>

      {lists.length > 0 ? (
        <div className="ts-grid is-3-columns is-relaxed">
          {lists.map((list) => (
            <div key={list.id} className="column">
              <Link href={`/lists/${list.id}`} style={{ textDecoration: 'none' }}>
                <div className="ts-box is-link">
                  <div className="ts-content">
                    <h3 className="ts-header">{list.title}</h3>
                    <p className="ts-text is-secondary is-small" style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {list.description || '暫無描述'}
                    </p>
                    <div className="ts-meta is-secondary" style={{ marginTop: '0.5rem' }}>
                      <span className="item">
                        <span className="ts-icon is-clipboard-list-icon"></span>
                        {list.itemCount} 個項目
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="ts-box">
          <div className="ts-content is-center-aligned" style={{ padding: '3rem' }}>
            <span className="ts-icon is-huge is-inbox-icon" style={{ color: 'var(--ts-gray-400)' }}></span>
            <h3 className="ts-header" style={{ marginTop: '1rem', color: 'var(--ts-gray-600)' }}>
              還沒有任何清單
            </h3>
            <p className="ts-text is-secondary" style={{ marginBottom: '1rem' }}>
              建立你的第一個共享願望清單吧！
            </p>
            <Link href="/lists/new" className="ts-button is-primary">
              <span className="ts-icon is-plus-icon"></span>
              建立清單
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
