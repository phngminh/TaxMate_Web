import http from '../utils/http'
import type { ApiResponse } from '../types/common.type'
import type {
  QttCalculationPreview,
  QttCalculationResponse,
  QttDeclaration,
  QttOffsetObligationOption,
  QttPreview,
  S2bBook,
  S2cBook,
  S2dBook,
  S2eBook,
  UpdateQttAllocationRequest
} from '../types/taxBook.type'

export const getQttPreview = async (businessId: string, year: number) => {
  const response = await http.get<ApiResponse<QttPreview>>(
    `/businesses/${businessId}/tax-books/qtt/preview`,
    { params: { year } }
  )
  return response.data.data
}

export const getQttCalculationPreview = async (businessId: string, year: number) => {
  const response = await http.get<ApiResponse<QttCalculationPreview>>(
    `/businesses/${businessId}/tax-books/qtt/calculation-preview`,
    { params: { year } }
  )
  return response.data.data
}

export const calculateQtt = async (businessId: string, year: number) => {
  const response = await http.post<ApiResponse<QttCalculationResponse>>(
    `/businesses/${businessId}/tax-books/qtt/calculate`,
    undefined,
    { params: { year } }
  )
  return response.data.data
}

export const createQttDeclaration = async (businessId: string, year: number) => {
  const response = await http.post<ApiResponse<QttDeclaration>>(
    `/businesses/${businessId}/tax-books/qtt/declaration`,
    undefined,
    { params: { year } }
  )
  return response.data.data
}

export const getQttOffsetObligations = async (businessId: string) => {
  const response = await http.get<ApiResponse<QttOffsetObligationOption[]>>(
    `/businesses/${businessId}/tax-books/qtt/offset-obligations`
  )
  return response.data.data
}

export const updateQttAllocation = async (
  businessId: string,
  declarationId: string,
  request: UpdateQttAllocationRequest
) => {
  const response = await http.put<ApiResponse<QttDeclaration>>(
    `/businesses/${businessId}/tax-books/qtt/declarations/${declarationId}/overpayment-allocation`,
    request
  )
  return response.data.data
}

export const confirmQttDeclaration = async (
  businessId: string,
  declarationId: string,
  expectedRevision: number
) => {
  const response = await http.post<ApiResponse<QttDeclaration>>(
    `/businesses/${businessId}/tax-books/qtt/declarations/${declarationId}/confirm`,
    { expectedRevision }
  )
  return response.data.data
}

export const exportQttDeclaration = async (businessId: string, declarationId: string) => {
  const response = await http.get<Blob>(
    `/businesses/${businessId}/tax-books/qtt/declarations/${declarationId}/export`,
    { responseType: 'blob' }
  )
  return response.data
}

export const exportS1a = async (businessId: string, year: number, month?: number) => {
  const params: Record<string, any> = { year }
  if (month) {
    params.month = month
  }
  const response = await http.get(`/businesses/${businessId}/tax-books/s1a/export`, {
    params,
    responseType: 'blob'
  })
  return response.data
}

export const getS2bPreview = async (
  businessId: string,
  year: number,
  quarter: number
) => {
  const response = await http.get<ApiResponse<S2bBook>>(
    `/businesses/${businessId}/tax-books/s2b/preview`,
    { params: { year, quarter } }
  )
  return response.data.data
}

export const exportS2b = async (
  businessId: string,
  year: number,
  quarter: number
) => {
  const response = await http.get<Blob>(
    `/businesses/${businessId}/tax-books/s2b/export`,
    { params: { year, quarter }, responseType: 'blob' }
  )
  return response.data
}

export const getS2cPreview = async (
  businessId: string,
  year: number,
  quarter: number
) => {
  const response = await http.get<ApiResponse<S2cBook>>(
    `/businesses/${businessId}/tax-books/s2c/preview`,
    { params: { year, quarter } }
  )
  return response.data.data
}

export const exportS2c = async (
  businessId: string,
  year: number,
  quarter: number
) => {
  const response = await http.get<Blob>(
    `/businesses/${businessId}/tax-books/s2c/export`,
    { params: { year, quarter }, responseType: 'blob' }
  )
  return response.data
}

export const confirmS2cEvidenceReview = async (
  businessId: string,
  year: number,
  quarter: number
) => {
  const response = await http.post<ApiResponse<S2cBook>>(
    `/businesses/${businessId}/tax-books/s2c/evidence-review`,
    undefined,
    { params: { year, quarter } }
  )
  return response.data.data
}

export const getS2dPreview = async (
  businessId: string,
  year: number,
  quarter: number
) => {
  const response = await http.get<ApiResponse<S2dBook>>(
    `/businesses/${businessId}/tax-books/s2d/preview`,
    { params: { year, quarter } }
  )
  return response.data.data
}

export const exportS2d = async (
  businessId: string,
  year: number,
  quarter: number
) => {
  const response = await http.get<Blob>(
    `/businesses/${businessId}/tax-books/s2d/export`,
    { params: { year, quarter }, responseType: 'blob' }
  )
  return response.data
}

export const getS2ePreview = async (
  businessId: string,
  year: number,
  quarter: number
) => {
  const response = await http.get<ApiResponse<S2eBook>>(
    `/businesses/${businessId}/tax-books/s2e/preview`,
    { params: { year, quarter } }
  )
  return response.data.data
}

export const exportS2e = async (
  businessId: string,
  year: number,
  quarter: number
) => {
  const response = await http.get<Blob>(
    `/businesses/${businessId}/tax-books/s2e/export`,
    { params: { year, quarter }, responseType: 'blob' }
  )
  return response.data
}
