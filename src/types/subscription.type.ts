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