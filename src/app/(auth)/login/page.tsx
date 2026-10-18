import { LoginClient } from './login-client'
import { safeCallbackUrl } from '@/lib/http/callback-url'
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const query = await searchParams
  return (
    <LoginClient
      callbackUrl={safeCallbackUrl(
        typeof query.callbackUrl === 'string' ? query.callbackUrl : null,
      )}
      initialError={Boolean(query.error)}
    />
  )
}
