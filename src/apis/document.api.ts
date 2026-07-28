import http from '../utils/http'
import type { ApiResponse } from '../types/common.type'
import type { LegalDocumentResponse } from '../types/document.type'

export const getLegalDocuments = async () => {
  const response = await http.get<ApiResponse<LegalDocumentResponse[]>>('/LegalDocument')
  return response.data
}

export const getLegalDocumentById = async (id: string) => {
  const response = await http.get<ApiResponse<LegalDocumentResponse>>(
    `/LegalDocument/${id}`,
  )
  return response.data
}

export const uploadLegalDocument = async (formData: FormData) => {
  const response = await http.post<ApiResponse<string>>('/LegalDocument', formData, {
    headers: { 'Content-Type': undefined as unknown as string },
  })
  return response.data
}

export const activateLegalDocument = async (id: string) => {
  const response = await http.patch<ApiResponse<string>>(
    `/LegalDocument/${id}/activate`,
  )
  return response.data
}

export const deactivateLegalDocument = async (id: string) => {
  const response = await http.patch<ApiResponse<string>>(
    `/LegalDocument/${id}/deactivate`,
  )
  return response.data
}

export const updateLegalDocumentPdf = async (id: string, formData: FormData) => {
  const response = await http.put<ApiResponse<LegalDocumentResponse>>(
    `/LegalDocument/${id}/file`,
    formData,
    {
      headers: { 'Content-Type': undefined as unknown as string },
    },
  )
  return response.data
}

export const deleteLegalDocument = async (id: string) => {
  const response = await http.delete<ApiResponse<null>>(`/LegalDocument/${id}`)
  return response.data
}
