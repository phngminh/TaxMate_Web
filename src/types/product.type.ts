export interface Product {
  id: string
  name: string
  productCategory?: string
  category: string
  description?: string
  unit?: string
  currentPrice?: number
  imageUrl?: string
  status: 'active' | 'inactive'
}

export interface CreateProductRequest {
  name: string
  productCategory?: string
  description?: string
  unit?: string
  currentPrice?: number
  imageUrl?: string
}

export interface UpdateProductRequest {
  name: string
  productCategory?: string
  description?: string
  unit?: string
  currentPrice?: number
  imageUrl?: string
}