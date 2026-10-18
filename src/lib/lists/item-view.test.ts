import { describe, expect, it } from 'vitest'
import type { ListItem } from '@/lib/data/types'
import { selectItems, DEFAULT_ITEM_VIEW } from './item-view'

const item = (id: string, changes: Partial<ListItem> = {}): ListItem => ({
  id, listId: 'list', categoryId: null, title: id, description: null,
  version: 1, isCompleted: false, completedAt: null, completedBy: null,
  dueDate: null, priority: null, order: 0, createdBy: null,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', ...changes,
})
const ids = (items: ListItem[]) => items.map((i) => i.id)

describe('item filtering and sorting', () => {
  it('combines status and category, including uncategorized items', () => {
    const items = [item('a', { categoryId: 'travel' }), item('b', { categoryId: 'travel', isCompleted: true }),
      item('c'), item('d', { isCompleted: true })]
    expect(ids(selectItems(items, { ...DEFAULT_ITEM_VIEW, status: 'incomplete', category: 'travel' }))).toEqual(['a'])
    expect(ids(selectItems(items, { ...DEFAULT_ITEM_VIEW, status: 'completed', category: 'uncategorized' }))).toEqual(['d'])
    expect(ids(selectItems(items, { ...DEFAULT_ITEM_VIEW, category: 'uncategorized' }))).toEqual(['c', 'd'])
    expect(selectItems(items, { ...DEFAULT_ITEM_VIEW, category: 'missing' })).toEqual([])
  })

  it('uses stored order then ID as a stable tie breaker without mutating input', () => {
    const items = [item('z', { order: 1 }), item('b'), item('a')]
    const before = structuredClone(items)
    expect(ids(selectItems(items, DEFAULT_ITEM_VIEW))).toEqual(['a', 'b', 'z'])
    expect(items).toEqual(before)
    expect(selectItems(items, DEFAULT_ITEM_VIEW)).not.toBe(items)
  })

  it('sorts earliest deadlines first, missing dates last, with deterministic ties', () => {
    const items = [item('none'), item('late', { dueDate: '2027-01-01' }),
      item('b', { dueDate: '2026-11-01' }), item('a', { dueDate: '2026-11-01' }),
      item('invalid', { dueDate: 'invalid', order: 1 })]
    expect(ids(selectItems(items, { ...DEFAULT_ITEM_VIEW, sort: 'dueDate' }))).toEqual(['a', 'b', 'late', 'none', 'invalid'])
  })

  it('sorts high, medium, low priority, then missing values', () => {
    const items = [item('none'), item('low', { priority: 'low' }), item('medium', { priority: 'medium' }),
      item('b', { priority: 'high', order: 1 }), item('a', { priority: 'high' })]
    expect(ids(selectItems(items, { ...DEFAULT_ITEM_VIEW, sort: 'priority' }))).toEqual(['a', 'b', 'medium', 'low', 'none'])
  })

  it('sorts recent updates first and places missing or invalid times last', () => {
    const items = [item('old'), item('b', { updatedAt: '2026-10-18T01:00:00Z' }),
      item('a', { updatedAt: '2026-10-18T01:00:00Z' }), item('missing', { updatedAt: '' })]
    expect(ids(selectItems(items, { ...DEFAULT_ITEM_VIEW, sort: 'updated' }))).toEqual(['a', 'b', 'old', 'missing'])
  })

  it('derives a fresh view after creation, completion, removal and remote category changes', () => {
    const view = { ...DEFAULT_ITEM_VIEW, status: 'incomplete' as const, category: 'travel' }
    let items = [item('a', { categoryId: 'travel' }), item('b', { categoryId: 'home' })]
    expect(ids(selectItems(items, view))).toEqual(['a'])
    items = [...items, item('c', { categoryId: 'travel' })]
    expect(ids(selectItems(items, view))).toEqual(['a', 'c'])
    items = items.map((i) => i.id === 'a' ? { ...i, isCompleted: true } : i)
    expect(ids(selectItems(items, view))).toEqual(['c'])
    items = items.filter((i) => i.id !== 'c').map((i) => ({ ...i, categoryId: 'travel' }))
    expect(ids(selectItems(items, view))).toEqual(['b'])
    expect(selectItems([], view)).toEqual([])
    expect(items).toHaveLength(2)
  })
})
