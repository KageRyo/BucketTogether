'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ItemPriority, ListDetails, ListItem, UpdateItemInput, MemberRole } from '@/lib/data'

import { apiRequest, ApiError } from '@/lib/http/client'
import { ItemEditor } from './item-editor'
import { InviteLinks } from '@/components/invites/invite-links'

export function ListDetailClient({ initialList }: { initialList: ListDetails }) {
  const router = useRouter()
  const [list, setList] = useState(initialList)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [itemTitle, setItemTitle] = useState('')
  const [itemCategoryId, setItemCategoryId] = useState('')
  const [itemPriority, setItemPriority] = useState<ItemPriority | ''>('')
  const [itemDueDate, setItemDueDate] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryColor, setCategoryColor] = useState('#3b82f6')
  const [settingsTitle, setSettingsTitle] = useState(list.title)
  const [settingsDescription, setSettingsDescription] = useState(list.description || '')
  const [settingsVersion, setSettingsVersion] = useState(list.version)
  const [editing, setEditing] = useState<ListItem | null>(null)
  const [syncError, setSyncError] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const generation = useRef(0)
  const busyRef = useRef(false)

  const refresh = useCallback(async () => {
    const updated = await apiRequest<ListDetails>(`/api/lists/${initialList.id}`)
    setList(updated)
    setSyncError('')
    return updated
  }, [initialList.id])

  useEffect(() => {
    let pending = false
    let active = true
    let controller: AbortController | undefined
    const poll = async () => {
      if (document.visibilityState !== 'visible' || busyRef.current || pending) return
      pending = true
      const requestedGeneration = generation.current
      controller = new AbortController()
      try {
        const updated = await apiRequest<ListDetails>(`/api/lists/${initialList.id}`, {
          signal: controller.signal,
        })
        if (active && requestedGeneration === generation.current) {
          setList(updated)
          setSyncError('')
        }
      } catch (error) {
        if (active && !controller.signal.aborted)
          setSyncError(error instanceof Error ? error.message : '同步失敗')
      } finally {
        pending = false
      }
    }
    const timer = window.setInterval(() => void poll(), 15000)
    const visibility = () => {
      if (document.visibilityState === 'visible') void poll()
    }
    document.addEventListener('visibilitychange', visibility)
    return () => {
      active = false
      controller?.abort()
      clearInterval(timer)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [initialList.id])

  const run = async (operation: () => Promise<void>) => {
    if (busyRef.current) return
    generation.current++
    busyRef.current = true
    setBusy(true)
    setError('')
    try {
      await operation()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '操作失敗')
      if (caught instanceof ApiError && caught.status === 409) {
        try {
          await refresh()
        } catch {
          setSyncError('無法取得最新資料，請重試')
        }
      }
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const addItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run(async () => {
      await apiRequest(`/api/lists/${list.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: itemTitle,
          description: itemDescription,
          categoryId: itemCategoryId || null,
          priority: itemPriority || null,
          dueDate: itemDueDate || null,
        }),
      })
      setItemTitle('')
      setItemDescription('')
      setItemDueDate('')
      await refresh()
    })
  }

  const toggleItem = (itemId: string, isCompleted: boolean) =>
    void run(async () => {
      await apiRequest(`/api/lists/${list.id}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCompleted,
          expectedVersion: list.items.find((i) => i.id === itemId)?.version,
        }),
      })
      await refresh()
    })

  const saveItem = (input: UpdateItemInput) => {
    if (!editing) return
    void run(async () => {
      await apiRequest(`/api/lists/${list.id}/items/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
      setEditing(null)
      await refresh()
    })
  }

  const deleteItem = (itemId: string) => {
    if (!window.confirm('確定要刪除這個項目嗎？')) return
    void run(async () => {
      await apiRequest(`/api/lists/${list.id}/items/${itemId}`, { method: 'DELETE' })
      await refresh()
    })
  }

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run(async () => {
      const updated = await apiRequest<ListDetails>(`/api/lists/${list.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: settingsTitle,
          description: settingsDescription,
          expectedVersion: settingsVersion,
        }),
      })
      setList(updated)
      setSettingsVersion(updated.version)
    })
  }

  const deleteList = () => {
    if (!window.confirm('這會刪除清單及所有項目，確定繼續？')) return
    void run(async () => {
      await apiRequest(`/api/lists/${list.id}`, { method: 'DELETE' })
      router.push('/lists')
      router.refresh()
    })
  }

  const addCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void run(async () => {
      await apiRequest(`/api/lists/${list.id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName, color: categoryColor }),
      })
      setCategoryName('')
      await refresh()
    })
  }

  const editCategory = (categoryId: string, currentName: string) => {
    const name = window.prompt('更新分類名稱', currentName)
    if (name === null || name === currentName) return
    void run(async () => {
      await apiRequest(`/api/lists/${list.id}/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      await refresh()
    })
  }

  const deleteCategory = (categoryId: string) => {
    if (!window.confirm('刪除分類後，原有項目會變成未分類。確定刪除？')) return
    void run(async () => {
      await apiRequest(`/api/lists/${list.id}/categories/${categoryId}`, { method: 'DELETE' })
      await refresh()
    })
  }

  const updateMemberRole = (membershipId: string, role: Exclude<MemberRole, 'owner'>) =>
    void run(async () => {
      await apiRequest(`/api/lists/${list.id}/members/${membershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      await refresh()
    })

  const removeMember = (membershipId: string) => {
    if (!window.confirm('確定要移除這位成員嗎？')) return
    void run(async () => {
      await apiRequest(`/api/lists/${list.id}/members/${membershipId}`, { method: 'DELETE' })
      await refresh()
    })
  }

  return (
    <div className="ts-container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {error && (
        <div role="alert" className="ts-notice is-negative" style={{ marginBottom: '1rem' }}>
          <div className="content">{error}</div>
        </div>
      )}

      {syncError && (
        <div className="ts-notice is-warning" role="status">
          <div className="content">
            同步暫停：{syncError}。目前內容仍保留。
            <button
              type="button"
              className="ts-button is-small"
              onClick={() => void refresh().catch(() => setSyncError('重新連線失敗'))}
            >
              重新連線
            </button>
          </div>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div className="ts-text is-secondary is-small">角色：{list.currentUserRole}</div>
          <h1 className="ts-header is-large">{list.title}</h1>
          <p className="ts-text is-secondary">{list.description || '暫無描述'}</p>
        </div>
        <div className="ts-statistic is-small">
          <div className="value">{list.stats.progress}%</div>
          <div className="comparison">
            已完成 {list.stats.completedItems} / {list.stats.totalItems}
          </div>
        </div>
      </div>

      {editing && (
        <ItemEditor
          key={editing.id}
          original={editing}
          latest={list.items.find((i) => i.id === editing.id)}
          categories={list.categories}
          busy={busy}
          onSave={saveItem}
          onCancel={() => setEditing(null)}
          onRebase={() => {
            const current = list.items.find((i) => i.id === editing.id)
            if (current) setEditing(current)
          }}
        />
      )}
      {list.canEditItems && (
        <form onSubmit={addItem} className="ts-box" style={{ marginBottom: '1.5rem' }}>
          <div className="ts-content">
            <h3 className="ts-header">新增目標</h3>
            <div className="ts-grid is-4-columns is-relaxed" style={{ marginTop: '1rem' }}>
              <div className="column">
                <div className="ts-input is-fluid">
                  <input
                    aria-label="新目標名稱"
                    value={itemTitle}
                    onChange={(event) => setItemTitle(event.target.value)}
                    placeholder="想一起完成什麼？"
                    required
                  />
                </div>
              </div>
              <div className="column">
                <div className="ts-select is-fluid">
                  <select
                    value={itemCategoryId}
                    onChange={(event) => setItemCategoryId(event.target.value)}
                  >
                    <option value="">未分類</option>
                    {list.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="column">
                <div className="ts-select is-fluid">
                  <select
                    value={itemPriority}
                    onChange={(event) => setItemPriority(event.target.value as ItemPriority | '')}
                  >
                    <option value="">無優先級</option>
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>
              <div className="column">
                <div className="ts-input is-fluid">
                  <input
                    type="date"
                    aria-label="新目標期限"
                    value={itemDueDate}
                    onChange={(event) => setItemDueDate(event.target.value)}
                  />
                </div>
              </div>
            </div>
            <label style={{ display: 'block', marginTop: '1rem' }}>
              描述（選填）
              <textarea
                className="app-field"
                rows={2}
                maxLength={10000}
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
              />
            </label>
            <button className="ts-button is-primary" disabled={busy} style={{ marginTop: '1rem' }}>
              <span className="ts-icon is-plus-icon"></span>新增項目
            </button>
          </div>
        </form>
      )}

      <div className="ts-box" style={{ marginBottom: '1.5rem' }}>
        <div className="ts-content">
          <h3 className="ts-header">目標項目</h3>
          {list.items.length === 0 ? (
            <p className="ts-text is-secondary" style={{ marginTop: '1rem' }}>
              清單是空的，新增第一個目標吧。
            </p>
          ) : (
            <div className="ts-wrap is-vertical" style={{ gap: '0.75rem', marginTop: '1rem' }}>
              {list.items.map((item) => {
                const category = list.categories.find(
                  (candidate) => candidate.id === item.categoryId,
                )
                return (
                  <div key={item.id} className="ts-box is-flat">
                    <div
                      className="ts-content is-dense app-item-row"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    >
                      <input
                        aria-label={`完成 ${item.title}`}
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={(event) => toggleItem(item.id, event.target.checked)}
                        disabled={!list.canEditItems || busy}
                      />
                      <div style={{ flex: '1 1 10rem', minWidth: 0 }}>
                        <div
                          className={`ts-text ${item.isCompleted ? 'is-secondary' : 'is-bold'}`}
                          style={{ textDecoration: item.isCompleted ? 'line-through' : undefined }}
                        >
                          {item.title}
                        </div>
                        {item.description && <p className="ts-text is-small">{item.description}</p>}
                        <div className="ts-meta is-secondary is-small">
                          {category && (
                            <span className="item">
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: category.color,
                                }}
                              ></span>
                              {category.name}
                            </span>
                          )}
                          {item.priority && <span className="item">優先級：{item.priority}</span>}
                          {item.dueDate && <span className="item">期限：{item.dueDate}</span>}
                        </div>
                      </div>
                      {list.canEditItems && (
                        <>
                          <button
                            type="button"
                            className="ts-button is-small is-outlined"
                            onClick={() => setEditing(item)}
                            disabled={busy || editing !== null}
                          >
                            編輯
                          </button>
                          <button
                            type="button"
                            className="ts-button is-small is-negative is-outlined"
                            onClick={() => deleteItem(item.id)}
                            disabled={busy}
                          >
                            刪除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {list.canManage && (
        <div className="ts-grid is-2-columns is-relaxed">
          <div className="column">
            <div className="ts-box" style={{ marginBottom: '1rem' }}>
              <div className="ts-content">
                <h3 className="ts-header">分類管理</h3>
                <form
                  onSubmit={addCategory}
                  style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}
                >
                  <input
                    type="color"
                    value={categoryColor}
                    onChange={(event) => setCategoryColor(event.target.value)}
                  />
                  <div className="ts-input is-fluid">
                    <input
                      value={categoryName}
                      onChange={(event) => setCategoryName(event.target.value)}
                      placeholder="分類名稱"
                      required
                    />
                  </div>
                  <button className="ts-button is-outlined" disabled={busy}>
                    新增
                  </button>
                </form>
                <div className="ts-menu" style={{ marginTop: '0.75rem' }}>
                  {list.categories.map((category) => (
                    <div
                      key={category.id}
                      className="item"
                      style={{ display: 'flex', gap: '0.5rem' }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: category.color,
                        }}
                      ></span>
                      <span style={{ flex: 1 }}>{category.name}</span>
                      <button
                        type="button"
                        className="ts-button is-small is-ghost"
                        onClick={() => editCategory(category.id, category.name)}
                      >
                        編輯
                      </button>
                      <button
                        type="button"
                        className="ts-button is-small is-ghost"
                        onClick={() => deleteCategory(category.id)}
                      >
                        刪除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="ts-box">
              <div className="ts-content">
                <h3 className="ts-header">邀請成員</h3>
                <InviteLinks listId={list.id} />
                <div className="ts-menu" style={{ marginTop: '0.75rem' }}>
                  {list.members.map((member) => (
                    <div
                      key={member.id}
                      className="item"
                      style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    >
                      <span style={{ flex: 1 }}>
                        {member.user.displayName}
                        <span className="ts-text is-secondary is-small">
                          {' '}
                          · {member.user.email}
                        </span>
                      </span>
                      {member.status === 'pending' && (
                        <span className="ts-badge is-warning">待接受</span>
                      )}
                      {member.role === 'owner' ? (
                        <span className="ts-badge">owner</span>
                      ) : (
                        <>
                          <div className="ts-select is-small">
                            <select
                              value={member.role}
                              onChange={(event) =>
                                updateMemberRole(
                                  member.id,
                                  event.target.value as Exclude<MemberRole, 'owner'>,
                                )
                              }
                            >
                              <option value="editor">editor</option>
                              <option value="viewer">viewer</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            className="ts-button is-small is-negative is-outlined"
                            onClick={() => removeMember(member.id)}
                          >
                            移除
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="column">
            <form onSubmit={saveSettings} className="ts-box">
              <div className="ts-content">
                <h3 className="ts-header">清單設定</h3>
                <div className="ts-wrap is-vertical" style={{ gap: '1rem', marginTop: '1rem' }}>
                  <div className="ts-input is-fluid">
                    <input
                      aria-label="清單名稱"
                      value={settingsTitle}
                      onChange={(event) => setSettingsTitle(event.target.value)}
                      required
                    />
                  </div>
                  <div className="ts-input is-fluid">
                    <textarea
                      aria-label="清單描述"
                      rows={4}
                      value={settingsDescription}
                      onChange={(event) => setSettingsDescription(event.target.value)}
                    />
                  </div>
                  <p className="ts-text is-secondary is-small">
                    僅擁有者與已接受邀請的成員可查看。
                  </p>
                  {settingsVersion !== list.version && (
                    <div role="status">
                      <p>
                        清單設定已有更新，草稿仍保留。最新名稱：{list.title}；描述：
                        {list.description || '無'}。
                      </p>
                      <button
                        type="button"
                        className="ts-button is-small"
                        onClick={() => setSettingsVersion(list.version)}
                      >
                        已確認，以草稿更新最新版本
                      </button>
                    </div>
                  )}
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}
                >
                  <button
                    className="ts-button is-primary"
                    disabled={busy || settingsVersion !== list.version}
                  >
                    儲存設定
                  </button>
                  <button
                    type="button"
                    className="ts-button is-negative is-outlined"
                    onClick={deleteList}
                    disabled={busy}
                  >
                    刪除清單
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
