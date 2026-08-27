import type { ApiResponse } from '../types/common.type'
import type { AnnualRevenueConclusionPreview } from '../types/annualRevenueConclusion.type'
import type {
  OwnerTaxProfile,
  RevenueThresholdReview,
  TaxMethod,
  UpdateOwnerTaxProfileRequest
} from '../types/taxProfile.type'
import http from '../utils/http'

export async function getAnnualRevenueConclusion(
  businessId: string,
  year: number
): Promise<AnnualRevenueConclusionPreview> {
  const response = await http.get<
    ApiResponse<AnnualRevenueConclusionPreview>
  >(`/tax-profile/business/${businessId}/annual-conclusion`, {
    params: { year }
  })

  return response.data.data
}

export async function confirmAnnualRevenueConclusion(
  businessId: string,
  year: number,
  personalIncomeTaxMethod?: TaxMethod
): Promise<AnnualRevenueConclusionPreview> {
  const response = await http.post<
    ApiResponse<AnnualRevenueConclusionPreview>
  >(
    `/tax-profile/business/${businessId}/annual-conclusion/confirm`,
    { confirmed: true, personalIncomeTaxMethod },
    { params: { year } }
  )

  return response.data.data
}

export async function getOwnerTaxProfile(
  businessId: string
): Promise<OwnerTaxProfile> {
  const response = await http.get<ApiResponse<OwnerTaxProfile>>(
    `/tax-profile/business/${businessId}`
  )
  return response.data.data
}

export async function updateOwnerTaxProfile(
  businessId: string,
  request: UpdateOwnerTaxProfileRequest
): Promise<OwnerTaxProfile> {
  const response = await http.put<ApiResponse<OwnerTaxProfile>>(
    `/tax-profile/business/${businessId}`,
    request
  )
  return response.data.data
}

export async function confirmThresholdReview(
  businessId: string,
  alertId: string,
  personalIncomeTaxMethod?: TaxMethod
): Promise<RevenueThresholdReview> {
  const response = await http.post<ApiResponse<RevenueThresholdReview>>(
    `/tax-profile/business/${businessId}/threshold-reviews/${alertId}/confirm`,
    { confirmed: true, personalIncomeTaxMethod }
  )
  return response.data.data
}

export async function dismissThresholdReview(
  businessId: string,
  alertId: string
): Promise<RevenueThresholdReview> {
  const response = await http.post<ApiResponse<RevenueThresholdReview>>(
    `/tax-profile/business/${businessId}/threshold-reviews/${alertId}/dismiss`,
    {}
  )
  return response.data.data
}
