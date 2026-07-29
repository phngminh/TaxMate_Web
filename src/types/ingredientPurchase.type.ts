export interface IngredientPurchaseResponse {
  id: string
  businessId: string
  businessName: string
  ingredientId: string
  ingredientName: string
  ingredientUnit?: string
  quantity: number
  totalCost: number
  purchaseDate: string
  invoiceNumber?: string
  supplierId?: string
  supplierName?: string
  receiptImageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface CreateIngredientPurchaseRequest {
  ingredientId: string
  quantity: number
  totalCost: number
  purchaseDate: string
  invoiceNumber?: string
  supplierId?: string
  supplierName?: string
  receiptImageUrl?: string
}

export interface UpdateIngredientPurchaseRequest {
  ingredientId: string
  quantity: number
  totalCost: number
  purchaseDate: string
  invoiceNumber?: string
  supplierId?: string
  supplierName?: string
  receiptImageUrl?: string
}
