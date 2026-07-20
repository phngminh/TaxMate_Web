import type {
  EInvoiceConfig,
  SaveEInvoiceConfigRequest,
  TestConnectionRequest,
  GetTemplatesRequest,
  SePayProviderItem,
  SePayTemplateItem
} from '../types/einvoice.type'
import type { ApiResponse } from '../types/common.type'
import http from '../utils/http'

export const getEInvoiceConfig = async (businessId: string) => {
  const response = await http.get<ApiResponse<EInvoiceConfig>>(
    `/EInvoiceConfig/business/${businessId}`
  )
  return response.data
}

export const saveEInvoiceConfig = async (
  businessId: string,
  body: SaveEInvoiceConfigRequest
) => {
  const response = await http.post<ApiResponse<EInvoiceConfig>>(
    `/EInvoiceConfig/business/${businessId}`,
    body
  )
  return response.data
}

export const getEInvoiceQuota = async (businessId: string) => {
  const response = await http.get<ApiResponse<number | null>>(
    `/EInvoiceConfig/business/${businessId}/quota`
  )
  return response.data
}

export const getSavedProvidersAndTemplates = async (businessId: string) => {
  const response = await http.get<ApiResponse<{
    providers: SePayProviderItem[]
    templates: SePayTemplateItem[]
  }>>(
    `/EInvoiceConfig/business/${businessId}/saved-providers-and-templates`
  )
  return response.data
}

export const testConnectionAndGetProviders = async (body: TestConnectionRequest) => {
  const response = await http.post<ApiResponse<SePayProviderItem[]>>(
    `/EInvoiceConfig/test-connection-and-get-providers`,
    body
  )
  return response.data
}

export const getTemplates = async (body: GetTemplatesRequest) => {
  const response = await http.post<ApiResponse<SePayTemplateItem[]>>(
    `/EInvoiceConfig/get-templates`,
    body
  )
  return response.data
}
