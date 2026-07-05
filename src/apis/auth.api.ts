import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types/auth.type'
import http from '../utils/http'

export const login = async (body: LoginRequest) => {
  const response = await http.post<AuthResponse>('/Auth/login',body)
  return response.data
}

export const me = async () => {
  const response = await http.get<User>('/Auth/me')
  return response.data
}

export interface GoogleLoginRequest {
  idToken: string
}

export const loginWithGoogle = async (idToken: string) => {
  const response = await http.post('/Auth/google', {idToken})
  return response.data
}

export const register = async (body: RegisterRequest) => {
  const response = await http.post<AuthResponse>('/Auth/register', body)
  return response.data
}