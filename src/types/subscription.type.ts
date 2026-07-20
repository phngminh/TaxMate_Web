export interface PlanFeature {
  id: string
  name: string
  included: boolean
}

export interface Plan {
  id: string
  name: string
  price: number
  period: 'month' | 'year'
  description: string
  activeUsers: number
  features: PlanFeature[]
  isActive: boolean
}

export interface PlanFeatureResponse {
  id: string
  featureKey: string
  featureName: string
  isEnabled: boolean
}

export interface SubscriptionPlanResponse {
  id: string
  name: string
  description?: string
  monthlyPrice: number
  annualPrice: number
  maxProducts: number | null
  maxTransactionsPerMonth: number |null
  isActive: boolean
  sortOrder: number
  features: PlanFeatureResponse[]
}

export interface UserSubscriptionResponse {
  id: string
  userId: string
  userFullName: string
  subscriptionPlanId: string
  subscriptionPlanName: string
  startDate: string
  endDate?: string | null
  status: string
  billingCycle: string
  autoRenew: boolean
  paymentStatus: string
  checkoutUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface SubscribeRequest {
  subscriptionPlanId: string
  billingCycle: 'Monthly' | 'Annual'
  autoRenew: boolean
}

export interface SubscribeResponse {
  subscriptionId: string
  subscriptionPlanId: string
  planName: string
  amount: number
  status: string
  paymentStatus: string
  checkoutUrl: string
  orderCode: number
}