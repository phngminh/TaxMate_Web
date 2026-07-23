import { useCallback, useEffect, useRef, useState } from 'react'
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
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Tag,
  FileUp,
  TrendingUp,
  Plus,
} from 'lucide-react'
import { toast } from 'react-toastify'
import type { LegalDocument } from '../../../types/document.type'
import { mapLegalDocumentResponse } from '../../../types/document.type'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import {
  activateLegalDocument,
  deactivateLegalDocument,
  deleteLegalDocument,
  getLegalDocuments,
  updateLegalDocumentPdf,
  uploadLegalDocument,
} from '../../../apis/document.api'

const DOC_TYPES = ['All', 'Luật', 'Thông Tư', 'Nghị Định', 'Nghị Quyết'] as const

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as {
    response?: { status?: number; data?: { message?: string } }
    message?: string
  }
  if (err?.response?.status === 401) {
    return 'Phiên đăng nhập hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại bằng tài khoản Admin.'
  }
  if (err?.response?.status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này (cần tài khoản Admin).'
  }
  return err?.response?.data?.message || err?.message || fallback
}

function formatDateOnly(value: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value.slice(0, 10)
  return d.toLocaleDateString('vi-VN')
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<
    string,
    { label: string; className: string; dot: string }
  > = {
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
  }

  const config = configs[status] ?? {
    label: status,
    className: 'bg-[#f3f4f6] text-[#6b7280]',
    dot: 'bg-[#9ca3af]',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${config.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

function IndexBadge({ badge }: { badge: LegalDocument['index_badge'] }) {
  const configs = {
    INDEXED: {
      label: 'INDEXED',
      className: 'bg-[#ecfdf5] text-[#10b981]',
    },
    PENDING: {
      label: 'PENDING',
      className: 'bg-[#fff7ed] text-[#f59e0b]',
    },
  }
  const { label, className } = configs[badge]
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  )
}

function ActionsMenu({
  doc,
  onView,
  onUpdatePdf,
  onDelete,
  onToggle,
}: {
  doc: LegalDocument
  onView: () => void
  onUpdatePdf: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger {...({ asChild: true } as object)}>
        <button
          type='button'
          onClick={(e) => e.stopPropagation()}
          className='p-1.5 rounded-md text-[#9ca3af] hover:text-[#1a1a1a] hover:bg-[#f9fafb] transition-colors'
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

        <DropdownMenuItem onClick={onUpdatePdf}>
          <FileUp className='mr-2 h-4 w-4' />
          Cập nhật PDF
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onToggle}>
          {doc.status === 'Active' ? (
            <ToggleLeft className='mr-2 h-4 w-4' />
          ) : (
            <ToggleRight className='mr-2 h-4 w-4' />
          )}
          {doc.status === 'Active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
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

function DocumentDrawer({
  doc,
  onClose,
}: {
  doc: LegalDocument
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

        <div className='flex border-b border-[#e5e7eb] px-6 shrink-0'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type='button'
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

        <div className='flex-1 overflow-y-auto p-6 space-y-5'>
          {activeTab === 'pdf' && (
            <div className='space-y-4'>
              <h3 className='text-sm font-semibold text-[#9ca3af] uppercase tracking-wider'>
                PDF Information
              </h3>
              <div className='bg-card border border-border rounded-xl overflow-hidden'>
                {[
                  { label: 'Source File Name', value: doc.source_file_name, mono: true },
                  { label: 'Storage Path', value: doc.source_file_path, mono: true },
                  { label: 'File Size', value: `${(doc.file_size / 1024).toFixed(1)} KB` },
                  {
                    label: 'Total Pages',
                    value: doc.total_pages != null ? `${doc.total_pages} pages` : '—',
                  },
                  {
                    label: 'Created At',
                    value: new Date(doc.created_at).toLocaleString('vi-VN'),
                  },
                  {
                    label: 'Updated At',
                    value: new Date(doc.updated_at).toLocaleString('vi-VN'),
                  },
                  { label: 'Effective Date', value: formatDateOnly(doc.effective_date) },
                  { label: 'Expired Date', value: formatDateOnly(doc.expired_date) },
                  { label: 'Authority', value: doc.authority_level ?? '—' },
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
                    <span className='text-sm text-[#9ca3af]'>Index Status</span>
                    <FileSearch className='w-3.5 h-3.5 text-[#9ca3af]' />
                  </div>
                  <IndexBadge badge={doc.index_badge} />
                  <p className='text-sm text-[#9ca3af] mt-2'>
                    {doc.is_indexed
                      ? 'Document marked as indexed'
                      : 'Awaiting RAG index'}
                  </p>
                </div>
                <div className='bg-card border border-border rounded-xl p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='text-sm text-[#9ca3af]'>Chunks</span>
                    <Database className='w-3.5 h-3.5 text-[#9ca3af]' />
                  </div>
                  <p className='text-lg font-semibold text-[#1a1a1a]'>
                    {doc.total_chunks > 0 ? doc.total_chunks.toLocaleString('vi-VN') : '—'}
                  </p>
                  <p className='text-sm text-[#9ca3af] mt-2'>
                    Stored on TaxMate document record
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chunks' && (
            <div className='py-12 text-center text-sm text-[#9ca3af]'>
              Chưa có dữ liệu index (chunks).
            </div>
          )}

          {activeTab === 'keywords' && (
            <div className='py-12 text-center text-sm text-[#9ca3af]'>
              Chưa có dữ liệu index (keywords).
            </div>
          )}
        </div>
      </div>
    </>
  )
}

type UploadFormState = {
  documentCode: string
  documentName: string
  documentType: string
  authorityLevel: string
  effectiveDate: string
  file: File | null
}

const emptyUploadForm = (): UploadFormState => ({
  documentCode: '',
  documentName: '',
  documentType: 'Luật',
  authorityLevel: '',
  effectiveDate: '',
  file: null,
})

function UploadDocumentModal({
  open,
  saving,
  form,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  form: UploadFormState
  onChange: (form: UploadFormState) => void
  onClose: () => void
  onSubmit: () => void
}) {
  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto'>
        <div className='px-6 py-4 border-b border-[#f3f4f6] flex items-center justify-between'>
          <h2 className='text-lg font-bold text-[#0a0a0a]'>Thêm tài liệu</h2>
          <button
            type='button'
            onClick={onClose}
            disabled={saving}
            className='p-1.5 hover:bg-[#f9fafb] rounded-sm'
          >
            <X className='w-4 h-4 text-[#6b7280]' />
          </button>
        </div>

        <div className='px-6 py-4 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-[#374151] mb-1'>
              Mã tài liệu
            </label>
            <input
              value={form.documentCode}
              onChange={(e) => onChange({ ...form, documentCode: e.target.value })}
              className='w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30'
              placeholder='38/2024/QH15'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-[#374151] mb-1'>
              Tên tài liệu
            </label>
            <input
              value={form.documentName}
              onChange={(e) => onChange({ ...form, documentName: e.target.value })}
              className='w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30'
              placeholder='Luật Thuế Thu Nhập Cá Nhân 2024'
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-[#374151] mb-1'>
                Loại tài liệu
              </label>
              <select
                value={form.documentType}
                onChange={(e) => onChange({ ...form, documentType: e.target.value })}
                className='w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30'
              >
                {DOC_TYPES.filter((t) => t !== 'All').map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-[#374151] mb-1'>
                Ngày hiệu lực
              </label>
              <input
                type='date'
                value={form.effectiveDate}
                onChange={(e) => onChange({ ...form, effectiveDate: e.target.value })}
                className='w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30'
              />
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium text-[#374151] mb-1'>
              Cấp ban hành
            </label>
            <input
              value={form.authorityLevel}
              onChange={(e) => onChange({ ...form, authorityLevel: e.target.value })}
              className='w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30'
              placeholder='Quốc hội / Bộ Tài chính...'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-[#374151] mb-1'>
              File PDF
            </label>
            <label className='flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-dashed border-[#d1d5db] bg-[#f9fafb] hover:bg-[#f3f4f6] hover:border-[#5d2ec0]/40 cursor-pointer transition-colors'>
              <span className='inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-md bg-[#5d2ec0] text-white text-sm font-medium shadow-xs'>
                <FileUp className='w-3.5 h-3.5' />
                Chọn file
              </span>
              <span className='text-sm text-[#6b7280] truncate'>
                {form.file ? form.file.name : 'Chưa chọn file PDF'}
              </span>
              <input
                type='file'
                accept='.pdf,application/pdf'
                onChange={(e) =>
                  onChange({ ...form, file: e.target.files?.[0] ?? null })
                }
                className='sr-only'
              />
            </label>
          </div>
        </div>

        <div className='px-6 py-4 border-t border-[#f3f4f6] flex justify-end gap-2'>
          <Button type='button' variant='outline' onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button
            type='button'
            onClick={onSubmit}
            disabled={saving}
            className='bg-[#5d2ec0] text-white hover:bg-[#4c25a0]'
          >
            {saving ? 'Đang tải lên...' : 'Tải lên'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function LegalDocumentManagement() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null)
  const [documents, setDocuments] = useState<LegalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState<UploadFormState>(emptyUploadForm())
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const updatePdfDocIdRef = useRef<string | null>(null)

  const fetchDocuments = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      const response = await getLegalDocuments()
      if (!response.success) {
        throw new Error(response.message || 'Không thể tải danh sách tài liệu')
      }
      const mapped = (response.data ?? []).map(mapLegalDocumentResponse)
      setDocuments(mapped)
      setSelectedDoc((prev) => {
        if (!prev) return null
        return mapped.find((d) => d.id === prev.id) ?? null
      })
      return true
    } catch (error) {
      if (!opts?.silent) {
        toast.error(getErrorMessage(error, 'Không thể tải danh sách tài liệu'))
      }
      return false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      await fetchDocuments()
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [fetchDocuments])

  const handleSync = async () => {
    setSyncing(true)
    const ok = await fetchDocuments({ silent: true })
    setSyncing(false)
    if (ok) {
      toast.success('Đã đồng bộ danh sách tài liệu')
    } else {
      toast.error('Đồng bộ thất bại')
    }
  }

  const handleUpload = async () => {
    if (!uploadForm.documentCode.trim() || !uploadForm.documentName.trim()) {
      toast.error('Vui lòng nhập mã và tên tài liệu')
      return
    }
    if (!uploadForm.file) {
      toast.error('Vui lòng chọn file PDF')
      return
    }
    if (!window.confirm('Bạn có chắc chắn muốn tải lên tài liệu này?')) {
      return
    }

    const formData = new FormData()
    formData.append('DocumentCode', uploadForm.documentCode.trim())
    formData.append('DocumentName', uploadForm.documentName.trim())
    formData.append('DocumentType', uploadForm.documentType)
    if (uploadForm.authorityLevel.trim()) {
      formData.append('AuthorityLevel', uploadForm.authorityLevel.trim())
    }
    if (uploadForm.effectiveDate) {
      formData.append('EffectiveDate', uploadForm.effectiveDate)
    }
    formData.append('File', uploadForm.file)

    setSaving(true)
    try {
      const response = await uploadLegalDocument(formData)
      if (!response.success) {
        throw new Error(response.message || 'Upload thất bại')
      }
      toast.success('Tải lên tài liệu thành công')
      setUploadOpen(false)
      setUploadForm(emptyUploadForm())
      await fetchDocuments({ silent: true })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải lên tài liệu'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (doc: LegalDocument) => {
    const nextLabel = doc.status === 'Active' ? 'vô hiệu hóa' : 'kích hoạt'
    if (!window.confirm(`Bạn có chắc chắn muốn ${nextLabel} "${doc.document_name}"?`)) {
      return
    }

    setActionId(doc.id)
    try {
      const response =
        doc.status === 'Active'
          ? await deactivateLegalDocument(doc.id)
          : await activateLegalDocument(doc.id)
      if (!response.success) {
        throw new Error(response.message || 'Cập nhật trạng thái thất bại')
      }
      toast.success(
        doc.status === 'Active' ? 'Đã vô hiệu hóa tài liệu' : 'Đã kích hoạt tài liệu',
      )
      await fetchDocuments({ silent: true })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể cập nhật trạng thái'))
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (doc: LegalDocument) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa "${doc.document_name}"? Hành động này không thể hoàn tác.`,
      )
    ) {
      return
    }

    setActionId(doc.id)
    try {
      const response = await deleteLegalDocument(doc.id)
      if (!response.success) {
        throw new Error(response.message || 'Xóa thất bại')
      }
      toast.success('Đã xóa tài liệu')
      if (selectedDoc?.id === doc.id) setSelectedDoc(null)
      await fetchDocuments({ silent: true })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xóa tài liệu'))
    } finally {
      setActionId(null)
    }
  }

  const startUpdatePdf = (doc: LegalDocument) => {
    updatePdfDocIdRef.current = doc.id
    pdfInputRef.current?.click()
  }

  const handlePdfFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const docId = updatePdfDocIdRef.current
    e.target.value = ''
    updatePdfDocIdRef.current = null

    if (!file || !docId) return

    if (!window.confirm('Bạn có chắc chắn muốn cập nhật file PDF cho tài liệu này?')) {
      return
    }

    const formData = new FormData()
    formData.append('File', file)

    setActionId(docId)
    try {
      const response = await updateLegalDocumentPdf(docId, formData)
      if (!response.success) {
        throw new Error(response.message || 'Cập nhật PDF thất bại')
      }
      toast.success('Cập nhật PDF thành công')
      await fetchDocuments({ silent: true })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể cập nhật PDF'))
    } finally {
      setActionId(null)
    }
  }

  const filtered = documents.filter((doc) => {
    const matchSearch =
      doc.document_name.toLowerCase().includes(search.toLowerCase()) ||
      doc.document_code.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'All' || doc.document_type === typeFilter
    const matchStatus = statusFilter === 'All' || doc.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  const itemsPerPage = 6
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDocuments = filtered.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, typeFilter, statusFilter])

  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const newIn7Days = documents.filter(
    (d) => now - new Date(d.created_at).getTime() <= sevenDaysMs,
  ).length
  const indexedCount = documents.filter((d) => d.is_indexed).length
  const pendingCount = documents.filter((d) => !d.is_indexed).length
  const activeCount = documents.filter((d) => d.status === 'Active').length
  const totalChunks = documents.reduce((s, d) => s + d.total_chunks, 0)
  const activePercent =
    documents.length === 0
      ? 0
      : Math.round((activeCount / documents.length) * 1000) / 10

  const statsCards = [
    {
      label: 'Tổng tài liệu',
      value: documents.length,
      icon: FileText,
      iconColor: '#5d2ec0',
      iconBg: '#faf5ff',
      subtext: `${newIn7Days} tài liệu mới trong 7 ngày`,
    },
    {
      label: 'Đang hoạt động',
      value: activeCount,
      icon: CheckCircle2,
      iconColor: '#10b981',
      iconBg: '#ecfdf5',
      subtext: `${activePercent}% tổng tài liệu`,
    },
    {
      label: 'Tổng chunks',
      value: totalChunks.toLocaleString('vi-VN'),
      icon: Layers,
      iconColor: '#3b82f6',
      iconBg: '#eff6ff',
      subtext: `${indexedCount} đã Indexed`,
    },
    {
      label: 'Chờ xử lý',
      value: pendingCount,
      icon: Clock,
      iconColor: '#f59e0b',
      iconBg: '#fff7ed',
      subtext: 'Đang trong hàng đợi',
    },
    {
      label: 'Lỗi',
      value: 0,
      icon: AlertTriangle,
      iconColor: '#ef4444',
      iconBg: '#fef2f2',
      subtext: 'Không có lỗi',
    },
  ]

  return (
    <div className='min-h-screen bg-[#f8f9fb] p-5'>
      <input
        ref={pdfInputRef}
        type='file'
        accept='.pdf,application/pdf'
        className='hidden'
        onChange={handlePdfFileSelected}
      />

      <div className='space-y-6'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-[#0a0a0a]'>Tài liệu pháp lý</h1>
            <p className='text-sm text-[#6b7280] mt-1'>
              Quản lý toàn bộ tài liệu pháp luật, quyết định và hướng dẫn thuế trong
              hệ thống TaxMate.
            </p>
          </div>
          <div className='flex shrink-0 items-center gap-3'>
            <Button
              type='button'
              onClick={() => {
                setUploadForm(emptyUploadForm())
                setUploadOpen(true)
              }}
              className='h-9.5 rounded-[10px] bg-[#6226c1] hover:bg-[#5224a8] text-white px-4'
            >
              <Plus className='h-4 w-4' strokeWidth={2} />
              Thêm tài liệu
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={syncing || loading}
              onClick={handleSync}
              className='h-9.5 rounded-[10px] px-4 text-[#374151]'
            >
              <RefreshCw
                className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`}
                strokeWidth={2}
              />
              Đồng bộ dữ liệu
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-[15.8px]'>
          {statsCards.map(({ label, value, icon: Icon, iconColor, iconBg, subtext }) => (
            <div
              key={label}
              className='bg-white border border-[#f3f4f6] rounded-xl p-5.25 shadow-xs flex items-start justify-between'
            >
              <div>
                <p className='text-base font-medium text-[#6b7280] mb-2'>{label}</p>
                <p
                  className='text-[30px] font-bold leading-9'
                  style={{
                    color: label === 'Tổng tài liệu' ? '#0a0a0a' : iconColor,
                  }}
                >
                  {value}
                </p>
                {subtext && (
                  <div className='flex items-center gap-1 mt-2.5'>
                    <TrendingUp className='w-3.25 h-2.75 text-green-500' />
                    <p className='text-[13px] text-green-500'>{subtext}</p>
                  </div>
                )}
              </div>
              <div
                className='w-10 h-10 rounded-lg flex items-center justify-center'
                style={{ backgroundColor: iconBg }}
              >
                <Icon className='w-5 h-5' style={{ color: iconColor }} />
              </div>
            </div>
          ))}
        </div>

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
            <Select
              value={typeFilter}
              onValueChange={(val) => setTypeFilter(val ?? 'All')}
            >
              <SelectTrigger className='py-5 bg-white!'>
                <SelectValue>
                  {typeFilter === 'All' ? 'Loại tài liệu' : typeFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='All'>Loại tài liệu</SelectItem>
                {DOC_TYPES.filter((t) => t !== 'All').map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val ?? 'All')}
            >
              <SelectTrigger className='py-5 bg-white!'>
                <SelectValue>
                  {statusFilter === 'All'
                    ? 'Trạng thái'
                    : statusFilter === 'Active'
                      ? 'Đang hoạt động'
                      : 'Ngừng hoạt động'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='All'>Trạng thái</SelectItem>
                <SelectItem value='Active'>Đang hoạt động</SelectItem>
                <SelectItem value='Inactive'>Ngừng hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className='px-4 py-12 text-center text-sm text-[#9ca3af]'
                  >
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : paginatedDocuments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className='px-4 py-12 text-center text-sm text-[#9ca3af]'
                  >
                    Không có tài liệu phù hợp.
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
                        <div className='w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center shrink-0'>
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
                      <span className='text-sm text-[#4b5563]'>{doc.document_type}</span>
                    </TableCell>
                    <TableCell className='px-4 py-5'>
                      <div>
                        <p className='text-sm font-medium text-[#374151]'>
                          {formatDateOnly(doc.effective_date)}
                        </p>
                        <p
                          className={`text-[11px] mt-1 ${
                            doc.expired_date ? 'text-[#9ca3af]' : 'text-[#10b981]'
                          }`}
                        >
                          {doc.expired_date ? 'Hết hiệu lực' : 'Còn hiệu lực'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className='px-4 py-5'>
                      <StatusBadge status={doc.status} />
                    </TableCell>
                    <TableCell className='px-4 py-5'>
                      <IndexBadge badge={doc.index_badge} />
                    </TableCell>
                    <TableCell className='px-4 py-5'>
                      <span className='text-sm text-[#6b7280]'>
                        {doc.total_chunks > 0 ? doc.total_chunks : '---'}
                      </span>
                    </TableCell>
                    <TableCell className='px-4 py-5'>
                      <div>
                        <p className='text-sm text-[#374151]'>
                          {new Date(doc.updated_at).toLocaleDateString('vi-VN')}
                        </p>
                        <p className='text-[11px] text-[#9ca3af] mt-1'>
                          {new Date(doc.updated_at).toLocaleTimeString('vi-VN', {
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
                          onUpdatePdf={() => startUpdatePdf(doc)}
                          onDelete={() => handleDelete(doc)}
                          onToggle={() => handleToggle(doc)}
                        />
                        {actionId === doc.id && (
                          <span className='text-xs text-[#9ca3af]'>...</span>
                        )}
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
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
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
              Hiển thị {filtered.length === 0 ? 0 : startIndex + 1} đến{' '}
              {Math.min(startIndex + itemsPerPage, filtered.length)} trong tổng số{' '}
              {filtered.length} tài liệu
            </span>
          </div>
        </div>

        {selectedDoc && (
          <DocumentDrawer doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
        )}
      </div>

      <UploadDocumentModal
        open={uploadOpen}
        saving={saving}
        form={uploadForm}
        onChange={setUploadForm}
        onClose={() => {
          if (!saving) setUploadOpen(false)
        }}
        onSubmit={handleUpload}
      />
    </div>
  )
}
