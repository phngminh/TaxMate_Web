import type { QttOffsetAllocationItemRequest } from './taxBook.type'

export interface TknTaxPeriodPreview {
  taxPeriodId: string
  year: number
  windowStart: string
  windowEnd: string
  dueDate: string | null
  totalRevenue: number
  revenueGroupCount: number
  canClose: boolean
  warnings: string[]
}

export interface CloseTknTaxPeriodRequest {
  confirmWarnings: boolean
}

export interface CloseTknTaxPeriodResponse {
  taxPeriodId: string
  status: 'Closed'
  totalRevenue: number
  closedAt: string
}

export interface TknTaxCalculationResponse {
  taxPeriodId: string
  taxCalculationId: string
  version: number
  totalRevenue: number
  applicableRevenueThreshold: number
  recommendedFormCode: '01/TKN-CNKD'
  calculatedAt: string
}

export type TknQttBridgeChoice =
  | 'Later'
  | 'Refund'
  | 'Offset'

export interface TknQttBridgeIssue {
  code: string
  message: string
  businessId: string | null
  sourceId: string | null
}

export interface TknQttNextStep {
  tknTaxPeriodId: string
  taxYear: number
  annualRevenue: number
  incomeBasedPitPaid: number
  eligibility: string
  requiresPaymentSourceReview: boolean
  canCreateQttDraft: boolean
  choices: TknQttBridgeChoice[]
  blockingIssues: TknQttBridgeIssue[]
  selectedChoice: TknQttBridgeChoice | null
  selectedChoiceAt: string | null
  qttTaxPeriodId: string | null
  qttDeclarationId: string | null
  qttDeclarationStatus: string | null
  qttDraftRevision: number | null
}

export interface ApplyTknQttNextStepRequest {
  choice: TknQttBridgeChoice
  refundPaymentAccountId: string | null
  offsetItems: QttOffsetAllocationItemRequest[]
}
