import http from '../utils/http'
import type { ApiResponse } from '../types/common.type'
import type { InitializeInventoryRequest, InventoryControlResult, InventoryInitializationPreview, ReconcileInventoryRequest } from '../types/inventory.type'

export const getInventoryInitializationPreview = async (businessId: string) => {
  const response = await http.get<ApiResponse<InventoryInitializationPreview>>(
    `/businesses/${businessId}/inventory/initialization/preview`
  )
  return response.data.data
}

export const initializeInventory = async (businessId: string, body: InitializeInventoryRequest) => {
  const response = await http.post<ApiResponse<InventoryControlResult>>(
    `/businesses/${businessId}/inventory/initialization/confirm`, body
  )
  return response.data.data
}

export const reconcileInventory = async (businessId: string, body: ReconcileInventoryRequest) => {
  const response = await http.post<ApiResponse<InventoryControlResult>>(
    `/businesses/${businessId}/inventory/adjustments/reconcile`, body
  )
  return response.data.data
}
