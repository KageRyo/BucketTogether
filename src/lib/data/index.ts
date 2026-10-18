import { productionEnvironmentErrors } from '../environment.mjs'
import type { DataRepository } from './repository'
import { LocalFileRepository } from './local-file-repository'
import { SupabaseRepository } from './supabase-repository'
import { createDatabase } from './postgres'

let repository: DataRepository | undefined
export function getDataRepository(): DataRepository {
  if (!repository) {
    const backend = process.env.DATA_BACKEND || 'local'
    if (process.env.NODE_ENV === 'production') {
      const errors = productionEnvironmentErrors()
      if (errors.length) throw new Error(`Invalid production configuration: ${errors.join('; ')}`)
    }
    if (backend === 'supabase') repository = new SupabaseRepository(createDatabase())
    else if (backend === 'local') repository = new LocalFileRepository()
    else throw new Error(`Unsupported DATA_BACKEND: ${backend}`)
  }
  return repository
}
export { DataError } from './errors'
export { INVITABLE_ROLES, ITEM_PRIORITIES } from './repository'
export type { DataRepository } from './repository'
export type * from './types'
