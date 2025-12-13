/** @type {import('next').NextConfig} */
const nextConfig = {
  // 啟用實驗性功能
  experimental: {
    // 可在此加入實驗性設定
  },
  // 圖片網域白名單（LINE 頭像等）
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'profile.line-scdn.net',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
