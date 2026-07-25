import type { ExpenseDTO, CreateExpenseRequest, UpdateExpenseRequest, ExpenseCategory } from '../types/expense.type'
import type { ApiResponse, PagedResult } from '../types/common.type'
import http from '../utils/http'

export const getExpenseCategories = async (businessId: string) => {
  const response = await http.get<ApiResponse<ExpenseCategory[]>>(`/ExpenseCategory/business/${businessId}`)
  return response.data
}

export const getAllExpenses = async (
  businessId: string,
  pageNumber = 1,
  pageSize = 1000,
  search?: string,
  categoryId?: string,
  paymentMethod?: string
) => {
  const response = await http.get<ApiResponse<PagedResult<ExpenseDTO>>>(`/Expense/business/${businessId}`, {
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

export const createExpense = async (businessId: string, body: CreateExpenseRequest) => {
  const response = await http.post<ApiResponse<ExpenseDTO>>(`/Expense/business/${businessId}`, body)
  return response.data
}

export const updateExpense = async (expenseId: string, body: UpdateExpenseRequest) => {
  const response = await http.put<ApiResponse<ExpenseDTO>>(`/Expense/${expenseId}`, body)
  return response.data
}

export const deleteExpense = async (expenseId: string) => {
  const response = await http.delete<ApiResponse<boolean>>(`/Expense/${expenseId}`)
  return response.data
}
