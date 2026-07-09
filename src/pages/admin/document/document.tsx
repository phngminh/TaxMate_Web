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
import { Button } from '../../../components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '../../../components/ui/pagination'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'

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
    keyword_type: 'Legal_term',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: 'miễn thuế',
    keyword_type: 'Legal_term',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: 'thuế thu nhập cá nhân',
    keyword_type: 'Concept',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: 'Bộ Tài Chính',
    keyword_type: 'Entity',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: '20%',
    keyword_type: 'Numeric',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: 'khấu trừ thuế',
    keyword_type: 'Legal_term',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: 'cư trú',
    keyword_type: 'Concept',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: 'Tổng Cục Thuế',
    keyword_type: 'Entity',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: 'giảm trừ gia cảnh',
    keyword_type: 'Legal_term',
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
  {
    keyword_text: '11 triệu đồng/tháng',
    keyword_type: 'Numeric',
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
    status: 'Active',
    requires_ocr: false,
    total_pages: 48,
    total_chunks: 247,
    created_at: '2024-01-15T09:30:00Z',
    updated_at: '2024-05-10T14:22:00Z',
    source_file_name: 'luat_thue_tncn_2024_38_2024_QH15.pdf',
    source_file_path: '/storage/legal/laws/luat_thue_tncn_2024_38_2024_QH15.pdf',
    ocr_status: 'Not_required',
    embedding_status: 'Completed',
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
    status: 'Active',
    requires_ocr: false,
    total_pages: 64,
    total_chunks: 389,
    created_at: '2023-09-20T11:00:00Z',
    updated_at: '2024-04-15T09:45:00Z',
    source_file_name: 'TT_78_2023_TT_BTC.pdf',
    source_file_path: '/storage/legal/circulars/TT_78_2023_TT_BTC.pdf',
    ocr_status: 'Not_required',
    embedding_status: 'Completed',
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
    status: 'Processing',
    requires_ocr: true,
    total_pages: 82,
    total_chunks: 0,
    created_at: '2024-05-20T08:00:00Z',
    updated_at: '2024-05-22T10:30:00Z',
    source_file_name: 'ND_126_2023_ND_CP_scan.pdf',
    source_file_path: '/storage/legal/decrees/ND_126_2023_ND_CP_scan.pdf',
    ocr_status: 'Pending',
    embedding_status: 'Pending',
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
    status: 'Inactive',
    requires_ocr: false,
    total_pages: 56,
    total_chunks: 298,
    created_at: '2021-03-12T10:00:00Z',
    updated_at: '2024-01-05T08:00:00Z',
    source_file_name: 'TT_219_2013_TT_BTC.pdf',
    source_file_path: '/storage/legal/circulars/TT_219_2013_TT_BTC.pdf',
    ocr_status: 'Not_required',
    embedding_status: 'Completed',
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
    status: 'Error',
    requires_ocr: true,
    total_pages: 28,
    total_chunks: 0,
    created_at: '2024-04-10T14:00:00Z',
    updated_at: '2024-04-12T16:45:00Z',
    source_file_name: 'QD_15_2024_BTC_scan_corrupt.pdf',
    source_file_path: '/storage/legal/decisions/QD_15_2024_BTC_scan_corrupt.pdf',
    ocr_status: 'Failed',
    embedding_status: 'Failed',
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
    status: 'Active',
    requires_ocr: false,
    total_pages: 44,
    total_chunks: 218,
    created_at: '2021-08-15T09:00:00Z',
    updated_at: '2023-11-20T10:30:00Z',
    source_file_name: 'ND_65_2013_ND_CP.pdf',
    source_file_path: '/storage/legal/decrees/ND_65_2013_ND_CP.pdf',
    ocr_status: 'Not_required',
    embedding_status: 'Completed',
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
    status: 'Active',
    requires_ocr: false,
    total_pages: 38,
    total_chunks: 176,
    created_at: '2021-09-12T11:00:00Z',
    updated_at: '2024-02-18T14:20:00Z',
    source_file_name: 'TT_78_2021_TT_BTC_hoadon.pdf',
    source_file_path: '/storage/legal/circulars/TT_78_2021_TT_BTC_hoadon.pdf',
    ocr_status: 'Not_required',
    embedding_status: 'Completed',
    token_count: 66528,
    embedding_model: 'text-embedding-3-large',
    vector_dimension: 3072,
  },
]

