import http from '../utils/http'
import type { ApiResponse } from '../types/common.type'
import type { SubscriptionPlanResponse, UserSubscriptionResponse, SubscribeRequest, SubscribeResponse } from '../types/subscription.type'

export const getSubscriptionPlans = async () => {
  const response = await http.get<ApiResponse<SubscriptionPlanResponse[]>>('/Subscription/plans')
  return response.data
}

export const getCurrentSubscription = async (userId: string) => {
  const response = await http.get<ApiResponse<UserSubscriptionResponse>>(`/Subscription/user/${userId}/current`)
  return response.data
}

export const subscribe = async (userId: string, body: SubscribeRequest) => {
  const response = await http.post<ApiResponse<SubscribeResponse>>(`/Subscription/user/${userId}/subscribe`, body)
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