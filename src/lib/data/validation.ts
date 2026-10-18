import { createHash, randomBytes } from 'node:crypto'
import { DataError } from './errors'
import type { CreateItemInput, UpdateItemInput, OAuthProfile, MemberRole } from './types'

export function requiredText(value: string, label: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new DataError('VALIDATION_ERROR', `${label}為必填，且不得超過 ${maxLength} 個字`)
  }
  return value.trim()
}
export function validateColor(color: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(color))
    throw new DataError('VALIDATION_ERROR', '請使用六位十六進位色碼')
  return color
}
export function validateRole(role: string): asserts role is Exclude<MemberRole, 'owner'> {
  if (role !== 'editor' && role !== 'viewer')
    throw new DataError('VALIDATION_ERROR', '邀請角色不正確')
}
export function validateItem(input: CreateItemInput | UpdateItemInput) {
  if (input.priority != null && !['low', 'medium', 'high'].includes(input.priority))
    throw new DataError('VALIDATION_ERROR', '優先級不正確')
  if (
    input.dueDate != null &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) ||
      !Number.isFinite(Date.parse(input.dueDate)) ||
      new Date(input.dueDate).toISOString().slice(0, 10) !== input.dueDate)
  ) {
    throw new DataError('VALIDATION_ERROR', '日期不正確')
  }
  if (input.description && input.description.length > 10000)
    throw new DataError('VALIDATION_ERROR', '描述不得超過 10000 字')
}
export function validateProfile(profile: OAuthProfile) {
  if (!['line', 'discord', 'google'].includes(profile.provider))
    throw new DataError('VALIDATION_ERROR', '不支援的登入方式')
  requiredText(profile.providerAccountId, '登入識別碼', 255)
  requiredText(profile.displayName, '顯示名稱', 255)
}
export function checkVersion(version: number, expected: number) {
  if (!Number.isSafeInteger(expected) || expected < 1)
    throw new DataError('VALIDATION_ERROR', '缺少有效的資料版本')
  if (version !== expected)
    throw new DataError('CONFLICT', '資料已被其他人更新，請重新載入後確認再儲存')
}
export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
export function newInviteSecret() {
  const token = randomBytes(32).toString('base64url')
  return {
    token,
    tokenHash: tokenHash(token),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  }
}
