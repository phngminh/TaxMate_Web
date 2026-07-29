import type { ApiResponse } from '../types/common.type'
import type { ProductPrice, CreateProductPriceRequest, UpdateProductPriceRequest } from '../types/product.price.type'
import http from '../utils/http'

export const getProductPrices = async (productId: string) => {
  const response = await http.get<ApiResponse<ProductPrice[]>>(`/ProductPrice/product/${productId}`)
  return response.data
}

export const getProductPriceById = async (id: string) => {
  const response = await http.get<ApiResponse<ProductPrice>>(`/ProductPrice/${id}`)
  return response.data
}

export const createProductPrice = async (productId: string, body: CreateProductPriceRequest) => {
  const response = await http.post<ApiResponse<ProductPrice>>(`/ProductPrice/product/${productId}`, body)
  return response.data
}

export const updateProductPrice = async (id: string, body: UpdateProductPriceRequest) => {
  const response = await http.put<ApiResponse<ProductPrice>>(`/ProductPrice/${id}`, body)
  return response.data
}

export const deleteProductPrice = async (id: string) => {
  const response = await http.delete<ApiResponse<string>>(`/ProductPrice/${id}`)
  return response.data
}