import type { Product, CreateProductRequest, UpdateProductRequest } from '../types/product.type'
import type { ApiResponse, PagedResult } from '../types/common.type'
import http from '../utils/http'

export const getAllProducts = async (
  businessId: string,
  pageNumber = 1,
  pageSize = 5,
  search?: string,
  status?: string,
  productCategoryId?: string,
  hasRecipe?: boolean
) => {
  const response = await http.get<ApiResponse<PagedResult<Product>>>(`/Product/business/${businessId}`,
    {
      params: {
        pageNumber,
        pageSize,
        search,
        status,
        productCategoryId,
        hasRecipe
      }
    }
  )
  return response.data
}

// Wrapper chuyên dụng cho tab Công thức — chỉ lấy sản phẩm đã có công thức nguyên liệu
export const getProductsWithRecipe = async (
  businessId: string,
  pageNumber = 1,
  pageSize = 100
) => {
  return getAllProducts(businessId, pageNumber, pageSize, undefined, undefined, undefined, true)
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

export const toggleProductStatus = async (id: string) => {
  const response = await http.patch<ApiResponse<Product>>(`/Product/${id}/toggle-status`)
  return response.data
}

export const deleteProduct = async (id: string) => {
  const response = await http.delete<ApiResponse<object>>(`/Product/${id}`)
  return response.data
}

export const updateProductCostPrice = async (
  id: string,
  body: { incomingQuantity: number; incomingCostPrice: number }
) => {
  const response = await http.patch<ApiResponse<Product>>(`/Product/${id}/cost-price`, body)
  return response.data
}