import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { LocalFileRepository } from './local-file-repository'
import { exportList, serializeListExport } from './list-export'
import type { ListDetails } from './types'

const OWNER = '00000000-0000-4000-8000-000000000002'
const VIEWER = '00000000-0000-4000-8000-000000000003'

describe('list export', () => {
  let directory: string
  let repository: LocalFileRepository
  let list: ListDetails
  beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'bucket-export-'))
    repository = new LocalFileRepository(path.join(directory, 'data.json'))
    const created = await repository.createList(OWNER, {
      title: '旅行 🏔️', description: '一起出發', categories: [{ name: '戶外', color: '#22c55e' }],
    })
    const item = await repository.createItem(OWNER, created.id, {
      title: '看日出', description: '帶相機', categoryId: created.categories[0].id,
      priority: 'high', dueDate: '2027-01-02',
    })
    await repository.updateItem(OWNER, created.id, item.id, {
      isCompleted: true, expectedVersion: item.version,
    })
    list = await repository.getList(OWNER, created.id)
  })
  afterEach(async () => { await rm(directory, { recursive: true, force: true }) })

  it('rejects outsiders and pending members, but allows accepted viewers', async () => {
    await expect(exportList(repository, VIEWER, list.id, 'json')).rejects.toMatchObject({ code: 'FORBIDDEN' })
    const invite = await repository.inviteMember(OWNER, list.id, 'jamie@bucket.local', 'viewer')
    await expect(exportList(repository, VIEWER, list.id, 'csv')).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await repository.respondToInvite(VIEWER, invite.id, 'accept')
    const result = await exportList(repository, VIEWER, list.id, 'json')
    expect(JSON.parse(result.body).list.title).toBe('旅行 🏔️')
  })

  it('archives content and stable relationships using an explicit privacy allowlist', () => {
    const output = serializeListExport(list, 'json', new Date('2026-10-18T00:00:00Z'))
    const document = JSON.parse(output.body)
    expect(document).toEqual({
      schemaVersion: 1, exportedAt: '2026-10-18T00:00:00.000Z',
      list: { id: list.id, title: list.title, description: list.description, coverImage: null,
        createdAt: list.createdAt, updatedAt: list.updatedAt },
      categories: [{ id: list.categories[0].id, name: '戶外', color: '#22c55e', order: 0,
        createdAt: list.categories[0].createdAt }],
      items: [{ id: list.items[0].id, categoryId: list.categories[0].id, title: '看日出', description: '帶相機',
        isCompleted: true, completedAt: list.items[0].completedAt, dueDate: '2027-01-02',
        priority: 'high', order: 0, createdAt: list.items[0].createdAt, updatedAt: list.items[0].updatedAt }],
    })
    expect(output.body).not.toContain(OWNER)
    expect(output.body).not.toContain('bucket.local')
    expect(output.filename).toMatch(/^bucket-list-[a-z0-9-]+-2026-10-18\.json$/)
  })

  it('quotes Unicode, commas, quotes and embedded newlines in spreadsheet CSV', () => {
    list.items[0].title = '旅行,"日出" 🏔️'
    list.items[0].description = '第一行\n第二行'
    const output = serializeListExport(list, 'csv')
    expect(output.body.startsWith('\uFEFF"id","category_id","category"')).toBe(true)
    expect(output.body).toContain('"旅行,""日出"" 🏔️","第一行\n第二行"')
    expect(output.body).toContain('"戶外"')
    expect(output.body).toContain('"true"')
    expect(output.body.endsWith('\r\n')).toBe(true)
    expect(output.body).not.toContain(OWNER)
  })

  it.each(['=SUM(1,2)', '+cmd', '-1+2', '@SUM(A1)', ' \t=1', '\r\n+1'])('neutralizes formula input %j', (value) => {
    list.items[0].title = value
    list.items[0].description = value
    list.categories[0].name = value
    const output = serializeListExport(list, 'csv')
    expect(output.body).toContain(`"'${value}","'${value}"`)
    expect(output.body).toContain(`"'${value}"`)
  })

  it('exports empty lists and rejects oversized exports without truncation', () => {
    list.items = []
    list.categories = []
    expect(JSON.parse(serializeListExport(list, 'json').body).items).toEqual([])
    expect(serializeListExport(list, 'csv').body.split('\r\n')).toHaveLength(2)
    list.description = '界'.repeat(1_500_000)
    expect(() => serializeListExport(list, 'json')).toThrow('4 MiB')
  })

  it('exports a large list intact and rejects unsupported formats', () => {
    list.items = Array.from({ length: 3000 }, (_, i) => ({ ...list.items[0], id: `item-${i}` }))
    expect(JSON.parse(serializeListExport(list, 'json').body).items).toHaveLength(3000)
    expect(serializeListExport(list, 'csv').body).toContain('"item-2999"')
    expect(() => serializeListExport(list, 'xml')).toThrow('格式')
  })
})
