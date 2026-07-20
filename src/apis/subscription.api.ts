import type { ApiResponse } from '../types/common.type'
import type { SubscriptionPlan, UserSubscription, SubscribeRequest, SubscribeResponse } from '../types/subscription.type'
import http from '../utils/http'

export const getPlans = async () => {
  const response = await http.get<ApiResponse<SubscriptionPlan[]>>('/Subscription/plans')
  return response.data
}

export const getCurrentSubscription = async (userId: string) => {
  const response = await http.get<ApiResponse<UserSubscription | null>>(`/Subscription/user/${userId}/current`)
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

export const cancelSubscriptionImmediately = async (userId: string) => {
  const response = await http.post<ApiResponse<string>>(`/Subscription/user/${userId}/cancel`)
  return response.data
}
