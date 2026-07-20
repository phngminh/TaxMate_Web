export interface PlanFeature {
  id: string
  featureKey: string
  featureName: string
  isEnabled: boolean
}

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  monthlyPrice: number
  annualPrice: number
  maxProducts?: number
  maxTransactionsPerMonth?: number
  isActive: boolean
  sortOrder: number
  features: PlanFeature[]
}

export interface UserSubscription {
  id: string
  userId: string
  userFullName: string
  subscriptionPlanId: string
  subscriptionPlanName: string
  startDate: string
  endDate?: string
  status: string
  billingCycle: string
  autoRenew: boolean
  paymentStatus: string
  checkoutUrl?: string
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