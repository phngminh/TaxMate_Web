import type { ApiResponse } from '../types/common.type'
import type { ProductCategory, CreateProductCategoryRequest, UpdateProductCategoryRequest } from '../types/product.category.type'
import http from '../utils/http'

export const getProductCategories = async (businessId: string) => {
  const response = await http.get<ApiResponse<ProductCategory[]>>(`/ProductCategory/business/${businessId}`)
  return response.data
}

export const getProductCategoryById = async (id: string) => {
  const response = await http.get<ApiResponse<ProductCategory>>(`/ProductCategory/${id}`)
  return response.data
}

export const createProductCategory = async (businessId: string, body: CreateProductCategoryRequest) => {
  const response = await http.post<ApiResponse<ProductCategory>>(`/ProductCategory/business/${businessId}`, body)
  return response.data
}

export const updateProductCategory = async (id: string, body: UpdateProductCategoryRequest) => {
  const response = await http.put<ApiResponse<ProductCategory>>(`/ProductCategory/${id}`, body)
  return response.data
}

export const deleteProductCategory = async (
  id: string,
  fallbackProductCategoryId?: string,
  forceDelete = false
) => {
  const response = await http.delete<ApiResponse<boolean>>(`/ProductCategory/${id}`,
    {
      params: {
        fallbackProductCategoryId,
        forceDelete
      }
    }
  )
  return response.data
}