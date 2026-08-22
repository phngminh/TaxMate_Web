export type TaxPeriodType =
  | 'Quarterly'
  | 'Monthly'

export type TaxPeriodStatus =
  | 'Open'
  | 'Closed'
  | 'Calculated'
  | 'Submitted'

export type TaxPitMethod =
  | 'RevenueBased'
  | 'IncomeBased'
  | null

export interface TaxPeriodBusinessRevenue {
  businessId: string
  businessName: string
  revenue: number
}

export interface TaxPeriodSummary {
  id: string
  ownerId: string
  periodType: TaxPeriodType
  year: number
  month: number | null
  quarter: number | null
  periodStartDate: string
  periodEndDate: string
  dueDate: string | null
  status: TaxPeriodStatus
  totalRevenue: number
  taxableRevenue: number
  estimatedTax: number
  taxAmountDebt: number
  filingFrequency: 'Quarterly' | 'Monthly' | 'None'
  canDeclare: boolean
}

export interface TaxPeriodDetail extends TaxPeriodSummary {
  salesRevenue: number
  otherRevenue: number
  vatTaxAmount: number
  personalIncomeTaxAmount: number
  totalExpense: number
  estimatedProfit: number
  transactionCount: number
  businesses: TaxPeriodBusinessRevenue[]
  pitMethod: TaxPitMethod
  pitMethodLocked: boolean
}
