export interface Product {
  id: string
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
  name: string
  category?: string
  description?: string
  unit?: string
  currentPrice?: number
  imageUrl?: string
}

export interface UpdateProductRequest {
  name: string
  category?: string
  description?: string
  unit?: string
  currentPrice?: number
  imageUrl?: string
}