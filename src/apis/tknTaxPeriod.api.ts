import type { ApiResponse } from '../types/common.type'
import type {
  CloseTknTaxPeriodRequest,
  CloseTknTaxPeriodResponse,
  ApplyTknQttNextStepRequest,
  TknTaxCalculationResponse,
  TknQttNextStep,
  TknTaxPeriodPreview
} from '../types/tknTaxPeriod.type'
import http from '../utils/http'

export async function getTknTaxPeriodPreview(
  taxPeriodId: string
): Promise<TknTaxPeriodPreview> {
  const response = await http.get<
    ApiResponse<TknTaxPeriodPreview>
  >(`/tkn-tax-periods/${taxPeriodId}/preview`)

  return response.data.data
}

export async function getTknQttNextStep(
  taxPeriodId: string
): Promise<TknQttNextStep> {
  const response = await http.get<
    ApiResponse<TknQttNextStep>
  >(`/tkn-tax-periods/${taxPeriodId}/qtt-next-step`)

  return response.data.data
}

export async function applyTknQttNextStep(
  taxPeriodId: string,
  request: ApplyTknQttNextStepRequest
): Promise<TknQttNextStep> {
  const response = await http.post<
    ApiResponse<TknQttNextStep>
  >(
    `/tkn-tax-periods/${taxPeriodId}/qtt-next-step`,
    request
  )

  return response.data.data
}

export async function closeTknTaxPeriod(
  taxPeriodId: string,
  request: CloseTknTaxPeriodRequest
): Promise<CloseTknTaxPeriodResponse> {
  const response = await http.post<
    ApiResponse<CloseTknTaxPeriodResponse>
  >(`/tkn-tax-periods/${taxPeriodId}/close`, request)

  return response.data.data
}

export async function calculateTknTaxPeriod(
  taxPeriodId: string
): Promise<TknTaxCalculationResponse> {
  const response = await http.post<
    ApiResponse<TknTaxCalculationResponse>
  >(`/tkn-tax-periods/${taxPeriodId}/calculate`, {})

  return response.data.data
}
