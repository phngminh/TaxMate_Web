import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  Filter,
  Layers,
  Receipt,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  TrendingUp,
  X,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { exportS2b, getS2bPreview } from '../../../apis/taxBook.api'
import { useBusiness } from '../../../contexts/BusinessContext'
import type { S2bBlocker, S2bBook, S2bRevenueLine } from '../../../types/taxBook.type'
import LegalBadge from '../../../components/owner/tax/LegalBadge'
import Tip from '../../../components/owner/tax/Tip'
import TaxPagination from '../../../components/owner/tax/TaxPagination'

const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

type SortKey = 'documentDate' | 'amount' | 'documentNumber'
type SortOrder = 'asc' | 'desc'
type SourceFilter = 'all' | 'Transaction' | 'ManualIncome'

type BlockerSeverity = 'error' | 'warning'
const BLOCKER_META: Record<string, { label: string; severity: BlockerSeverity }> = {
  MissingInvoice: {
    label: 'Giao dịch bán hàng chưa có số hóa đơn',
    severity: 'error',
  },
  MissingBusinessCategory: {
    label: 'Phát sinh chưa được phân loại ngành nghề tính thuế',
    severity: 'error',
  },
  NonPositiveManualRevenue: {
    label: 'Khoản doanh thu nhập thủ công phải có số tiền lớn hơn 0',
    severity: 'error',
  },
}

type BusinessCategoryDisplay = {
  summary: string
  detail: string
  legalName: string
}

const BUSINESS_CATEGORY_DISPLAY: Record<string, BusinessCategoryDisplay> = {
  DIST_GOODS: {
    summary: 'Phân phối, cung cấp hàng hóa',
    detail: 'Phân phối hàng hóa',
    legalName: 'Phân phối, cung cấp hàng hóa',
  },
  PROD_TRANSPORT: {
    summary: 'Sản xuất, vận tải, dịch vụ gắn hàng hóa, xây dựng có NVL',
    detail: 'Sản xuất, vận tải, dịch vụ gắn hàng hóa',
    legalName:
      'Sản xuất, vận tải, dịch vụ có gắn với hàng hóa, xây dựng có bao thầu nguyên vật liệu',
  },
  SERVICE_CONSTRUCT: {
    summary: 'Dịch vụ, xây dựng không bao thầu NVL',
    detail: 'Dịch vụ không bao thầu NVL',
    legalName: 'Dịch vụ, xây dựng không bao thầu nguyên vật liệu',
  },
  ASSET_INSURANCE: {
    summary: 'Cho thuê tài sản, đại lý bảo hiểm, xổ số, đa cấp',
    detail: 'Cho thuê tài sản, đại lý…',
    legalName:
      'Hoạt động cho thuê tài sản, đại lý bảo hiểm, đại lý xổ số, đại lý bán hàng đa cấp',
  },
  OTHER: {
    summary: 'Hoạt động kinh doanh khác',
    detail: 'Hoạt động khác',
    legalName: 'Hoạt động kinh doanh khác',
  },
  FNB: {
    summary: 'Dịch vụ ăn uống',
    detail: 'Dịch vụ ăn uống',
    legalName:
      'Dịch vụ ăn uống có gắn với hàng hóa, thuộc nhóm sản xuất, vận tải, dịch vụ có gắn với hàng hóa, xây dựng có bao thầu nguyên vật liệu',
  },
  SERVICE: {
    summary: 'Dịch vụ, xây dựng không bao thầu NVL',
    detail: 'Dịch vụ không bao thầu NVL',
    legalName: 'Dịch vụ, xây dựng không bao thầu nguyên vật liệu',
  },
}

const getBusinessCategoryDisplay = (
  code: string | null | undefined,
  fallbackName?: string
): BusinessCategoryDisplay => {
  if (code && BUSINESS_CATEGORY_DISPLAY[code]) {
    return BUSINESS_CATEGORY_DISPLAY[code]
  }

  const fallback = fallbackName?.trim() || code || 'Chưa xác định'
  return { summary: fallback, detail: fallback, legalName: fallback }
}

