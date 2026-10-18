'use client'
import { useState } from 'react'
import type { ListDetails } from '@/lib/data'

export function OwnershipTransfer({
  list,
  busy,
  onTransfer,
}: {
  list: ListDetails
  busy: boolean
  onTransfer: (newOwnerId: string, expectedVersion: number) => void
}) {
  const [selected, setSelected] = useState('')
  const [confirmation, setConfirmation] = useState<{
    userId: string
    name: string
    version: number
  } | null>(null)
  const candidates = list.members.filter(
    (m) => m.status === 'accepted' && m.userId !== list.ownerId,
  )
  const recipient = candidates.find((m) => m.userId === selected)
  const valid =
    confirmation &&
    confirmation.version === list.version &&
    candidates.some((m) => m.userId === confirmation.userId)
  return (
    <section className="ts-box" aria-label="轉移擁有權" style={{ marginTop: '1rem' }}>
      <div className="ts-content app-stack">
        <h3 className="ts-header">轉移擁有權</h3>
        <p>
          將「{list.title}」交給已加入的成員。轉移後你會成為清單編輯者。
          {list.currentUserRole === 'admin'
            ? '平台管理員權限仍會保留。'
            : '你將無法再管理成員、修改清單設定或刪除清單。'}
        </p>
        {!confirmation ? (
          <>
            <label>
              新擁有者
              <select
                className="app-field"
                value={selected}
                disabled={busy}
                onChange={(event) => setSelected(event.target.value)}
              >
                <option value="">請選擇已加入的成員</option>
                {candidates.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.displayName}
                  </option>
                ))}
              </select>
            </label>
            {!candidates.length && <p>目前沒有其他已加入的成員。請先邀請對方並等待接受。</p>}
            <button
              type="button"
              className="ts-button is-outlined"
              disabled={busy || !recipient}
              onClick={() => {
                if (recipient)
                  setConfirmation({
                    userId: recipient.userId,
                    name: recipient.user.displayName,
                    version: list.version,
                  })
              }}
            >
              檢查轉移內容
            </button>
          </>
        ) : (
          <>
            <p role="status">
              確認將「{list.title}」轉交給 {confirmation.name}
              ？內容與其他成員會保留。轉移後，只有新擁有者可以再轉移；你刪除帳號時，這份清單會保留。
            </p>
            {!valid && <p role="alert">清單或成員已有更新，請取消後重新選擇。</p>}
            <div className="app-actions">
              <button
                type="button"
                className="ts-button is-primary"
                disabled={busy || !valid}
                onClick={() => onTransfer(confirmation.userId, confirmation.version)}
              >
                確認轉移給 {confirmation.name}
              </button>
              <button
                type="button"
                className="ts-button is-outlined"
                disabled={busy}
                onClick={() => setConfirmation(null)}
              >
                取消轉移
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
