export const TAX_THRESHOLD_TYPES = {
  ANNUAL_REVENUE_TAX: 'AnnualRevenueTax',
  E_INVOICE_REQUIREMENT: 'EInvoiceRequirement',
} as const

export type TaxThresholdType =
  (typeof TAX_THRESHOLD_TYPES)[keyof typeof TAX_THRESHOLD_TYPES]

export interface TaxThresholdSetting {
  id: string
  type: TaxThresholdType
  amount: number
  effectiveFrom: string
  updatedByUserId?: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateTaxThresholdSettingRequest {
  amount: number
  effectiveFrom: string
}
