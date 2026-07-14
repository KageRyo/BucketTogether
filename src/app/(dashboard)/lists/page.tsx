import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getDataRepository } from '@/lib/data'

export default async function ListsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const lists = await getDataRepository().listLists(session.user.id)

  return (
    <div className="ts-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="ts-header is-large">我的清單</h1>
          <p className="ts-text is-secondary">共 {lists.length} 個可查看的清單</p>
        </div>
        <Link href="/lists/new" className="ts-button is-primary">
          <span className="ts-icon is-plus-icon"></span>建立清單
        </Link>
      </div>

      {lists.length > 0 ? (
        <div className="ts-grid is-3-columns is-relaxed">
          {lists.map((list) => (
            <div key={list.id} className="column">
              <Link href={`/lists/${list.id}`} className="ts-box is-link" style={{ textDecoration: 'none' }}>
                <div className="ts-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <h3 className="ts-header">{list.title}</h3>
                    <span className="ts-badge is-small">{list.memberRole}</span>
                  </div>
                  <p className="ts-text is-secondary is-small">{list.description || '暫無描述'}</p>
                  <div className="ts-progress is-small" style={{ marginTop: '0.75rem' }}>
                    <div className="bar" style={{ width: `${list.itemCount ? (list.completedCount / list.itemCount) * 100 : 0}%` }}></div>
                  </div>
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
          <div className="ts-content is-center-aligned" style={{ padding: '4rem' }}>
            <span className="ts-icon is-huge is-inbox-icon"></span>
            <h3 className="ts-header" style={{ marginTop: '1rem' }}>還沒有任何清單</h3>
            <Link href="/lists/new" className="ts-button is-primary" style={{ marginTop: '1rem' }}>建立第一個清單</Link>
          </div>
        </div>
      )}
    </div>
  )
}
