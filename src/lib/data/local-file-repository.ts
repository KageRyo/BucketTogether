import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { DataError } from './errors'
import { hashPassword, verifyPassword } from './password'
import type { DataRepository } from './repository'
import type {
  AppUser,
  BucketList,
  CreateItemInput,
  CreateListInput,
  EffectiveListRole,
  ListDetails,
  ListCategory,
  ListItem,
  ListMemberView,
  ListMembership,
  ListSummary,
  LocalData,
  MemberRole,
  PendingInvite,
  StoredUser,
  UpdateItemInput,
  UpdateListInput,
} from './types'

const DEFAULT_DATA_FILE = path.join(process.cwd(), '.data', 'bucket-together.json')

function now(): string {
  return new Date().toISOString()
}

function publicUser(user: StoredUser): AppUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    pictureUrl: user.pictureUrl,
    role: user.role,
    authProvider: user.authProvider,
    lineId: user.lineId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

function memberUser(user: StoredUser): ListMemberView['user'] {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    pictureUrl: user.pictureUrl,
  }
}

function requiredText(value: string, label: string, maxLength: number): string {
  const normalized = value.trim()
  if (!normalized) {
    throw new DataError('VALIDATION_ERROR', `${label}為必填`)
  }
  if (normalized.length > maxLength) {
    throw new DataError('VALIDATION_ERROR', `${label}不得超過 ${maxLength} 個字`)
  }
  return normalized
}

