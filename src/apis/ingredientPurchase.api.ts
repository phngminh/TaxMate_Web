import type { ApiResponse, PagedResult } from '../types/common.type'
import type { IngredientPurchaseResponse, CreateIngredientPurchaseRequest, UpdateIngredientPurchaseRequest } from '../types/ingredientPurchase.type'
import http from '../utils/http'

export const getIngredientPurchases = async (businessId: string, pageNumber = 1, pageSize = 100, search?: string) => {
  const response = await http.get<ApiResponse<PagedResult<IngredientPurchaseResponse>>>(
    `/IngredientPurchase/business/${businessId}`,
    {
      params: {
        pageNumber,
        pageSize,
        search
      }
    }
  )
  return response.data
}

export const getIngredientPurchaseById = async (id: string) => {
  const response = await http.get<ApiResponse<IngredientPurchaseResponse>>(`/IngredientPurchase/${id}`)
  return response.data
}

export const createIngredientPurchase = async (businessId: string, body: CreateIngredientPurchaseRequest) => {
  const response = await http.post<ApiResponse<IngredientPurchaseResponse>>(
    `/IngredientPurchase/business/${businessId}`,
    body
  )
  return response.data
}

export const updateIngredientPurchase = async (id: string, body: UpdateIngredientPurchaseRequest) => {
  const response = await http.put<ApiResponse<IngredientPurchaseResponse>>(`/IngredientPurchase/${id}`, body)
  return response.data
}

export const deleteIngredientPurchase = async (id: string) => {
  const response = await http.delete<ApiResponse<string>>(`/IngredientPurchase/${id}`)
  return response.data
}
