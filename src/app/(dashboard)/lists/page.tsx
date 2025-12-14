import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function ListsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const supabase = createSupabaseAdmin()
  const userId = (session.user as any).supabaseUserId

  // 取得使用者的所有清單
  let lists: any[] = []
  if (userId) {
    // 查詢使用者擁有的清單
    const { data: ownedLists } = await supabase
      .from('lists')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    // 計算每個清單的項目數量和完成數
    const owned = await Promise.all(
      (ownedLists || []).map(async (list) => {
        const { data: items } = await supabase
          .from('items')
          .select('is_completed')
          .eq('list_id', list.id)

        const itemCount = items?.length || 0
        const completedCount = items?.filter(i => i.is_completed).length || 0

        return {
          ...list,
          isOwner: true,
          itemCount,
          completedCount,
        }
      })
    )

    // 查詢使用者參與的清單
    const { data: memberRecords } = await supabase
      .from('list_members')
      .select('list_id')
      .eq('user_id', userId)

    const participatedListIds = (memberRecords || [])
      .map(m => m.list_id)
      .filter(id => !owned.some(l => l.id === id))

    let participated: any[] = []
    if (participatedListIds.length > 0) {
      const { data: pLists } = await supabase
        .from('lists')
        .select('*')
        .in('id', participatedListIds)

      participated = await Promise.all(
        (pLists || []).map(async (list) => {
          const { data: items } = await supabase
            .from('items')
            .select('is_completed')
            .eq('list_id', list.id)

          const itemCount = items?.length || 0
          const completedCount = items?.filter(i => i.is_completed).length || 0

          return {
            ...list,
            isOwner: false,
            itemCount,
            completedCount,
          }
        })
      )
    }

    lists = [...owned, ...participated]
  }

  return (
    <div className="ts-container" style={{ paddingTop: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="ts-header is-large">我的清單</h1>
          <p className="ts-text is-secondary">管理你所有的願望清單（共 {lists.length} 個）</p>
        </div>
        <Link href="/lists/new" className="ts-button is-primary">
          <span className="ts-icon is-plus-icon"></span>
          建立清單
        </Link>
      </div>

      {/* Lists Grid */}
      {lists.length > 0 ? (
        <div className="ts-grid is-3-columns is-relaxed">
          {lists.map((list) => (
            <div key={list.id} className="column">
              <Link href={`/lists/${list.id}`} style={{ textDecoration: 'none' }}>
                <div className="ts-box is-link">
                  <div className="ts-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 className="ts-header">{list.title}</h3>
                      {!list.isOwner && (
                        <span className="ts-badge is-small">參與</span>
                      )}
                    </div>
                    <p className="ts-text is-secondary is-small" style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      marginTop: '0.25rem'
                    }}>
                      {list.description || '暫無描述'}
                    </p>
                    <div className="ts-meta is-secondary" style={{ marginTop: '0.5rem' }}>
                      <span className="item">
                        <span className="ts-icon is-check-icon"></span>
                        {list.completedCount} / {list.itemCount} 完成
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
          <div className="ts-content is-center-aligned" style={{ padding: '4rem' }}>
            <span className="ts-icon is-huge is-inbox-icon" style={{ color: 'var(--ts-gray-400)' }}></span>
            <h3 className="ts-header" style={{ marginTop: '1rem', color: 'var(--ts-gray-600)' }}>
              還沒有任何清單
            </h3>
            <p className="ts-text is-secondary" style={{ marginBottom: '1.5rem' }}>
              建立你的第一個共享願望清單，開始與親友一起規劃目標吧！
            </p>
            <Link href="/lists/new" className="ts-button is-primary">
              <span className="ts-icon is-plus-icon"></span>
              建立第一個清單
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
