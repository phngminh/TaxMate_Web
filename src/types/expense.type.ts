export type S2cGroupCode = 'Labor' | 'PurchasedServices' | 'OtherDirect'

export interface ExpenseCategory {
  expenseCategoryId: string
  businessId: string
  categoryName: string
  description?: string
  s2cGroupCode?: S2cGroupCode | null
  createdAt?: string
}

export interface CreateExpenseCategoryRequest {
  categoryName: string
  description?: string
  s2cGroupCode?: S2cGroupCode | null
}

export interface ExpenseDTO {
  expenseId: string
  expenseCategoryId: string
  categoryName: string
  expenseTitle: string
  amount: number
  expenseDate: string
  paymentMethod?: string
  receiptImageUrl?: string
  note?: string
  fileUrl?: string
  dueDate?: string
  paidDate?: string
  supplierId?: string
  supplierName?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateExpenseRequest {
  expenseCategoryId: string
  expenseTitle: string
  amount: number
  expenseDate: string
  paymentMethod?: string | null
  paymentAccountId?: string | null
  receiptImageUrl?: string | null
  note?: string | null
  fileUrl?: string | null
  dueDate?: string | null
  paidDate?: string | null
  supplierId?: string | null
}

export interface UpdateExpenseRequest {
  expenseCategoryId: string
  expenseTitle: string
  amount: number
  expenseDate: string
  paymentMethod?: string | null
  paymentAccountId?: string | null
  receiptImageUrl?: string | null
  note?: string | null
  fileUrl?: string | null
  dueDate?: string | null
  paidDate?: string | null
  supplierId?: string | null
}

export interface ExpenseSummaryDTO {
  totalExpense: number
  categorySummaries: {
    categoryId: string
    categoryName: string
    amount: number
    percentage: number
  }[]
}
