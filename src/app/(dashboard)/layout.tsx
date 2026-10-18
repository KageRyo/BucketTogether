import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import Image from 'next/image'
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link href="/dashboard" className="app-brand">
          BucketTogether
        </Link>
        <nav aria-label="主要導覽">
          <Link href="/dashboard">首頁</Link>
          <Link href="/lists">我的清單</Link>
          <Link href="/lists/new">建立清單</Link>
          <Link href="/invites">邀請通知</Link>
          <Link href="/settings">設定</Link>
          <Link href="/api/auth/signout">登出</Link>
        </nav>
        <div className="app-profile">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt=""
              width={32}
              height={32}
              style={{ borderRadius: '50%' }}
            />
          )}
          <span>{session.user.name}</span>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  )
}
