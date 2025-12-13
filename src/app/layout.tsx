import type { Metadata } from 'next'
import { Providers } from '@/components'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'BucketTogether - 共享願望清單',
  description: '與你的另一半或好友一起規劃、追蹤並完成人生目標！',
  keywords: ['願望清單', '目標清單', 'bucket list', '情侶', '好友', '共享'],
  authors: [{ name: 'BucketTogether Team' }],
  openGraph: {
    title: 'BucketTogether - 共享願望清單',
    description: '與你的另一半或好友一起規劃、追蹤並完成人生目標！',
    locale: 'zh_TW',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <head>
        {/* Tocas UI CSS */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/tocas-ui/5.0.2/tocas.min.css"
        />
        {/* Tocas UI Icons */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/tocas-ui/5.0.2/icons.min.css"
        />
      </head>
      <body>
        <Providers>
          <div className="ts-app-layout is-full">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
