export interface Product {
  id: string
  productCode: string
  name: string
  productCategoryId?: string
  description?: string
  unit?: string
  currentPrice?: number
  costPrice?: number
  stockQuantity?: number
  imageUrl?: string
  status: string
  hasRecipe: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductRequest {
  productCode: string
  name: string
  productCategoryId?: string
  description?: string
  unit?: string
  currentPrice?: number
  imageUrl?: string
}

export interface UpdateProductRequest {
  productCode: string
  name: string
  productCategoryId?: string
  description?: string
  unit?: string
  currentPrice?: number
  imageUrl?: string
}

export interface ProductForm {
  productCode: string,
  name: string
  productCategoryId: string
  unit: string
  price: string
  description: string
  imagePreview?: string
  imageFile?: File
}