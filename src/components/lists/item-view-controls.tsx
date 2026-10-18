'use client'

import type { ListCategory } from '@/lib/data'
import { DEFAULT_ITEM_VIEW, type ItemView } from '@/lib/lists/item-view'

export function ItemViewControls({ view, categories, categoryRemoved, visibleCount, totalCount, onChange }: {
  view: ItemView
  categories: ListCategory[]
  categoryRemoved: boolean
  visibleCount: number
  totalCount: number
  onChange: (view: ItemView) => void
}) {
  const active = categoryRemoved || view.status !== 'all' || view.category !== 'all' || view.sort !== 'default'
  return (
    <div style={{ marginTop: '1rem' }}>
      <div className="app-item-view-controls" role="group" aria-label="目標篩選與排序">
        <label>
          完成狀態
          <select className="app-field" value={view.status} onChange={(e) => onChange({ ...view, status: e.target.value as ItemView['status'] })}>
            <option value="all">全部狀態</option>
            <option value="incomplete">未完成</option>
            <option value="completed">已完成</option>
          </select>
        </label>
        <label>
          目標分類
          <select className="app-field" value={view.category} onChange={(e) => onChange({ ...view, category: e.target.value })}>
            <option value="all">全部分類</option>
            <option value="uncategorized">未分類</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label>
          項目排序
          <select className="app-field" value={view.sort} onChange={(e) => onChange({ ...view, sort: e.target.value as ItemView['sort'] })}>
            <option value="default">預設順序</option>
            <option value="dueDate">期限由近到遠</option>
            <option value="priority">優先級由高到低</option>
            <option value="updated">最近更新</option>
          </select>
        </label>
      </div>
      <div className="app-actions" style={{ justifyContent: 'space-between', marginTop: '0.75rem' }}>
        <p role="status" className="ts-text is-secondary is-small">顯示 {visibleCount} / 共 {totalCount} 個項目</p>
        <button type="button" className="ts-button is-small is-outlined" disabled={!active} onClick={() => onChange({ ...DEFAULT_ITEM_VIEW })}>清除篩選與排序</button>
      </div>
      {categoryRemoved && <p role="status">原分類已移除，已顯示所有分類。</p>}
    </div>
  )
}
