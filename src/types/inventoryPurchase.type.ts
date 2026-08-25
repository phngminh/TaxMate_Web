export interface InventoryPurchaseLineRequest {
  productId?: string
  ingredientId?: string
  quantity: number
  totalValue: number
}

export interface CreateInventoryPurchaseRequest {
  expenseCategoryId: string
  expenseTitle: string
  purchaseDate: string
  supplierId?: string
  receiptImageUrl?: string
  note?: string
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
  note: string | null
  lines: InventoryPurchaseLineResponse[]
  createdAt: string
  updatedAt: string
}
