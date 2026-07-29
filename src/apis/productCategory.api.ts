import type { ProductCategory } from '../types/productCategory.type'
import type { ApiResponse } from '../types/common.type'
import http from '../utils/http'

export const getProductCategories = async (businessId: string) => {
  const response = await http.get<ApiResponse<ProductCategory[]>>(
    `/ProductCategory/business/${businessId}`
  )
  return response.data
}
