import nextEnv from '@next/env'
import postgres from 'postgres'
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
nextEnv.loadEnvConfig(process.cwd())
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL === 'disable')
  throw new Error('TLS cannot be disabled in production')
const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false,
  ssl: process.env.DATABASE_SSL === 'disable' ? false : 'verify-full',
})
try {
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(20261018)`
    await tx`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`
    await tx`ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY`
    const files = (await readdir(new URL('../supabase/migrations/', import.meta.url)))
      .filter((name) => name.endsWith('.sql'))
      .sort()
    for (const name of files) {
      const source = await readFile(
        new URL(`../supabase/migrations/${name}`, import.meta.url),
        'utf8',
      )
      const checksum = createHash('sha256').update(source).digest('hex')
      const [previous] = await tx`SELECT checksum FROM schema_migrations WHERE name = ${name}`
      if (previous && previous.checksum !== checksum)
        throw new Error(`Applied migration changed: ${name}`)
      if (previous) continue
      await tx.unsafe(source)
      await tx`INSERT INTO schema_migrations (name, checksum) VALUES (${name}, ${checksum})`
      console.log(`Applied ${name}`)
    }
  })
  console.log('Database migrations are up to date.')
} finally {
  await sql.end()
}
