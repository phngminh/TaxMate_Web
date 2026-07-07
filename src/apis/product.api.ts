import type { Product, CreateProductRequest, UpdateProductRequest } from '../types/product.type'
import type { ApiResponse, PagedResult } from '../types/common.type'
import http from '../utils/http'

export const getAllProducts = async (
  businessId: string,
  pageNumber = 1,
  pageSize = 10,
  search?: string,
  status?: string,
  category?: string
) => {
  const response = await http.get<ApiResponse<PagedResult<Product>>>(`/Product/business/${businessId}`,
    {
      params: {
        pageNumber,
        pageSize,
        search,
        status,
        category
      }
    }
  )
  return response.data
}

export const getProductById = async (id: string) => {
  const response = await http.get<ApiResponse<Product>>(`/Product/${id}`)
  return response.data
}

export const createProduct = async (businessId: string, body: CreateProductRequest) => {
  const response = await http.post<ApiResponse<Product>>(`/Product/business/${businessId}`, body)
  return response.data
}

export const updateProduct = async (id: string, body: UpdateProductRequest) => {
  const response = await http.put<ApiResponse<Product>>(`/Product/${id}`, body)
  return response.data
}