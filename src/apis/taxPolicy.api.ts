import type { ApiResponse } from '../types/common.type'
import type {
  TaxThresholdSetting,
  TaxThresholdType,
  UpdateTaxThresholdSettingRequest,
} from '../types/taxPolicy.type'
import http from '../utils/http'

export async function getEffectiveTaxThreshold(
  type: TaxThresholdType,
  effectiveOn: string,
) {
  const response = await http.get<ApiResponse<TaxThresholdSetting>>(
    `/admin/tax-policy/${type}`,
    { params: { effectiveOn } },
  )
  return response.data
}

export async function getLatestTaxThreshold(type: TaxThresholdType) {
  const response = await http.get<ApiResponse<TaxThresholdSetting>>(
    `/admin/tax-policy/${type}/latest`,
  )
  return response.data
}

export async function updateTaxThreshold(
  type: TaxThresholdType,
  request: UpdateTaxThresholdSettingRequest,
) {
  const response = await http.put<ApiResponse<TaxThresholdSetting>>(
    `/admin/tax-policy/${type}`,
    request,
  )
  return response.data
}
