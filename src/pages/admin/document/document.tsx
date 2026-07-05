import { useState, useRef } from 'react'
import {
  Search,
  FileText,
  MoreHorizontal,
  X,
  Eye,
  RefreshCw,
  Cpu,
  Database,
  Trash2,
  ToggleLeft,
  ToggleRight,
  FileSearch,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Layers,
  Hash,
  Tag,
  Zap,
  FileUp,
  BarChart2,
  Activity,
  TrendingUp,
  Plus,
} from 'lucide-react'
import type { DocumentChunk, DocumentKeyword, LegalDocument } from '../../../types/document.type'

const mockChunks: DocumentChunk[] = [
  {
    chunk_index: 1,
    dieu: 'Điều 1',
    khoan: null,
    diem: null,
    tieu_de_dieu: 'Phạm vi điều chỉnh',
    token_count: 312,
    character_count: 1248,
  },
  {
    chunk_index: 2,
    dieu: 'Điều 2',
    khoan: 'Khoản 1',
    diem: null,
    tieu_de_dieu: 'Đối tượng áp dụng',
    token_count: 287,
    character_count: 1148,
  },
  {
    chunk_index: 3,
    dieu: 'Điều 2',
    khoan: 'Khoản 2',
    diem: 'Điểm a',
    tieu_de_dieu: 'Đối tượng áp dụng',
    token_count: 198,
    character_count: 792,
  },
  {
    chunk_index: 4,
    dieu: 'Điều 2',
    khoan: 'Khoản 2',
    diem: 'Điểm b',
    tieu_de_dieu: 'Đối tượng áp dụng',
    token_count: 205,
    character_count: 820,
  },
  {
    chunk_index: 5,
    dieu: 'Điều 3',
    khoan: null,
    diem: null,
    tieu_de_dieu: 'Giải thích từ ngữ',
    token_count: 445,
    character_count: 1780,
  },
  {
    chunk_index: 6,
    dieu: 'Điều 4',
    khoan: 'Khoản 1',
    diem: null,
    tieu_de_dieu: 'Thu nhập chịu thuế',
    token_count: 389,
    character_count: 1556,
  },
  {
    chunk_index: 7,
    dieu: 'Điều 4',
    khoan: 'Khoản 2',
    diem: null,
    tieu_de_dieu: 'Thu nhập chịu thuế',
    token_count: 356,
    character_count: 1424,
  },
  {
    chunk_index: 8,
    dieu: 'Điều 5',
    khoan: null,
    diem: null,
    tieu_de_dieu: 'Thu nhập được miễn thuế',
    token_count: 412,
    character_count: 1648,
  },
  {
    chunk_index: 9,
    dieu: 'Điều 6',
    khoan: 'Khoản 1',
    diem: 'Điểm a',
    tieu_de_dieu: 'Kỳ tính thuế',
    token_count: 178,
    character_count: 712,
  },
  {
    chunk_index: 10,
    dieu: 'Điều 6',
    khoan: 'Khoản 1',
    diem: 'Điểm b',
    tieu_de_dieu: 'Kỳ tính thuế',
    token_count: 162,
    character_count: 648,
  },
]

