import type { ProductIngredient, AddProductIngredientRequest, UpdateProductIngredientRequest } from '../types/product.ingredient.type'
import type { ApiResponse } from '../types/common.type'
import http from '../utils/http'

export const getProductIngredients = async (productId: string) => {
  const response = await http.get<ApiResponse<ProductIngredient[]>>(`/api/ProductIngredient/product/${productId}`)
  return response.data
}

export const addProductIngredient = async (productId: string, body: AddProductIngredientRequest) => {
  const response = await http.post<ApiResponse<ProductIngredient>>(`/api/ProductIngredient/product/${productId}`, body)
  return response.data
}

export const updateProductIngredient = async (
  productId: string,
  ingredientId: string,
  body: UpdateProductIngredientRequest
) => {
  const response = await http.put<ApiResponse<ProductIngredient>>(`/api/ProductIngredient/product/${productId}/ingredient/${ingredientId}`, body)
  return response.data
}

export const deleteProductIngredient = async (productId: string, ingredientId: string) => {
  const response = await http.delete<ApiResponse<string>>(`/api/ProductIngredient/product/${productId}/ingredient/${ingredientId}`)
  return response.data
}