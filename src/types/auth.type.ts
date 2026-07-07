export type UserRole = 'Admin' | 'Owner'

export interface User {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  accountStatus: 'Active' | 'Inactive'
  role: UserRole
  taxCode?: string
  phone?: string
  hasProfileInfo: boolean
}

export interface AuthResponse {
  accessToken: string
  expiresAt: string
  requiresEmailVerification: boolean
  user: User
}

export interface LoginRequest {
  login: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  taxCode: string
  phone: string
  email: string
  password: string
}