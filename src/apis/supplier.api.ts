import type { ApiResponse } from '../types/common.type'
import type { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '../types/supplier.type'
import http from '../utils/http'

export const getSuppliers = async (businessId: string) => {
  const response = await http.get<ApiResponse<Supplier[]>>(`/Supplier/business/${businessId}`)
  return response.data
}

export const getSupplierById = async (id: string) => {
  const response = await http.get<ApiResponse<Supplier>>(`/Supplier/${id}`)
  return response.data
}

export const createSupplier = async (businessId: string, body: CreateSupplierRequest) => {
  const response = await http.post<ApiResponse<Supplier>>(`/Supplier/business/${businessId}`, body)
  return response.data
}

export const updateSupplier = async (id: string, body: UpdateSupplierRequest) => {
  const response = await http.put<ApiResponse<Supplier>>(`/Supplier/${id}`, body)
  return response.data
}

export const deleteSupplier = async (id: string) => {
  const response = await http.delete<ApiResponse<boolean>>(`/Supplier/${id}`)
  return response.data
}
