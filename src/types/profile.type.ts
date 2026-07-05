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
}

export interface UpdateBusinessProfileRequest {
  businessName: string
  provinceCode?: string
  wardCode?: string
  address?: string
  mainCategoryId?: string
  preferElectronicInvoice: boolean
}