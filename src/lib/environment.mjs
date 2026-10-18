/** @param {Record<string, string | undefined>} env */
export function productionEnvironmentErrors(env = process.env) {
  const errors = []
  if (env.DATA_BACKEND !== 'supabase') errors.push('DATA_BACKEND must be supabase')
  if (!env.DATABASE_URL) errors.push('DATABASE_URL is required')
  else {
    try {
      const url = new URL(env.DATABASE_URL)
      if (!['postgres:', 'postgresql:'].includes(url.protocol))
        errors.push('DATABASE_URL must be a PostgreSQL connection URL')
    } catch {
      errors.push('DATABASE_URL is invalid')
    }
  }
  if (env.DATABASE_SSL === 'disable') errors.push('DATABASE_SSL cannot be disabled in production')
  if (
    !env.NEXTAUTH_SECRET ||
    env.NEXTAUTH_SECRET.length < 32 ||
    /replace-with|local-development/i.test(env.NEXTAUTH_SECRET)
  )
    errors.push('NEXTAUTH_SECRET must be a unique random secret of at least 32 characters')
  try {
    if (new URL(env.NEXTAUTH_URL).protocol !== 'https:') errors.push('NEXTAUTH_URL must use HTTPS')
  } catch {
    errors.push('NEXTAUTH_URL is required and must be a valid HTTPS URL')
  }
  for (const key of [
    'LINE_CHANNEL_ID',
    'LINE_CHANNEL_SECRET',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ])
    if (!env[key]) errors.push(`${key} is required`)
  if (
    !env.NEXT_PUBLIC_CONTACT_EMAIL ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.NEXT_PUBLIC_CONTACT_EMAIL)
  )
    errors.push('NEXT_PUBLIC_CONTACT_EMAIL must be a monitored contact email')
  if (!env.NEXT_PUBLIC_DATA_REGION)
    errors.push('NEXT_PUBLIC_DATA_REGION is required for the privacy policy')
  if (
    !env.NEXT_PUBLIC_BACKUP_RETENTION_DAYS ||
    !/^\d+$/.test(env.NEXT_PUBLIC_BACKUP_RETENTION_DAYS) ||
    Number(env.NEXT_PUBLIC_BACKUP_RETENTION_DAYS) < 1
  )
    errors.push('NEXT_PUBLIC_BACKUP_RETENTION_DAYS must be a positive number')
  return errors
}
