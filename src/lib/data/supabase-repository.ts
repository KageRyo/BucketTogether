import type { Sql, TransactionSql } from 'postgres'
import { DataError } from './errors'
import { verifyPassword } from './password'
import {
  checkVersion,
  newInviteSecret,
  requiredText,
  tokenHash,
  validateColor,
  validateItem,
  validateProfile,
  validateRole,
} from './validation'
import type { DataRepository } from './repository'
import type {
  AppUser,
  BucketList,
  CreateItemInput,
  CreateListInput,
  CreatedInviteLink,
  EffectiveListRole,
  InviteLink,
  InvitePreview,
  ListCategory,
  ListDetails,
  ListItem,
  ListMembership,
  ListMemberView,
  ListSummary,
  OAuthIdentity,
  OAuthProfile,
  PendingInvite,
  StoredInviteLink,
  StoredUser,
  UpdateItemInput,
  UpdateListInput,
} from './types'

type DB = Sql | TransactionSql
function normalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [
        key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
        normalize(v),
      ]),
    )
  return value
}
async function rows<T>(
  db: DB,
  query: string,
  parameters: (string | number | boolean | null)[] = [],
): Promise<T[]> {
  try {
    return normalize(await db.unsafe(query, parameters)) as T[]
  } catch (error) {
    const code = (error as { code?: string }).code
    if (
      code === '22P02' ||
      code === '22007' ||
      code === '22008' ||
      code === '23514' ||
      code === '22001'
    )
      throw new DataError('VALIDATION_ERROR', '輸入格式不正確')
    if (code === '23503' || code === '23505')
      throw new DataError('CONFLICT', '資料已有變更，請重新載入')
    throw error
  }
}
function notFound<T>(value: T | undefined, message = '找不到資料'): T {
  if (!value) throw new DataError('NOT_FOUND', message)
  return value
}
function publicUser(user: StoredUser): AppUser {
  const { passwordHash: _hash, ...view } = user
  void _hash
  return view
}
function publicInvite(invite: StoredInviteLink): InviteLink {
  const { tokenHash: _hash, ...view } = invite
  void _hash
  return view
}

export class SupabaseRepository implements DataRepository {
  constructor(private readonly db: Sql) {}

  private async user(db: DB, userId: string) {
    return notFound(
      (await rows<StoredUser>(db, 'SELECT * FROM users WHERE id = $1', [userId]))[0],
      '找不到使用者',
    )
  }
  private async access(
    db: DB,
    userId: string,
    listId: string,
    level: 'view' | 'edit' | 'manage' = 'view',
    lock = false,
  ) {
    // User row lock prevents deletion racing a mutation that uses this account.
    const user = lock
      ? notFound(
          (
            await rows<StoredUser>(db, 'SELECT * FROM users WHERE id = $1 FOR KEY SHARE', [userId])
          )[0],
          '找不到使用者',
        )
      : await this.user(db, userId)
    const list = notFound(
      (
        await rows<BucketList>(
          db,
          `SELECT * FROM lists WHERE id = $1 ${lock ? 'FOR UPDATE' : ''}`,
          [listId],
        )
      )[0],
      '找不到清單',
    )
    const member = (
      await rows<ListMembership>(
        db,
        "SELECT * FROM list_members WHERE list_id = $1 AND user_id = $2 AND status = 'accepted'",
        [listId, userId],
      )
    )[0]
    const role: EffectiveListRole | null =
      user.role === 'admin' ? 'admin' : list.ownerId === userId ? 'owner' : (member?.role ?? null)
    if (
      !role ||
      (level === 'manage' && role !== 'owner' && role !== 'admin') ||
      (level === 'edit' && role === 'viewer')
    )
      throw new DataError('FORBIDDEN', '您沒有執行此操作的權限')
    return { list, role }
  }
  private async members(db: DB, listId: string, manage: boolean): Promise<ListMemberView[]> {
    return rows(
      db,
      `SELECT m.*, json_build_object('id', u.id, 'email', NULL, 'display_name', u.display_name, 'picture_url', u.picture_url) AS "user" FROM list_members m JOIN users u ON u.id = m.user_id WHERE m.list_id = $1 ${manage ? '' : "AND m.status = 'accepted'"} ORDER BY m.invited_at, m.id`,
      [listId],
    )
  }
  private async details(db: DB, userId: string, listId: string): Promise<ListDetails> {
    const { list, role } = await this.access(db, userId, listId)
    const canManage = role === 'owner' || role === 'admin'
    const items = await rows<ListItem>(
      db,
      'SELECT * FROM items WHERE list_id = $1 ORDER BY "order", id',
      [listId],
    )
    const completedItems = items.filter((i) => i.isCompleted).length
    return {
      ...list,
      items,
      categories: await rows(
        db,
        'SELECT * FROM categories WHERE list_id = $1 ORDER BY "order", id',
        [listId],
      ),
      members: await this.members(db, listId, canManage),
      currentUserRole: role,
      canManage,
      canEditItems: role !== 'viewer',
      stats: {
        totalItems: items.length,
        completedItems,
        progress: items.length ? Math.round((completedItems / items.length) * 100) : 0,
      },
    }
  }
  private mutate<T>(
    userId: string,
    listId: string,
    level: 'edit' | 'manage',
    operation: (tx: TransactionSql, list: BucketList) => Promise<T>,
  ): Promise<T> {
    return this.db.begin(async (tx) => {
      const { list } = await this.access(tx, userId, listId, level, true)
      const result = await operation(tx, list)
      await rows(tx, 'UPDATE lists SET updated_at = clock_timestamp() WHERE id = $1', [listId])
      return result
    }) as Promise<T>
  }

