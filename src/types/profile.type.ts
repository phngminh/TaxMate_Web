export interface BusinessProfile {
  id: string
  ownerId: string
  businessName: string
  provinceCode?: string
  wardCode?: string
  address?: string
  mainCategoryId?: string
  mainCategoryName?: string
  preferElectronicInvoice: boolean
  isStockTrackingEnabled?: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateBusinessProfileRequest {
  ownerId: string
  businessName: string
  provinceCode?: string
  wardCode?: string
  address?: string
  mainCategoryId?: string
  preferElectronicInvoice: boolean
  isStockTrackingEnabled?: boolean
}

export interface UpdateBusinessProfileRequest {
  businessName: string
  provinceCode?: string
  wardCode?: string
  address?: string
  mainCategoryId?: string
  preferElectronicInvoice: boolean
  isStockTrackingEnabled?: boolean
}

export interface ToggleStockTrackingRequest {
  isStockTrackingEnabled: boolean
  reconciliation?: import('./inventory.type').ReconcileInventoryRequest
}
