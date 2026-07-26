import type { Ingredient, CreateIngredientRequest, UpdateIngredientRequest } from '../types/ingredient.type'
import type { ApiResponse, PagedResult } from '../types/common.type'
import http from '../utils/http'

export const getAllIngredients = async (
  businessId: string,
  pageNumber = 1,
  pageSize = 10,
  search?: string
) => {
  const response = await http.get<ApiResponse<PagedResult<Ingredient>>>(`/Ingredient/business/${businessId}`,
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

export const createIngredient = async (body: CreateIngredientRequest) => {
  const response = await http.post<ApiResponse<Ingredient>>('/Ingredient', body)
  return response.data
}

export const updateIngredient = async (id: string, body: UpdateIngredientRequest) => {
  const response = await http.put<ApiResponse<Ingredient>>(`/Ingredient/${id}`, body)
  return response.data
}

export const deactivateIngredient = async (id: string) => {
  const response = await http.patch<ApiResponse<string>>(`/Ingredient/${id}/deactivate`)
  return response.data
}