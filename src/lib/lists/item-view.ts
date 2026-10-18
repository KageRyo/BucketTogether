import type { ListItem } from '@/lib/data/types'

export interface ItemView {
  status: 'all' | 'incomplete' | 'completed'
  category: string // 'all', 'uncategorized', or a category UUID
  sort: 'default' | 'dueDate' | 'priority' | 'updated'
}

export const DEFAULT_ITEM_VIEW: Readonly<ItemView> = {
  status: 'all', category: 'all', sort: 'default',
}

const priorityRank = { high: 0, medium: 1, low: 2 }
const compare = (a: number | string, b: number | string) => a === b ? 0 : a < b ? -1 : 1
const fallbackOrder = (a: ListItem, b: ListItem) => compare(a.order, b.order) || compare(a.id, b.id)

function compareDates(a: string | null, b: string | null, descending = false): number {
  const left = a ? Date.parse(a) : NaN
  const right = b ? Date.parse(b) : NaN
  const leftMissing = !Number.isFinite(left)
  const rightMissing = !Number.isFinite(right)
  if (leftMissing || rightMissing) return compare(Number(leftMissing), Number(rightMissing))
  return compare(left, right) * (descending ? -1 : 1)
}

export function selectItems(items: readonly ListItem[], view: ItemView): ListItem[] {
  return items.filter((item) => {
    if (view.status === 'incomplete' && item.isCompleted) return false
    if (view.status === 'completed' && !item.isCompleted) return false
    if (view.category === 'uncategorized') return item.categoryId === null
    return view.category === 'all' || item.categoryId === view.category
  }).sort((a, b) => {
    let result = 0
    if (view.sort === 'dueDate') result = compareDates(a.dueDate, b.dueDate)
    if (view.sort === 'updated') result = compareDates(a.updatedAt, b.updatedAt, true)
    if (view.sort === 'priority')
      result = compare(a.priority ? priorityRank[a.priority] : 3, b.priority ? priorityRank[b.priority] : 3)
    return result || fallbackOrder(a, b)
  })
}
