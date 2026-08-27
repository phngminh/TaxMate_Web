export interface S2bBlocker {
  code: string
  businessId: string
  sourceId: string
  message: string
}

export interface S2bRevenueGroup {
  businessCategoryId: string
  businessCategoryCode: string
  businessCategoryName: string
  vatRate: number
  completedTransactionRevenue: number
  manualBusinessRevenue: number
  totalRevenue: number
  vatAmount: number
}

export interface S2bRevenueLine {
  businessCategoryId: string
  businessCategoryCode: string
  sourceId: string
  sourceType: 'Transaction' | 'ManualIncome'
  documentNumber: string
  documentDate: string
  description: string
  amount: number
}

export interface S2bBook {
  ownerId: string
  startNaiveUtc: string
  endExclusiveNaiveUtc: string
  completedTransactionRevenue: number
  manualBusinessRevenue: number
  totalRevenue: number
  groups: S2bRevenueGroup[]
  lines: S2bRevenueLine[]
  blockers: S2bBlocker[]
  isValid: boolean
}

export type S2cExpenseGroupCode = 'Labor' | 'PurchasedServices' | 'OtherDirect'

export interface S2cExpenseLine {
  expenseId: string
  voucherNumber: string
  expenseDate: string
  expenseTitle: string
  categoryName: string
  groupCode: S2cExpenseGroupCode
  amount: number
  hasEvidence: boolean
}

export interface S2cBookWarning {
  code: string
  message: string
  sourceId: string | null
  canOverride: boolean
}

export interface S2cBook {
  businessId: string
  periodStart: string
  periodEndExclusive: string
  totalRevenue: number
  materialCost: number
  laborCost: number
  purchasedServicesCost: number
  otherDirectCost: number
  excludedCashPaymentExpenseCount: number
  excludedCashPaymentExpenseAmount: number
  excludedInventoryCashCost: number
  evidenceReviewedAt: string | null
  evidenceReviewedByUserId: string | null
  totalExpense: number
  netIncome: number
  lines: S2cExpenseLine[]
  warnings: S2cBookWarning[]
  isReady: boolean
}

export interface InventoryBookBlocker {
  code: string
  message: string
  productId: string | null
  ingredientId: string | null
  inventoryMovementId: string | null
}

export interface S2dBookLine {
  inventoryMovementId: string
  documentDate: string
  documentNumber: string
  description: string
  movementType: string
  referenceId: string | null
  inboundUnitValue: number | null
  inboundQuantity: number | null
  inboundValue: number | null
  outboundUnitValue: number | null
  outboundQuantity: number | null
  outboundValue: number | null
  runningQuantity: number
  runningValue: number
  isProvisionalValue: boolean
}

export interface S2dItemBook {
  productId: string | null
  ingredientId: string | null
  itemCode: string
  itemName: string
  unit: string | null
  isDeleted: boolean
  openingQuantity: number
  openingValue: number
  totalInboundQuantity: number
  totalInboundValue: number
  totalOutboundQuantity: number
  totalOutboundValue: number
  endingQuantity: number
  endingValue: number
  wholePeriodAverageUnitValue: number | null
  lines: S2dBookLine[]
}

export interface S2dBook {
  businessId: string
  periodStart: string
  periodEndExclusive: string
  isProvisional: boolean
  canFinalize: boolean
  items: S2dItemBook[]
  blockers: InventoryBookBlocker[]
}

export interface S2eBlocker {
  code: string
  message: string
  paymentAccountId: string | null
  referenceId: string | null
}

export interface S2eBookEntry {
  moneyMovementId: string
  movementDate: string
  documentNumber: string
  description: string
  amountIn: number
  amountOut: number
  referenceId: string
}

export interface S2eAccountSection {
  paymentAccountId: string
  accountType: 'Cash' | 'Bank'
  displayName: string
  isActive: boolean
  openingBalance: number
  totalIn: number
  totalOut: number
  endingBalance: number
  entries: S2eBookEntry[]
}

export interface S2eBook {
  businessId: string
  fromInclusive: string
  toExclusive: string
  openingBalance: number
  totalIn: number
  totalOut: number
  endingBalance: number
  accounts: S2eAccountSection[]
  blockers: S2eBlocker[]
  isReady: boolean
}

export interface QttIssue {
  code: string
  message: string
  businessId: string | null
  sourceId: string | null
}

export interface QttIndicators {
  indicator09: number
  indicator09a: number
  indicator09b: number
  indicator09c: number
  indicator10: number
  indicator10a: number
  indicator10b: number
  indicator10c: number
  indicator10d: number
  indicator10LoanInterest: number
  indicator10e: number
  indicator11: number
  indicator12Rate: number
  indicator13: number
  indicator14: number
  indicator15: number
  indicator16: number
  indicator17: number
  indicator18: number
  indicator19: number
  indicator20: number
  indicator21: number
  indicator22: number
  indicator23: number
  indicator24: number
}

export interface QttInventoryTotals {
  indicator31: number
  indicator32: number
  indicator33: number
  indicator34: number
}

export interface QttPreview {
  taxYear: number
  eligibility: string
  warnings: QttIssue[]
  hardBlockers: QttIssue[]
  canClose: boolean
}

export interface QttCalculationPreview {
  taxYear: number
  eligibility: string
  indicators: QttIndicators
  inventoryTotals: QttInventoryTotals
  applicableRateReason: string
  outcome: 'Payable' | 'Overpaid' | 'Zero'
  dueDate: string
  warnings: QttIssue[]
}

export interface QttCalculationResponse {
  taxPeriodId: string
  calculationId: string
  version: number
  calculation: QttCalculationPreview
}

export interface QttRefundAccount {
  paymentAccountId: string
  accountName: string
  accountNumber: string
  bankName: string
}

export interface QttOffsetItem {
  sourceObligationId: string | null
  taxCode: string
  taxpayerName: string
  obligationIdentifier: string
  budgetContent: string
  chapterCode: string | null
  subsectionCode: string | null
  collectingAuthority: string | null
  administrativeAreaCode: string | null
  dueDate: string | null
  outstandingAmount: number
  offsetAmount: number
  remainingAmount: number
}

export interface QttDeclaration {
  declarationId: string
  taxPeriodId: string
  calculationId: string
  declarationCode: string
  version: number
  draftRevision: number
  status: 'Draft' | 'Generated' | 'Submitted'
  taxpayerName: string
  taxCode: string
  indicators: QttIndicators
  inventoryTotals: QttInventoryTotals
  refundAccount: QttRefundAccount | null
  offsetItems: QttOffsetItem[]
}

export interface QttOffsetObligationOption {
  obligationId: string
  declarationCode: string
  taxCode: string
  taxpayerName: string
  budgetContent: string
  chapterCode: string | null
  subsectionCode: string | null
  collectingAuthority: string | null
  administrativeAreaCode: string | null
  dueDate: string | null
  outstandingAmount: number
}

export interface QttOffsetAllocationItemRequest {
  taxDeclarationObligationId?: string
  taxCode?: string
  taxpayerName?: string
  obligationIdentifier?: string
  budgetContent?: string
  chapterCode?: string
  subsectionCode?: string
  collectingAuthority?: string
  administrativeAreaCode?: string
  dueDate?: string
  outstandingAmount: number
  offsetAmount: number
}

export interface UpdateQttAllocationRequest {
  refundAmount: number
  offsetAmount: number
  refundPaymentAccountId?: string
  offsetItems: QttOffsetAllocationItemRequest[]
  expectedRevision: number
}
