import type { DataRepository } from './repository'
import { LocalFileRepository } from './local-file-repository'

let repository: DataRepository | undefined

export function getDataRepository(): DataRepository {
  if (!repository) {
    const backend = process.env.DATA_BACKEND || 'local'
    if (backend !== 'local') {
      throw new Error(`Unsupported DATA_BACKEND: ${backend}. Only "local" is available in this development version.`)
    }
    repository = new LocalFileRepository()
  }
  return repository
}

export { DataError } from './errors'
export { LocalFileRepository } from './local-file-repository'
export { INVITABLE_ROLES, ITEM_PRIORITIES } from './repository'
export type { DataRepository } from './repository'
export type * from './types'
