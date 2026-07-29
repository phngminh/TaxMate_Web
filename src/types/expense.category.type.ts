export interface ExpenseCategory {
  expenseCategoryId: string
  businessId: string | null
  categoryName: string
  description: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseCategoryRequest {
  categoryName: string
  description?: string
}

export interface UpdateExpenseCategoryRequest {
  categoryName: string
  description?: string
}