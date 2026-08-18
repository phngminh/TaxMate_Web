export type TaxDeclarationType =
  | 'Initial'
  | 'Supplement'

export type TaxDeclarationStatus =
  | 'Draft'
  | 'Submitted'

export interface CreateTaxDeclarationRequest {
  declarationType: TaxDeclarationType
  supplementNumber: number | null
}

export interface TaxDeclarationLine {
  id: string

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

export interface TaxDeclaration {
  id: string

  taxPeriodId: string
  taxCalculationId: string

  formCode: string
  declarationCode: string

  version: number

  declarationType: TaxDeclarationType
  supplementNumber: number | null

  status: TaxDeclarationStatus

  taxpayerName: string
  taxCode: string
  taxpayerAddress: string

  totalRevenue: number

  totalVatTaxAmount: number
  totalPersonalIncomeTaxAmount: number

  vatExemptionAmount: number
  personalIncomeTaxExemptionAmount: number

  vatPayableAmount: number
  personalIncomeTaxPayableAmount: number

  totalTaxPayableAmount: number

  generatedAt: string
  submittedAt: string | null

  lines: TaxDeclarationLine[]
}

export interface ExportedTaxDeclarationDocument {
  blob: Blob
  fileName: string
}