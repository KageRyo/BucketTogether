'use client'
import { useState, type FormEvent } from 'react'
import type { ListCategory, ListItem, UpdateItemInput } from '@/lib/data'

export function ItemEditor({
  original,
  latest,
  categories,
  busy,
  onSave,
  onCancel,
  onRebase,
}: {
  original: ListItem
  latest?: ListItem
  categories: ListCategory[]
  busy: boolean
  onSave: (input: UpdateItemInput) => void
  onCancel: () => void
  onRebase: () => void
}) {
  const [title, setTitle] = useState(original.title)
  const [description, setDescription] = useState(original.description || '')
  const [categoryId, setCategoryId] = useState(original.categoryId || '')
  const [priority, setPriority] = useState(original.priority || '')
  const [dueDate, setDueDate] = useState(original.dueDate || '')
  const stale = latest?.version !== original.version
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave({
      title,
      description,
      categoryId: categoryId || null,
      priority: (priority as ListItem['priority']) || null,
      dueDate: dueDate || null,
      expectedVersion: original.version,
    })
  }
  return (
    <form onSubmit={submit} className="app-editor" aria-label="編輯目標">
      <h3>編輯目標</h3>
      {stale && (
        <div className="ts-notice is-warning" role="status">
          <div className="content">
            {latest ? (
              <>
                <p>其他人已更新此目標。你的草稿仍保留，請比較最新內容後再儲存。</p>
                <p>最新名稱：{latest.title}</p>
                <p>最新描述：{latest.description || '無'}</p>
                <p>
                  分類：{categories.find((c) => c.id === latest.categoryId)?.name || '未分類'}
                  ；優先級：{latest.priority || '無'}；期限：{latest.dueDate || '無'}；狀態：
                  {latest.isCompleted ? '已完成' : '未完成'}
                </p>
                <button type="button" className="ts-button is-small" onClick={onRebase}>
                  已確認，以草稿更新最新版本
                </button>
              </>
            ) : (
              '此目標已被刪除。草稿仍保留，請複製需要的內容。'
            )}
          </div>
        </div>
      )}
      <label>
        名稱
        <input
          className="app-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={500}
          required
        />
      </label>
      <label>
        描述
        <textarea
          className="app-field"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={10000}
          rows={3}
        />
      </label>
      <div className="app-editor-grid">
        <label>
          分類
          <select
            className="app-field"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">未分類</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          優先級
          <select
            className="app-field"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">無</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </label>
        <label>
          期限
          <input
            type="date"
            className="app-field"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>
      </div>
      <div className="app-actions">
        <button className="ts-button is-primary" disabled={busy || stale}>
          儲存目標
        </button>
        <button type="button" className="ts-button is-outlined" disabled={busy} onClick={onCancel}>
          取消編輯
        </button>
      </div>
    </form>
  )
}
