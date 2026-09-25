export interface IncomeCategory {
  incomeCategoryId: string
  businessId?: string
  categoryName: string
  description?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateIncomeCategoryRequest {
  categoryName: string
  description?: string
}

export type IncomeAccountingType = 'BusinessRevenue' | 'NonRevenueCashIn'

export interface IncomeDTO {
  incomeId: string
  businessId: string
  incomeCategoryId: string
  categoryName: string
  incomeTitle: string
  amount: number
  incomeDate: string
  accountingType?: IncomeAccountingType
  paymentMethod?: string
  paymentAccountId?: string
  receiptImageUrl?: string
  note?: string
  fileUrl?: string
  dueDate?: string
  receivedDate?: string
  createdAt: string
  updatedAt: string
}

export interface CreateIncomeRequest {
  incomeCategoryId: string
  incomeTitle: string
  amount: number
  incomeDate: string
  accountingType: IncomeAccountingType
  paymentMethod?: string
  paymentAccountId?: string
  receiptImageUrl?: string
  note?: string
  fileUrl?: string
  dueDate?: string
  receivedDate?: string
}

export interface UpdateIncomeRequest extends CreateIncomeRequest {}

export interface IncomeSummaryDTO {
  totalAmount: number
  month: number
  year: number
}
