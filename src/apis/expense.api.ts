import type { ApiResponse, PagedResult } from '../types/common.type'
import type { ExpenseDTO, CreateExpenseRequest, UpdateExpenseRequest, ExpenseCategoryDTO, ExpenseSummaryDTO } from '../types/expense.type'
import http from '../utils/http'

// 1. Expense Categories
export const getExpenseCategories = async (businessId: string) => {
  const response = await http.get<ApiResponse<ExpenseCategoryDTO[]>>(`/ExpenseCategory/business/${businessId}`)
  return response.data
}

export const createExpenseCategory = async (
  businessId: string,
  body: { name: string; description?: string }
) => {
  const response = await http.post<ApiResponse<ExpenseCategoryDTO>>(`/ExpenseCategory/business/${businessId}`, body)
  return response.data
}

// 2. Expenses
export const getExpenses = async (
  businessId: string,
  params?: {
    pageNumber?: number
    pageSize?: number
    search?: string | null
    fromDate?: string | null
    toDate?: string | null
    categoryId?: string | null
    paymentMethod?: string | null
  }
) => {
  const response = await http.get<ApiResponse<PagedResult<ExpenseDTO>>>(`/Expense/business/${businessId}`, {
    params
  })
  return response.data
}

export const getExpenseById = async (id: string) => {
  const response = await http.get<ApiResponse<ExpenseDTO>>(`/Expense/${id}`)
  return response.data
}

export const createExpense = async (businessId: string, body: CreateExpenseRequest) => {
  const response = await http.post<ApiResponse<ExpenseDTO>>(`/Expense/business/${businessId}`, body)
  return response.data
}

export const updateExpense = async (id: string, body: UpdateExpenseRequest) => {
  const response = await http.put<ApiResponse<ExpenseDTO>>(`/Expense/${id}`, body)
  return response.data
}

export const deleteExpense = async (id: string) => {
  const response = await http.delete<ApiResponse<boolean>>(`/Expense/${id}`)
  return response.data
}

export const getExpenseMonthlySummary = async (businessId: string, year: number, month: number) => {
  const response = await http.get<ApiResponse<ExpenseSummaryDTO>>(`/Expense/business/${businessId}/summary`, {
    params: { year, month }
  })
  return response.data
}
