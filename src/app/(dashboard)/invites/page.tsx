import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function InvitesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // TODO: 實作 Supabase SELECT - 取得使用者待處理的邀請
  // 應查詢 list_members 表中 joined_at 為 NULL 的記錄
  // 並 JOIN lists 和 users 表取得邀請者資訊
  const pendingInvites: any[] = []

  return (
    <div className="ts-container" style={{ paddingTop: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="ts-header is-large">
          <span className="ts-icon is-envelope-icon"></span>
          邀請通知
        </h1>
        <p className="ts-text is-secondary">查看並管理你收到的清單邀請</p>
      </div>

      {/* Invites List */}
      {pendingInvites.length > 0 ? (
        <div className="ts-wrap is-vertical" style={{ gap: '1rem' }}>
          {pendingInvites.map((invite) => (
            <div key={invite.id} className="ts-box">
              <div className="ts-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 className="ts-header">{invite.listTitle}</h3>
                  <p className="ts-text is-secondary is-small">
                    {invite.inviterName} 邀請你加入此清單
                  </p>
                  <div className="ts-meta is-secondary" style={{ marginTop: '0.5rem' }}>
                    <span className="item">
                      <span className="ts-icon is-clock-icon"></span>
                      {invite.invitedAt}
                    </span>
                  </div>
                </div>
                {/* TODO: 實作接受邀請功能 - 更新 list_members.joined_at 為當前時間 */}
                {/* TODO: 實作拒絕邀請功能 - 刪除 list_members 記錄 */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="ts-button is-positive">
                    <span className="ts-icon is-check-icon"></span>
                    接受
                  </button>
                  <button className="ts-button is-outlined">
                    <span className="ts-icon is-xmark-icon"></span>
                    拒絕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="ts-box">
          <div className="ts-content is-center-aligned" style={{ padding: '4rem' }}>
            <span className="ts-icon is-huge is-envelope-open-icon" style={{ color: 'var(--ts-gray-400)' }}></span>
            <h3 className="ts-header" style={{ marginTop: '1rem', color: 'var(--ts-gray-600)' }}>
              沒有待處理的邀請
            </h3>
            <p className="ts-text is-secondary" style={{ marginBottom: '1.5rem' }}>
              當有人邀請你加入清單時，會顯示在這裡
            </p>
            <Link href="/dashboard" className="ts-button is-outlined">
              <span className="ts-icon is-arrow-left-icon"></span>
              返回首頁
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
