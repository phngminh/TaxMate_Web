export interface ProductPrice {
  id: string
  productId: string
  price: number
  applyDate: string
  createdAt: string
  updatedAt: string
}

export interface CreateProductPriceRequest {
  price: number
  applyDate: string
}

export interface UpdateProductPriceRequest {
  price: number
  applyDate: string
}