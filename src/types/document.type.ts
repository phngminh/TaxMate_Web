export interface LegalDocumentResponse {
  legalDocumentId: string
  documentCode: string
  documentName: string
  documentType?: string | null
  authorityLevel?: string | null
  effectiveDate?: string | null
  expiredDate?: string | null
  status: string
  sourceFileName: string
  storagePath: string
  fileSize: number
  fileHash: string
  isIndexed: boolean
  totalPages?: number | null
  totalChunks?: number | null
  createdAt: string
  updatedAt: string
}

/** Display model used by the admin documents page. */
export interface LegalDocument {
  id: string
  document_name: string
  document_code: string
  document_type: string
  authority_level: string | null
  effective_date: string | null
  expired_date: string | null
  status: 'Active' | 'Inactive' | string
  total_pages: number | null
  total_chunks: number
  created_at: string
  updated_at: string
  source_file_name: string
  source_file_path: string
  file_size: number
  file_hash: string
  is_indexed: boolean
  /** Derived from is_indexed for table badge. */
  index_badge: 'INDEXED' | 'PENDING'
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
  keyword_type: 'Entity' | 'Concept' | 'Legal_term' | 'Numeric'
  embedding_model: string
  vector_dimension: number
}

export function mapLegalDocumentResponse(doc: LegalDocumentResponse): LegalDocument {
  return {
    id: doc.legalDocumentId,
    document_name: doc.documentName,
    document_code: doc.documentCode,
    document_type: doc.documentType ?? '—',
    authority_level: doc.authorityLevel ?? null,
    effective_date: doc.effectiveDate ?? null,
    expired_date: doc.expiredDate ?? null,
    status: doc.status,
    total_pages: doc.totalPages ?? null,
    total_chunks: doc.totalChunks ?? 0,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
    source_file_name: doc.sourceFileName,
    source_file_path: doc.storagePath,
    file_size: doc.fileSize,
    file_hash: doc.fileHash,
    is_indexed: doc.isIndexed,
    index_badge: doc.isIndexed ? 'INDEXED' : 'PENDING',
  }
}
