export interface LegalDocument {
  id: string
  document_name: string
  document_code: string
  document_type:
    | 'Luật'
    | 'Thông Tư'
    | 'Nghị Định'
    | 'Nghị Quyết'
  effective_date: string
  expired_date: string | null
  status:
    | 'active'
    | 'inactive'
    | 'processing'
    | 'error'
    | 'pending'
  requires_ocr: boolean
  total_pages: number
  total_chunks: number
  created_at: string
  updated_at: string
  source_file_name: string
  source_file_path: string
  ocr_status:
    | 'completed'
    | 'pending'
    | 'failed'
    | 'not_required'
  embedding_status:
    | 'completed'
    | 'pending'
    | 'failed'
    | 'processing'
  token_count: number
  embedding_model: string
  vector_dimension: number
}

export interface DocumentChunk {
  chunk_index: number
  dieu: string
  khoan: string | null
  diem: string | null
  tieu_de_dieu: string
  token_count: number
  character_count: number
}

export interface DocumentKeyword {
  keyword_text: string
  keyword_type: 'entity' | 'concept' | 'legal_term' | 'numeric'
  embedding_model: string
  vector_dimension: number
}