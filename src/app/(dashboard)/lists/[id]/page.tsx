import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { ListDetailClient } from '@/components/lists/list-detail-client'
import { authOptions } from '@/lib/auth'
import { getDataRepository, type ListDetails } from '@/lib/data'

interface ListDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ListDetailPage({ params }: ListDetailPageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  let list: ListDetails
  try {
    list = await getDataRepository().getList(session.user.id, id)
  } catch {
    notFound()
  }

  return <ListDetailClient initialList={list} />
}
