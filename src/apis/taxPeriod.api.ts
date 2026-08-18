import type { ApiResponse } from '../types/common.type'

import type {
  CalculateTaxPeriodResponse,
  CloseTaxPeriodResponse,
  TaxPeriodDetail,
  TaxPeriodPreview,
  TaxPeriodStatus,
  TaxPeriodSummary,
  TaxPeriodType
} from '../types/taxPeriod.type'

import http from '../utils/http'

interface GetBusinessTaxPeriodsParams {
  businessId: string
  year?: number
  periodType?: TaxPeriodType
  status?: TaxPeriodStatus
}

export interface CloseTaxPeriodRequest {
  confirmWarnings: boolean
}

export async function getBusinessTaxPeriods({
  businessId,
  year,
  periodType,
  status
}: GetBusinessTaxPeriodsParams): Promise<
  TaxPeriodSummary[]
> {
  const response = await http.get<
    ApiResponse<TaxPeriodSummary[]>
  >(`/tax-periods/business/${businessId}`, {
    params: {
      Year: year,
      PeriodType: periodType,
      Status: status
    }
  })

  return response.data.data
}

export async function getTaxPeriodById(
  taxPeriodId: string
): Promise<TaxPeriodDetail> {
  const response = await http.get<
    ApiResponse<TaxPeriodDetail>
  >(`/tax-periods/${taxPeriodId}`)

  return response.data.data
}

export async function getTaxPeriodPreview(
  taxPeriodId: string
): Promise<TaxPeriodPreview> {
  const response = await http.get<
    ApiResponse<TaxPeriodPreview>
  >(`/tax-periods/${taxPeriodId}/preview`)

  return response.data.data
}

export async function closeTaxPeriod(
  taxPeriodId: string,
  request: CloseTaxPeriodRequest = {
    confirmWarnings: true
  }
): Promise<CloseTaxPeriodResponse> {
  const response = await http.post<
    ApiResponse<CloseTaxPeriodResponse>
  >(
    `/tax-periods/${taxPeriodId}/close`,
    request
  )

  return response.data.data
}

export async function calculateTaxPeriod(
  taxPeriodId: string
): Promise<CalculateTaxPeriodResponse> {
  const response = await http.post<
    ApiResponse<CalculateTaxPeriodResponse>
  >(
    `/tax-periods/${taxPeriodId}/calculate`,
    {}
  )

  return response.data.data
}