function StatusBadge({ status }: { status: LegalDocument['status'] }) {
  const configs = {
    Active: {
      label: 'Hoạt động',
      className: 'bg-[#ecfdf5] text-[#059669]',
      dot: 'bg-[#10b981]',
    },
    Inactive: {
      label: 'Không hoạt động',
      className: 'bg-[#f3f4f6] text-[#6b7280]',
      dot: 'bg-[#9ca3af]',
    },
    Processing: {
      label: 'Đang xử lý',
      className: 'bg-[#fef9c3] text-[#ca8a04] animate-pulse',
      dot: 'bg-[#f59e0b]',
    },
    Error: {
      label: 'Lỗi',
      className: 'bg-red-100 text-[#dc2626]',
      dot: 'bg-[#ef4444]',
    },
    Pending: {
      label: 'Chờ xử lý',
      className: 'bg-[#fff7ed] text-[#ea580c]',
      dot: 'bg-[#f97316]',
    },
  }

  const { label, className, dot } = configs[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

function OcrBadge({ status }: { status: LegalDocument['ocr_status'] }) {
  const configs = {
    Completed: {
      label: 'COMPLETED',
      className: 'bg-[#ecfdf5] text-[#10b981]',
    },
    Pending: {
      label: 'PENDING',
      className: 'bg-[#fff7ed] text-[#f59e0b]',
    },
    Failed: {
      label: 'FAILED',
      className: 'bg-[#fef2f2] text-[#ef4444]',
    },
    Not_required: {
      label: 'NATIVE PDF',
      className: 'bg-[#f3f4f6] text-[#9ca3af]',
    },
  }

  const { label, className } = configs[status]
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  )
}

function KeywordTypeBadge({ type }: { type: DocumentKeyword['keyword_type'] }) {
  const configs = {
    Entity: {
      label: 'Entity',
      cls: 'bg-[#eff6ff] text-[#3b82f6]',
    },
    Concept: {
      label: 'Concept',
      cls: 'bg-[#f5f3ff] text-[#8b5cf6]',
    },
    Legal_term: {
      label: 'Legal Term',
      cls: 'bg-[#ecfdf5] text-[#10b981]',
    },
    Numeric: {
      label: 'Numeric',
      cls: 'bg-[#fef3c7] text-[#f59e0b]',
    },
  }

  const { label, cls } = configs[type]
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-sm text-sm font-medium ${cls}`}
    >
      {label}
    </span>
  )
}

function ActionsMenu({
  doc,
  onView,
  onDelete,
  onToggle,
}: {
  doc: LegalDocument
  onView: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger {...({ asChild: true } as any)}>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-md text-[#9ca3af] hover:text-[#1a1a1a] hover:bg-[#f9fafb] transition-colors"
        >
          <MoreHorizontal className='w-3.5 h-3.5' />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='end'
        sideOffset={6}
        className='w-52'
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem onClick={onView}>
          <Eye className='mr-2 h-4 w-4' />
          Xem chi tiết
        </DropdownMenuItem>

        <DropdownMenuItem>
          <FileUp className='mr-2 h-4 w-4' />
          Cập nhật PDF
        </DropdownMenuItem>

        <DropdownMenuItem>
          <RefreshCw className='mr-2 h-4 w-4' />
          Re-index
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onToggle}>
          {doc.status === 'Active' ? (
            <ToggleLeft className='mr-2 h-4 w-4' />
          ) : (
            <ToggleRight className='mr-2 h-4 w-4' />
          )}

          {doc.status === 'Active'
            ? 'Vô hiệu hóa'
            : 'Kích hoạt'}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onDelete}
          className='text-red-600 focus:text-red-600'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Xóa tài liệu
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
        className='fixed h-screen inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity'
        onClick={onClose}
      />
      <div className='fixed right-0 top-0 h-full w-170 bg-white border-l border-[#e5e7eb] z-50 flex flex-col shadow-2xl'>
        <div className='flex items-start justify-between px-6 py-5 border-b border-[#e5e7eb] bg-white shrink-0'>
          <div className='flex-1 min-w-0 pr-4'>
            <h2 className='text-base font-semibold text-[#1a1a1a] leading-snug mt-2'>
              {doc.document_name}
            </h2>
            <p className='text-sm text-[#6b7280] mt-1 font-mono'>
              {doc.document_code}
            </p>
          </div>
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={onClose}
            className='mt-1 shrink-0 text-[#9ca3af] hover:text-[#1a1a1a]'
          >
            <X className='w-4 h-4' />
          </Button>
        </div>

        {/* Tabs */}
        <div className='flex border-b border-[#e5e7eb] px-6 shrink-0'>
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
              <div className='bg-card border border-border rounded-xl overflow-hidden'>
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
                    <span className='text-sm text-[#9ca3af] shrink-0 pt-0.5 w-36'>
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
                <Download className='w-4 h-4 text-[#9ca3af] shrink-0' />
                <span className='text-sm text-[#9ca3af] flex-1 truncate'>
                  {doc.source_file_name}
                </span>
                <Button variant='link' size='sm' className='text-[#5d2ec0] hover:text-[#4c25a0] p-0 h-auto'>
                  Download
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className='space-y-4'>
              <h3 className='text-sm font-semibold text-[#9ca3af] uppercase tracking-wider'>
                AI Processing Status
              </h3>

              <div className='grid grid-cols-2 gap-3'>
                <div className='bg-card border border-border rounded-xl p-4'>
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
                <div className='bg-card border border-border rounded-xl p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='text-sm text-[#9ca3af]'>
                      Embedding Status
                    </span>
                    <Database className='w-3.5 h-3.5 text-[#9ca3af]' />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                      doc.embedding_status === 'Completed'
                        ? 'text-[#10b981]'
                        : doc.embedding_status === 'Pending'
                          ? 'text-[#f59e0b]'
                          : doc.embedding_status === 'Failed'
                            ? 'text-[#ef4444]'
                            : 'text-[#3b82f6]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        doc.embedding_status === 'Completed'
                          ? 'bg-[#10b981]'
                          : doc.embedding_status === 'Pending'
                            ? 'bg-[#f59e0b]'
                            : doc.embedding_status === 'Failed'
                              ? 'bg-[#ef4444]'
                              : 'bg-[#3b82f6] animate-pulse'
                      }`}
                    />
                    {doc.embedding_status === 'Completed'
                      ? 'Indexed'
                      : doc.embedding_status === 'Pending'
                        ? 'Pending'
                        : doc.embedding_status === 'Failed'
                          ? 'Failed'
                          : 'Indexing…'}
                  </span>
                  <p className='text-sm text-[#9ca3af] mt-2'>
                    {doc.embedding_model}
                  </p>
                </div>
              </div>

              {/* Token stats */}
              <div className='bg-card border border-border rounded-xl overflow-hidden'>
                <div className='px-4 py-3 border-b border-[#e5e7eb]'>
                  <span className='text-sm font-medium text-[#1a1a1a]'>
                    Token &amp; Chunk Statistics
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
                <Button
                  variant='outline'
                  className='flex-1 text-[#1a1a1a]'
                >
                  <FileSearch className='w-3.5 h-3.5' />
                  Reprocess OCR
                </Button>
                <Button
                  variant='outline'
                  className='flex-1 border-[#e9d5ff] bg-[#faf5ff] hover:bg-[#f5f0ff] text-[#5d2ec0]'
                >
                  <RefreshCw className='w-3.5 h-3.5' />
                  Re-index Embeddings
                </Button>
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
              <div className='bg-card border border-border rounded-xl overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow className='border-b border-[#e5e7eb] bg-[#f9fafb]'>
                      <TableHead className='px-3 py-2.5 text-[#9ca3af] font-medium w-10'>
                        #
                      </TableHead>
                      <TableHead className='px-3 py-2.5 text-[#9ca3af] font-medium'>
                        Điều / Khoản / Điểm
                      </TableHead>
                      <TableHead className='px-3 py-2.5 text-[#9ca3af] font-medium'>
                        Tiêu đề
                      </TableHead>
                      <TableHead className='px-3 py-2.5 text-right text-[#9ca3af] font-medium'>
                        Tokens
                      </TableHead>
                      <TableHead className='px-3 py-2.5 text-right text-[#9ca3af] font-medium'>
                        Chars
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className='divide-y divide-[#e5e7eb]'>
                    {mockChunks.map((chunk) => (
                      <TableRow
                        key={chunk.chunk_index}
                        className='hover:bg-[#f9fafb] transition-colors group'
                      >
                        <TableCell className='px-3 py-2.5 font-mono text-[#9ca3af]'>
                          {chunk.chunk_index}
                        </TableCell>
                        <TableCell className='px-3 py-2.5'>
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
                        </TableCell>
                        <TableCell className='px-3 py-2.5 text-[#1a1a1a] max-w-40'>
                          <span
                            className='truncate block'
                            title={chunk.tieu_de_dieu}
                          >
                            {chunk.tieu_de_dieu}
                          </span>
                        </TableCell>
                        <TableCell className='px-3 py-2.5 text-right font-mono text-[#9ca3af]'>
                          {chunk.token_count}
                        </TableCell>
                        <TableCell className='px-3 py-2.5 text-right font-mono text-[#9ca3af]'>
                          {chunk.character_count.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {doc.total_chunks > mockChunks.length && (
                <Button
                  variant='ghost'
                  className='w-full text-[#9ca3af] hover:text-[#1a1a1a]'
                >
                  Load more chunks (
                  {doc.total_chunks - mockChunks.length}{' '}
                  remaining)
                </Button>
              )}
            </div>
          )}

          {/* ── Keywords & Embeddings ── */}
          {activeTab === 'keywords' && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold text-[#9ca3af] uppercase tracking-wider'>
                  Keywords &amp; Embeddings
                </h3>
                <span className='text-sm text-[#9ca3af]'>
                  {mockKeywords.length} extracted
                </span>
              </div>
              <div className='bg-card border border-border rounded-xl overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow className='border-b border-[#e5e7eb] bg-[#f9fafb]'>
                      <TableHead className='px-3 py-2.5 text-[#9ca3af] font-medium'>
                        Keyword
                      </TableHead>
                      <TableHead className='px-3 py-2.5 text-[#9ca3af] font-medium'>
                        Type
                      </TableHead>
                      <TableHead className='px-3 py-2.5 text-[#9ca3af] font-medium'>
                        Model
                      </TableHead>
                      <TableHead className='px-3 py-2.5 text-right text-[#9ca3af] font-medium'>
                        Dim
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className='divide-y divide-[#e5e7eb]'>
                    {mockKeywords.map((kw, i) => (
                      <TableRow
                        key={i}
                        className='hover:bg-[#f9fafb] transition-colors'
                      >
                        <TableCell className='px-3 py-2.5 text-[#1a1a1a] font-medium'>
                          {kw.keyword_text}
                        </TableCell>
                        <TableCell className='px-3 py-2.5'>
                          <KeywordTypeBadge
                            type={kw.keyword_type}
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2.5 text-[#9ca3af] font-mono text-[11px] truncate max-w-30'>
                          {kw.embedding_model}
                        </TableCell>
                        <TableCell className='px-3 py-2.5 text-right font-mono text-[#9ca3af]'>
                          {kw.vector_dimension}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className='bg-[#faf5ff] border border-[#e9d5ff] rounded-lg p-4'>
                <div className='flex items-start gap-3'>
                  <Zap className='w-4 h-4 text-[#5d2ec0] mt-0.5 shrink-0' />
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
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null)
  const [documents, setDocuments] = useState(mockDocuments)
  const docTypes = [
    'All',
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

    const matchType = typeFilter === 'All' || doc.document_type === typeFilter
    const matchStatus = statusFilter === 'All' || doc.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  const itemsPerPage = 6
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage

  const paginatedDocuments = filtered.slice(
    startIndex,
    startIndex + itemsPerPage,
  )

  const handleToggle = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status:
                d.status === 'Active' ? 'Inactive' : 'Active',
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
    active: documents.filter((d) => d.status === 'Active')
      .length,
    totalChunks: documents.reduce(
      (s, d) => s + d.total_chunks,
      0,
    ),
    processing: documents.filter(
      (d) =>
        d.status === 'Processing' || d.status === 'Pending',
    ).length,
    errors: documents.filter((d) => d.status === 'Error')
      .length,
  }

  return (
    <div className='min-h-screen bg-[#f8f9fb] p-5'>
      <div className='space-y-6'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-[#0a0a0a]'>
              Tài liệu pháp lý
            </h1>
            <p className='text-sm text-[#6b7280] mt-1'>
              Quản lý toàn bộ tài liệu pháp luật, quyết định và
              hướng dẫn thuế trong hệ thống TaxMate.
            </p>
          </div>
          <div className='flex shrink-0 items-center gap-3'>
            <Button
              type='button'
              className='h-9.5 rounded-[10px] bg-[#6226c1] hover:bg-[#5224a8] text-white px-4'
            >
              <Plus className='h-4 w-4' strokeWidth={2} />
              Thêm tài liệu
            </Button>
            <Button
              type='button'
              variant='outline'
              className='h-9.5 rounded-[10px] px-4 text-[#374151]'
            >
              <RefreshCw className='h-4 w-4' strokeWidth={2} />
              Đồng bộ dữ liệu
            </Button>
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
              subtext: 'Đã Indexed',
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
                className='bg-white border border-[#f3f4f6] rounded-xl p-5.25 shadow-xs flex items-start justify-between'
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
                      <TrendingUp className='w-3.25 h-2.75 text-green-500' />
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
          <div className='flex-1 max-w-5xl flex items-center bg-white border border-gray-300 rounded-lg px-5 py-2.5 shadow-xs focus-within:border-sidebar-primary focus-within:ring-1 focus-within:ring-[#D32F2F]/20 transition-all'>
            <Search
              className={`mr-3 size-5 shrink-0 stroke-2 transition-colors ${
                search ? 'text-sidebar-primary' : 'text-gray-400'
              }`}
            />
            <input
              type='text'
              placeholder='Tìm kiếm theo tên tài liệu, mã...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='grow bg-transparent outline-hidden text-[14px] text-gray-800 placeholder-gray-400 font-medium'
            />
          </div>

          <div className='flex gap-2'>
            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val ?? 'All')}>
              <SelectTrigger className='py-5 bg-white!'>
                <SelectValue>
                  {typeFilter === 'All' ? 'Loại tài liệu' : typeFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='All'>Loại tài liệu</SelectItem>
                {docTypes
                  .filter((t) => t !== 'All')
                  .map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? 'All')}>
              <SelectTrigger className='py-5 bg-white!'>
                <SelectValue>
                  {statusFilter === 'All'
                    ? 'Trạng thái'
                    : statusFilter === 'Active'
                    ? 'Đang hoạt động'
                    : statusFilter === 'Inactive'
                    ? 'Ngừng hoạt động'
                    : statusFilter === 'Processing'
                    ? 'Đang xử lý'
                    : 'Lỗi'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='All'>Trạng thái</SelectItem>
                <SelectItem value='Active'>Đang hoạt động</SelectItem>
                <SelectItem value='Inactive'>Ngừng hoạt động</SelectItem>
                <SelectItem value='Processing'>Đang xử lý</SelectItem>
                <SelectItem value='Error'>Lỗi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Document Table */}
        <div className='bg-white border border-[#f3f4f6] rounded-xl shadow-xs overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow className='border-b border-[#f9fafb]'>
                <TableHead className='px-6 py-3.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                  Tài liệu
                </TableHead>
                <TableHead className='px-4 py-3.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                  Loại tài liệu
                </TableHead>
                <TableHead className='px-4 py-3.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                  Hiệu lực
                </TableHead>
                <TableHead className='px-4 py-3.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                  Trạng thái
                </TableHead>
                <TableHead className='px-4 py-3.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                  OCR
                </TableHead>
                <TableHead className='px-4 py-3.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                  Chunks
                </TableHead>
                <TableHead className='px-4 py-3.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                  Cập nhật
                </TableHead>
                <TableHead className='px-4 py-3.5 text-right text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'>
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDocuments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className='px-4 py-12 text-center text-sm text-[#9ca3af]'
                  >
                    No documents match your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDocuments.map((doc) => (
                  <TableRow
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className='border-t border-[#f9fafb] hover:bg-[#f9fafb] transition-colors cursor-pointer group'
                  >
                    <TableCell className='px-6 py-5'>
                      <div className='flex items-center gap-3'>
                        <div
                          className='w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center shrink-0'
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
                    </TableCell>
                    <TableCell className='px-4 py-5'>
                      <span className='text-sm text-[#4b5563]'>
                        {doc.document_type}
                      </span>
                    </TableCell>
                    <TableCell className='px-4 py-5'>
                      <div>
                        <p className='text-sm font-medium text-[#374151]'>
                          {doc.effective_date}
                        </p>
                        <p className='text-[11px] text-[#10b981] mt-1'>
                          Còn hiệu lực
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className='px-4 py-5'>
                      <StatusBadge status={doc.status} />
                    </TableCell>
                    <TableCell className='px-4 py-5'>
                      <OcrBadge status={doc.ocr_status} />
                    </TableCell>
                    <TableCell className='px-4 py-5'>
                      <span className='text-sm text-[#6b7280]'>
                        {doc.total_chunks > 0
                          ? doc.total_chunks
                          : '---'}
                      </span>
                    </TableCell>
                    <TableCell className='px-4 py-5'>
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
                    </TableCell>
                    <TableCell
                      className='px-4 py-5'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className='flex items-center justify-center gap-2'>
                        <ActionsMenu
                          doc={doc}
                          onView={() => setSelectedDoc(doc)}
                          onDelete={() => handleDelete(doc.id)}
                          onToggle={() => handleToggle(doc.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className='px-6 py-4 border-t border-[#f3f4f6] flex items-center justify-between'>
            <Pagination className='justify-start mx-0 w-auto'>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    text=''
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    aria-disabled={currentPage === 1}
                    className={
                      currentPage === 1
                        ? 'pointer-events-none opacity-40'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={currentPage === page}
                      onClick={() => setCurrentPage(page)}
                      className='cursor-pointer'
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    text=''
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, totalPages),
                      )
                    }
                    aria-disabled={currentPage === totalPages}
                    className={
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-40'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            <span className='text-sm text-[#9ca3af]'>
              Hiển thị{' '}
              {filtered.length === 0 ? 0 : startIndex + 1} đến{' '}
              {Math.min(startIndex + itemsPerPage, filtered.length)} trong tổng số{' '}
              {filtered.length} tài liệu
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
    </div>
  )
}