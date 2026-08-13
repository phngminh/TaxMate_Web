import type { ApiResponse } from '../types/common.type'
import type {
  RagAskRequest,
  RagAskResponse
} from '../types/rag.type'
import http from '../utils/http'

export const askRag = async (
  body: RagAskRequest
): Promise<RagAskResponse> => {
  const response = await http.post<ApiResponse<RagAskResponse>>(
    '/rag/ask',
    body,
    {
      // BE chờ RAG tối đa 120 giây.
      // Client phải dài hơn timeout của BE.
      timeout: 130000
    }
  )

  return response.data.data
}