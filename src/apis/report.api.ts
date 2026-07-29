import http from '../utils/http'
import type { ApiResponse } from '../types/common.type'
import type {
  SalesDashboardResponse,
  BusinessProfileDropdownResponse,
  ActiveSalesMonthResponse,
  EstimatedProfitDashboardResponse,
  ActiveSalesQuarterResponse,
  CashFlowDashboardResponse,
  TaxDashboardResponse
} from '../types/report.type'

export const getSalesDashboard = async (businessId: string, year: number, month: number) => {
  const response = await http.get<ApiResponse<SalesDashboardResponse>>(`/businesses/reports/${businessId}/sales-dashboard`,
    {
      params: {
        year,
        month
      }
    }
  )
  return response.data
}

export const getBusinesses = async (userId: string) => {
  const response = await http.get<ApiResponse<BusinessProfileDropdownResponse[]>>(`/businesses/reports/${userId}`)
  return response.data
}

export const getActiveSalesMonths = async (businessId: string) => {
  const response = await http.get<ApiResponse<ActiveSalesMonthResponse[]>>(`/businesses/reports/${businessId}/active-months`)
  return response.data
}

export const getEstimatedProfitDashboard = async (businessId: string, year: number, quarter: number) => {
  const response = await http.get<ApiResponse<EstimatedProfitDashboardResponse>>(`/businesses/reports/${businessId}/estimated-profit-dashboard`,
    {
      params: {
        year,
        quarter
      }
    }
  )
  return response.data
}

export const getActiveSalesQuarters = async (businessId: string) => {
  const response = await http.get<ApiResponse<ActiveSalesQuarterResponse[]>>(`/businesses/reports/${businessId}/active-quarters`)
  return response.data
}

export const getCashFlowDashboard = async (businessId: string, year: number, quarter: number) => {
  const response = await http.get<ApiResponse<CashFlowDashboardResponse>>(`/businesses/reports/${businessId}/cash-flow-dashboard`,
    {
      params: {
        year,
        quarter
      }
    }
  )
  return response.data
}

export const getTaxDashboard = async (businessId: string, year: number) => {
  const response = await http.get<ApiResponse<TaxDashboardResponse>>(`/businesses/reports/${businessId}/tax-dashboard`,
    {
      params: {
        year
      }
    }
  )
  return response.data
}