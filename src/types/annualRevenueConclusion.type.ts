export interface AnnualRevenueConclusionIssue {
  code: string
  message: string
}

export interface AnnualRevenueConclusionQuarter {
  quarter: number
  taxPeriodId: string | null
  periodStatus: string | null
  isReady: boolean
}

export interface AnnualRevenueConclusionPreview {
  businessId: string
  taxYear: number
  annualRevenue: number
  revenueThreshold: number
  shouldShow: boolean
  canConfirm: boolean
  alreadyConfirmed: boolean
  currentRevenueBracket: string | null
  currentTaxMethod: string | null
  targetRevenueBracket: string
  requiredTaxMethod: 'RevenueBased' | 'IncomeBased' | null
  allowedTaxMethods: Array<'RevenueBased' | 'IncomeBased'>
  appliesFromYear: number
  quarters: AnnualRevenueConclusionQuarter[]
  blockingIssues: AnnualRevenueConclusionIssue[]
}
