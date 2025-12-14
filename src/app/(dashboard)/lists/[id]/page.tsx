import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface ListDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ListDetailPage({ params }: ListDetailPageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session) {
    redirect('/login')
  }

  // TODO: 實作 Supabase SELECT - 取得清單完整資料
  // 1. 查詢清單基本資料
  // 2. 查詢清單的所有項目 (items)
  // 3. 查詢清單的所有分類 (categories)
  // 4. 查詢清單的所有成員 (list_members JOIN users)
  const list = {
    id,
    title: '範例清單',
    description: '這是一個範例清單',
    items: [],
    categories: [],
  }

  return (
    <div className="ts-container" style={{ paddingTop: '2rem' }}>
      {/* Breadcrumb */}
      <div className="ts-breadcrumb" style={{ marginBottom: '1rem' }}>
        <Link href="/dashboard" className="item">首頁</Link>
        <Link href="/lists" className="item">我的清單</Link>
        <span className="item is-active">{list.title}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="ts-header is-large">{list.title}</h1>
          <p className="ts-text is-secondary">{list.description}</p>
        </div>
        {/* TODO: 實作邀請成員功能 - 開啟邀請 Modal 並呼叫 POST /api/lists/[id]/members */}
        {/* TODO: 實作清單設定功能 - 開啟設定 Modal 可編輯清單標題、描述、分類等 */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="ts-button is-outlined">
            <span className="ts-icon is-user-plus-icon"></span>
            邀請
          </button>
          <button className="ts-button is-outlined">
            <span className="ts-icon is-gear-icon"></span>
            設定
          </button>
        </div>
      </div>

      {/* Add Item Form */}
      {/* TODO: 實作新增項目表單 - 轉換為 Client Component 處理表單提交 */}
      {/* TODO: 呼叫 POST /api/lists/[id]/items 新增項目 */}
      <div className="ts-box" style={{ marginBottom: '1.5rem' }}>
        <div className="ts-content">
          <form style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="ts-input is-fluid">
              <input type="text" placeholder="新增一個願望..." />
            </div>
            <button type="submit" className="ts-button is-primary">
              <span className="ts-icon is-plus-icon"></span>
              新增
            </button>
          </form>
        </div>
      </div>

      {/* Items List */}
      <div className="ts-box">
        <div className="ts-content is-center-aligned" style={{ padding: '3rem' }}>
          <span className="ts-icon is-huge is-clipboard-list-icon" style={{ color: 'var(--ts-gray-400)' }}></span>
          <h3 className="ts-header" style={{ marginTop: '1rem', color: 'var(--ts-gray-600)' }}>
            清單是空的
          </h3>
          <p className="ts-text is-secondary">
            在上方輸入你的第一個願望吧！
          </p>
        </div>
      </div>
    </div>
  )
}
