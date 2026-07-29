import http from '../utils/http'

export const exportS1a = async (businessId: string, year: number, month?: number) => {
  const params: Record<string, any> = { year }
  if (month) {
    params.month = month
  }
  const response = await http.get(`/businesses/${businessId}/tax-books/s1a/export`, {
    params,
    responseType: 'blob'
  })
  return response.data
}
