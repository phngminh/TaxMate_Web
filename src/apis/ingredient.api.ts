import type { Ingredient, CreateIngredientRequest, UpdateIngredientRequest } from '../types/ingredient.type'
import type { ApiResponse, PagedResult } from '../types/common.type'
import http from '../utils/http'

export const getAllIngredients = async (
  pageNumber = 1,
  pageSize = 10,
  search?: string
) => {
  const response = await http.get<ApiResponse<PagedResult<Ingredient>>>('/api/Ingredient',
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
  const response = await http.post<ApiResponse<Ingredient>>('/api/Ingredient', body)
  return response.data
}

export const updateIngredient = async (id: string, body: UpdateIngredientRequest) => {
  const response = await http.put<ApiResponse<Ingredient>>(`/api/Ingredient/${id}`, body)
  return response.data
}

export const deactivateIngredient = async (id: string) => {
  const response = await http.patch<ApiResponse<string>>(`/api/Ingredient/${id}/deactivate`)
  return response.data
}