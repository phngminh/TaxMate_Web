import http from '../utils/http'
import type { ApiResponse } from '../types/common.type'
import type { ExpenseCategory, CreateExpenseCategoryRequest, UpdateExpenseCategoryRequest } from '../types/expense.category.type'

export const getExpenseCategories = async (businessId: string) => {
  const response = await http.get<ApiResponse<ExpenseCategory[]>>(`/ExpenseCategory/business/${businessId}` )
  return response.data
}

export const getExpenseCategoryById = async (id: string) => {
  const response = await http.get<ApiResponse<ExpenseCategory>>(`/ExpenseCategory/${id}`)
  return response.data
}

export const createExpenseCategory = async (businessId: string, body: CreateExpenseCategoryRequest) => {
  const response = await http.post<ApiResponse<ExpenseCategory>>(`/ExpenseCategory/business/${businessId}`, body)
  return response.data
}

export const updateExpenseCategory = async (id: string, body: UpdateExpenseCategoryRequest) => {
  const response = await http.put<ApiResponse<ExpenseCategory>>(`/ExpenseCategory/${id}`, body)
  return response.data
}

export const deleteExpenseCategory = async (id: string) => {
  const response = await http.delete<ApiResponse<boolean>>(`/ExpenseCategory/${id}`)
  return response.data
}