export default function S2bBookPage() {
  const { businesses, currentBusiness, setCurrentBusiness } = useBusiness()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const now = new Date()
  const yearFromUrl = Number(searchParams.get('year'))
  const quarterFromUrl = Number(searchParams.get('quarter'))
  const businessIdFromUrl = searchParams.get('businessId')

  const [year, setYear] = useState(
    Number.isInteger(yearFromUrl) && yearFromUrl >= 2024 && yearFromUrl <= 2030
      ? yearFromUrl
      : now.getFullYear()
  )
  const [quarter, setQuarter] = useState(
    Number.isInteger(quarterFromUrl) && quarterFromUrl >= 1 && quarterFromUrl <= 4
      ? quarterFromUrl
      : Math.floor(now.getMonth() / 3) + 1
  )

  useEffect(() => {
    if (!businessIdFromUrl || businesses.length === 0) return
    const target = businesses.find((b) => b.id === businessIdFromUrl)
    if (target && target.id !== currentBusiness?.id) {
      setCurrentBusiness(target)
    }
  }, [businessIdFromUrl, businesses, currentBusiness, setCurrentBusiness])

  const [book, setBook] = useState<S2bBook | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [isBlockersOpen, setIsBlockersOpen] = useState(true)

  // Filters & Search states for Line Detail Table
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('documentDate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const load = useCallback(async () => {
    if (!currentBusiness) return
    try {
      setLoading(true)
      const data = await getS2bPreview(currentBusiness.id, year, quarter)
      setBook(data)
    } catch {
      toast.error('Không thể tải sổ doanh thu S2b')
    } finally {
      setLoading(false)
    }
  }, [currentBusiness, year, quarter])

  useEffect(() => {
    setBook(null)
    setCurrentPage(1)
    void load()
  }, [load])

  const download = async () => {
    if (!currentBusiness || !book?.isValid) return
    try {
      setExporting(true)
      const blob = await exportS2b(currentBusiness.id, year, quarter)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `S2b-HKD_${currentBusiness.businessName}_Q${quarter}_${year}.docx`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Không thể xuất sổ doanh thu S2b')
    } finally {
      setExporting(false)
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortOrder(key === 'documentDate' ? 'desc' : 'asc')
    }
    setCurrentPage(1)
  }

  // Unclassified Lines Breakdown
  const unclassifiedLines = useMemo(() => {
    return (
      book?.lines.filter(
        (l) => !l.businessCategoryId || l.businessCategoryCode === 'CHUA_PHAN_LOAI'
      ) ?? []
    )
  }, [book])

  const unclassifiedPosRevenue = useMemo(() => {
    return unclassifiedLines
      .filter((l) => l.sourceType === 'Transaction')
      .reduce((sum, l) => sum + l.amount, 0)
  }, [unclassifiedLines])

  const unclassifiedManualRevenue = useMemo(() => {
    return unclassifiedLines
      .filter((l) => l.sourceType === 'ManualIncome')
      .reduce((sum, l) => sum + l.amount, 0)
  }, [unclassifiedLines])

  const unclassifiedRevenue = useMemo(() => {
    return unclassifiedLines.reduce((sum, l) => sum + l.amount, 0)
  }, [unclassifiedLines])

  // Filtered Lines
  const filteredLines = useMemo(() => {
    if (!book?.lines) return []
    return book.lines.filter((line) => {
      if (sourceFilter !== 'all' && line.sourceType !== sourceFilter) {
        return false
      }
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'CHUA_PHAN_LOAI') {
          if (line.businessCategoryId && line.businessCategoryCode !== 'CHUA_PHAN_LOAI') {
            return false
          }
        } else if (line.businessCategoryId !== categoryFilter) {
          return false
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchDoc = line.documentNumber.toLowerCase().includes(q)
        const matchDesc = line.description.toLowerCase().includes(q)
        const category = getBusinessCategoryDisplay(line.businessCategoryCode)
        const matchCat = [
          line.businessCategoryCode,
          category.summary,
          category.detail,
          category.legalName,
        ].some((value) => value?.toLowerCase().includes(q))
        if (!matchDoc && !matchDesc && !matchCat) return false
      }
      return true
    })
  }, [book, sourceFilter, categoryFilter, searchQuery])

  // Sorted Lines
  const sortedLines = useMemo(() => {
    return [...filteredLines].sort((a, b) => {
      let valA: any = a[sortKey]
      let valB: any = b[sortKey]

      if (sortKey === 'documentDate') {
        valA = new Date(a.documentDate).getTime()
        valB = new Date(b.documentDate).getTime()
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase()
        valB = (valB || '').toLowerCase()
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredLines, sortKey, sortOrder])

  // Paginated Lines
  const totalLinesCount = sortedLines.length
  const totalPages = Math.max(1, Math.ceil(totalLinesCount / pageSize))
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1)
  }, [currentPage, totalPages])

  const paginatedLines = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedLines.slice(start, start + pageSize)
  }, [sortedLines, currentPage, pageSize])

  // Grouped Blockers
  const groupedBlockers = useMemo(() => {
    if (!book?.blockers) return []
    const map = new Map<string, S2bBlocker[]>()
    for (const b of book.blockers) {
      const list = map.get(b.code) ?? []
      list.push(b)
      map.set(b.code, list)
    }
    return Array.from(map.entries()).map(([code, items]) => ({ code, items }))
  }, [book])

  const totalVat = useMemo(() => {
    return book?.groups.reduce((sum, group) => sum + group.vatAmount, 0) ?? 0
  }, [book])

  const revenueGroupByCategory = useMemo(
    () => new Map(book?.groups.map((group) => [group.businessCategoryId, group]) ?? []),
    [book]
  )

  const handleOpenSourceDetail = (line: S2bRevenueLine) => {
    if (line.sourceType === 'Transaction') {
      navigate(`/business-owner/orders?id=${encodeURIComponent(line.sourceId)}&autoOpen=true`)
    } else {
      navigate(`/business-owner/expenses?id=${encodeURIComponent(line.sourceId)}&autoOpen=true`)
    }
  }

  const handleOpenBlockerSource = (blocker: S2bBlocker) => {
    // 1. First, check if blocker.sourceId matches any line in book.lines to determine exact sourceType
    const matchedLine = book?.lines.find((l) => l.sourceId === blocker.sourceId)
    if (matchedLine) {
      handleOpenSourceDetail(matchedLine)
      return
    }

    // 2. Fallback check by message or code
    const msg = blocker.message.toLowerCase()
    if (
      blocker.code === 'MissingInvoice' ||
      msg.includes('giao dịch') ||
      msg.includes('đơn hàng') ||
      msg.includes('bán hàng')
    ) {
      navigate(`/business-owner/orders?id=${encodeURIComponent(blocker.sourceId)}&autoOpen=true`)
    } else {
      navigate(`/business-owner/expenses?id=${encodeURIComponent(blocker.sourceId)}&autoOpen=true`)
    }
  }

  const qttReturnParams = new URLSearchParams({ year: String(year) })
  if (searchParams.get('fromTkn')) qttReturnParams.set('fromTkn', searchParams.get('fromTkn')!)

  return (
    <div className='mx-auto max-w-7xl p-6'>
      {/* Return to QTT banner if navigated from QTT */}
      {searchParams.get('returnTo') === 'qtt' && (
        <button
          type='button'
          className='mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer'
          onClick={() => navigate(`/business-owner/tax-books/qtt?${qttReturnParams.toString()}`)}
        >
          <span>← Quay lại quyết toán năm</span>
        </button>
      )}

      {/* ── HEADER ── */}
      <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <div className='flex flex-wrap items-center gap-2.5'>
            <h1 className='text-2xl font-bold text-gray-900'>Sổ doanh thu bán hàng hóa, dịch vụ (S2b)</h1>
            <LegalBadge
              formCode='Mẫu S2b-HKD'
              circular='TT 152/2025/TT-BTC'
              title='Thông tư số 152/2025/TT-BTC ngày 31/12/2025 của Bộ Tài chính'
              article='Khoản 2 Điều 6, mục 2.2.1 — Mẫu S2b-HKD'
              description={'Ghi doanh thu bán hàng hóa, dịch vụ theo từng ngành nghề có cùng tỷ lệ thuế GTGT.\n\n➜ Đích đến: Tổng hợp doanh thu và thuế GTGT theo kỳ kê khai.'}
            />
          </div>
          <p className='mt-1 text-sm text-gray-500'>
            {currentBusiness ? (
              <span className='inline-flex items-center gap-1 font-medium text-gray-700'>
                <Store size={14} className='text-gray-400' />
                {currentBusiness.businessName}
              </span>
            ) : (
              'Chưa chọn cửa hàng'
            )}
          </p>
        </div>

        {/* Action controls */}
        <div className='flex flex-wrap items-end gap-3'>
          <label className='text-sm text-gray-600'>
            Năm
            <input
              className='mt-1 block w-28 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium focus:border-red-600 focus:outline-hidden'
              type='number'
              value={year}
              min={2024}
              max={2030}
              onChange={(event) => setYear(Number(event.target.value))}
            />
          </label>

          <div>
            <span className='text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block'>Kỳ kê khai Quý</span>
            <div className='flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80'>
              {[1, 2, 3, 4].map((q) => {
                const isActive = quarter === q
                return (
                  <button
                    key={q}
                    type='button'
                    onClick={() => setQuarter(q)}
                    className={`relative rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/10'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    Quý {q}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={load}
            disabled={!currentBusiness || loading}
            className='flex items-center gap-2 rounded-xl bg-[#9b0000] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#800000] disabled:opacity-50 cursor-pointer transition-all'
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Đang tải...' : 'Tải lại'}
          </button>

          <button
            onClick={download}
            disabled={!book?.isValid || exporting}
            className='flex items-center gap-2 rounded-xl border border-[#9b0000] px-4 py-2.5 text-sm font-semibold text-[#9b0000] hover:bg-red-50 disabled:opacity-50 cursor-pointer transition-all'
          >
            <Download size={16} />
            {exporting ? 'Đang xuất...' : 'Xuất Word'}
          </button>
        </div>
      </div>

      {/* ── BLOCKERS BANNER ── */}
      {book?.blockers.length ? (
        <div className='mb-6 rounded-2xl border border-amber-300 bg-amber-50/70 p-4 text-sm text-amber-950 transition-all'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center gap-2 font-semibold text-amber-900'>
              <AlertCircle size={18} className='text-amber-600' />
              <span>Dữ liệu cần kiểm tra ({book.blockers.length} phát sinh)</span>
            </div>
            <button
              type='button'
              onClick={() => setIsBlockersOpen(!isBlockersOpen)}
              className='inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 cursor-pointer'
            >
              <span>{isBlockersOpen ? 'Thu gọn' : 'Xem chi tiết lỗi'}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isBlockersOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {isBlockersOpen && (
            <div className='mt-3 divide-y divide-amber-200/70 border-t border-amber-200/70 pt-2'>
              {groupedBlockers.map(({ code, items }) => {
                const meta = BLOCKER_META[code]
                return (
                  <div key={code} className='py-2.5'>
                    <div className='flex items-center gap-2 font-medium text-amber-900'>
                      <span className='h-2 w-2 rounded-full bg-amber-500' />
                      <span>{meta?.label ?? code}</span>
                      <span className='rounded-full bg-amber-200/80 px-2 py-0.5 text-xs font-bold text-amber-900'>
                        {items.length}
                      </span>
                    </div>
                    <ul className='mt-2 ml-4 space-y-1.5 text-xs text-amber-800'>
                      {items.map((item, index) => (
                        <li key={`${item.code}-${item.sourceId}-${index}`} className='flex flex-wrap items-center justify-between gap-2 bg-amber-100/50 px-2.5 py-1.5 rounded-lg'>
                          <span>• {item.message}</span>
                          <button
                            type='button'
                            onClick={() => handleOpenBlockerSource(item)}
                            className='inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-red-700 bg-white/80 hover:bg-white px-2 py-0.5 rounded border border-amber-300/80 cursor-pointer transition-colors'
                          >
                            <span>Mở xử lý</span>
                            <ExternalLink size={10} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : null}

      {!book ? (
        <div className='rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500'>
          {loading ? 'Đang tải sổ doanh thu S2b...' : 'Không có dữ liệu để hiển thị.'}
        </div>
      ) : (
        <div className='space-y-6'>
          {/* ── BENTO METRIC CARDS ── */}
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs transition-all hover:shadow-xs'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-semibold uppercase tracking-wider text-slate-500'>Doanh thu POS</span>
                <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600'>
                  <ShoppingCart size={16} />
                </div>
              </div>
              <div className='mt-2 text-xl font-bold text-slate-900'>
                {money.format(book.completedTransactionRevenue)} đ
              </div>
              <p className='mt-1 text-xs text-slate-500'>Từ các đơn hàng POS đã hoàn tất</p>
            </div>

            <div className='rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs transition-all hover:shadow-xs'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-semibold uppercase tracking-wider text-slate-500'>Doanh thu nhập ngoài</span>
                <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600'>
                  <Receipt size={16} />
                </div>
              </div>
              <div className='mt-2 text-xl font-bold text-slate-900'>
                {money.format(book.manualBusinessRevenue)} đ
              </div>
              <p className='mt-1 text-xs text-slate-500'>Khoản thu kinh doanh thủ công</p>
            </div>

            <div className='rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white p-4.5 shadow-2xs transition-all hover:shadow-xs'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-semibold uppercase tracking-wider text-emerald-800'>Tổng doanh thu</span>
                <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700'>
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className='mt-2 text-xl font-extrabold text-emerald-950'>
                {money.format(book.totalRevenue)} đ
              </div>
              <p className='mt-1 text-xs text-emerald-700 font-medium'>Nguồn tính thuế và quyết toán [09a]</p>
            </div>

            <div className='rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/40 to-white p-4.5 shadow-2xs transition-all hover:shadow-xs'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-semibold uppercase tracking-wider text-rose-800'>Tổng thuế GTGT</span>
                <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-[#9b0000]'>
                  <Building2 size={16} />
                </div>
              </div>
              <div className='mt-2 text-xl font-extrabold text-[#9b0000]'>
                {money.format(totalVat)} đ
              </div>
              <p className='mt-1 text-xs text-rose-700 font-medium'>Tổng thuế GTGT ước tính theo ngành</p>
            </div>
          </div>

          {/* ── FORMULA BREAKDOWN BANNER ── */}
          <div className='rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-3.5 text-sm text-emerald-950'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <CheckCircle2 size={16} className='text-emerald-600 shrink-0' />
                <span className='font-semibold'>Minh bạch công thức doanh thu:</span>
                <div className='flex flex-wrap items-center gap-1.5 tabular-nums text-xs sm:text-sm'>
                  <span>{money.format(book.completedTransactionRevenue)} đ (POS)</span>
                  <span className='font-bold text-emerald-700'>+</span>
                  <span>{money.format(book.manualBusinessRevenue)} đ (Nhập ngoài)</span>
                  <span className='font-bold text-emerald-700'>=</span>
                  <span className='font-bold text-emerald-950'>{money.format(book.totalRevenue)} đ</span>
                </div>
              </div>
              <span className='text-xs text-emerald-800 font-medium'>
                ✓ Đã loại trừ vốn nạp/tiền vay và chống cộng trùng
              </span>
            </div>

            {/* Unclassified warning notice if there is discrepancy */}
            {unclassifiedRevenue > 0 && (
              <div className='mt-2.5 pt-2.5 border-t border-emerald-200/80 text-xs text-amber-900 flex items-center gap-1.5 font-medium'>
                <AlertCircle size={14} className='text-amber-600 shrink-0' />
                <span>
                  Lưu ý: Có {unclassifiedLines.length} phát sinh ({money.format(unclassifiedRevenue)} đ) chưa được phân loại ngành nghề. Các dòng này đã được đưa vào danh sách chi tiết (Bảng 2) với nhãn &quot;Chưa phân loại&quot; để bạn kiểm tra từng đơn bán.
                </span>
              </div>
            )}
          </div>

          {/* ── BẢNG 1: TỔNG HỢP THEO NGÀNH NGHỀ (MẪU S2B-HKD) ── */}
          <div className='overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs'>
            <div className='border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Layers size={16} className='text-slate-600' />
                <h2 className='text-sm font-bold text-slate-900 uppercase tracking-wider'>
                  1. Tổng hợp theo ngành nghề kinh doanh
                </h2>
              </div>
              <span className='text-xs font-semibold text-slate-500'>
                {book.groups.length} nhóm ngành
              </span>
            </div>

            {book.groups.length === 0 && unclassifiedRevenue === 0 ? (
              <div className='p-8 text-center text-sm text-gray-500'>Không có doanh thu trong kỳ.</div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead className='border-b border-slate-200/80 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-500'>
                    <tr>
                      <th className='px-4 py-3 text-left'>Ngành nghề kinh doanh</th>
                      <th className='px-4 py-3 text-right'>Doanh thu POS</th>
                      <th className='px-4 py-3 text-right'>Nhập thủ công</th>
                      <th className='px-4 py-3 text-right'>Tổng doanh thu</th>
                      <th className='px-4 py-3 text-right'>Thuế suất GTGT</th>
                      <th className='px-4 py-3 text-right'>Tiền thuế GTGT</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100'>
                    {book.groups.map((group) => {
                      const category = getBusinessCategoryDisplay(
                        group.businessCategoryCode,
                        group.businessCategoryName
                      )

                      return (
                        <tr key={group.businessCategoryId} className='hover:bg-slate-50/60 transition-colors'>
                          <td className='px-4 py-3.5'>
                            <Tip content={category.legalName} side='top' align='start'>
                              <span className='w-fit font-semibold text-slate-900'>
                                {category.summary}
                              </span>
                            </Tip>
                          </td>
                          <td className='px-4 py-3.5 text-right font-medium text-slate-700 tabular-nums'>
                            {money.format(group.completedTransactionRevenue)} đ
                          </td>
                          <td className='px-4 py-3.5 text-right font-medium text-slate-700 tabular-nums'>
                            {money.format(group.manualBusinessRevenue)} đ
                          </td>
                          <td className='px-4 py-3.5 text-right font-bold text-slate-900 tabular-nums'>
                            {money.format(group.totalRevenue)} đ
                          </td>
                          <td className='px-4 py-3.5 text-right font-semibold text-slate-700'>
                            <span className='inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800'>
                              {group.vatRate}%
                            </span>
                          </td>
                          <td className='px-4 py-3.5 text-right font-bold text-[#9b0000] tabular-nums'>
                            {money.format(group.vatAmount)} đ
                          </td>
                        </tr>
                      )
                    })}

                    {/* Unclassified temporary row if there is any unclassified revenue */}
                    {unclassifiedRevenue > 0 && (
                      <tr className='bg-amber-50/40 text-amber-900'>
                        <td className='px-4 py-3.5'>
                          <div className='font-semibold flex items-center gap-1.5'>
                            <AlertCircle size={14} className='text-amber-600 shrink-0' />
                            <span>Chưa phân loại ngành nghề ({unclassifiedLines.length} phát sinh)</span>
                          </div>
                          <div className='text-xs text-amber-700'>
                            Xem chi tiết từng đơn ở Bảng 2 bên dưới
                          </div>
                        </td>
                        <td className='px-4 py-3.5 text-right font-medium text-slate-700 tabular-nums'>
                          {money.format(unclassifiedPosRevenue)} đ
                        </td>
                        <td className='px-4 py-3.5 text-right font-medium text-slate-700 tabular-nums'>
                          {money.format(unclassifiedManualRevenue)} đ
                        </td>
                        <td className='px-4 py-3.5 text-right font-bold tabular-nums text-amber-900'>
                          {money.format(unclassifiedRevenue)} đ
                        </td>
                        <td className='px-4 py-3.5 text-right text-xs text-slate-400'>—</td>
                        <td className='px-4 py-3.5 text-right text-xs text-slate-400'>Chưa xác định</td>
                      </tr>
                    )}
                  </tbody>
                  {/* Table Footer */}
                  <tfoot className='border-t-2 border-slate-200 bg-slate-50/90 font-bold text-slate-900'>
                    <tr>
                      <td className='px-4 py-3 text-left uppercase text-xs tracking-wider text-slate-600'>Tổng cộng</td>
                      <td className='px-4 py-3 text-right tabular-nums'>
                        {money.format(book.completedTransactionRevenue)} đ
                      </td>
                      <td className='px-4 py-3 text-right tabular-nums'>
                        {money.format(book.manualBusinessRevenue)} đ
                      </td>
                      <td className='px-4 py-3 text-right text-emerald-900 tabular-nums'>
                        {money.format(book.totalRevenue)} đ
                      </td>
                      <td className='px-4 py-3 text-right text-xs text-slate-400 font-normal'>—</td>
                      <td className='px-4 py-3 text-right text-[#9b0000] tabular-nums'>
                        {money.format(totalVat)} đ
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* ── BẢNG 2: DANH SÁCH CHI TIẾT TỪNG DÒNG PHÁT SINH ── */}
          <div className='overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs'>
            {/* Table Header & Controls */}
            <div className='border-b border-slate-100 p-4'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div className='flex items-center gap-2'>
                  <Receipt size={16} className='text-slate-600' />
                  <h2 className='text-sm font-bold text-slate-900 uppercase tracking-wider'>
                    2. Chi tiết từng dòng phát sinh doanh thu ({book.lines.length} dòng)
                  </h2>
                </div>

                {/* Search & Filters */}
                <div className='flex flex-wrap items-center gap-2.5'>
                  {/* Search box */}
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={14} />
                    <input
                      type='text'
                      placeholder='Tìm số HĐ, diễn giải...'
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                      className='h-9 w-48 sm:w-56 rounded-xl border border-slate-200 pl-8 pr-3 text-xs focus:border-red-600 focus:outline-hidden'
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className='absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Source filter */}
                  <select
                    value={sourceFilter}
                    onChange={(e) => {
                      setSourceFilter(e.target.value as SourceFilter)
                      setCurrentPage(1)
                    }}
                    className='h-9 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-700 focus:border-red-600 focus:outline-hidden'
                  >
                    <option value='all'>Tất cả nguồn</option>
                    <option value='Transaction'>Đơn hàng POS</option>
                    <option value='ManualIncome'>Thu nhập ngoài</option>
                  </select>

                  {/* Category filter */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className='h-9 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-700 focus:border-red-600 focus:outline-hidden'
                  >
                    <option value='all'>Tất cả ngành nghề</option>
                    {book.groups.map((g) => {
                      const category = getBusinessCategoryDisplay(
                        g.businessCategoryCode,
                        g.businessCategoryName
                      )
                      return (
                        <option
                          key={g.businessCategoryId}
                          value={g.businessCategoryId}
                        >
                          {category.detail}
                        </option>
                      )
                    })}
                    {unclassifiedLines.length > 0 && (
                      <option value='CHUA_PHAN_LOAI'>⚠️ Chưa phân loại ({unclassifiedLines.length})</option>
                    )}
                  </select>

                </div>
              </div>
            </div>

            {/* Lines Table */}
            {paginatedLines.length === 0 ? (
              <div className='p-10 text-center text-sm text-slate-400'>
                {searchQuery || sourceFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Không tìm thấy dòng doanh thu nào phù hợp với bộ lọc.'
                  : 'Không có dòng doanh thu nào trong kỳ.'}
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead className='border-b border-slate-200/80 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-500'>
                    <tr>
                      <th
                        onClick={() => handleSort('documentDate')}
                        className='px-4 py-3 text-left cursor-pointer select-none hover:text-slate-800'
                      >
                        <div className='flex items-center gap-1.5'>
                          <span>Ngày chứng từ</span>
                          <ArrowUpDown size={13} className={sortKey === 'documentDate' ? 'text-red-700' : 'text-slate-400'} />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('documentNumber')}
                        className='px-4 py-3 text-left cursor-pointer select-none hover:text-slate-800'
                      >
                        <div className='flex items-center gap-1.5'>
                          <span>Số chứng từ / HĐ</span>
                          <ArrowUpDown size={13} className={sortKey === 'documentNumber' ? 'text-red-700' : 'text-slate-400'} />
                        </div>
                      </th>
                      <th className='px-4 py-3 text-left'>Nguồn</th>
                      <th className='px-4 py-3 text-left'>Diễn giải</th>
                      <th className='px-4 py-3 text-left'>Ngành nghề</th>
                      <th
                        onClick={() => handleSort('amount')}
                        className='px-4 py-3 text-right cursor-pointer select-none hover:text-slate-800'
                      >
                        <div className='flex items-center justify-end gap-1.5'>
                          <span>Doanh thu</span>
                          <ArrowUpDown size={13} className={sortKey === 'amount' ? 'text-red-700' : 'text-slate-400'} />
                        </div>
                      </th>
                      <th className='whitespace-nowrap px-4 py-3 text-right'>Thuế suất GTGT</th>
                      <th className='whitespace-nowrap px-4 py-3 text-right'>Thuế GTGT</th>
                      <th className='px-4 py-3 text-center'>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100'>
                    {paginatedLines.map((line, index) => {
                      const isTransaction = line.sourceType === 'Transaction'
                      const isUnclassified =
                        !line.businessCategoryId || line.businessCategoryCode === 'CHUA_PHAN_LOAI'
                      const revenueGroup = line.businessCategoryId
                        ? revenueGroupByCategory.get(line.businessCategoryId)
                        : undefined
                      const category = getBusinessCategoryDisplay(
                        line.businessCategoryCode,
                        revenueGroup?.businessCategoryName
                      )
                      const lineVatAmount = revenueGroup
                        ? (line.amount * revenueGroup.vatRate) / 100
                        : null

                      return (
                        <tr key={`${line.sourceId}-${index}`} className='hover:bg-slate-50/60 transition-colors'>
                          <td className='whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-600 tabular-nums'>
                            {new Date(line.documentDate).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className='whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-slate-800'>
                            {line.documentNumber}
                          </td>
                          <td className='whitespace-nowrap px-4 py-3 text-xs'>
                            {isTransaction ? (
                              <span className='inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700'>
                                <ShoppingCart size={11} /> POS
                              </span>
                            ) : (
                              <span className='inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 font-semibold text-purple-700'>
                                <Receipt size={11} /> Thu ngoài
                              </span>
                            )}
                          </td>
                          <td className='min-w-48 px-4 py-3 text-xs text-slate-700'>
                            {line.description}
                          </td>
                          <td className='whitespace-nowrap px-4 py-3 text-xs'>
                            {isUnclassified ? (
                              <span className='inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800'>
                                <AlertCircle size={11} className='text-amber-600' /> Chưa phân loại
                              </span>
                            ) : (
                              <Tip content={category.legalName} side='top' align='start'>
                                <span className='rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600'>
                                  {category.detail}
                                </span>
                              </Tip>
                            )}
                          </td>
                          <td className='whitespace-nowrap px-4 py-3 text-right text-xs font-bold text-slate-900 tabular-nums'>
                            {money.format(line.amount)} đ
                          </td>
                          <td className='whitespace-nowrap px-4 py-3 text-right text-xs text-slate-600 tabular-nums'>
                            {revenueGroup ? `${money.format(revenueGroup.vatRate)}%` : '—'}
                          </td>
                          <td className='whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-red-700 tabular-nums'>
                            {lineVatAmount === null ? '—' : `${money.format(lineVatAmount)} đ`}
                          </td>
                          <td className='whitespace-nowrap px-4 py-3 text-center'>
                            <button
                              type='button'
                              onClick={() => handleOpenSourceDetail(line)}
                              title={isTransaction ? 'Xem đơn hàng trên POS' : 'Xem phiếu thu'}
                              className='inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors cursor-pointer'
                            >
                              <span>Chi tiết</span>
                              <ExternalLink size={12} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <TaxPagination
              page={currentPage}
              pageSize={pageSize}
              totalCount={totalLinesCount}
              itemLabel='dòng doanh thu'
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  )
}
