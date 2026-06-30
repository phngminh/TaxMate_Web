export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  traceId: string
}

export interface PagedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}