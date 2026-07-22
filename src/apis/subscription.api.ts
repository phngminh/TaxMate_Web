import http from '../utils/http'
import type { ApiResponse } from '../types/common.type'
import type {
  SubscriptionPlanResponse,
  UserSubscriptionResponse,
  SubscribeRequest,
  SubscribeResponse,
  CreateSubscriptionPlanRequest,
  UpdateSubscriptionPlanRequest,
} from '../types/subscription.type'

export const getSubscriptionPlans = async () => {
  const response = await http.get<ApiResponse<SubscriptionPlanResponse[]>>('/Subscription/plans')
  return response.data
}

export const getCurrentSubscription = async (userId: string) => {
  const response = await http.get<ApiResponse<UserSubscriptionResponse>>(
    `/Subscription/user/${userId}/current`,
  )
  return response.data
}

export const subscribe = async (userId: string, body: SubscribeRequest) => {
  const response = await http.post<ApiResponse<SubscribeResponse>>(
    `/Subscription/user/${userId}/subscribe`,
    body,
  )
  return response.data
}

export const cancelAutoRenew = async (userId: string) => {
  const response = await http.post<ApiResponse<string>>(`/Subscription/user/${userId}/cancel-renew`)
  return response.data
}

export const cancelSubscription = async (userId: string) => {
  const response = await http.post<ApiResponse<string>>(`/Subscription/user/${userId}/cancel`)
  return response.data
}

export const getAllAdminPlans = async () => {
  const response = await http.get<ApiResponse<SubscriptionPlanResponse[]>>('/SubscriptionPlan')
  return response.data
}

export const getAdminPlanById = async (id: string) => {
  const response = await http.get<ApiResponse<SubscriptionPlanResponse>>(`/SubscriptionPlan/${id}`)
  return response.data
}

export const createPlan = async (body: CreateSubscriptionPlanRequest) => {
  const response = await http.post<ApiResponse<SubscriptionPlanResponse>>('/SubscriptionPlan', body)
  return response.data
}

export const updatePlan = async (id: string, body: UpdateSubscriptionPlanRequest) => {
  const response = await http.put<ApiResponse<SubscriptionPlanResponse>>(
    `/SubscriptionPlan/${id}`,
    body,
  )
  return response.data
}

export const togglePlanActive = async (id: string) => {
  const response = await http.patch<ApiResponse<SubscriptionPlanResponse>>(
    `/SubscriptionPlan/${id}/toggle-active`,
  )
  return response.data
}

export const deletePlan = async (id: string) => {
  const response = await http.delete<ApiResponse<null>>(`/SubscriptionPlan/${id}`)
  return response.data
}
