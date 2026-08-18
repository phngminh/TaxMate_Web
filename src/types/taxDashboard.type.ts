export type TaxThresholdStatus =
  | 'NotRequired'
  | 'Required'

export type TaxQuarterApiStatus =
  | 'Completed'
  | 'Current'
  | 'Upcoming'

export interface TaxDashboardApiResponse {
  year: number

  threshold: {
    amount: number
    accumulatedRevenue: number
    remainingAmount: number
    progressPercentage: number
    status: TaxThresholdStatus
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

export interface TaxDashboardUiData {
  year: number

  warningMessage: string

  thresholdAmount: number
  accumulatedRevenue: number
  remainingAmount: number
  progressPercentage: number
  thresholdStatus: TaxThresholdStatus
  statusLabel: string

  forecastRevenue: number
  forecastBasedOn: string

  quarters: TaxQuarter[]
}