import type {
  AppUser,
  CreateItemInput,
  CreateListInput,
  ItemPriority,
  ListCategory,
  ListDetails,
  ListItem,
  ListMemberView,
  ListSummary,
  MemberRole,
  PendingInvite,
  UpdateItemInput,
  UpdateListInput,
} from './types'

export interface DataRepository {
  authenticateCredentials(email: string, password: string): Promise<AppUser | null>
  upsertLineUser(profile: {
    lineId: string
    displayName: string
    pictureUrl?: string | null
    email?: string | null
  }): Promise<AppUser>
  getUserById(userId: string): Promise<AppUser | null>
  listLists(userId: string): Promise<ListSummary[]>
  createList(userId: string, input: CreateListInput): Promise<ListDetails>
  getList(userId: string, listId: string): Promise<ListDetails>
  updateList(userId: string, listId: string, input: UpdateListInput): Promise<ListDetails>
  deleteList(userId: string, listId: string): Promise<void>
  createCategory(userId: string, listId: string, name: string, color?: string): Promise<ListCategory>
  updateCategory(userId: string, listId: string, categoryId: string, input: { name?: string; color?: string }): Promise<ListCategory>
  deleteCategory(userId: string, listId: string, categoryId: string): Promise<void>
  listItems(userId: string, listId: string): Promise<ListItem[]>
  createItem(userId: string, listId: string, input: CreateItemInput): Promise<ListItem>
  updateItem(userId: string, listId: string, itemId: string, input: UpdateItemInput): Promise<ListItem>
  deleteItem(userId: string, listId: string, itemId: string): Promise<void>
  inviteMember(userId: string, listId: string, email: string, role: Exclude<MemberRole, 'owner'>): Promise<ListMemberView>
  listMembers(userId: string, listId: string): Promise<ListMemberView[]>
  updateMemberRole(userId: string, listId: string, membershipId: string, role: Exclude<MemberRole, 'owner'>): Promise<ListMemberView>
  removeMember(userId: string, listId: string, membershipId: string): Promise<void>
  listPendingInvites(userId: string): Promise<PendingInvite[]>
  respondToInvite(userId: string, inviteId: string, action: 'accept' | 'reject'): Promise<void>
}

export const ITEM_PRIORITIES: ItemPriority[] = ['low', 'medium', 'high']
export const INVITABLE_ROLES: Array<Exclude<MemberRole, 'owner'>> = ['editor', 'viewer']
