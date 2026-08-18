import axios from 'axios'

import type { ApiResponse } from '../types/common.type'

import type {
  CreateTaxDeclarationRequest,
  ExportedTaxDeclarationDocument,
  TaxDeclaration
} from '../types/taxDeclaration.type'

import http from '../utils/http'

function getFileNameFromContentDisposition(
  contentDisposition?: string
): string {
  if (!contentDisposition) {
    return 'tax-declaration.docx'
  }

  const utf8Match =
    contentDisposition.match(
      /filename\*=UTF-8''([^;]+)/
    )

  if (utf8Match?.[1]) {
    return decodeURIComponent(
      utf8Match[1]
    )
  }

  const normalMatch =
    contentDisposition.match(
      /filename="?([^"]+)"?/
    )

  if (normalMatch?.[1]) {
    return normalMatch[1]
  }

  return 'tax-declaration.docx'
}

export async function getTaxDeclarationByTaxPeriod(
  taxPeriodId: string
): Promise<TaxDeclaration | null> {
  try {
    const response = await http.get<
      ApiResponse<TaxDeclaration>
    >(
      `/tax-declarations/tax-period/${taxPeriodId}`
    )

    return response.data.data
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 404
    ) {
      return null
    }

    throw error
  }
}

export async function createTaxDeclaration(
  taxPeriodId: string,
  request: CreateTaxDeclarationRequest
): Promise<TaxDeclaration> {
  const response = await http.post<
    ApiResponse<TaxDeclaration>
  >(
    `/tax-declarations/tax-period/${taxPeriodId}`,
    request
  )

  return response.data.data
}

export async function exportTaxDeclarationDocument(
  declarationId: string
): Promise<ExportedTaxDeclarationDocument> {
  const response = await http.get<Blob>(
    `/tax-declarations/${declarationId}/export`,
    {
      responseType: 'blob'
    }
  )

  return {
    blob: response.data,
    fileName:
      getFileNameFromContentDisposition(
        response.headers[
          'content-disposition'
        ]
      )
  }
}

export async function submitTaxDeclaration(
  declarationId: string
): Promise<TaxDeclaration> {
  const response = await http.post<
    ApiResponse<TaxDeclaration>
  >(
    `/tax-declarations/${declarationId}/submit`,
    {}
  )

  return response.data.data
}