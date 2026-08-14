export interface RagAskRequest {
  question: string
}

export interface RagSource {
  document: string
  document_code: string
  dieu: number | null
  khoan: unknown | null
  diem: unknown | null
  title: string | null
  score: number
  retrieval_source: string | null
  page: number | null
  metadata: Record<string, unknown> | null
}

export interface RagAskResponse {
  success: boolean
  question: string
  answer: string
  sources: RagSource[]
}

export type RagChatRole = 'user' | 'assistant'

export interface RagChatMessage {
  id: string
  role: RagChatRole
  content: string
  time: string
  sources?: RagSource[]
  isError?: boolean
}