import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ListsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // TODO: 從 Supabase 取得使用者的清單
  const lists: any[] = []

  return (
    <div className="ts-container" style={{ paddingTop: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="ts-header is-large">我的清單</h1>
          <p className="ts-text is-secondary">管理你所有的願望清單</p>
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
              <Link href={`/lists/${list.id}`} className="ts-box is-link">
                <div className="ts-content">
                  <h3 className="ts-header">{list.title}</h3>
                  <p className="ts-text is-secondary is-small">{list.description}</p>
                  <div className="ts-meta is-secondary" style={{ marginTop: '0.5rem' }}>
                    <span className="item">
                      <span className="ts-icon is-check-icon"></span>
                      0 / 0 完成
                    </span>
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
