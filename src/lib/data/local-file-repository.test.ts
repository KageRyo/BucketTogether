import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { LocalFileRepository } from './local-file-repository'

const ADMIN_ID = '00000000-0000-4000-8000-000000000001'
const ALEX_ID = '00000000-0000-4000-8000-000000000002'
const JAMIE_ID = '00000000-0000-4000-8000-000000000003'
const SEEDED_LIST_ID = '10000000-0000-4000-8000-000000000001'
const SEEDED_INVITE_ID = '30000000-0000-4000-8000-000000000002'

describe('LocalFileRepository', () => {
  let directory: string
  let repository: LocalFileRepository

  beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'bucket-together-'))
    repository = new LocalFileRepository(path.join(directory, 'data.json'))
  })

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  it('使用雜湊密碼驗證本地帳號', async () => {
    const user = await repository.authenticateCredentials('alex@bucket.local', 'Tester123!')

    expect(user).toMatchObject({ id: ALEX_ID, displayName: 'Alex', role: 'user' })
    expect(user).not.toHaveProperty('passwordHash')
    await expect(repository.authenticateCredentials('alex@bucket.local', 'wrong-password')).resolves.toBeNull()
  })

  it('可建立清單、分類並完成項目 CRUD', async () => {
    const list = await repository.createList(ALEX_ID, {
      title: '週末目標',
      categories: [{ name: '戶外', color: '#22c55e' }],
    })
    const category = await repository.createCategory(ALEX_ID, list.id, '室內', '#8b5cf6')
    const updatedCategory = await repository.updateCategory(ALEX_ID, list.id, category.id, { name: '居家' })
    const item = await repository.createItem(ALEX_ID, list.id, {
      title: '一起做晚餐',
      categoryId: updatedCategory.id,
      priority: 'high',
    })

    expect(updatedCategory.name).toBe('居家')
    await expect(repository.updateItem(ALEX_ID, list.id, item.id, { isCompleted: true }))
      .resolves.toMatchObject({ isCompleted: true, completedBy: ALEX_ID })

    await repository.deleteCategory(ALEX_ID, list.id, updatedCategory.id)
    await expect(repository.listItems(ALEX_ID, list.id)).resolves.toEqual([
      expect.objectContaining({ id: item.id, categoryId: null }),
    ])

    await repository.deleteItem(ALEX_ID, list.id, item.id)
    await expect(repository.listItems(ALEX_ID, list.id)).resolves.toEqual([])
  })

  it('邀請接受前不授權，接受後 editor 可編輯項目', async () => {
    await expect(repository.getList(JAMIE_ID, SEEDED_LIST_ID)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(repository.listPendingInvites(JAMIE_ID)).resolves.toEqual([
      expect.objectContaining({ id: SEEDED_INVITE_ID, role: 'editor' }),
    ])

    await repository.respondToInvite(JAMIE_ID, SEEDED_INVITE_ID, 'accept')
    await expect(repository.getList(JAMIE_ID, SEEDED_LIST_ID)).resolves.toMatchObject({
      currentUserRole: 'editor',
      canEditItems: true,
      canManage: false,
    })
    await expect(repository.createItem(JAMIE_ID, SEEDED_LIST_ID, { title: '共同新目標' }))
      .resolves.toMatchObject({ createdBy: JAMIE_ID })
  })

  it('viewer 只能查看，不能新增項目', async () => {
    const list = await repository.createList(ALEX_ID, { title: '僅供查看' })
    const invite = await repository.inviteMember(ALEX_ID, list.id, 'jamie@bucket.local', 'viewer')
    await repository.respondToInvite(JAMIE_ID, invite.id, 'accept')

    await expect(repository.getList(JAMIE_ID, list.id)).resolves.toMatchObject({ currentUserRole: 'viewer' })
    await expect(repository.createItem(JAMIE_ID, list.id, { title: '不應新增' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('管理員可管理不屬於自己的清單', async () => {
    await expect(repository.getList(ADMIN_ID, SEEDED_LIST_ID)).resolves.toMatchObject({
      currentUserRole: 'admin',
      canManage: true,
    })
    await expect(repository.updateList(ADMIN_ID, SEEDED_LIST_ID, { title: '管理員更新' }))
      .resolves.toMatchObject({ title: '管理員更新' })
  })

  it('拒絕邀請後不會成為清單成員', async () => {
    await repository.respondToInvite(JAMIE_ID, SEEDED_INVITE_ID, 'reject')
    await expect(repository.listPendingInvites(JAMIE_ID)).resolves.toEqual([])
    await expect(repository.getList(JAMIE_ID, SEEDED_LIST_ID)).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})
