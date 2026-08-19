import http from '../utils/http'

import type {
  ApiResponse
} from '../types/common.type'

import type {
  HomeDashboardGroupBy,
  HomeDashboardResponse
} from '../types/homeDashboard.type'

interface GetHomeDashboardParams {
  businessId: string

  date?: string

  rangeDays?: number

  groupBy?: HomeDashboardGroupBy
}

export async function getHomeDashboard({
  businessId,
  date,
  rangeDays = 30,
  groupBy = 'Day'
}: GetHomeDashboardParams): Promise<HomeDashboardResponse> {
  const response = await http.get<
    ApiResponse<HomeDashboardResponse>
  >(
    `/businesses/reports/${businessId}/home-dashboard`,
    {
      params: {
        date,
        rangeDays,
        groupBy
      }
    }
  )

  return response.data.data
}