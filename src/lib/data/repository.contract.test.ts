import { describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { LocalFileRepository } from './local-file-repository'

import { repositoryContract } from './repository-contract'

repositoryContract('local repository contract', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'bucket-contract-'))
  return {
    repository: new LocalFileRepository(path.join(directory, 'data.json')),
    cleanup: () => rm(directory, { recursive: true, force: true }),
  }
})

describe('local persistence', () => {
  it('stores token hashes and rejects expired tokens', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'bucket-expiry-'))
    try {
      const file = path.join(directory, 'data.json')
      const repo = new LocalFileRepository(file)
      const owner = (
        await repo.resolveOAuthUser({
          provider: 'line',
          providerAccountId: 'expiry',
          displayName: 'Owner',
        })
      ).id
      const list = await repo.createList(owner, { title: 'Expiry' })
      const invite = await repo.createInviteLink(owner, list.id, 'editor')
      expect(await readFile(file, 'utf8')).not.toContain(invite.token)
      expect(new Date(invite.expiresAt).getTime() - Date.now()).toBeGreaterThan(6 * 86400000)
      const { writeFile } = await import('node:fs/promises')
      const data = JSON.parse(await readFile(file, 'utf8'))
      data.inviteLinks[0].expiresAt = '2000-01-01T00:00:00.000Z'
      await writeFile(file, JSON.stringify(data))
      await expect(repo.getInvitePreview(owner, invite.token)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
