export type S2cGroupCode = 'Labor' | 'PurchasedServices' | 'OtherDirect'

export interface ExpenseCategory {
  expenseCategoryId: string
  businessId: string | null
  categoryName: string
  description: string | null
  s2cGroupCode: S2cGroupCode | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseCategoryRequest {
  categoryName: string
  description?: string
  s2cGroupCode?: S2cGroupCode | null
}

export interface UpdateExpenseCategoryRequest {
  categoryName: string
  description?: string
  s2cGroupCode?: S2cGroupCode | null
}
