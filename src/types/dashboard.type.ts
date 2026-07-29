export interface MomCountMetric {
  currentMonth: number
  lastMonth: number
  deltaPercent: number | null
}

export interface MomRevenueMetric {
  currentMonth: number
  lastMonth: number
  deltaPercent: number | null
}

export interface MonthlyTrendPoint {
  year: number
  month: number
  monthLabel: string
  value: number
}

export interface SubscriptionTrendResponse {
  points: MonthlyTrendPoint[]
}

export interface BusinessUserTrendResponse {
  points: MonthlyTrendPoint[]
}

export interface PackageDistributionItem {
  planId: string
  planName: string
  count: number
}

export interface MonthlyPackageDistribution {
  year: number
  month: number
  monthLabel: string
  packages: PackageDistributionItem[]
}

export interface ServicePackageDistributionResponse {
  months: MonthlyPackageDistribution[]
}

export interface PackageRevenueItem {
  planId: string
  planName: string
  subscriptionCount: number
  revenue: number
}

export interface PackageRevenueResponse {
  year: number
  month: number
  monthLabel: string
  totalRevenue: number
  packages: PackageRevenueItem[]
}

export interface ChatMessageCount {
  total: number
}

export interface UserConversionStage {
  planId: string | null
  label: string
  count: number
  percent: number
}

export interface UserConversionResponse {
  totalUsers: number
  stages: UserConversionStage[]
}
