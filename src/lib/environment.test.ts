import { describe, expect, it } from 'vitest'
import { productionEnvironmentErrors } from './environment.mjs'
const configured = {
  DATA_BACKEND: 'supabase',
  DATABASE_URL: 'postgres://user:password@db.example.com/postgres',
  NEXTAUTH_SECRET: 'x'.repeat(64),
  NEXTAUTH_URL: 'https://bucket.example.com',
  LINE_CHANNEL_ID: 'line',
  LINE_CHANNEL_SECRET: 'secret',
  DISCORD_CLIENT_ID: 'discord',
  DISCORD_CLIENT_SECRET: 'secret',
  GOOGLE_CLIENT_ID: 'google',
  GOOGLE_CLIENT_SECRET: 'secret',
  NEXT_PUBLIC_CONTACT_EMAIL: 'help@example.com',
  NEXT_PUBLIC_DATA_REGION: 'Singapore',
  NEXT_PUBLIC_BACKUP_RETENTION_DAYS: '7',
}
describe('production configuration', () => {
  it('accepts complete configuration and rejects unsafe storage, secrets and origins', () => {
    expect(productionEnvironmentErrors(configured)).toEqual([])
    for (const overrides of [
      { DATA_BACKEND: 'local' },
      { NEXTAUTH_SECRET: 'short' },
      { NEXTAUTH_URL: 'http://localhost:3000' },
      { DATABASE_SSL: 'disable' },
      { GOOGLE_CLIENT_SECRET: '' },
      { NEXT_PUBLIC_CONTACT_EMAIL: '' },
    ])
      expect(productionEnvironmentErrors({ ...configured, ...overrides }).length).toBeGreaterThan(0)
  })
})
