export type TaxMethod = 'RevenueBased' | 'IncomeBased'
export type RevenueBracket =
  | 'AtOrBelow1B'
  | 'Over1BTo3B'
  | 'Over3BTo50B'

export interface RevenueThresholdReview {
  alertId: string
  year: number
  quarter: number
  thresholdCode: string
  thresholdAmount: number
  currentAnnualRevenue: number
  status: string
  canConfirm: boolean
  canDismiss: boolean
  requiredTaxMethod: TaxMethod | null
  allowedTaxMethods: TaxMethod[]
  appliesFromYear: number
  isOutsideSupportedScope: boolean
  message: string
}

export interface OwnerTaxProfile {
  businessId: string
  declaredRevenueBracket: RevenueBracket | null
  personalIncomeTaxMethod: TaxMethod | null
  taxMethodEffectiveYear: number | null
  commencementPeriod: string | null
  commencementTaxYear: number | null
  confirmedAt: string | null
  isConfigured: boolean
  isMethodLocked: boolean
  lockedThroughYear: number | null
  thresholdReviews: RevenueThresholdReview[]
}

export interface UpdateOwnerTaxProfileRequest {
  declaredRevenueBracket: RevenueBracket
  personalIncomeTaxMethod?: TaxMethod
  commencementPeriod?: string
  commencementTaxYear?: number
  confirmed: true
}
