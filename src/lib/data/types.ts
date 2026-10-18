export type AppRole = 'admin' | 'user'
export type OAuthProvider = 'line' | 'discord' | 'google'
export type AuthProvider = 'credentials' | OAuthProvider | 'multiple'
export type MemberRole = 'owner' | 'editor' | 'viewer'
export type MembershipStatus = 'pending' | 'accepted'
export type ItemPriority = 'low' | 'medium' | 'high'

export interface AppUser {
  id: string
  email: string | null
  displayName: string
  pictureUrl: string | null
  role: AppRole
  authProvider: AuthProvider
  createdAt: string
  updatedAt: string
}

export interface StoredUser extends AppUser {
  passwordHash: string | null
}

export interface BucketList {
  version: number
  id: string
  title: string
  description: string | null
  coverImage: string | null
  ownerId: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface ListMembership {
  id: string
  listId: string
  userId: string
  role: MemberRole
  status: MembershipStatus
  invitedBy: string | null
  invitedAt: string
  joinedAt: string | null
}

export interface ListCategory {
  id: string
  listId: string
  name: string
  color: string
  order: number
  createdAt: string
}

export interface ListItem {
  version: number
  id: string
  listId: string
  categoryId: string | null
  title: string
  description: string | null
  isCompleted: boolean
  completedAt: string | null
  completedBy: string | null
  dueDate: string | null
  priority: ItemPriority | null
  order: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface LocalData {
  schemaVersion: 2
  identities: OAuthIdentity[]
  inviteLinks: StoredInviteLink[]
  users: StoredUser[]
  lists: BucketList[]
  memberships: ListMembership[]
  categories: ListCategory[]
  items: ListItem[]
}

export type EffectiveListRole = 'admin' | MemberRole

export interface ListSummary extends BucketList {
  isOwner: boolean
  memberRole: EffectiveListRole
  itemCount: number
  completedCount: number
}

export interface ListMemberView extends ListMembership {
  user: Pick<AppUser, 'id' | 'email' | 'displayName' | 'pictureUrl'>
}

export interface ListDetails extends BucketList {
  categories: ListCategory[]
  items: ListItem[]
  members: ListMemberView[]
  stats: {
    totalItems: number
    completedItems: number
    progress: number
  }
  currentUserRole: EffectiveListRole
  canManage: boolean
  canEditItems: boolean
}

export interface PendingInvite extends ListMembership {
  list: Pick<BucketList, 'id' | 'title' | 'description'>
  inviter: Pick<AppUser, 'id' | 'displayName' | 'pictureUrl'> | null
}

export interface CreateListInput {
  title: string
  description?: string | null
  categories?: Array<{ name: string; color?: string }>
}

export interface UpdateListInput {
  expectedVersion: number
  title?: string
  description?: string | null
}

export interface CreateItemInput {
  title: string
  description?: string | null
  categoryId?: string | null
  priority?: ItemPriority | null
  dueDate?: string | null
}

export interface UpdateItemInput {
  expectedVersion: number
  title?: string
  description?: string | null
  categoryId?: string | null
  priority?: ItemPriority | null
  dueDate?: string | null
  isCompleted?: boolean
}

export interface OAuthProfile {
  provider: OAuthProvider
  providerAccountId: string
  displayName: string
  pictureUrl?: string | null
  email?: string | null
}

export interface OAuthIdentity {
  userId: string
  provider: OAuthProvider
  providerAccountId: string
  createdAt: string
}

export interface InviteLink {
  id: string
  listId: string
  role: Exclude<MemberRole, 'owner'>
  createdBy: string
  createdAt: string
  expiresAt: string
  revokedAt: string | null
  acceptedAt: string | null
}

export interface StoredInviteLink extends InviteLink {
  tokenHash: string
}

export interface CreatedInviteLink extends InviteLink {
  token: string
}
export interface InvitePreview {
  title: string
  role: Exclude<MemberRole, 'owner'>
  expiresAt: string
}
