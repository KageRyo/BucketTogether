/**
 * LINE Login 設定
 * 
 * 設定步驟：
 * 1. 前往 LINE Developers Console: https://developers.line.biz/
 * 2. 建立 Provider 和 Channel (LINE Login)
 * 3. 在 Channel 設定中加入 Callback URL: {YOUR_DOMAIN}/api/auth/callback/line
 * 4. 複製 Channel ID 和 Channel Secret 到 .env.local
 */

export const lineConfig = {
  clientId: process.env.LINE_CHANNEL_ID!,
  clientSecret: process.env.LINE_CHANNEL_SECRET!,
  scope: 'profile openid email',
  authorizationUrl: 'https://access.line.me/oauth2/v2.1/authorize',
  tokenUrl: 'https://api.line.me/oauth2/v2.1/token',
  profileUrl: 'https://api.line.me/v2/profile',
}

/**
 * 產生 LINE 授權 URL
 */
export function getLineAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: lineConfig.clientId,
    redirect_uri: redirectUri,
    state: state,
    scope: lineConfig.scope,
  })

  return `${lineConfig.authorizationUrl}?${params.toString()}`
}
