import http from '../utils/http'

export const hasBusinessProfile = async (userId: string) => {
  const response = await http.get<boolean>(`/api/BusinessProfile/exists?ownerId=${userId}`)
  return response.data
}

export interface CreateBusinessProfileRequest {
  ownerId: string
  businessName: string
  provinceCode?: string
  wardCode?: string
  address?: string
  mainCategoryId?: string
 preferElectronicInvoice: boolean
}

export const createBusinessProfile = async (request: CreateBusinessProfileRequest) => {
  const response = await http.post(`/api/BusinessProfile`, request)
  return response.data
}