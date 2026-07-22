export interface Product {
  id: string
  name: string
  productCategoryId?: string
  description?: string
  unit?: string
  currentPrice?: number
  imageUrl?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface CreateProductRequest {
  name: string
  productCategoryId?: string
  description?: string
  unit?: string
  currentPrice?: number
  imageUrl?: string
}

export interface UpdateProductRequest {
  name: string
  productCategoryId?: string
  description?: string
  unit?: string
  currentPrice?: number
  imageUrl?: string
}

export interface ProductForm {
  name: string
  productCategoryId: string
  unit: string
  price: string
  description: string
  imagePreview?: string
  imageFile?: File
}