async function seedData(): Promise<LocalData> {
  const createdAt = now()
  const [adminPassword, alexPassword, jamiePassword] = await Promise.all([
    hashPassword('Admin123!'),
    hashPassword('Tester123!'),
    hashPassword('Tester123!'),
  ])

  const adminId = '00000000-0000-4000-8000-000000000001'
  const alexId = '00000000-0000-4000-8000-000000000002'
  const jamieId = '00000000-0000-4000-8000-000000000003'
  const listId = '10000000-0000-4000-8000-000000000001'
  const categoryId = '20000000-0000-4000-8000-000000000001'

  return {
    schemaVersion: 1,
    users: [
      {
        id: adminId,
        email: 'admin@bucket.local',
        displayName: '本地管理員',
        pictureUrl: null,
        role: 'admin',
        authProvider: 'credentials',
        lineId: null,
        passwordHash: adminPassword,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: alexId,
        email: 'alex@bucket.local',
        displayName: 'Alex',
        pictureUrl: null,
        role: 'user',
        authProvider: 'credentials',
        lineId: null,
        passwordHash: alexPassword,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: jamieId,
        email: 'jamie@bucket.local',
        displayName: 'Jamie',
        pictureUrl: null,
        role: 'user',
        authProvider: 'credentials',
        lineId: null,
        passwordHash: jamiePassword,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    lists: [
      {
        id: listId,
        title: '我們的共同目標',
        description: '本地開發用的範例清單',
        coverImage: null,
        ownerId: alexId,
        isPublic: false,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    memberships: [
      {
        id: '30000000-0000-4000-8000-000000000001',
        listId,
        userId: alexId,
        role: 'owner',
        status: 'accepted',
        invitedBy: null,
        invitedAt: createdAt,
        joinedAt: createdAt,
      },
      {
        id: '30000000-0000-4000-8000-000000000002',
        listId,
        userId: jamieId,
        role: 'editor',
        status: 'pending',
        invitedBy: alexId,
        invitedAt: createdAt,
        joinedAt: null,
      },
    ],
    categories: [
      {
        id: categoryId,
        listId,
        name: '旅遊',
        color: '#3b82f6',
        order: 0,
        createdAt,
      },
    ],
    items: [
      {
        id: '40000000-0000-4000-8000-000000000001',
        listId,
        categoryId,
        title: '一起去看櫻花',
        description: '挑一個春天的週末出發',
        isCompleted: false,
        completedAt: null,
        completedBy: null,
        dueDate: null,
        priority: 'medium',
        order: 0,
        createdBy: alexId,
        createdAt,
        updatedAt: createdAt,
      },
    ],
  }
}

export class LocalFileRepository implements DataRepository {
  private queue: Promise<void> = Promise.resolve()

  constructor(private readonly filePath = process.env.LOCAL_DATA_FILE || DEFAULT_DATA_FILE) {}

  private async load(): Promise<LocalData> {
    try {
      const content = await readFile(this.filePath, 'utf8')
      return JSON.parse(content) as LocalData
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }

      const data = await seedData()
      await this.save(data)
      return data
    }
  }

  private async save(data: LocalData): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true })
    const temporaryPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`
    await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, this.filePath)
  }

  private withData<T>(operation: (data: LocalData) => Promise<T> | T, persist = false): Promise<T> {
    const running = this.queue.then(async () => {
      const data = await this.load()
      const result = await operation(data)
      if (persist) {
        await this.save(data)
      }
      return result
    })

    this.queue = running.then(() => undefined, () => undefined)
    return running
  }

  private user(data: LocalData, userId: string): StoredUser {
    const user = data.users.find((candidate) => candidate.id === userId)
    if (!user) {
      throw new DataError('NOT_FOUND', '找不到使用者')
    }
    return user
  }

  private list(data: LocalData, listId: string): BucketList {
    const list = data.lists.find((candidate) => candidate.id === listId)
    if (!list) {
      throw new DataError('NOT_FOUND', '找不到該清單')
    }
    return list
  }

  private role(data: LocalData, userId: string, list: BucketList): EffectiveListRole | null {
    const user = this.user(data, userId)
    if (user.role === 'admin') {
      return 'admin'
    }
    if (list.ownerId === userId) {
      return 'owner'
    }

    return data.memberships.find((membership) =>
      membership.listId === list.id
      && membership.userId === userId
      && membership.status === 'accepted',
    )?.role ?? (list.isPublic ? 'viewer' : null)
  }

  private requireView(data: LocalData, userId: string, list: BucketList): EffectiveListRole {
    const role = this.role(data, userId, list)
    if (!role) {
      throw new DataError('FORBIDDEN', '您沒有權限查看此清單')
    }
    return role
  }

  private requireManage(data: LocalData, userId: string, list: BucketList): EffectiveListRole {
    const role = this.requireView(data, userId, list)
    if (role !== 'owner' && role !== 'admin') {
      throw new DataError('FORBIDDEN', '只有清單擁有者可以進行此操作')
    }
    return role
  }

  private requireItemEdit(data: LocalData, userId: string, list: BucketList): EffectiveListRole {
    const role = this.requireView(data, userId, list)
    if (role === 'viewer') {
      throw new DataError('FORBIDDEN', '您只有查看權限')
    }
    return role
  }

  private memberView(data: LocalData, membership: ListMembership): ListMemberView {
    return {
      ...membership,
      user: memberUser(this.user(data, membership.userId)),
    }
  }

  private details(data: LocalData, userId: string, list: BucketList): ListDetails {
    const currentUserRole = this.requireView(data, userId, list)
    const items = data.items
      .filter((item) => item.listId === list.id)
      .sort((a, b) => a.order - b.order)
    const completedItems = items.filter((item) => item.isCompleted).length
    const canManage = currentUserRole === 'owner' || currentUserRole === 'admin'
    const memberships = data.memberships.filter((membership) =>
      membership.listId === list.id && (canManage || membership.status === 'accepted'),
    )

    return {
      ...list,
      categories: data.categories
        .filter((category) => category.listId === list.id)
        .sort((a, b) => a.order - b.order),
      items,
      members: memberships.map((membership) => this.memberView(data, membership)),
      stats: {
        totalItems: items.length,
        completedItems,
        progress: items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0,
      },
      currentUserRole,
      canManage,
      canEditItems: currentUserRole !== 'viewer',
    }
  }

  async authenticateCredentials(email: string, password: string): Promise<AppUser | null> {
    return this.withData(async (data) => {
      const user = data.users.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase())
      if (!user?.passwordHash || !await verifyPassword(password, user.passwordHash)) {
        return null
      }
      return publicUser(user)
    })
  }

  async upsertLineUser(profile: {
    lineId: string
    displayName: string
    pictureUrl?: string | null
    email?: string | null
  }): Promise<AppUser> {
    return this.withData((data) => {
      const normalizedEmail = profile.email?.trim().toLowerCase() || `line-${profile.lineId}@bucket.local`
      const existing = data.users.find((candidate) =>
        candidate.lineId === profile.lineId || candidate.email.toLowerCase() === normalizedEmail,
      )

      if (existing) {
        existing.lineId = profile.lineId
        existing.displayName = profile.displayName
        existing.pictureUrl = profile.pictureUrl ?? existing.pictureUrl
        existing.authProvider = existing.passwordHash ? 'both' : 'line'
        existing.updatedAt = now()
        return publicUser(existing)
      }

      const createdAt = now()
      const user: StoredUser = {
        id: randomUUID(),
        email: normalizedEmail,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl ?? null,
        role: 'user',
        authProvider: 'line',
        lineId: profile.lineId,
        passwordHash: null,
        createdAt,
        updatedAt: createdAt,
      }
      data.users.push(user)
      return publicUser(user)
    }, true)
  }

  async getUserById(userId: string): Promise<AppUser | null> {
    return this.withData((data) => {
      const user = data.users.find((candidate) => candidate.id === userId)
      return user ? publicUser(user) : null
    })
  }

  async listLists(userId: string): Promise<ListSummary[]> {
    return this.withData((data) => {
      this.user(data, userId)
      return data.lists
        .flatMap((list) => {
          const memberRole = this.role(data, userId, list)
          if (!memberRole) {
            return []
          }
          const items = data.items.filter((item) => item.listId === list.id)
          return [{
            ...list,
            isOwner: list.ownerId === userId,
            memberRole,
            itemCount: items.length,
            completedCount: items.filter((item) => item.isCompleted).length,
          }]
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    })
  }

  async createList(userId: string, input: CreateListInput): Promise<ListDetails> {
    return this.withData((data) => {
      this.user(data, userId)
      const createdAt = now()
      const list: BucketList = {
        id: randomUUID(),
        title: requiredText(input.title, '清單標題', 255),
        description: input.description?.trim() || null,
        coverImage: null,
        ownerId: userId,
        isPublic: false,
        createdAt,
        updatedAt: createdAt,
      }
      data.lists.push(list)
      data.memberships.push({
        id: randomUUID(),
        listId: list.id,
        userId,
        role: 'owner',
        status: 'accepted',
        invitedBy: null,
        invitedAt: createdAt,
        joinedAt: createdAt,
      })

      const categories = input.categories ?? []
      categories.forEach((category, index) => {
        const name = category.name.trim()
        if (name) {
          data.categories.push({
            id: randomUUID(),
            listId: list.id,
            name: requiredText(name, '分類名稱', 100),
            color: category.color || '#3b82f6',
            order: index,
            createdAt,
          })
        }
      })

      return this.details(data, userId, list)
    }, true)
  }

  async getList(userId: string, listId: string): Promise<ListDetails> {
    return this.withData((data) => this.details(data, userId, this.list(data, listId)))
  }

  async updateList(userId: string, listId: string, input: UpdateListInput): Promise<ListDetails> {
    return this.withData((data) => {
      const list = this.list(data, listId)
      this.requireManage(data, userId, list)
      if (input.title !== undefined) {
        list.title = requiredText(input.title, '清單標題', 255)
      }
      if (input.description !== undefined) {
        list.description = input.description?.trim() || null
      }
      if (input.isPublic !== undefined) {
        list.isPublic = input.isPublic
      }
      list.updatedAt = now()
      return this.details(data, userId, list)
    }, true)
  }

  async deleteList(userId: string, listId: string): Promise<void> {
    return this.withData((data) => {
      const list = this.list(data, listId)
      this.requireManage(data, userId, list)
      data.lists = data.lists.filter((candidate) => candidate.id !== listId)
      data.memberships = data.memberships.filter((membership) => membership.listId !== listId)
      data.categories = data.categories.filter((category) => category.listId !== listId)
      data.items = data.items.filter((item) => item.listId !== listId)
    }, true)
  }

  async createCategory(userId: string, listId: string, name: string, color = '#3b82f6'): Promise<ListCategory> {
    return this.withData((data) => {
      const list = this.list(data, listId)
      this.requireManage(data, userId, list)
      const categories = data.categories.filter((category) => category.listId === listId)
      const category: ListCategory = {
        id: randomUUID(),
        listId,
        name: requiredText(name, '分類名稱', 100),
        color,
        order: categories.length > 0 ? Math.max(...categories.map((candidate) => candidate.order)) + 1 : 0,
        createdAt: now(),
      }
      data.categories.push(category)
      list.updatedAt = now()
      return category
    }, true)
  }

  async updateCategory(
    userId: string,
    listId: string,
    categoryId: string,
    input: { name?: string; color?: string },
  ): Promise<ListCategory> {
    return this.withData((data) => {
      const list = this.list(data, listId)
      this.requireManage(data, userId, list)
      const category = data.categories.find((candidate) => candidate.id === categoryId && candidate.listId === listId)
      if (!category) {
        throw new DataError('NOT_FOUND', '找不到該分類')
      }
      if (input.name !== undefined) category.name = requiredText(input.name, '分類名稱', 100)
      if (input.color !== undefined) category.color = input.color
      list.updatedAt = now()
      return category
    }, true)
  }

  async deleteCategory(userId: string, listId: string, categoryId: string): Promise<void> {
    return this.withData((data) => {
      const list = this.list(data, listId)
      this.requireManage(data, userId, list)
      const categoryIndex = data.categories.findIndex((candidate) => candidate.id === categoryId && candidate.listId === listId)
      if (categoryIndex === -1) {
        throw new DataError('NOT_FOUND', '找不到該分類')
      }
      data.categories.splice(categoryIndex, 1)
      data.items.forEach((item) => {
        if (item.listId === listId && item.categoryId === categoryId) item.categoryId = null
      })
      list.updatedAt = now()
    }, true)
  }

  async listItems(userId: string, listId: string): Promise<ListItem[]> {
    return this.withData((data) => {
      this.requireView(data, userId, this.list(data, listId))
      return data.items.filter((item) => item.listId === listId).sort((a, b) => a.order - b.order)
    })
  }

  async createItem(userId: string, listId: string, input: CreateItemInput): Promise<ListItem> {
    return this.withData((data) => {
      const list = this.list(data, listId)
      this.requireItemEdit(data, userId, list)
      if (input.categoryId && !data.categories.some((category) => category.id === input.categoryId && category.listId === listId)) {
        throw new DataError('VALIDATION_ERROR', '分類不屬於此清單')
      }
      const createdAt = now()
      const currentItems = data.items.filter((item) => item.listId === listId)
      const item: ListItem = {
        id: randomUUID(),
        listId,
        categoryId: input.categoryId || null,
        title: requiredText(input.title, '項目標題', 500),
        description: input.description?.trim() || null,
        isCompleted: false,
        completedAt: null,
        completedBy: null,
        dueDate: input.dueDate || null,
        priority: input.priority || null,
        order: currentItems.length > 0 ? Math.max(...currentItems.map((candidate) => candidate.order)) + 1 : 0,
        createdBy: userId,
        createdAt,
        updatedAt: createdAt,
      }
      data.items.push(item)
      list.updatedAt = createdAt
      return item
    }, true)
  }

  async updateItem(userId: string, listId: string, itemId: string, input: UpdateItemInput): Promise<ListItem> {
    return this.withData((data) => {
      const list = this.list(data, listId)
      this.requireItemEdit(data, userId, list)
      const item = data.items.find((candidate) => candidate.id === itemId && candidate.listId === listId)
      if (!item) {
        throw new DataError('NOT_FOUND', '找不到該項目')
      }
      if (input.categoryId && !data.categories.some((category) => category.id === input.categoryId && category.listId === listId)) {
        throw new DataError('VALIDATION_ERROR', '分類不屬於此清單')
      }
      if (input.title !== undefined) item.title = requiredText(input.title, '項目標題', 500)
      if (input.description !== undefined) item.description = input.description?.trim() || null
      if (input.categoryId !== undefined) item.categoryId = input.categoryId || null
      if (input.priority !== undefined) item.priority = input.priority
      if (input.dueDate !== undefined) item.dueDate = input.dueDate || null
      if (input.isCompleted !== undefined) {
        item.isCompleted = input.isCompleted
        item.completedAt = input.isCompleted ? now() : null
        item.completedBy = input.isCompleted ? userId : null
      }
      item.updatedAt = now()
      list.updatedAt = item.updatedAt
      return item
    }, true)
  }

  async deleteItem(userId: string, listId: string, itemId: string): Promise<void> {
    return this.withData((data) => {
      const list = this.list(data, listId)
      this.requireItemEdit(data, userId, list)
      const itemIndex = data.items.findIndex((candidate) => candidate.id === itemId && candidate.listId === listId)
      if (itemIndex === -1) {
        throw new DataError('NOT_FOUND', '找不到該項目')
      }
      data.items.splice(itemIndex, 1)
      list.updatedAt = now()
    }, true)
  }

  async inviteMember(
    userId: string,
    listId: string,
    email: string,
    role: Exclude<MemberRole, 'owner'>,
  ): Promise<ListMemberView> {
    return this.withData((data) => {
      const list = this.list(data, listId)
      this.requireManage(data, userId, list)
      const invitedUser = data.users.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase())
      if (!invitedUser) {
        throw new DataError('NOT_FOUND', '找不到此 Email 的使用者，請先建立本地測試帳號')
      }
      if (invitedUser.id === list.ownerId) {
        throw new DataError('CONFLICT', '清單擁有者已是成員')
      }
      if (data.memberships.some((membership) => membership.listId === listId && membership.userId === invitedUser.id)) {
        throw new DataError('CONFLICT', '該使用者已是成員或已收到邀請')
      }
      const membership: ListMembership = {
        id: randomUUID(),
        listId,
        userId: invitedUser.id,
        role,
        status: 'pending',
        invitedBy: userId,
        invitedAt: now(),
        joinedAt: null,
      }
      data.memberships.push(membership)
      return this.memberView(data, membership)
    }, true)
  }

  async listMembers(userId: string, listId: string): Promise<ListMemberView[]> {
    return this.withData((data) => {
      const list = this.list(data, listId)
      const currentRole = this.requireView(data, userId, list)
      const canManage = currentRole === 'owner' || currentRole === 'admin'
      return data.memberships
        .filter((membership) => membership.listId === listId && (canManage || membership.status === 'accepted'))
        .map((membership) => this.memberView(data, membership))
    })
  }

  async updateMemberRole(
    userId: string,
    listId: string,
    membershipId: string,
    role: Exclude<MemberRole, 'owner'>,
  ): Promise<ListMemberView> {
    return this.withData((data) => {
      const list = this.list(data, listId)
      this.requireManage(data, userId, list)
      const membership = data.memberships.find((candidate) => candidate.id === membershipId && candidate.listId === listId)
      if (!membership) {
        throw new DataError('NOT_FOUND', '找不到該成員')
      }
      if (membership.role === 'owner') {
        throw new DataError('FORBIDDEN', '不能修改清單擁有者的角色')
      }
      membership.role = role
      return this.memberView(data, membership)
    }, true)
  }

  async removeMember(userId: string, listId: string, membershipId: string): Promise<void> {
    return this.withData((data) => {
      const list = this.list(data, listId)
      const membershipIndex = data.memberships.findIndex((candidate) => candidate.id === membershipId && candidate.listId === listId)
      if (membershipIndex === -1) {
        throw new DataError('NOT_FOUND', '找不到該成員')
      }
      const membership = data.memberships[membershipIndex]
      const selfRemoval = membership.userId === userId
      if (!selfRemoval) {
        this.requireManage(data, userId, list)
      }
      if (membership.role === 'owner') {
        throw new DataError('FORBIDDEN', '清單擁有者不能離開清單')
      }
      data.memberships.splice(membershipIndex, 1)
    }, true)
  }

  async listPendingInvites(userId: string): Promise<PendingInvite[]> {
    return this.withData((data) => {
      this.user(data, userId)
      return data.memberships
        .filter((membership) => membership.userId === userId && membership.status === 'pending')
        .map((membership) => {
          const list = this.list(data, membership.listId)
          const inviter = membership.invitedBy
            ? data.users.find((candidate) => candidate.id === membership.invitedBy)
            : null
          return {
            ...membership,
            list: { id: list.id, title: list.title, description: list.description },
            inviter: inviter ? {
              id: inviter.id,
              displayName: inviter.displayName,
              pictureUrl: inviter.pictureUrl,
            } : null,
          }
        })
        .sort((a, b) => b.invitedAt.localeCompare(a.invitedAt))
    })
  }

  async respondToInvite(userId: string, inviteId: string, action: 'accept' | 'reject'): Promise<void> {
    return this.withData((data) => {
      const membershipIndex = data.memberships.findIndex((membership) =>
        membership.id === inviteId
        && membership.userId === userId
        && membership.status === 'pending',
      )
      if (membershipIndex === -1) {
        throw new DataError('NOT_FOUND', '找不到待處理邀請')
      }
      if (action === 'reject') {
        data.memberships.splice(membershipIndex, 1)
        return
      }
      data.memberships[membershipIndex].status = 'accepted'
      data.memberships[membershipIndex].joinedAt = now()
    }, true)
  }
}
