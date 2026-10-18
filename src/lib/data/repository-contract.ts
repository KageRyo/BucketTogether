import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DataRepository } from './repository'

// This suite is also invoked by the PostgreSQL integration tests.
export function repositoryContract(
  name: string,
  setup: () => Promise<{
    repository: DataRepository
    cleanup: () => Promise<void>
  }>,
) {
  describe(name, () => {
    let repository: DataRepository
    let cleanup: () => Promise<void>
    let owner: string
    let friend: string
    beforeEach(async () => {
      ;({ repository, cleanup } = await setup())
      owner = (
        await repository.resolveOAuthUser({
          provider: 'google',
          providerAccountId: 'owner',
          displayName: 'Owner',
          email: 'same@example.com',
        })
      ).id
      friend = (
        await repository.resolveOAuthUser({
          provider: 'discord',
          providerAccountId: 'friend',
          displayName: 'Friend',
          email: 'same@example.com',
        })
      ).id
    })
    afterEach(async () => {
      await cleanup?.()
    })

    it('does not merge equal emails and recognizes the provider identity on later sign-in', async () => {
      expect(owner).not.toBe(friend)
      expect(
        (
          await repository.resolveOAuthUser({
            provider: 'google',
            providerAccountId: 'owner',
            displayName: 'Updated',
          })
        ).id,
      ).toBe(owner)
      expect((await repository.getUserById(owner))?.displayName).toBe('Updated')
    })
    it('links only explicitly and refuses an identity owned by another account', async () => {
      await repository.resolveOAuthUser(
        { provider: 'line', providerAccountId: 'linked', displayName: 'LINE' },
        owner,
      )
      expect(
        (
          await repository.resolveOAuthUser({
            provider: 'line',
            providerAccountId: 'linked',
            displayName: 'LINE',
          })
        ).id,
      ).toBe(owner)
      await expect(
        repository.resolveOAuthUser(
          { provider: 'discord', providerAccountId: 'friend', displayName: 'Friend' },
          owner,
        ),
      ).rejects.toMatchObject({ code: 'CONFLICT' })
      expect(await repository.listIdentities(owner)).toHaveLength(2)
    })
    it('keeps lists private and enforces viewer and editor boundaries', async () => {
      const list = await repository.createList(owner, { title: 'Private' })
      await expect(repository.getList(friend, list.id)).rejects.toMatchObject({ code: 'FORBIDDEN' })
      const invite = await repository.createInviteLink(owner, list.id, 'viewer')
      await repository.acceptInviteLink(friend, invite.token)
      await expect(
        repository.createItem(friend, list.id, { title: 'Denied' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      await expect(repository.createInviteLink(friend, list.id, 'editor')).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })
    it('accepts a single-use invitation exactly once even concurrently', async () => {
      const list = await repository.createList(owner, { title: 'Shared' })
      const invite = await repository.createInviteLink(owner, list.id, 'editor')
      expect(await repository.getInvitePreview(friend, invite.token)).toMatchObject({
        title: 'Shared',
        role: 'editor',
      })
      await expect(repository.getList(friend, list.id)).rejects.toMatchObject({ code: 'FORBIDDEN' })
      const results = await Promise.allSettled([
        repository.acceptInviteLink(friend, invite.token),
        repository.acceptInviteLink(friend, invite.token),
      ])
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
      expect((await repository.getList(friend, list.id)).canEditItems).toBe(true)
      expect(await repository.listMembers(owner, list.id)).toHaveLength(2)
    })
    it('keeps an existing member role and rejects revoked links', async () => {
      const list = await repository.createList(owner, { title: 'Shared' })
      await repository.acceptInviteLink(
        friend,
        (await repository.createInviteLink(owner, list.id, 'viewer')).token,
      )
      await repository.acceptInviteLink(
        friend,
        (await repository.createInviteLink(owner, list.id, 'editor')).token,
      )
      expect((await repository.getList(friend, list.id)).currentUserRole).toBe('viewer')
      const revoked = await repository.createInviteLink(owner, list.id, 'editor')
      await repository.revokeInviteLink(owner, list.id, revoked.id)
      await expect(repository.acceptInviteLink(friend, revoked.token)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
      expect(JSON.stringify(await repository.listInviteLinks(owner, list.id))).not.toContain(
        revoked.token,
      )
    })
    it('detects stale updates and commits only one concurrent version', async () => {
      const list = await repository.createList(owner, { title: 'Versioned' })
      const item = await repository.createItem(owner, list.id, { title: 'Original' })
      const results = await Promise.allSettled([
        repository.updateItem(owner, list.id, item.id, {
          title: 'First',
          expectedVersion: item.version,
        }),
        repository.updateItem(owner, list.id, item.id, {
          title: 'Second',
          expectedVersion: item.version,
        }),
      ])
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
      expect(results.find((r) => r.status === 'rejected')).toMatchObject({
        reason: { code: 'CONFLICT' },
      })
      await repository.updateList(owner, list.id, {
        title: 'Updated',
        expectedVersion: list.version,
      })
      await expect(
        repository.updateList(owner, list.id, { title: 'Stale', expectedVersion: list.version }),
      ).rejects.toMatchObject({ code: 'CONFLICT' })
    })
    it('rejects categories and items belonging to another list', async () => {
      const a = await repository.createList(owner, { title: 'A', categories: [{ name: 'A' }] })
      const b = await repository.createList(owner, { title: 'B' })
      await expect(
        repository.createItem(owner, b.id, { title: 'Bad', categoryId: a.categories[0].id }),
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
      const item = await repository.createItem(owner, a.id, { title: 'A' })
      await expect(
        repository.updateItem(owner, b.id, item.id, {
          title: 'Bad',
          expectedVersion: item.version,
        }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })
      await expect(
        repository.deleteCategory(owner, b.id, a.categories[0].id),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
    it('deletes owned data and anonymizes contributions to other lists', async () => {
      const owned = await repository.createList(owner, { title: 'Owned' })
      const shared = await repository.createList(friend, { title: 'Friend list' })
      await repository.acceptInviteLink(
        owner,
        (await repository.createInviteLink(friend, shared.id, 'editor')).token,
      )
      const item = await repository.createItem(owner, shared.id, { title: 'Keep contribution' })
      await repository.updateItem(owner, shared.id, item.id, {
        isCompleted: true,
        expectedVersion: item.version,
      })
      await repository.deleteAccount(owner)
      expect(await repository.getUserById(owner)).toBeNull()
      await expect(repository.getList(friend, owned.id)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
      expect((await repository.getList(friend, shared.id)).items[0]).toMatchObject({
        title: 'Keep contribution',
        createdBy: null,
        completedBy: null,
      })
      await expect(repository.listLists(owner)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
    it('limits parallel requests against a shared fixed window', async () => {
      const results = await Promise.all(
        Array.from({ length: 5 }, () => repository.consumeRateLimit('contract-limit', 2, 60)),
      )
      expect(results.filter(Boolean)).toHaveLength(2)
    })
    it('validates dates, priorities, roles and colors at the repository boundary', async () => {
      const list = await repository.createList(owner, { title: 'Validation' })
      await expect(
        repository.createItem(owner, list.id, { title: 'Bad date', dueDate: '2026-02-31' }),
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
      await expect(repository.createCategory(owner, list.id, 'Bad', 'red')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      })
      await expect(
        repository.createInviteLink(owner, list.id, 'owner' as 'editor'),
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    })
  })
}
