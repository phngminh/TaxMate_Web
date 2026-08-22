export type TaxDeclarationStatus =
  | 'Draft'
  | 'Submitted'

export interface TaxDeclarationLine {
  id: string
  businessId: string
  businessName: string
  businessActivityCode: string
  businessActivityName: string
  totalRevenue: number
  vatTaxableRevenue: number
  vatTaxRate: number
  vatTaxAmount: number
  personalIncomeTaxableRevenue: number
  personalIncomeTaxRate: number
  personalIncomeTaxAmount: number
}

export interface TaxDeclaration {
  id: string
  taxPeriodId: string
  taxCalculationId: string
  formCode: string
  declarationCode: string
  status: TaxDeclarationStatus
  taxpayerName: string
  taxCode: string
  taxpayerAddress: string
  totalRevenue: number
  totalVatTaxAmount: number
  totalPersonalIncomeTaxAmount: number
  totalTaxPayableAmount: number
  generatedAt: string
  submittedAt: string | null
  lines: TaxDeclarationLine[]
}
