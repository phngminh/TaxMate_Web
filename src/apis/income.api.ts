import type { IncomeDTO, CreateIncomeRequest, UpdateIncomeRequest, IncomeCategory } from '../types/income.type'
import type { ApiResponse, PagedResult } from '../types/common.type'
import http from '../utils/http'

export const getIncomeCategories = async (businessId: string) => {
  const response = await http.get<ApiResponse<IncomeCategory[]>>(`/IncomeCategory/business/${businessId}`)
  return response.data
}

export const getAllIncomes = async (
  businessId: string,
  pageNumber = 1,
  pageSize = 1000,
  search?: string,
  categoryId?: string,
  paymentMethod?: string
) => {
  const response = await http.get<ApiResponse<PagedResult<IncomeDTO>>>(`/Income/business/${businessId}`, {
    params: {
      pageNumber,
      pageSize,
      search,
      categoryId,
      paymentMethod
    }
  })
  return response.data
}

export const createIncome = async (businessId: string, body: CreateIncomeRequest) => {
  const response = await http.post<ApiResponse<IncomeDTO>>(`/Income/business/${businessId}`, body)
  return response.data
}

export const updateIncome = async (incomeId: string, body: UpdateIncomeRequest) => {
  const response = await http.put<ApiResponse<IncomeDTO>>(`/Income/${incomeId}`, body)
  return response.data
}

export const deleteIncome = async (incomeId: string) => {
  const response = await http.delete<ApiResponse<boolean>>(`/Income/${incomeId}`)
  return response.data
}
