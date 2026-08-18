import http from '../utils/http'

import type { ApiResponse } from '../types/common.type'
import type { TaxDashboardApiResponse } from '../types/taxDashboard.type'

interface GetTaxDashboardParams {
  businessId: string
  year: number
}

export async function getTaxDashboard({
  businessId,
  year
}: GetTaxDashboardParams): Promise<TaxDashboardApiResponse> {
  const response = await http.get<
    ApiResponse<TaxDashboardApiResponse>
  >(
    `/businesses/reports/${businessId}/tax-dashboard`,
    {
      params: {
        year
      }
    }
  )

  return response.data.data
}