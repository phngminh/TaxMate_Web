export interface Product {
  id: string
  productCode: string
  name: string
  category?: string
  description?: string
  unit?: string
  currentPrice?: number
  imageUrl?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface CreateProductRequest {
  productCode: string
  name: string
  category?: string
  description?: string
  unit?: string
  currentPrice?: number
  imageUrl?: string
}

export interface UpdateProductRequest {
  productCode: string
  name: string
  category?: string
  description?: string
  unit?: string
  currentPrice?: number
  imageUrl?: string
}