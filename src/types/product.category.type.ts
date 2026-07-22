export interface ProductCategory {
  id: string
  businessId: string
  name: string
  description?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateProductCategoryRequest {
  name: string
  description?: string
  sortOrder?: number
}

export interface UpdateProductCategoryRequest {
  name: string
  description?: string
  sortOrder?: number
}