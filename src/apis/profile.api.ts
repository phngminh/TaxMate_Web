import type { BusinessProfile, CreateBusinessProfileRequest } from '../types/profile.type'
import type { ApiResponse, PagedResult } from '../types/common.type'
import http from '../utils/http'

export const getBusinessProfiles = async (
  ownerId: string,
  pageNumber = 1,
  pageSize = 10,
  search?: string
) => {
  const response = await http.get<ApiResponse<PagedResult<BusinessProfile>>>( '/BusinessProfile',
    {
      params: {
        ownerId,
        pageNumber,
        pageSize,
        search
      }
    }
  )
  return response.data
}

export const createBusinessProfile = async (request: CreateBusinessProfileRequest) => {
  const response = await http.post(`/BusinessProfile`, request)
  return response.data
}