export interface InventoryPurchaseLineRequest {
  productId?: string
  ingredientId?: string
  quantity: number
  totalValue: number
}

export interface CreateInventoryPurchaseRequest {
  expenseCategoryId: string
  voucherNumber?: string
  expenseTitle: string
  purchaseDate: string
  paidDate: string
  paymentMethod: 'Cash'
  paymentAccountId: string
  supplierId?: string
  receiptImageUrl?: string
  note?: string
  lines: InventoryPurchaseLineRequest[]
}

export interface UpdateInventoryPurchaseRequest {
  expenseCategoryId: string
  voucherNumber?: string
  expenseTitle: string
  purchaseDate: string
  supplierId?: string
  receiptImageUrl?: string
  fileUrl?: string
  note?: string
  dueDate?: string
  paidDate?: string
  paymentMethod?: string
  paymentAccountId?: string
  lines: InventoryPurchaseLineRequest[]
}

export interface InventoryPurchaseLineResponse {
  productId: string | null
  ingredientId: string | null
  itemName: string
  unit: string | null
  quantity: number
  totalValue: number
}

export interface InventoryPurchaseResponse {
  expenseId: string
  businessId: string
  expenseCategoryId: string
  expenseCategoryName: string | null
  voucherNumber: string
  expenseTitle: string
  amount: number
  purchaseDate: string
  supplierId: string | null
  supplierName: string | null
  receiptImageUrl: string | null
  fileUrl: string | null
  note: string | null
  dueDate: string | null
  paidDate: string | null
  paymentMethod: string | null
  paymentAccountId: string | null
  lines: InventoryPurchaseLineResponse[]
  createdAt: string
  updatedAt: string
}
