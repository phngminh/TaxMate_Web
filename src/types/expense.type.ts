export interface ExpenseCategory {
  expenseCategoryId: string
  businessId?: string
  categoryName: string
  description?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface ExpenseDTO {
  expenseId: string
  businessId: string
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
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseRequest {
  expenseCategoryId: string
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
}

export interface UpdateExpenseRequest extends CreateExpenseRequest {}

export interface ExpenseSummaryDTO {
  totalAmount: number
  month: number
  year: number
}
