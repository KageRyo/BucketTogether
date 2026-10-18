import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import postgres from 'postgres'
import { readFile } from 'node:fs/promises'
import { SupabaseRepository } from './supabase-repository'
import { repositoryContract } from './repository-contract'

const url = process.env.TEST_DATABASE_URL
const integration = url ? describe : describe.skip
integration('Supabase PostgreSQL integration (disposable database only)', () => {
  const db = postgres(url!, {
    prepare: false,
    max: 5,
    types: {
      date: { to: 1082, from: [1082], serialize: (v: string) => v, parse: (v: string) => v },
    },
  })
  beforeAll(async () => {
    // Refuse any database not explicitly named as a test database.
    const [{ current_database: name }] = await db`SELECT current_database()`
    if (!name.endsWith('_test'))
      throw new Error('TEST_DATABASE_URL must point to a database ending in _test')
    const [{ exists }] =
      await db`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')`
    if (!exists)
      await db.unsafe(await readFile('supabase/migrations/202610180001_public_beta.sql', 'utf8'))
  })
  afterAll(async () => {
    await db.end()
  })
  repositoryContract('PostgreSQL repository contract', async () => {
    await db`TRUNCATE users, rate_limits CASCADE`
    return { repository: new SupabaseRepository(db), cleanup: async () => {} }
  })
  it('denies table reads to an unprivileged client even if SELECT is granted', async () => {
    const repository = new SupabaseRepository(db)
    const owner = await repository.resolveOAuthUser({
      provider: 'line',
      providerAccountId: 'rls',
      displayName: 'RLS fixture',
    })
    await repository.createList(owner.id, { title: 'RLS fixture' })
    const role = `bucket_client_${Date.now()}`
    await db.begin(async (tx) => {
      await tx`CREATE ROLE ${tx(role)} NOLOGIN`
      await tx`GRANT USAGE ON SCHEMA public TO ${tx(role)}`
      await tx`GRANT SELECT ON users, lists, oauth_identities, invite_links TO ${tx(role)}`
      await tx`SET LOCAL ROLE ${tx(role)}`
      const [counts] =
        await tx`SELECT (SELECT count(*)::int FROM users) AS users, (SELECT count(*)::int FROM lists) AS lists, (SELECT count(*)::int FROM oauth_identities) AS identities, (SELECT count(*)::int FROM invite_links) AS invites`
      expect(counts).toEqual({ users: 0, lists: 0, identities: 0, invites: 0 })
      await tx`RESET ROLE`
      await tx`DROP OWNED BY ${tx(role)}`
      await tx`DROP ROLE ${tx(role)}`
    })
  })
  it('rolls back list and owner creation if a category is invalid', async () => {
    const repo = new SupabaseRepository(db)
    const user = await repo.resolveOAuthUser({
      provider: 'line',
      providerAccountId: 'rollback',
      displayName: 'Rollback',
    })
    await expect(
      repo.createList(user.id, {
        title: 'Rollback',
        categories: [{ name: 'Invalid', color: 'bad' }],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(await repo.listLists(user.id)).toEqual([])
  })
  it('deduplicates concurrent first logins and rejects expired invitations', async () => {
    const repo = new SupabaseRepository(db)
    const profile = { provider: 'google' as const, providerAccountId: 'race', displayName: 'Race' }
    const users = await Promise.all([
      repo.resolveOAuthUser(profile),
      repo.resolveOAuthUser(profile),
    ])
    expect(users[0].id).toBe(users[1].id)
    const list = await repo.createList(users[0].id, { title: 'Expiry' })
    const invite = await repo.createInviteLink(users[0].id, list.id, 'editor')
    await db`UPDATE invite_links SET expires_at = now() - interval '1 second' WHERE id = ${invite.id}`
    await expect(repo.acceptInviteLink(users[0].id, invite.token)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
  it('refuses legacy email invitations on the public storage backend', async () => {
    const repo = new SupabaseRepository(db)
    const owner = await repo.resolveOAuthUser({
      provider: 'google',
      providerAccountId: 'legacy-owner',
      displayName: 'Owner',
    })
    await repo.resolveOAuthUser({
      provider: 'discord',
      providerAccountId: 'legacy-target',
      displayName: 'Target',
      email: 'unverified@example.com',
    })
    const list = await repo.createList(owner.id, { title: 'Private' })
    await expect(
      repo.inviteMember(owner.id, list.id, 'unverified@example.com', 'editor'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(await repo.listMembers(owner.id, list.id)).toHaveLength(1)
  })
  it('resets expired rate limits and shares state across repository instances', async () => {
    const one = new SupabaseRepository(db)
    const two = new SupabaseRepository(db)
    expect(await one.consumeRateLimit('shared', 1, 60)).toBe(true)
    expect(await two.consumeRateLimit('shared', 1, 60)).toBe(false)
    await db`UPDATE rate_limits SET expires_at = now() - interval '1 second' WHERE key = 'shared'`
    expect(await two.consumeRateLimit('shared', 1, 60)).toBe(true)
  })
})
