export interface ProductCategory {
  id: string
  businessId: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateProductCategoryRequest {
  name: string
  description?: string
}

export interface UpdateProductCategoryRequest {
  name: string
  description?: string
}