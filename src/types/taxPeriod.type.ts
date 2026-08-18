export type TaxPeriodStatus =
  | 'Open'
  | 'Closed'
  | 'Calculated'
  | 'Submitted'
  | 'Paid'

export type TaxPeriodType =
  | 'Monthly'
  | 'Quarterly'
  | 'Yearly'

export type DataCheckStatus =
  | 'Good'
  | 'Warning'
  | 'NeedReview'

export interface TaxPeriodSummary {
  id: string
  businessId: string

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

  paidDate: string | null
}

export interface TaxPeriodDetail
  extends TaxPeriodSummary {
  salesRevenue: number
  otherRevenue: number

  vatTaxAmount: number
  personalIncomeTaxAmount: number

  totalExpense: number
  estimatedProfit: number

  transactionCount: number
  paidTransactionCount: number
  unpaidTransactionCount: number
  missingInvoiceCount: number
  expenseCount: number

  dataCheckStatus: DataCheckStatus

  closedAt: string | null
  calculatedAt: string | null
  submittedAt: string | null
}

export interface TaxPeriodPreviewWarning {
  code: string
  message: string
}

export interface TaxPeriodPreview {
  taxPeriodId: string
  businessId: string

  status: TaxPeriodStatus

  salesRevenue: number
  otherRevenue: number
  totalRevenue: number
  taxableRevenue: number
  totalExpense: number

  transactionCount: number
  completedTransactionCount: number
  unpaidTransactionCount: number
  cancelledTransactionCount: number
  missingInvoiceCount: number
  expenseCount: number

  dataCheckStatus: DataCheckStatus

  canClose: boolean

  warnings: TaxPeriodPreviewWarning[]
}

export interface CloseTaxPeriodResponse {
  taxPeriodId: string
  status: 'Closed'

  salesRevenue: number
  otherRevenue: number
  totalRevenue: number
  taxableRevenue: number

  closedAt: string
}

export interface TaxCalculationLine {
  id: string
  businessCategoryId: string

  sectionCode: string
  indicatorCode: string

  businessActivityCode: string
  businessActivityName: string

  totalRevenue: number

  vatTaxableRevenue: number
  zeroRatedVatRevenue: number

  vatTaxRate: number
  vatTaxAmount: number

  personalIncomeTaxableRevenue: number
  personalIncomeTaxDeductibleRevenue: number

  personalIncomeTaxRate: number
  personalIncomeTaxAmount: number

  vatNonTaxableRevenue: number
  personalIncomeTaxRevenue: number
}

export interface CalculateTaxPeriodResponse {
  taxPeriodId: string
  taxCalculationId: string

  version: number

  totalRevenue: number
  totalTaxableRevenue: number

  totalVatTaxAmount: number
  totalPersonalIncomeTaxAmount: number

  totalTaxBeforeExemption: number
  totalExemptionAmount: number
  totalTaxPayableAmount: number

  status: 'Calculated'
  calculatedAt: string

  lines: TaxCalculationLine[]
}