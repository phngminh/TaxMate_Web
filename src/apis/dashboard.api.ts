import type { ApiResponse } from '../types/common.type'
import type {
  BusinessUserTrendResponse,
  ChatMessageCount,
  MomCountMetric,
  MomRevenueMetric,
  PackageRevenueResponse,
  ServicePackageDistributionResponse,
  SubscriptionTrendResponse,
  UserConversionResponse
} from '../types/dashboard.type'
import http from '../utils/http'

export const getActiveBusinesses = async () => {
  const response = await http.get<ApiResponse<MomCountMetric>>('/Dashboard/active-businesses')
  return response.data
}

export const getPaidSubscriptions = async () => {
  const response = await http.get<ApiResponse<MomCountMetric>>('/Dashboard/paid-subscriptions')
  return response.data
}

export const getMonthlyRevenue = async () => {
  const response = await http.get<ApiResponse<MomRevenueMetric>>('/Dashboard/monthly-revenue')
  return response.data
}

export const getSubscriptionTrend = async () => {
  const response = await http.get<ApiResponse<SubscriptionTrendResponse>>('/Dashboard/subscription-trend')
  return response.data
}

export const getServicePackageDistribution = async () => {
  const response = await http.get<ApiResponse<ServicePackageDistributionResponse>>(
    '/Dashboard/service-package-distribution'
  )
  return response.data
}

export const getPackageRevenue = async () => {
  const response = await http.get<ApiResponse<PackageRevenueResponse>>('/Dashboard/package-revenue')
  return response.data
}

export const getBusinessUserTrend = async () => {
  const response = await http.get<ApiResponse<BusinessUserTrendResponse>>('/Dashboard/business-user-trend')
  return response.data
}

export const getTodayChatMessages = async () => {
  const response = await http.get<ApiResponse<ChatMessageCount>>('/Dashboard/today-chat-messages')
  return response.data
}

export const getUserConversion = async () => {
  const response = await http.get<ApiResponse<UserConversionResponse>>('/Dashboard/user-conversion')
  return response.data
}