  async authenticateCredentials(email: string, password: string): Promise<AppUser | null> {
    if (process.env.NODE_ENV === 'production') return null
    const user = (
      await rows<StoredUser>(
        this.db,
        'SELECT * FROM users WHERE lower(email) = lower($1) AND password_hash IS NOT NULL',
        [email.trim()],
      )
    )[0]
    return user?.passwordHash && (await verifyPassword(password, user.passwordHash))
      ? publicUser(user)
      : null
  }
  async getUserById(userId: string): Promise<AppUser | null> {
    const user = (await rows<StoredUser>(this.db, 'SELECT * FROM users WHERE id = $1', [userId]))[0]
    return user ? publicUser(user) : null
  }
  async resolveOAuthUser(profile: OAuthProfile, linkUserId?: string): Promise<AppUser> {
    validateProfile(profile)
    return this.db.begin(async (tx) => {
      // Serialize first sign-ins for one provider identity, including across instances.
      await rows(tx, 'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
        `${profile.provider}:${profile.providerAccountId}`,
      ])
      const identity = (
        await rows<OAuthIdentity>(
          tx,
          'SELECT * FROM oauth_identities WHERE provider = $1 AND provider_account_id = $2',
          [profile.provider, profile.providerAccountId],
        )
      )[0]
      if (identity && linkUserId && identity.userId !== linkUserId)
        throw new DataError('CONFLICT', '此登入身分已綁定其他帳號')
      let user: StoredUser
      if (identity || linkUserId) {
        user = notFound(
          (
            await rows<StoredUser>(tx, 'SELECT * FROM users WHERE id = $1 FOR UPDATE', [
              identity?.userId ?? linkUserId!,
            ])
          )[0],
        )
      } else {
        user = (
          await rows<StoredUser>(
            tx,
            'INSERT INTO users (email, display_name, picture_url, auth_provider) VALUES ($1, $2, $3, $4) RETURNING *',
            [
              profile.email?.trim().toLowerCase() || null,
              profile.displayName,
              profile.pictureUrl ?? null,
              profile.provider,
            ],
          )
        )[0]
      }
      if (!identity) {
        if (
          (
            await rows(tx, 'SELECT 1 FROM oauth_identities WHERE user_id = $1 AND provider = $2', [
              user.id,
              profile.provider,
            ])
          ).length
        )
          throw new DataError('CONFLICT', '此帳號已綁定該平台')
        await rows(
          tx,
          'INSERT INTO oauth_identities (user_id, provider, provider_account_id) VALUES ($1, $2, $3)',
          [user.id, profile.provider, profile.providerAccountId],
        )
      }
      const identities = await rows<OAuthIdentity>(
        tx,
        'SELECT * FROM oauth_identities WHERE user_id = $1',
        [user.id],
      )
      const provider =
        identities.length + (user.passwordHash ? 1 : 0) > 1 ? 'multiple' : profile.provider
      user = (
        await rows<StoredUser>(
          tx,
          'UPDATE users SET display_name = $2, picture_url = $3, email = $4, auth_provider = $5, updated_at = clock_timestamp() WHERE id = $1 RETURNING *',
          [
            user.id,
            linkUserId ? user.displayName : profile.displayName,
            linkUserId ? user.pictureUrl : (profile.pictureUrl ?? user.pictureUrl),
            linkUserId ? user.email : profile.email?.trim().toLowerCase() || user.email,
            provider,
          ],
        )
      )[0]
      return publicUser(user)
    }) as Promise<AppUser>
  }
  async listIdentities(userId: string): Promise<OAuthIdentity[]> {
    await this.user(this.db, userId)
    return rows(this.db, 'SELECT * FROM oauth_identities WHERE user_id = $1 ORDER BY provider', [
      userId,
    ])
  }
  async deleteAccount(userId: string): Promise<void> {
    await this.db.begin(async (tx) => {
      notFound((await rows(tx, 'DELETE FROM users WHERE id = $1 RETURNING id', [userId]))[0])
    })
  }
  async listLists(userId: string): Promise<ListSummary[]> {
    const user = await this.user(this.db, userId)
    return rows(
      this.db,
      `SELECT l.*, (l.owner_id = $1) AS is_owner,
      CASE WHEN $2 = 'admin' THEN 'admin' WHEN l.owner_id = $1 THEN 'owner' ELSE m.role END AS member_role,
      (SELECT count(*)::int FROM items i WHERE i.list_id = l.id) AS item_count,
      (SELECT count(*)::int FROM items i WHERE i.list_id = l.id AND i.is_completed) AS completed_count
      FROM lists l LEFT JOIN list_members m ON m.list_id = l.id AND m.user_id = $1 AND m.status = 'accepted'
      WHERE $2 = 'admin' OR l.owner_id = $1 OR m.id IS NOT NULL ORDER BY l.updated_at DESC`,
      [userId, user.role],
    )
  }
  async createList(userId: string, input: CreateListInput): Promise<ListDetails> {
    return this.db.begin(async (tx) => {
      await this.user(tx, userId)
      const list = (
        await rows<BucketList>(
          tx,
          'INSERT INTO lists (owner_id, title, description) VALUES ($1, $2, $3) RETURNING *',
          [userId, requiredText(input.title, '清單標題', 255), input.description?.trim() || null],
        )
      )[0]
      await rows(
        tx,
        "INSERT INTO list_members (list_id, user_id, role, joined_at) VALUES ($1, $2, 'owner', now())",
        [list.id, userId],
      )
      for (const [order, category] of (input.categories ?? []).entries()) {
        if (category.name.trim())
          await rows(
            tx,
            'INSERT INTO categories (list_id, name, color, "order") VALUES ($1, $2, $3, $4)',
            [
              list.id,
              requiredText(category.name, '分類名稱', 100),
              validateColor(category.color || '#3b82f6'),
              order,
            ],
          )
      }
      return this.details(tx, userId, list.id)
    }) as Promise<ListDetails>
  }
  async getList(userId: string, listId: string): Promise<ListDetails> {
    // A repeatable snapshot keeps items, roles and member views consistent.
    return this.db.begin('isolation level repeatable read read only', (tx) =>
      this.details(tx, userId, listId),
    ) as Promise<ListDetails>
  }
  async updateList(userId: string, listId: string, input: UpdateListInput): Promise<ListDetails> {
    return this.mutate(userId, listId, 'manage', async (tx, list) => {
      checkVersion(list.version, input.expectedVersion)
      await rows(
        tx,
        'UPDATE lists SET title = $2, description = $3, version = version + 1 WHERE id = $1',
        [
          listId,
          input.title === undefined ? list.title : requiredText(input.title, '清單標題', 255),
          input.description === undefined ? list.description : input.description?.trim() || null,
        ],
      )
      return this.details(tx, userId, listId)
    })
  }
  async deleteList(userId: string, listId: string): Promise<void> {
    await this.mutate(userId, listId, 'manage', async (tx) => {
      await rows(tx, 'DELETE FROM lists WHERE id = $1', [listId])
    })
  }
  async createCategory(
    userId: string,
    listId: string,
    name: string,
    color = '#3b82f6',
  ): Promise<ListCategory> {
    return this.mutate(
      userId,
      listId,
      'manage',
      async (tx) =>
        (
          await rows<ListCategory>(
            tx,
            'INSERT INTO categories (list_id, name, color, "order") VALUES ($1, $2, $3, (SELECT coalesce(max("order"), -1) + 1 FROM categories WHERE list_id = $1)) RETURNING *',
            [listId, requiredText(name, '分類名稱', 100), validateColor(color)],
          )
        )[0],
    )
  }
  async updateCategory(
    userId: string,
    listId: string,
    categoryId: string,
    input: { name?: string; color?: string },
  ): Promise<ListCategory> {
    return this.mutate(userId, listId, 'manage', async (tx) => {
      const category = notFound(
        (
          await rows<ListCategory>(tx, 'SELECT * FROM categories WHERE list_id = $1 AND id = $2', [
            listId,
            categoryId,
          ])
        )[0],
      )
      return (
        await rows<ListCategory>(
          tx,
          'UPDATE categories SET name = $3, color = $4 WHERE list_id = $1 AND id = $2 RETURNING *',
          [
            listId,
            categoryId,
            input.name === undefined ? category.name : requiredText(input.name, '分類名稱', 100),
            input.color === undefined ? category.color : validateColor(input.color),
          ],
        )
      )[0]
    })
  }
  async deleteCategory(userId: string, listId: string, categoryId: string): Promise<void> {
    await this.mutate(userId, listId, 'manage', async (tx) => {
      await rows(
        tx,
        'UPDATE items SET category_id = NULL, version = version + 1, updated_at = clock_timestamp() WHERE list_id = $1 AND category_id = $2',
        [listId, categoryId],
      )
      notFound(
        (
          await rows(tx, 'DELETE FROM categories WHERE list_id = $1 AND id = $2 RETURNING id', [
            listId,
            categoryId,
          ])
        )[0],
      )
    })
  }
  async listItems(userId: string, listId: string): Promise<ListItem[]> {
    return (await this.getList(userId, listId)).items
  }
  private async validateCategory(db: DB, listId: string, categoryId?: string | null) {
    if (
      categoryId &&
      !(
        await rows(db, 'SELECT 1 FROM categories WHERE list_id = $1 AND id = $2', [
          listId,
          categoryId,
        ])
      ).length
    )
      throw new DataError('VALIDATION_ERROR', '分類不屬於此清單')
  }
  async createItem(userId: string, listId: string, input: CreateItemInput): Promise<ListItem> {
    validateItem(input)
    return this.mutate(userId, listId, 'edit', async (tx) => {
      await this.validateCategory(tx, listId, input.categoryId)
      return (
        await rows<ListItem>(
          tx,
          'INSERT INTO items (list_id, category_id, title, description, due_date, priority, created_by, "order") VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT coalesce(max("order"), -1) + 1 FROM items WHERE list_id = $1)) RETURNING *',
          [
            listId,
            input.categoryId || null,
            requiredText(input.title, '項目標題', 500),
            input.description?.trim() || null,
            input.dueDate || null,
            input.priority || null,
            userId,
          ],
        )
      )[0]
    })
  }
  async updateItem(
    userId: string,
    listId: string,
    itemId: string,
    input: UpdateItemInput,
  ): Promise<ListItem> {
    validateItem(input)
    return this.mutate(userId, listId, 'edit', async (tx) => {
      const item = notFound(
        (
          await rows<ListItem>(tx, 'SELECT * FROM items WHERE list_id = $1 AND id = $2', [
            listId,
            itemId,
          ])
        )[0],
      )
      checkVersion(item.version, input.expectedVersion)
      await this.validateCategory(tx, listId, input.categoryId)
      const completed = input.isCompleted ?? item.isCompleted
      return (
        await rows<ListItem>(
          tx,
          `UPDATE items SET title = $3, description = $4, category_id = $5, due_date = $6, priority = $7, is_completed = $8, completed_at = $9, completed_by = $10, version = version + 1, updated_at = clock_timestamp() WHERE list_id = $1 AND id = $2 RETURNING *`,
          [
            listId,
            itemId,
            input.title === undefined ? item.title : requiredText(input.title, '項目標題', 500),
            input.description === undefined ? item.description : input.description?.trim() || null,
            input.categoryId === undefined ? item.categoryId : input.categoryId || null,
            input.dueDate === undefined ? item.dueDate : input.dueDate || null,
            input.priority === undefined ? item.priority : input.priority,
            completed,
            input.isCompleted === undefined
              ? item.completedAt
              : completed
                ? new Date().toISOString()
                : null,
            input.isCompleted === undefined ? item.completedBy : completed ? userId : null,
          ],
        )
      )[0]
    })
  }
  async deleteItem(userId: string, listId: string, itemId: string): Promise<void> {
    await this.mutate(userId, listId, 'edit', async (tx) => {
      notFound(
        (
          await rows(tx, 'DELETE FROM items WHERE list_id = $1 AND id = $2 RETURNING id', [
            listId,
            itemId,
          ])
        )[0],
      )
    })
  }
  async inviteMember(
    userId: string,
    listId: string,
    email: string,
    role: 'editor' | 'viewer',
  ): Promise<ListMemberView> {
    // OAuth emails are not identity proofs; public invitations use bearer links.
    void userId
    void listId
    void email
    void role
    throw new DataError('FORBIDDEN', '請改用邀請連結')
  }

  async listMembers(userId: string, listId: string): Promise<ListMemberView[]> {
    return (await this.getList(userId, listId)).members
  }
  async updateMemberRole(
    userId: string,
    listId: string,
    membershipId: string,
    role: 'editor' | 'viewer',
  ): Promise<ListMemberView> {
    validateRole(role)
    return this.mutate(userId, listId, 'manage', async (tx) => {
      const member = notFound(
        (
          await rows<ListMembership>(
            tx,
            'SELECT * FROM list_members WHERE list_id = $1 AND id = $2',
            [listId, membershipId],
          )
        )[0],
      )
      if (member.role === 'owner') throw new DataError('FORBIDDEN', '不能修改清單擁有者')
      await rows(tx, 'UPDATE list_members SET role = $3 WHERE list_id = $1 AND id = $2', [
        listId,
        membershipId,
        role,
      ])
      return notFound((await this.members(tx, listId, true)).find((m) => m.id === membershipId))
    })
  }
  async removeMember(userId: string, listId: string, membershipId: string): Promise<void> {
    await this.db.begin(async (tx) => {
      const { role } = await this.access(tx, userId, listId, 'view', true)
      const member = notFound(
        (
          await rows<ListMembership>(
            tx,
            'SELECT * FROM list_members WHERE list_id = $1 AND id = $2',
            [listId, membershipId],
          )
        )[0],
      )
      if (
        member.role === 'owner' ||
        (member.userId !== userId && role !== 'admin' && role !== 'owner')
      )
        throw new DataError('FORBIDDEN', '不能移除此成員')
      await rows(tx, 'DELETE FROM list_members WHERE id = $1', [member.id])
    })
  }
  async listPendingInvites(userId: string): Promise<PendingInvite[]> {
    await this.user(this.db, userId)
    return rows(
      this.db,
      `SELECT m.*, json_build_object('id', l.id, 'title', l.title, 'description', l.description) AS list, CASE WHEN u.id IS NULL THEN NULL ELSE json_build_object('id', u.id, 'display_name', u.display_name, 'picture_url', u.picture_url) END AS inviter FROM list_members m JOIN lists l ON l.id = m.list_id LEFT JOIN users u ON u.id = m.invited_by WHERE m.user_id = $1 AND m.status = 'pending' ORDER BY m.invited_at DESC`,
      [userId],
    )
  }
  async respondToInvite(
    userId: string,
    inviteId: string,
    action: 'accept' | 'reject',
  ): Promise<void> {
    await this.db.begin(async (tx) => {
      await this.user(tx, userId)
      const member = notFound(
        (
          await rows<ListMembership>(
            tx,
            "SELECT * FROM list_members WHERE id = $1 AND user_id = $2 AND status = 'pending' FOR UPDATE",
            [inviteId, userId],
          )
        )[0],
      )
      if (action === 'reject') await rows(tx, 'DELETE FROM list_members WHERE id = $1', [member.id])
      else
        await rows(
          tx,
          "UPDATE list_members SET status = 'accepted', joined_at = now() WHERE id = $1",
          [member.id],
        )
    })
  }
  async createInviteLink(
    userId: string,
    listId: string,
    role: 'editor' | 'viewer',
  ): Promise<CreatedInviteLink> {
    validateRole(role)
    return this.mutate(userId, listId, 'manage', async (tx) => {
      const secret = newInviteSecret()
      const invite = (
        await rows<StoredInviteLink>(
          tx,
          'INSERT INTO invite_links (list_id, role, token_hash, created_by, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [listId, role, secret.tokenHash, userId, secret.expiresAt],
        )
      )[0]
      return { ...publicInvite(invite), token: secret.token }
    })
  }
  async listInviteLinks(userId: string, listId: string): Promise<InviteLink[]> {
    await this.access(this.db, userId, listId, 'manage')
    return (
      await rows<StoredInviteLink>(
        this.db,
        'SELECT * FROM invite_links WHERE list_id = $1 ORDER BY created_at DESC',
        [listId],
      )
    ).map(publicInvite)
  }
  async revokeInviteLink(userId: string, listId: string, inviteId: string): Promise<void> {
    await this.mutate(userId, listId, 'manage', async (tx) => {
      notFound(
        (
          await rows(
            tx,
            'UPDATE invite_links SET revoked_at = now() WHERE list_id = $1 AND id = $2 RETURNING id',
            [listId, inviteId],
          )
        )[0],
      )
    })
  }
  private async validInvite(db: DB, token: string, lock = false): Promise<StoredInviteLink> {
    return notFound(
      (
        await rows<StoredInviteLink>(
          db,
          `SELECT * FROM invite_links WHERE token_hash = $1 AND revoked_at IS NULL AND accepted_at IS NULL AND expires_at > clock_timestamp() ${lock ? 'FOR UPDATE' : ''}`,
          [tokenHash(token)],
        )
      )[0],
      '邀請已失效、使用或撤銷',
    )
  }
  async getInvitePreview(userId: string, token: string): Promise<InvitePreview> {
    await this.user(this.db, userId)
    const invite = await this.validInvite(this.db, token)
    const list = notFound(
      (await rows<BucketList>(this.db, 'SELECT * FROM lists WHERE id = $1', [invite.listId]))[0],
    )
    return { title: list.title, role: invite.role, expiresAt: invite.expiresAt }
  }
  async acceptInviteLink(userId: string, token: string): Promise<string> {
    return this.db.begin(async (tx) => {
      await this.user(tx, userId)
      const preview = await this.validInvite(tx, token)
      // Match list-mutation lock order (list -> invitation).
      notFound(
        (await rows(tx, 'SELECT id FROM lists WHERE id = $1 FOR UPDATE', [preview.listId]))[0],
      )
      const invite = await this.validInvite(tx, token, true)
      await rows(
        tx,
        `INSERT INTO list_members (list_id, user_id, role, status, invited_by, joined_at) VALUES ($1, $2, $3, 'accepted', $4, now()) ON CONFLICT (list_id, user_id) DO UPDATE SET status = 'accepted', role = CASE WHEN list_members.status = 'accepted' THEN list_members.role ELSE EXCLUDED.role END, joined_at = coalesce(list_members.joined_at, now())`,
        [invite.listId, userId, invite.role, invite.createdBy],
      )
      await rows(tx, 'UPDATE invite_links SET accepted_at = now() WHERE id = $1', [invite.id])
      return invite.listId
    }) as Promise<string>
  }
  async consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const result = await rows<{ count: number }>(
      this.db,
      `INSERT INTO rate_limits (key, count, expires_at) VALUES ($1, 1, clock_timestamp() + $2 * interval '1 second') ON CONFLICT (key) DO UPDATE SET count = CASE WHEN rate_limits.expires_at <= clock_timestamp() THEN 1 ELSE rate_limits.count + 1 END, expires_at = CASE WHEN rate_limits.expires_at <= clock_timestamp() THEN EXCLUDED.expires_at ELSE rate_limits.expires_at END RETURNING count`,
      [key, windowSeconds],
    )
    return result[0].count <= limit
  }
}