const mockKeywords: DocumentKeyword[] = [
  {
    keyword_text: 'thu nhập chịu thuế',
    keyword_type: 'legal_term',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: 'miễn thuế',
    keyword_type: 'legal_term',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: 'thuế thu nhập cá nhân',
    keyword_type: 'concept',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: 'Bộ Tài Chính',
    keyword_type: 'entity',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: '20%',
    keyword_type: 'numeric',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: 'khấu trừ thuế',
    keyword_type: 'legal_term',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: 'cư trú',
    keyword_type: 'concept',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: 'Tổng Cục Thuế',
    keyword_type: 'entity',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: 'giảm trừ gia cảnh',
    keyword_type: 'legal_term',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: '11 triệu đồng/tháng',
    keyword_type: 'numeric',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
]

const mockDocuments: LegalDocument[] = [
  {
    id: 'doc-001',
    document_name: 'Luật Thuế Thu Nhập Cá Nhân 2024',
    document_code: '38/2024/QH15',
    document_type: 'Luật',
    effective_date: '2024-07-01',
    expired_date: null,
    status: 'active',
    requires_ocr: false,
    total_pages: 48,
    total_chunks: 247,
    created_at: '2024-01-15T09:30:00Z',
    updated_at: '2024-05-10T14:22:00Z',
    source_file_name: 'luat_thue_tncn_2024_38_2024_QH15.pdf',
    source_file_path: '/storage/legal/laws/luat_thue_tncn_2024_38_2024_QH15.pdf',
    ocr_status: 'not_required',
    embedding_status: 'completed',
    token_count: 94328,
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    id: 'doc-002',
    document_name: 'Thông Tư Hướng Dẫn Về Quản Lý Thuế',
    document_code: '78/2023/TT-BTC',
    document_type: 'Thông Tư',
    effective_date: '2023-10-01',
    expired_date: null,
    status: 'active',
    requires_ocr: false,
    total_pages: 64,
    total_chunks: 389,
    created_at: '2023-09-20T11:00:00Z',
    updated_at: '2024-04-15T09:45:00Z',
    source_file_name: 'TT_78_2023_TT_BTC.pdf',
    source_file_path: '/storage/legal/circulars/TT_78_2023_TT_BTC.pdf',
    ocr_status: 'not_required',
    embedding_status: 'completed',
    token_count: 148752,
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    id: 'doc-003',
    document_name:
      'Nghị Định Quy Định Chi Tiết Một Số Điều Của Luật Quản Lý Thuế',
    document_code: '126/2023/NĐ-CP',
    document_type: 'Nghị Định',
    effective_date: '2023-11-15',
    expired_date: null,
    status: 'processing',
    requires_ocr: true,
    total_pages: 82,
    total_chunks: 0,
    created_at: '2024-05-20T08:00:00Z',
    updated_at: '2024-05-22T10:30:00Z',
    source_file_name: 'ND_126_2023_ND_CP_scan.pdf',
    source_file_path: '/storage/legal/decrees/ND_126_2023_ND_CP_scan.pdf',
    ocr_status: 'pending',
    embedding_status: 'pending',
    token_count: 0,
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    id: 'doc-005',
    document_name: 'Thông Tư Hướng Dẫn Thuế Giá Trị Gia Tăng',
    document_code: '219/2013/TT-BTC',
    document_type: 'Thông Tư',
    effective_date: '2014-01-01',
    expired_date: '2023-12-31',
    status: 'inactive',
    requires_ocr: false,
    total_pages: 56,
    total_chunks: 298,
    created_at: '2021-03-12T10:00:00Z',
    updated_at: '2024-01-05T08:00:00Z',
    source_file_name: 'TT_219_2013_TT_BTC.pdf',
    source_file_path: '/storage/legal/circulars/TT_219_2013_TT_BTC.pdf',
    ocr_status: 'not_required',
    embedding_status: 'completed',
    token_count: 112360,
    embedding_model: 'text-embedding-ada-002',
    vector_dimension: 1536,
  },
  {
    id: 'doc-006',
    document_name: 'Quyết Định Về Hệ Thống Mã Số Thuế',
    document_code: '15/2024/QĐ-BTC',
    document_type: 'Nghị Quyết',
    effective_date: '2024-04-01',
    expired_date: null,
    status: 'error',
    requires_ocr: true,
    total_pages: 28,
    total_chunks: 0,
    created_at: '2024-04-10T14:00:00Z',
    updated_at: '2024-04-12T16:45:00Z',
    source_file_name: 'QD_15_2024_BTC_scan_corrupt.pdf',
    source_file_path: '/storage/legal/decisions/QD_15_2024_BTC_scan_corrupt.pdf',
    ocr_status: 'failed',
    embedding_status: 'failed',
    token_count: 0,
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    id: 'doc-007',
    document_name: 'Nghị Định Hướng Dẫn Luật Thuế TNCN',
    document_code: '65/2013/NĐ-CP',
    document_type: 'Nghị Định',
    effective_date: '2013-08-01',
    expired_date: null,
    status: 'active',
    requires_ocr: false,
    total_pages: 44,
    total_chunks: 218,
    created_at: '2021-08-15T09:00:00Z',
    updated_at: '2023-11-20T10:30:00Z',
    source_file_name: 'ND_65_2013_ND_CP.pdf',
    source_file_path: '/storage/legal/decrees/ND_65_2013_ND_CP.pdf',
    ocr_status: 'not_required',
    embedding_status: 'completed',
    token_count: 82744,
    embedding_model: 'text-embedding-ada-002',
    vector_dimension: 1536,
  },
  {
    id: 'doc-008',
    document_name: 'Thông Tư Quy Định Về Hóa Đơn Điện Tử',
    document_code: '78/2021/TT-BTC',
    document_type: 'Thông Tư',
    effective_date: '2022-07-01',
    expired_date: null,
    status: 'active',
    requires_ocr: false,
    total_pages: 38,
    total_chunks: 176,
    created_at: '2021-09-12T11:00:00Z',
    updated_at: '2024-02-18T14:20:00Z',
    source_file_name: 'TT_78_2021_TT_BTC_hoadon.pdf',
    source_file_path: '/storage/legal/circulars/TT_78_2021_TT_BTC_hoadon.pdf',
    ocr_status: 'not_required',
    embedding_status: 'completed',
    token_count: 66528,
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
]

function StatusBadge({ status }: { status: LegalDocument['status'] }) {
  const configs = {
    active: {
      label: 'Hoạt động',
      className: 'bg-[#ecfdf5] text-[#059669]',
      icon: CheckCircle2,
    },
    inactive: {
      label: 'Không hoạt động',
      className: 'bg-[#f3f4f6] text-[#6b7280]',
      icon: ToggleLeft,
    },
    processing: {
      label: 'Đang xử lý',
      className: 'bg-[#fef9c3] text-[#ca8a04] animate-pulse',
      icon: Clock,
    },
    error: {
      label: 'Lỗi',
      className: 'bg-red-100 text-[#dc2626]',
      icon: XCircle,
    },
    pending: {
      label: 'Chờ xử lý',
      className: 'bg-[#fff7ed] text-[#ea580c]',
      icon: Clock,
    },
  }

  const { label, className } = configs[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${className.includes('ecfdf5') ? 'bg-[#10b981]' : className.includes('f3f4f6') ? 'bg-[#9ca3af]' : className.includes('fef9c3') ? 'bg-[#f59e0b]' : className.includes('fef2f2') ? 'bg-[#ef4444]' : 'bg-[#f97316]'}`}
      />
      {label}
    </span>
  )
}

function OcrBadge({ status }: { status: LegalDocument['ocr_status'] }) {
  const configs = {
    completed: {
      label: 'COMPLETED',
      className: 'bg-[#ecfdf5] text-[#10b981]',
    },
    pending: {
      label: 'PENDING',
      className: 'bg-[#fff7ed] text-[#f59e0b]',
    },
    failed: {
      label: 'FAILED',
      className: 'bg-[#fef2f2] text-[#ef4444]',
    },
    not_required: {
      label: 'NATIVE PDF',
      className: 'bg-[#f3f4f6] text-[#9ca3af]',
    },
  }

  const { label, className } = configs[status]
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  )
}

function KeywordTypeBadge({ type }: { type: DocumentKeyword['keyword_type'] }) {
  const configs = {
    entity: {
      label: 'Entity',
      cls: 'bg-[#eff6ff] text-[#3b82f6]',
    },
    concept: {
      label: 'Concept',
      cls: 'bg-[#f5f3ff] text-[#8b5cf6]',
    },
    legal_term: {
      label: 'Legal Term',
      cls: 'bg-[#ecfdf5] text-[#10b981]',
    },
    numeric: {
      label: 'Numeric',
      cls: 'bg-[#fef3c7] text-[#f59e0b]',
    },
  }

  const { label, cls } = configs[type]
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-sm font-medium ${cls}`}
    >
      {label}
    </span>
  )
}

function ActionsMenu({doc, onView, onDelete, onToggle}: {
  doc: LegalDocument,
  onView: () => void,
  onDelete: () => void,
  onToggle: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const actions = [
    {
      icon: Eye,
      label: 'Xem chi tiết',
      handler: onView,
      variant: 'default' as const,
    },
    {
      icon: FileUp,
      label: 'Cập nhật PDF',
      handler: () => {},
      variant: 'default' as const,
    },
    {
      icon: RefreshCw,
      label: 'Re-index',
      handler: () => {},
      variant: 'default' as const,
    },
    null,
    {
      icon: doc.status === 'active' ? ToggleLeft : ToggleRight,
      label:
        doc.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt',
      handler: onToggle,
      variant: 'default' as const,
    },
    {
      icon: Trash2,
      label: 'Xóa tài liệu',
      handler: onDelete,
      variant: 'danger' as const,
    },
  ]

  return (
    <div className='relative' ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className='p-1.5 rounded-md text-[#9ca3af] hover:text-[#1a1a1a] hover:bg-[#f9fafb] transition-colors'
      >
        <MoreHorizontal className='w-3.5 h-3.5' />
      </button>
      {open && (
        <>
          <div
            className='fixed inset-0 z-40'
            onClick={() => setOpen(false)}
          />
          <div className='absolute right-0 top-8 z-50 w-52 bg-white border border-[#e5e7eb] rounded-lg shadow-xl overflow-hidden'>
            {actions.map((action, i) =>
              action === null ? (
                <div
                  key={i}
                  className='my-1 border-t border-gray-300'
                />
              ) : (
                <button
                  key={action.label}
                  onClick={() => {
                    setOpen(false)
                    action.handler()
                  }}
                  disabled={Boolean('disabled' in action && action.disabled)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    action.variant === 'danger'
                      ? 'text-[#dc2626] hover:bg-[#fef2f2]'
                      : 'text-[#1a1a1a] hover:bg-[#f9fafb]'
                  }`}
                >
                  <action.icon className='w-3.5 h-3.5' />
                  {action.label}
                </button>
              ),
            )}
          </div>
        </>
      )}
    </div>
  )
}

function DocumentDrawer({ doc, onClose }: {
  doc: LegalDocument,
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'ai' | 'chunks' | 'keywords'>('pdf')
  const tabs = [
    { id: 'pdf' as const, label: 'PDF Info', icon: FileText },
    { id: 'ai' as const, label: 'AI Processing', icon: Cpu },
    { id: 'chunks' as const, label: 'Chunks', icon: Layers },
    { id: 'keywords' as const, label: 'Keywords', icon: Tag },
  ]

  return (
    <>
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity'
        onClick={onClose}
      />
      <div className='fixed right-0 top-0 h-full w-[680px] bg-white border-l border-[#e5e7eb] z-50 flex flex-col shadow-2xl'>
        <div className='flex items-start justify-between px-6 py-5 border-b border-[#e5e7eb] bg-white flex-shrink-0'>
          <div className='flex-1 min-w-0 pr-4'>
            <h2 className='text-base font-semibold text-[#1a1a1a] leading-snug mt-2'>
              {doc.document_name}
            </h2>
            <p className='text-sm text-[#6b7280] mt-1 font-mono'>
              {doc.document_code}
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-1.5 rounded-md text-[#9ca3af] hover:text-[#1a1a1a] hover:bg-[#f9fafb] transition-colors mt-1 flex-shrink-0'
          >
            <X className='w-4 h-4' />
          </button>
        </div>

        <div className='flex border-b border-[#e5e7eb] px-6 flex-shrink-0'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-[#5d2ec0] text-[#5d2ec0]'
                  : 'border-transparent text-[#9ca3af] hover:text-[#1a1a1a]'
              }`}
            >
              <tab.icon className='w-3.5 h-3.5' />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className='flex-1 overflow-y-auto p-6 space-y-5'>
          {activeTab === 'pdf' && (
            <div className='space-y-4'>
              <h3 className='text-sm font-semibold text-[#9ca3af] uppercase tracking-wider'>
                PDF Information
              </h3>
              <div className='bg-white border border-[#e5e7eb] rounded-lg overflow-hidden'>
                {[
                  {
                    label: 'Source File Name',
                    value: doc.source_file_name,
                    mono: true,
                  },
                  {
                    label: 'Storage Path',
                    value: doc.source_file_path,
                    mono: true,
                  },
                  {
                    label: 'Total Pages',
                    value: `${doc.total_pages} pages`,
                  },
                  {
                    label: 'Created At',
                    value: new Date(
                      doc.created_at,
                    ).toLocaleString('vi-VN'),
                  },
                  {
                    label: 'Updated At',
                    value: new Date(
                      doc.updated_at,
                    ).toLocaleString('vi-VN'),
                  },
                  {
                    label: 'Effective Date',
                    value: doc.effective_date,
                  },
                  {
                    label: 'Expired Date',
                    value: doc.expired_date ?? '—',
                  },
                ].map(({ label, value, mono }) => (
                  <div
                    key={label}
                    className='flex items-start justify-between px-4 py-3 border-b border-[#e5e7eb] last:border-0 gap-4'
                  >
                    <span className='text-sm text-[#9ca3af] flex-shrink-0 pt-0.5 w-36'>
                      {label}
                    </span>
                    <span
                      className={`text-sm text-[#1a1a1a] text-right break-all ${mono ? 'font-mono text-[11px]' : ''}`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className='flex items-center gap-2 p-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg'>
                <Download className='w-4 h-4 text-[#9ca3af] flex-shrink-0' />
                <span className='text-sm text-[#9ca3af] flex-1 truncate'>
                  {doc.source_file_name}
                </span>
                <button className='text-sm text-[#5d2ec0] hover:text-[#4c25a0] font-medium'>
                  Download
                </button>
              </div>
            </div>
          )}

          {/* ── AI Processing ── */}
          {activeTab === 'ai' && (
            <div className='space-y-4'>
              <h3 className='text-sm font-semibold text-[#9ca3af] uppercase tracking-wider'>
                AI Processing Status
              </h3>

              {/* Processing pipeline */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='bg-white border border-[#e5e7eb] rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='text-sm text-[#9ca3af]'>
                      OCR Status
                    </span>
                    <FileSearch className='w-3.5 h-3.5 text-[#9ca3af]' />
                  </div>
                  <OcrBadge status={doc.ocr_status} />
                  <p className='text-sm text-[#9ca3af] mt-2'>
                    {doc.requires_ocr
                      ? 'Scanned PDF — OCR required'
                      : 'Digital PDF — no OCR needed'}
                  </p>
                </div>
                <div className='bg-white border border-[#e5e7eb] rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='text-sm text-[#9ca3af]'>
                      Embedding Status
                    </span>
                    <Database className='w-3.5 h-3.5 text-[#9ca3af]' />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                      doc.embedding_status === 'completed'
                        ? 'text-[#10b981]'
                        : doc.embedding_status === 'pending'
                          ? 'text-[#f59e0b]'
                          : doc.embedding_status === 'failed'
                            ? 'text-[#ef4444]'
                            : 'text-[#3b82f6]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        doc.embedding_status === 'completed'
                          ? 'bg-[#10b981]'
                          : doc.embedding_status === 'pending'
                            ? 'bg-[#f59e0b]'
                            : doc.embedding_status === 'failed'
                              ? 'bg-[#ef4444]'
                              : 'bg-[#3b82f6] animate-pulse'
                      }`}
                    />
                    {doc.embedding_status === 'completed'
                      ? 'Indexed'
                      : doc.embedding_status === 'pending'
                        ? 'Pending'
                        : doc.embedding_status === 'failed'
                          ? 'Failed'
                          : 'Indexing…'}
                  </span>
                  <p className='text-sm text-[#9ca3af] mt-2'>
                    {doc.embedding_model}
                  </p>
                </div>
              </div>

              {/* Token stats */}
              <div className='bg-white border border-[#e5e7eb] rounded-lg overflow-hidden'>
                <div className='px-4 py-3 border-b border-[#e5e7eb]'>
                  <span className='text-sm font-medium text-[#1a1a1a]'>
                    Token & Chunk Statistics
                  </span>
                </div>
                {[
                  {
                    label: 'Total Chunks',
                    value: doc.total_chunks.toLocaleString(),
                    icon: Layers,
                  },
                  {
                    label: 'Total Tokens',
                    value:
                      doc.token_count > 0
                        ? doc.token_count.toLocaleString()
                        : '—',
                    icon: Hash,
                  },
                  {
                    label: 'Avg Tokens/Chunk',
                    value:
                      doc.total_chunks > 0
                        ? Math.round(
                            doc.token_count / doc.total_chunks,
                          ).toLocaleString()
                        : '—',
                    icon: BarChart2,
                  },
                  {
                    label: 'Embedding Model',
                    value: doc.embedding_model,
                    icon: Cpu,
                  },
                  {
                    label: 'Vector Dimension',
                    value:
                      doc.vector_dimension.toLocaleString(),
                    icon: Activity,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className='flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb] last:border-0'
                  >
                    <div className='flex items-center gap-2'>
                      <Icon className='w-3.5 h-3.5 text-[#9ca3af]' />
                      <span className='text-sm text-[#9ca3af]'>
                        {label}
                      </span>
                    </div>
                    <span className='text-sm font-medium text-[#1a1a1a] font-mono'>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Processing actions */}
              <div className='flex gap-2'>
                <button className='flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#f9fafb] hover:bg-[#f3f4f6] border border-[#e5e7eb] rounded-lg text-sm font-medium text-[#1a1a1a] transition-colors'>
                  <FileSearch className='w-3.5 h-3.5' />
                  Reprocess OCR
                </button>
                <button className='flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#faf5ff] hover:bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg text-sm font-medium text-[#5d2ec0] transition-colors'>
                  <RefreshCw className='w-3.5 h-3.5' />
                  Re-index Embeddings
                </button>
              </div>
            </div>
          )}

          {/* ── Chunk Explorer ── */}
          {activeTab === 'chunks' && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold text-[#9ca3af] uppercase tracking-wider'>
                  Chunk Explorer
                </h3>
                <span className='text-sm text-[#9ca3af]'>
                  {mockChunks.length} / {doc.total_chunks}{' '}
                  chunks shown
                </span>
              </div>
              <div className='bg-white border border-[#e5e7eb] rounded-lg overflow-hidden'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-[#e5e7eb] bg-[#f9fafb]'>
                      <th className='px-3 py-2.5 text-left text-[#9ca3af] font-medium w-10'>
                        #
                      </th>
                      <th className='px-3 py-2.5 text-left text-[#9ca3af] font-medium'>
                        Điều / Khoản / Điểm
                      </th>
                      <th className='px-3 py-2.5 text-left text-[#9ca3af] font-medium'>
                        Tiêu đề
                      </th>
                      <th className='px-3 py-2.5 text-right text-[#9ca3af] font-medium'>
                        Tokens
                      </th>
                      <th className='px-3 py-2.5 text-right text-[#9ca3af] font-medium'>
                        Chars
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-[#e5e7eb]'>
                    {mockChunks.map((chunk) => (
                      <tr
                        key={chunk.chunk_index}
                        className='hover:bg-[#f9fafb] transition-colors group'
                      >
                        <td className='px-3 py-2.5 font-mono text-[#9ca3af]'>
                          {chunk.chunk_index}
                        </td>
                        <td className='px-3 py-2.5'>
                          <div className='space-y-0.5'>
                            <span className='text-[#5d2ec0] font-medium'>
                              {chunk.dieu}
                            </span>
                            {chunk.khoan && (
                              <span className='block text-[#9ca3af]'>
                                {chunk.khoan}
                              </span>
                            )}
                            {chunk.diem && (
                              <span className='block text-[#9ca3af]'>
                                {chunk.diem}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className='px-3 py-2.5 text-[#1a1a1a] max-w-[160px]'>
                          <span
                            className='truncate block'
                            title={chunk.tieu_de_dieu}
                          >
                            {chunk.tieu_de_dieu}
                          </span>
                        </td>
                        <td className='px-3 py-2.5 text-right font-mono text-[#9ca3af]'>
                          {chunk.token_count}
                        </td>
                        <td className='px-3 py-2.5 text-right font-mono text-[#9ca3af]'>
                          {chunk.character_count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {doc.total_chunks > mockChunks.length && (
                <button className='w-full py-2 text-sm text-[#9ca3af] hover:text-[#1a1a1a] text-center transition-colors'>
                  Load more chunks (
                  {doc.total_chunks - mockChunks.length}{' '}
                  remaining)
                </button>
              )}
            </div>
          )}

          {/* ── Keywords & Embeddings ── */}
          {activeTab === 'keywords' && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold text-[#9ca3af] uppercase tracking-wider'>
                  Keywords & Embeddings
                </h3>
                <span className='text-sm text-[#9ca3af]'>
                  {mockKeywords.length} extracted
                </span>
              </div>
              <div className='bg-white border border-[#e5e7eb] rounded-lg overflow-hidden'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-[#e5e7eb] bg-[#f9fafb]'>
                      <th className='px-3 py-2.5 text-left text-[#9ca3af] font-medium'>
                        Keyword
                      </th>
                      <th className='px-3 py-2.5 text-left text-[#9ca3af] font-medium'>
                        Type
                      </th>
                      <th className='px-3 py-2.5 text-left text-[#9ca3af] font-medium'>
                        Model
                      </th>
                      <th className='px-3 py-2.5 text-right text-[#9ca3af] font-medium'>
                        Dim
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-[#e5e7eb]'>
                    {mockKeywords.map((kw, i) => (
                      <tr
                        key={i}
                        className='hover:bg-[#f9fafb] transition-colors'
                      >
                        <td className='px-3 py-2.5 text-[#1a1a1a] font-medium'>
                          {kw.keyword_text}
                        </td>
                        <td className='px-3 py-2.5'>
                          <KeywordTypeBadge
                            type={kw.keyword_type}
                          />
                        </td>
                        <td className='px-3 py-2.5 text-[#9ca3af] font-mono text-[11px] truncate max-w-[120px]'>
                          {kw.embedding_model}
                        </td>
                        <td className='px-3 py-2.5 text-right font-mono text-[#9ca3af]'>
                          {kw.vector_dimension}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className='bg-[#faf5ff] border border-[#e9d5ff] rounded-lg p-4'>
                <div className='flex items-start gap-3'>
                  <Zap className='w-4 h-4 text-[#5d2ec0] mt-0.5 flex-shrink-0' />
                  <div>
                    <p className='text-sm font-medium text-[#1a1a1a] mb-1'>
                      Embedding Model Details
                    </p>
                    <p className='text-sm text-[#6b7280]'>
                      Model:{' '}
                      <span className='font-mono text-[#1a1a1a]'>
                        {doc.embedding_model}
                      </span>
                    </p>
                    <p className='text-sm text-[#6b7280]'>
                      Dimensions:{' '}
                      <span className='font-mono text-[#1a1a1a]'>
                        {doc.vector_dimension.toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function LegalDocumentManagement() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null)
  const [documents, setDocuments] = useState(mockDocuments)
  const docTypes = [
    'all',
    'Luật',
    'Thông Tư',
    'Nghị Định',
    'Nghị Quyết'
  ]

  const filtered = documents.filter((doc) => {
    const matchSearch =
      doc.document_name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      doc.document_code
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchType = typeFilter === 'all' || doc.document_type === typeFilter
    const matchStatus = statusFilter === 'all' || doc.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  const handleToggle = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status:
                d.status === 'active' ? 'inactive' : 'active',
            }
          : d,
      ),
    )
  }
  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    if (selectedDoc?.id === id) setSelectedDoc(null)
  }

  const stats = {
    total: documents.length,
    active: documents.filter((d) => d.status === 'active')
      .length,
    totalChunks: documents.reduce(
      (s, d) => s + d.total_chunks,
      0,
    ),
    processing: documents.filter(
      (d) =>
        d.status === 'processing' || d.status === 'pending',
    ).length,
    errors: documents.filter((d) => d.status === 'error')
      .length,
  }

  return (
    <div className='space-y-6 relative'>
        {/* Page Header */}
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-3xl font-semibold text-foreground'>
              Tài liệu pháp lý
            </h1>
            <p className='text-md text-muted-foreground mt-1'>
              Quản lý toàn bộ tài liệu pháp luật, quyết định và
              hướng dẫn thuế trong hệ thống TaxMate AI
            </p>
          </div>
          <div className='flex shrink-0 items-center gap-3'>
            <button
              type='button'
              className='inline-flex h-[38px] shrink-0 items-center justify-center gap-2 rounded-[10px] border-0 bg-[#6226c1] px-4 text-sm font-medium text-white shadow-none transition-colors hover:bg-[#5224a8]'
            >
              <Plus className='h-4 w-4' strokeWidth={2} />
              Thêm tài liệu
            </button>
            <button
              type='button'
              className='inline-flex h-[38px] shrink-0 items-center justify-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-sm font-medium text-[#374151] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:bg-[#f9fafb]'
            >
              <RefreshCw className='h-4 w-4' strokeWidth={2} />
              Đồng bộ dữ liệu
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className='grid grid-cols-5 gap-[15.8px]'>
          {[
            {
              label: 'Tổng tài liệu',
              value: stats.total,
              icon: FileText,
              iconColor: '#5d2ec0',
              iconBg: '#faf5ff',
              subtext: '2 tài liệu mới trong 7 ngày',
            },
            {
              label: 'Đang hoạt động',
              value: stats.active,
              icon: CheckCircle2,
              iconColor: '#10b981',
              iconBg: '#ecfdf5',
              subtext: '62.5% tổng tài liệu',
            },
            {
              label: 'Tổng chunks',
              value: '1.940',
              icon: Layers,
              iconColor: '#3b82f6',
              iconBg: '#eff6ff',
              subtext: 'Đã lập chỉ mục',
            },
            {
              label: 'Chờ xử lý',
              value: stats.processing,
              icon: Clock,
              iconColor: '#f59e0b',
              iconBg: '#fff7ed',
              subtext: 'Đang trong hàng đợi',
            },
            {
              label: 'Lỗi',
              value: stats.errors,
              icon: AlertTriangle,
              iconColor: '#ef4444',
              iconBg: '#fef2f2',
              subtext: 'Cần kiểm tra tháng này',
            },
          ].map(
            ({
              label,
              value,
              icon: Icon,
              iconColor,
              iconBg,
              subtext,
            }) => (
              <div
                key={label}
                className='bg-white border border-[#f3f4f6] rounded-xl p-[21px] shadow-sm flex items-start justify-between'
              >
                <div>
                  <p className='text-base font-medium text-[#6b7280] mb-2'>
                    {label}
                  </p>
                  <p
                    className='text-[30px] font-bold leading-9'
                    style={{
                      color:
                        label === 'Tổng tài liệu'
                          ? '#0a0a0a'
                          : iconColor,
                    }}
                  >
                    {value}
                  </p>
                  {subtext && (
                    <div className='flex items-center gap-1 mt-2.5'>
                      <TrendingUp className='w-[13px] h-[11px] text-green-500' />
                      <p className='text-[13px] text-green-500'>
                        {subtext}
                      </p>
                    </div>
                  )}
                </div>
                <div
                  className='w-10 h-10 rounded-lg flex items-center justify-center'
                  style={{ backgroundColor: iconBg }}
                >
                  <Icon
                    className='w-5 h-5'
                    style={{ color: iconColor }}
                  />
                </div>
              </div>
            ),
          )}
        </div>

        {/* Toolbar */}
        <div className='flex items-center gap-3 flex-wrap'>
          <div className='relative flex-1 min-w-[320px]'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9ca3af]' />
            <input
              type='text'
              placeholder='Tìm kiếm theo tên tài liệu, mã hiệu...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='w-full pl-[39px] pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-[#9ca3af] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-400'
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className='px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-[#4b5563] focus:outline-none focus:ring-1 focus:ring-green-400'
          >
            <option value='all'>Loại tài liệu</option>
            {docTypes
              .filter((t) => t !== 'all')
              .map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
          </select>

          <select className='px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-[#4b5563] focus:outline-none focus:ring-1 focus:ring-green-400'>
            <option>Trạng thái</option>
            <option>Hoạt động</option>
            <option>Không hoạt động</option>
          </select>

          <button className='p-2.5 bg-white border border-gray-300 rounded-lg hover:bg-[#f9fafb] transition-colors'>
            <svg
              className='w-4.5 h-4.5'
              fill='none'
              viewBox='0 0 18 18'
            >
              <path
                d='M16.5 2.25H1.5L7.5 9.345V14.25L10.5 15.75V9.345L16.5 2.25Z'
                stroke='#4b5563'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>
        </div>

        {/* Document Table */}
        <div className='bg-white border border-[#f3f4f6] rounded-xl shadow-sm overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-[#f9fafb]'>
                  <th className='px-6 py-3.5 text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                    Tài liệu
                  </th>
                  <th className='px-4 py-3.5 text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                    Loại tài liệu
                  </th>
                  <th className='px-4 py-3.5 text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                    Hiệu lực
                  </th>
                  <th className='px-4 py-3.5 text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                    Trạng thái
                  </th>
                  <th className='px-4 py-3.5 text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                    OCR
                  </th>
                  <th className='px-4 py-3.5 text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                    Chunks
                  </th>
                  <th className='px-4 py-3.5 text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                    Cập nhật
                  </th>
                  <th className='px-4 py-3.5 text-right text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className='px-4 py-12 text-center text-sm text-[#9ca3af]'
                    >
                      No documents match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className='border-t border-[#f9fafb] hover:bg-[#f9fafb] transition-colors cursor-pointer group'
                    >
                      <td className='px-6 py-5'>
                        <div className='flex items-center gap-3'>
                          <div
                            className='w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0'
                          >
                            <FileText className='w-5 h-5 text-white' />
                          </div>
                          <div className='min-w-0'>
                            <p className='text-sm font-semibold text-[#1a1a1a] truncate'>
                              {doc.document_name}
                            </p>
                            <div className='flex items-center gap-2 mt-1.5'>
                              <span className='text-sm text-[#9ca3af] font-mono'>
                                {doc.document_code}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-5'>
                        <span className='text-sm text-[#4b5563]'>
                          {doc.document_type}
                        </span>
                      </td>
                      <td className='px-4 py-5'>
                        <div>
                          <p className='text-sm font-medium text-[#374151]'>
                            {doc.effective_date}
                          </p>
                          <p className='text-[11px] text-[#10b981] mt-1'>
                            Còn hiệu lực
                          </p>
                        </div>
                      </td>
                      <td className='px-4 py-5'>
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className='px-4 py-5'>
                        <OcrBadge status={doc.ocr_status} />
                      </td>
                      <td className='px-4 py-5'>
                        <span className='text-sm text-[#6b7280]'>
                          {doc.total_chunks > 0
                            ? doc.total_chunks
                            : '---'}
                        </span>
                      </td>
                      <td className='px-4 py-5'>
                        <div>
                          <p className='text-sm text-[#374151]'>
                            {new Date(
                              doc.updated_at,
                            ).toLocaleDateString('vi-VN')}
                          </p>
                          <p className='text-[11px] text-[#9ca3af] mt-1'>
                            {new Date(
                              doc.updated_at,
                            ).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </td>
                      <td
                        className='px-4 py-5'
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className='flex items-center justify-end gap-2'>
                          <button
                            onClick={() => setSelectedDoc(doc)}
                            className='text-sm font-medium text-gray-400 hover:underline'
                          >
                            Xem chi tiết
                          </button>
                      
                          <ActionsMenu
                            doc={doc}
                            onView={() => setSelectedDoc(doc)}
                            onDelete={() => handleDelete(doc.id)}
                            onToggle={() => handleToggle(doc.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className='px-6 py-4 border-t border-[#f9fafb] flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <button className='px-3 py-2 bg-[#5d2ec0] text-white text-sm font-medium rounded hover:bg-[#4c25a0] transition-colors'>
                1
              </button>
              <button className='px-3 py-2 text-sm font-medium text-[#6b7280] hover:bg-[#f9fafb] rounded transition-colors'>
                2
              </button>
              <button className='px-3 py-2 text-sm font-medium text-[#6b7280] hover:bg-[#f9fafb] rounded transition-colors'>
                3
              </button>
            </div>
            <span className='text-sm text-[#9ca3af]'>
              Hiển thị 1 đến 6 trong tổng số {documents.length}{' '}
              tài liệu
            </span>
          </div>
        </div>

        {selectedDoc && (
          <DocumentDrawer
            doc={selectedDoc}
            onClose={() => setSelectedDoc(null)}
          />
        )}
    </div>
  )
}