import type { ApiResponse } from '../types/common.type'
import type { TaxFilingTask } from '../types/taxFilingTask.type'
import http from '../utils/http'

export async function getTaxFilingTasks(
  businessId: string,
  year: number
): Promise<TaxFilingTask[]> {
  const response = await http.get<
    ApiResponse<TaxFilingTask[]>
  >(`/tax-filing-tasks/business/${businessId}`, {
    params: { year }
  })

  return response.data.data
}

export async function openTaxFilingTask(
  businessId: string,
  taskId: string
): Promise<TaxFilingTask> {
  const response = await http.post<
    ApiResponse<TaxFilingTask>
  >(
    `/tax-filing-tasks/business/${businessId}/${taskId}/open`,
    {}
  )

  return response.data.data
}
