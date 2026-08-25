import http from '../utils/http'
import type { ApiResponse, PagedResult } from '../types/common.type'
import type { CreateInventoryPurchaseRequest, InventoryPurchaseResponse } from '../types/inventoryPurchase.type'

export const getInventoryPurchases = async (businessId: string, pageNumber = 1, pageSize = 100) => {
  const response = await http.get<ApiResponse<PagedResult<InventoryPurchaseResponse>>>(
    `/inventory-purchases/business/${businessId}`,
    { params: { pageNumber, pageSize } }
  )
  return response.data
}

export const createInventoryPurchase = async (businessId: string, body: CreateInventoryPurchaseRequest) => {
  const response = await http.post<ApiResponse<InventoryPurchaseResponse>>(
    `/inventory-purchases/business/${businessId}`,
    body
  )
  return response.data
}

export const deleteInventoryPurchase = async (expenseId: string) => {
  const response = await http.delete<ApiResponse<string>>(`/inventory-purchases/${expenseId}`)
  return response.data
}
