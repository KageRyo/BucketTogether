import postgres from 'postgres'

// Supabase transaction pooler does not support prepared statements.
export function createDatabase(url = process.env.DATABASE_URL) {
  if (!url) throw new Error('DATABASE_URL is required for DATA_BACKEND=supabase')
  return postgres(url, {
    prepare: false,
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl:
      process.env.DATABASE_SSL === 'disable' && process.env.NODE_ENV !== 'production'
        ? false
        : 'verify-full',
    types: {
      date: {
        to: 1082,
        from: [1082],
        serialize: (value: string) => value,
        parse: (value: string) => value,
      },
    },
  })
}
