import type { AuthResponse, LoginRequest, RegisterRequest, User, ForgotPasswordRequest, ResetPasswordRequest, VerifyResetPasswordOtpRequest } from '../types/auth.type'
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

export const resendProfileEmail = async () => {
  const response = await http.post('/Auth/profile/resend-email')
  return response.data
}

export const forgotPassword = async (body: ForgotPasswordRequest) => {
  const response = await http.post('/Auth/forgot-password', body)
  return response.data
}

export const verifyForgotPasswordOtp = async (body: VerifyResetPasswordOtpRequest) => {
  const response = await http.post('/Auth/forgot-password/verify', body)
  return response.data
}

export const resetPassword = async (body: ResetPasswordRequest) => {
  const response = await http.post('/Auth/reset-password', body)
  return response.data
}

export const resendForgotPasswordOtp = async (body: ForgotPasswordRequest) => {
  const response = await http.post('/Auth/forgot-password/resend', body)
  return response.data
}

export const resend = async (email: string) => {
  const response = await http.post('/Auth/resend-verification-email', { email })
  return response.data
}