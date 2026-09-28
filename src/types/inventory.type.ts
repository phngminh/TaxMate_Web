export interface InventoryControlItem {
  productId: string | null
  ingredientId: string | null
  name: string
  unit: string | null
  currentQuantity: number
  currentUnitValue: number | null
}

export interface InventoryInitializationPreview {
  version: string
  businessId: string
  isInitialized: boolean
  isStockTrackingEnabled: boolean
  items: InventoryControlItem[]
}

export interface InventoryOpeningLineRequest {
  productId?: string
  ingredientId?: string
  quantity: number
  totalValue?: number
}

export interface InventoryCountLineRequest {
  productId?: string
  ingredientId?: string
  actualQuantity: number
  adjustmentInTotalValue?: number
}

export interface InitializeInventoryRequest {
  occurredAt: string
  documentNumber: string
  description: string
  lines: InventoryOpeningLineRequest[]
}

export interface ReconcileInventoryRequest {
  expectedVersion: string
  documentNumber: string
  description: string
  lines: InventoryCountLineRequest[]
}

export interface InventoryControlResult {
  businessId: string
  isStockTrackingEnabled: boolean
  openingBalanceCount: number
  adjustmentInCount: number
  adjustmentOutCount: number
  items: InventoryControlItem[]
}
