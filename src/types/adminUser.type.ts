import type { AccountStatus, UserRole } from './auth.type'
import type { BusinessProfile } from './profile.type'

export interface AdminUserListItem {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  accountStatus: AccountStatus
  role: UserRole
  taxCode?: string
  phone?: string
  hasProfileInfo: boolean
  businessProfileCount: number
  createdAt: string
}

export interface AdminUserDetail {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  accountStatus: AccountStatus
  role: UserRole
  taxCode?: string
  phone?: string
  hasProfileInfo: boolean
  createdAt: string
  updatedAt: string
  businessProfiles: BusinessProfile[]
}

export interface GetUsersParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  role?: string
  accountStatus?: string
}
