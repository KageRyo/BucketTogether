'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PendingInvite } from '@/lib/data'

export function InvitesClient({ initialInvites }: { initialInvites: PendingInvite[] }) {
  const [invites, setInvites] = useState(initialInvites)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const respond = async (inviteId: string, action: 'accept' | 'reject') => {
    setBusyId(inviteId)
    setError('')
    try {
      const response = await fetch(`/api/invites/${inviteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || '無法處理邀請')
      setInvites((current) => current.filter((invite) => invite.id !== inviteId))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '無法處理邀請')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="ts-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="ts-header is-large"><span className="ts-icon is-envelope-icon"></span>邀請通知</h1>
        <p className="ts-text is-secondary">查看並管理你收到的清單邀請</p>
      </div>

      {error && <div className="ts-notice is-negative" style={{ marginBottom: '1rem' }}><div className="content">{error}</div></div>}

      {invites.length > 0 ? (
        <div className="ts-wrap is-vertical" style={{ gap: '1rem' }}>
          {invites.map((invite) => (
            <div key={invite.id} className="ts-box">
              <div className="ts-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <h3 className="ts-header">{invite.list.title}</h3>
                  <p className="ts-text is-secondary is-small">
                    {invite.inviter?.displayName || '某位使用者'} 邀請你以 {invite.role} 身分加入
                  </p>
                  <span className="ts-text is-secondary is-small">{new Date(invite.invitedAt).toLocaleString('zh-TW')}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="ts-button is-positive" disabled={busyId === invite.id} onClick={() => respond(invite.id, 'accept')}>接受</button>
                  <button className="ts-button is-outlined" disabled={busyId === invite.id} onClick={() => respond(invite.id, 'reject')}>拒絕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ts-box">
          <div className="ts-content is-center-aligned" style={{ padding: '4rem' }}>
            <span className="ts-icon is-huge is-envelope-open-icon"></span>
            <h3 className="ts-header" style={{ marginTop: '1rem' }}>沒有待處理的邀請</h3>
            <Link href="/lists" className="ts-button is-outlined" style={{ marginTop: '1rem' }}>查看清單</Link>
          </div>
        </div>
      )}
    </div>
  )
}
