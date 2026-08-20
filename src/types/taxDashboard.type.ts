export type TaxThresholdStatus =
  | 'NotTaxable'
  | 'Taxable'

export type EInvoiceThresholdStatus =
  | 'NotRequired'
  | 'RequiredEInvoice'

export type TaxQuarterApiStatus =
  | 'Completed'
  | 'Current'
  | 'Upcoming'

export interface TaxDashboardBusinessRevenue {
  businessId: string
  businessName: string
  revenue: number
}

export interface TaxDashboardApiResponse {
  year: number

  threshold: {
    amount: number
    accumulatedRevenue: number
    remainingAmount: number
    progressPercentage: number
    status: TaxThresholdStatus
  }

  eInvoiceThreshold: {
    amount: number
    accumulatedRevenue: number
    remainingAmount: number
    progressPercentage: number
    status: EInvoiceThresholdStatus
  }

  forecast: {
    estimatedYearEndRevenue: number
    basedOnThroughQuarter: number
    label: string
  }

  quarters: {
    quarter: number
    revenue: number
    status: TaxQuarterApiStatus
  }[]

  businesses: TaxDashboardBusinessRevenue[]
}

export type TaxQuarterUiStatus =
  | 'normal'
  | 'in_progress'
  | 'upcoming'

export interface TaxQuarter {
  id: string
  name: string
  revenueText: string
  statusText: string
  status: TaxQuarterUiStatus
}

export interface TaxDashboardBusinessUi {
  businessId: string
  businessName: string
  revenue: number
}

export interface TaxDashboardUiData {
  year: number

  warningMessage: string

  thresholdAmount: number
  accumulatedRevenue: number
  remainingAmount: number
  progressPercentage: number
  thresholdStatus: TaxThresholdStatus
  statusLabel: string

  eInvoiceThresholdAmount: number
  eInvoiceRemainingAmount: number
  eInvoiceProgressPercentage: number
  eInvoiceStatus: EInvoiceThresholdStatus

  forecastRevenue: number
  forecastBasedOn: string

  quarters: TaxQuarter[]

  businesses: TaxDashboardBusinessUi[]
}
