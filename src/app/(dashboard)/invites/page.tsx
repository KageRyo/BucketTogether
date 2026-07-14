import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { InvitesClient } from '@/components/invites/invites-client'
import { authOptions } from '@/lib/auth'
import { getDataRepository } from '@/lib/data'

export default async function InvitesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const invites = await getDataRepository().listPendingInvites(session.user.id)
  return <InvitesClient initialInvites={invites} />
}
