import http from '../utils/http'

export type UserRole = 'Admin' | 'Owner'

export interface User {
  id: string
  email: string
  role: UserRole
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

export const login = async (body: LoginRequest) => {
  const response = await http.post<AuthResponse>('/api/auth/login',body)
  return response.data
}

export const me = async () => {
  const response = await http.get<User>('/api/auth/me')
  return response.data
}