import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Filter,
  Image as ImageIcon,
  Info,
  Layers,
  LayoutGrid,
  ListFilter,
  Loader2,
  Package,
  Receipt,
  RefreshCw,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { exportS2d, getS2dPreview } from '../../../apis/taxBook.api'
import { getOrderById } from '../../../apis/order.api'
import { getInventoryPurchaseById } from '../../../apis/inventoryPurchase.api'
import { useBusiness } from '../../../contexts/BusinessContext'
import type { InventoryBookBlocker, S2dBook, S2dBookLine, S2dItemBook } from '../../../types/taxBook.type'
import type { OrderDetail } from '../../../types/order.type'
import type { InventoryPurchaseResponse } from '../../../types/inventoryPurchase.type'
import LegalBadge from '../../../components/owner/tax/LegalBadge'
import Tip from '../../../components/owner/tax/Tip'

const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 })
const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

const MOVEMENT_LABEL: Record<string, string> = {
  OpeningBalance: 'Số dư đầu kỳ',
  PurchaseIn: 'Nhập hàng',
  OrderOut: 'Xuất hàng (đơn)',
  AdjustmentIn: 'Điều chỉnh tăng',
  AdjustmentOut: 'Điều chỉnh giảm',
}

type WarningSeverity = 'error' | 'warning'
const BLOCKER_META: Record<string, { label: string; severity: WarningSeverity }> = {
  NEGATIVE_INVENTORY: {
    label: 'Tồn kho bị âm trong kỳ (xuất quá số lượng tồn)',
    severity: 'error',
  },
  MISSING_INBOUND_VALUE: {
    label: 'Phiếu nhập kho chưa có giá trị / đơn giá nhập',
    severity: 'error',
  },
  MISSING_OUTBOUND_VALUE: {
    label: 'Phiếu xuất kho chưa xác định được giá vốn',
    severity: 'warning',
  },
  MISSING_VALUATION_BASE: {
    label: 'Chưa có căn cứ tính giá xuất kho bình quân',
    severity: 'error',
  },
  MISSING_UNIT: {
    label: 'Mặt hàng chưa có đơn vị tính',
    severity: 'warning',
  },
  MISSING_PRIOR_OUTBOUND_VALUE: {
    label: 'Thiếu giá trị xuất kho từ kỳ trước',
    severity: 'error',
  },
  ITEM_NOT_FOUND: {
    label: 'Mặt hàng không tồn tại trong hệ thống',
    severity: 'error',
  },
  ITEM_BUSINESS_MISMATCH: {
    label: 'Mặt hàng không thuộc cơ sở kinh doanh hiện tại',
    severity: 'error',
  },
  DUPLICATE_SOURCE_ITEM: {
    label: 'Trùng lặp mặt hàng trong cùng chứng từ',
    severity: 'error',
  },
  CONFLICTING_FINALIZED_OUTBOUND_VALUE: {
    label: 'Xung đột giá trị xuất kho đã chốt kỳ trước',
    severity: 'error',
  },
  INVALID_ITEM: {
    label: 'Thông tin mặt hàng không hợp lệ',
    severity: 'error',
  },
  INVALID_QUANTITY: {
    label: 'Số lượng không hợp lệ',
    severity: 'error',
  },
  INVALID_VALUE: {
    label: 'Giá trị tiền không hợp lệ',
    severity: 'error',
  },
}

type ViewMode = 'byItem' | 'byOrder'
type MovementFilter = 'all' | 'inbound' | 'outbound'
type SortKey = 'documentDate' | 'value' | null
type SortOrder = 'asc' | 'desc'

interface GroupedDocItem {
  itemName: string
  unit: string | null
  inboundQuantity?: number | null
  inboundValue?: number | null
  outboundQuantity?: number | null
  outboundValue?: number | null
  isProvisionalValue?: boolean
}

interface GroupedDocument {
  id: string
  documentNumber: string
  referenceId?: string | null
  movementType: string
  documentDate: string
  description: string
  totalInboundValue: number
  totalOutboundValue: number
  items: GroupedDocItem[]
}

export default function S2dBookPage() {
  const { currentBusiness } = useBusiness()
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1)
  const [book, setBook] = useState<S2dBook | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set())
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [collapsedItemIds, setCollapsedItemIds] = useState<Set<string>>(new Set())
  const [collapsedDocIds, setCollapsedDocIds] = useState<Set<string>>(new Set())

  // View Mode: 'byItem' (Mặt hàng TT 88) or 'byOrder' (Gom cụm theo Đơn hàng/Nghiệp vụ)
  const [viewMode, setViewMode] = useState<ViewMode>('byItem')

  // Filters & Sorting States
  const [movementFilter, setMovementFilter] = useState<MovementFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Traceability Mini Card State
  const [selectedTrace, setSelectedTrace] = useState<{
    line: S2dBookLine
    item: S2dItemBook
  } | null>(null)
  const [traceLoading, setTraceLoading] = useState(false)
  const [traceOrder, setTraceOrder] = useState<OrderDetail | null>(null)
  const [tracePurchase, setTracePurchase] = useState<InventoryPurchaseResponse | null>(null)

  const load = useCallback(async () => {
    if (!currentBusiness) return
    try {
      setLoading(true)
      setBook(await getS2dPreview(currentBusiness.id, year, quarter))
    } catch {
      toast.error('Không thể tải sổ kho S2d')
    } finally {
      setLoading(false)
    }
  }, [currentBusiness, year, quarter])

  useEffect(() => {
    setBook(null)
    setExpandedCodes(new Set())
    setExpandedItems(new Set())
    setCollapsedItemIds(new Set())
    setCollapsedDocIds(new Set())
    setSelectedTrace(null)
    void load()
  }, [load])

  // Fetch Origin Document when a line is clicked in ByItem view
  useEffect(() => {
    if (!selectedTrace) {
      setTraceOrder(null)
      setTracePurchase(null)
      return
    }

    const { line } = selectedTrace
    setTraceOrder(null)
    setTracePurchase(null)

    if (line.movementType === 'OrderOut' && line.referenceId) {
      setTraceLoading(true)
      getOrderById(line.referenceId)
        .then((res) => {
          if (res.success && res.data) {
            setTraceOrder(res.data)
          }
        })
        .catch((err) => console.error('Không thể tra cứu đơn hàng gốc:', err))
        .finally(() => setTraceLoading(false))
    } else if (line.movementType === 'PurchaseIn' && line.referenceId) {
      setTraceLoading(true)
      getInventoryPurchaseById(line.referenceId)
        .then((res) => {
          if (res.success && res.data) {
            setTracePurchase(res.data)
          }
        })
        .catch((err) => console.error('Không thể tra cứu phiếu nhập gốc:', err))
        .finally(() => setTraceLoading(false))
    }
  }, [selectedTrace])

  const itemKey = (item: S2dItemBook) =>
    item.productId ?? item.ingredientId ?? item.itemCode ?? item.itemName

  const itemById = useMemo(() => {
    const map = new Map<string, S2dItemBook>()
    if (!book) return map
    for (const it of book.items) {
      if (it.productId) map.set(it.productId, it)
      if (it.ingredientId) map.set(it.ingredientId, it)
      if (it.itemCode) map.set(it.itemCode, it)
    }
    return map
  }, [book])

  const groupedBlockers = useMemo(() => {
    if (!book) return []
    const map = new Map<string, InventoryBookBlocker[]>()
    for (const b of book.blockers) {
      const list = map.get(b.code) ?? []
      list.push(b)
      map.set(b.code, list)
    }
    return Array.from(map.entries()).map(([code, items]) => ({ code, items }))
  }, [book])

  const toggleCode = (code: string) =>
    setExpandedCodes((prev) => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })

  const toggleItems = (code: string) =>
    setExpandedItems((prev) => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })

  const toggleItemCollapse = (id: string) => {
    setCollapsedItemIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleDocCollapse = (id: string) => {
    setCollapsedDocIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (!book) return
    if (viewMode === 'byItem') {
      const allKeys = book.items.map(itemKey)
      setCollapsedItemIds(collapsedItemIds.size === allKeys.length ? new Set() : new Set(allKeys))
    } else {
      const allDocIds = groupedDocuments.map((d) => d.id)
      setCollapsedDocIds(collapsedDocIds.size === allDocIds.length ? new Set() : new Set(allDocIds))
    }
  }

  const totals = useMemo(() => {
    if (!book) return { opening: 0, inbound: 0, outbound: 0, ending: 0 }
    return book.items.reduce(
      (acc, it) => ({
        opening: acc.opening + it.openingValue,
        inbound: acc.inbound + it.totalInboundValue,
        outbound: acc.outbound + it.totalOutboundValue,
        ending: acc.ending + it.endingValue,
      }),
      { opening: 0, inbound: 0, outbound: 0, ending: 0 }
    )
  }, [book])

  const download = async () => {
    if (!currentBusiness) return
    try {
      setExporting(true)
      const blob = await exportS2d(currentBusiness.id, year, quarter)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `S2d-HKD_${currentBusiness.businessName}_Q${quarter}_${year}.docx`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Không thể xuất sổ kho S2d')
    } finally {
      setExporting(false)
    }
  }

  // Navigate directly to origin page
  const navigateToOrigin = (movementType: string, referenceId?: string | null, documentNumber?: string) => {
    if (movementType === 'OrderOut') {
      const params = new URLSearchParams()
      if (referenceId) params.set('id', referenceId)
      if (documentNumber) params.set('orderCode', documentNumber)
      params.set('autoOpen', 'true')
      navigate(`/business-owner/orders?${params.toString()}`)
    } else if (movementType === 'PurchaseIn') {
      const params = new URLSearchParams()
      const targetId = referenceId || documentNumber
      if (targetId) params.set('id', targetId)
      if (documentNumber) params.set('voucherNumber', documentNumber)
      params.set('autoOpen', 'true')
      navigate(`/business-owner/purchase-expenses?${params.toString()}`)
    } else {
      const params = new URLSearchParams()
      if (referenceId) params.set('id', referenceId)
      params.set('autoOpen', 'true')
      navigate(`/business-owner/expenses?${params.toString()}`)
    }
  }

  // Group all lines across all items by Document / Order (Góc nhìn 2: Truy vết theo Đơn hàng)
  const groupedDocuments = useMemo(() => {
    if (!book) return []
    const map = new Map<string, GroupedDocument>()

    for (const item of book.items) {
      for (const line of item.lines) {
        const docKey = `${line.movementType}_${line.referenceId || line.documentNumber}_${line.documentDate}`
        let existing = map.get(docKey)
        if (!existing) {
          existing = {
            id: docKey,
            documentNumber: line.documentNumber,
            referenceId: line.referenceId,
            movementType: line.movementType,
            documentDate: typeof line.documentDate === 'string' ? line.documentDate : String(line.documentDate),
            description: line.description,
            totalInboundValue: 0,
            totalOutboundValue: 0,
            items: [],
          }
          map.set(docKey, existing)
        }

        existing.totalInboundValue += line.inboundValue ?? 0
        existing.totalOutboundValue += line.outboundValue ?? 0
        existing.items.push({
          itemName: item.itemName,
          unit: item.unit,
          inboundQuantity: line.inboundQuantity,
          inboundValue: line.inboundValue,
          outboundQuantity: line.outboundQuantity,
          outboundValue: line.outboundValue,
          isProvisionalValue: line.isProvisionalValue,
        })
      }
    }

    let list = Array.from(map.values())

    // Movement filter
    if (movementFilter === 'inbound') {
      list = list.filter((d) => d.totalInboundValue > 0 || d.movementType === 'PurchaseIn')
    } else if (movementFilter === 'outbound') {
      list = list.filter((d) => d.totalOutboundValue > 0 || d.movementType === 'OrderOut')
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (d) =>
          d.documentNumber.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.items.some((it) => it.itemName.toLowerCase().includes(q))
      )
    }

    // Sort by date desc (or by value)
    if (sortKey === 'value') {
      list.sort((a, b) => {
        const valA = a.totalInboundValue + a.totalOutboundValue
        const valB = b.totalInboundValue + b.totalOutboundValue
        return sortOrder === 'asc' ? valA - valB : valB - valA
      })
    } else {
      list.sort((a, b) => {
        const tA = new Date(a.documentDate).getTime()
        const tB = new Date(b.documentDate).getTime()
        return sortOrder === 'asc' ? tA - tB : tB - tA
      })
    }

    return list
  }, [book, movementFilter, searchQuery, sortKey, sortOrder])

  // Filter items for View Mode 1 (By Item)
  const filteredItems = useMemo(() => {
    if (!book) return []
    return book.items.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const itemMatches =
          item.itemName?.toLowerCase().includes(q) ||
          item.itemCode?.toLowerCase().includes(q) ||
          item.unit?.toLowerCase().includes(q)
        const hasMatchingLine = item.lines.some(
          (l) =>
            l.documentNumber?.toLowerCase().includes(q) ||
            l.description?.toLowerCase().includes(q)
        )
        if (!itemMatches && !hasMatchingLine) return false
      }

      if (movementFilter === 'inbound') {
        const hasInbound =
          item.totalInboundQuantity > 0 ||
          item.lines.some((l) => (l.inboundQuantity != null && l.inboundQuantity > 0) || l.movementType === 'PurchaseIn')
        return hasInbound
      } else if (movementFilter === 'outbound') {
        const hasOutbound =
          item.totalOutboundQuantity > 0 ||
          item.lines.some((l) => (l.outboundQuantity != null && l.outboundQuantity > 0) || l.movementType === 'OrderOut')
        return hasOutbound
      }

      return true
    })
  }, [book, searchQuery, movementFilter])

  const processItemLines = (lines: S2dBookLine[]) => {
    let result = [...lines]

    if (movementFilter === 'inbound') {
      result = result.filter(
        (l) => (l.inboundQuantity != null && l.inboundQuantity > 0) || l.movementType === 'PurchaseIn'
      )
    } else if (movementFilter === 'outbound') {
      result = result.filter(
        (l) => (l.outboundQuantity != null && l.outboundQuantity > 0) || l.movementType === 'OrderOut'
      )
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (l) => l.documentNumber?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q)
      )
    }

    if (sortKey === 'value') {
      result.sort((a, b) => {
        const valA = (a.inboundValue ?? 0) + (a.outboundValue ?? 0)
        const valB = (b.inboundValue ?? 0) + (b.outboundValue ?? 0)
        return sortOrder === 'asc' ? valA - valB : valB - valA
      })
    } else if (sortKey === 'documentDate') {
      result.sort((a, b) => {
        const tA = new Date(a.documentDate).getTime()
        const tB = new Date(b.documentDate).getTime()
        return sortOrder === 'asc' ? tA - tB : tB - tA
      })
    }

    return result
  }

  return (
    <div className='mx-auto max-w-7xl p-6'>
      {/* Top Title & Period Selector */}
      <div className='mb-5 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <div className='flex flex-wrap items-center gap-2.5'>
            <h1 className='text-2xl font-bold text-gray-900'>Sổ chi tiết tồn kho (S2d)</h1>
            <LegalBadge
              formCode='Mẫu S2d-HKD'
              circular='TT 88/2021/TT-BTC'
              title='Thông tư số 88/2021/TT-BTC ngày 11/10/2021 của Bộ Tài chính'
              description={
                'Theo dõi nhập - xuất - tồn kho theo giá bình quân cả kỳ (TT 88).\n\n➜ Đích đến: Giá trị xuất dùng cả năm chuyển thành Chi phí nguyên vật liệu [10a] khi quyết toán. (Phiếu chi tiền mặt ≥ 5 triệu không được tính là chi phí hợp lý).'
              }
            />
          </div>
          <p className='mt-1 text-sm text-gray-500'>{currentBusiness?.businessName ?? 'Chưa chọn cửa hàng'}</p>
        </div>

        <div className='flex flex-wrap items-end gap-3'>
          <label className='text-sm text-gray-600'>
            Năm
            <input
              className='mt-1 block w-28 rounded-lg border px-3 py-2'
              type='number'
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            />
          </label>
          <label className='text-sm text-gray-600'>
            Quý
            <select
              className='mt-1 block w-24 rounded-lg border px-3 py-2'
              value={quarter}
              onChange={(event) => setQuarter(Number(event.target.value))}
            >
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  Quý {value}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={load}
            disabled={!currentBusiness || loading}
            className='flex items-center gap-2 rounded-lg bg-[#9b0000] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer'
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Đang tải...' : 'Tải lại'}
          </button>
          <button
            onClick={download}
            disabled={!currentBusiness || exporting}
            className='flex items-center gap-2 rounded-lg border border-[#9b0000] px-4 py-2.5 text-sm font-semibold text-[#9b0000] disabled:opacity-50 cursor-pointer'
          >
            <Download size={16} />
            {exporting ? 'Đang xuất...' : 'Xuất Word'}
          </button>
        </div>
      </div>

      {/* Accordion Blockers (Dữ liệu cần kiểm tra) */}
      {groupedBlockers.length > 0 && (
        <div className='mb-5 overflow-hidden rounded-xl border border-amber-300 bg-amber-50'>
          <div className='flex items-center justify-between px-4 py-3'>
            <div className='flex items-center gap-2 font-semibold text-amber-950'>
              <span>⚠ Dữ liệu cần kiểm tra</span>
              <span className='rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-900'>
                {groupedBlockers.reduce((sum, g) => sum + g.items.length, 0)} vấn đề
              </span>
            </div>
            <button
              onClick={() => {
                if (expandedCodes.size === groupedBlockers.length) {
                  setExpandedCodes(new Set())
                } else {
                  setExpandedCodes(new Set(groupedBlockers.map((g) => g.code)))
                }
              }}
              className='flex items-center gap-1 text-xs font-medium text-amber-900 hover:underline cursor-pointer'
            >
              {expandedCodes.size === groupedBlockers.length ? (
                <>
                  <ChevronUp size={13} /> Thu gọn tất cả
                </>
              ) : (
                <>
                  <ChevronDown size={13} /> Mở rộng tất cả
                </>
              )}
            </button>
          </div>

          <div className='divide-y divide-amber-200 border-t border-amber-200'>
            {groupedBlockers.map(({ code, items }) => {
              const meta = BLOCKER_META[code]
              const isOpen = expandedCodes.has(code)
              const showAll = expandedItems.has(code)
              const PREVIEW_LIMIT = 5
              const displayed = showAll ? items : items.slice(0, PREVIEW_LIMIT)
              const severityDot = meta?.severity === 'error' ? 'bg-red-500' : 'bg-amber-500'

              return (
                <div key={code}>
                  <button
                    onClick={() => toggleCode(code)}
                    className='flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-amber-100/60 cursor-pointer'
                  >
                    <div className='flex items-center gap-2'>
                      <span className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${severityDot}`} />
                      <span className='text-sm font-medium text-amber-950'>{meta?.label ?? code}</span>
                      <span className='rounded-full bg-amber-200/80 px-1.5 py-0.5 text-xs font-semibold text-amber-900'>
                        {items.length}
                      </span>
                    </div>
                    {isOpen ? <ChevronUp size={14} className='text-amber-700' /> : <ChevronDown size={14} className='text-amber-600' />}
                  </button>

                  {isOpen && (
                    <div className='border-t border-amber-200/60 bg-white/70 px-4 pb-3 pt-2'>
                      <ul className='space-y-1.5'>
                        {displayed.map((item, i) => {
                          const matchedItem =
                            (item.productId && itemById.get(item.productId)) ||
                            (item.ingredientId && itemById.get(item.ingredientId)) ||
                            undefined

                          return (
                            <li
                              key={`${code}-${item.productId ?? item.ingredientId ?? i}`}
                              className='flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 py-1.5 border-b border-amber-100/60 last:border-b-0'
                            >
                              <div className='flex flex-wrap items-center gap-2'>
                                <span className='select-none text-amber-500 font-bold'>›</span>
                                {matchedItem ? (
                                  <>
                                    <span className='font-semibold text-gray-900'>{matchedItem.itemName}</span>
                                    {matchedItem.unit && (
                                      <span className='rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-900'>
                                        ĐVT: {matchedItem.unit}
                                      </span>
                                    )}
                                    <span className='text-gray-500'>
                                      (Tồn cuối: {number.format(matchedItem.endingQuantity)})
                                    </span>
                                  </>
                                ) : (
                                  <span className='text-gray-800'>{item.message}</span>
                                )}
                              </div>

                              <div>
                                {item.productId ? (
                                  <button
                                    onClick={() => navigate('/business-owner/products')}
                                    className='inline-flex items-center gap-1 rounded-md bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 text-[11.5px] font-semibold text-amber-900 transition-colors cursor-pointer'
                                    title='Xem danh sách hàng hóa'
                                  >
                                    <span>Xem hàng hóa</span>
                                    <ExternalLink size={12} />
                                  </button>
                                ) : item.ingredientId ? (
                                  <button
                                    onClick={() => navigate('/business-owner/ingredients')}
                                    className='inline-flex items-center gap-1 rounded-md bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 text-[11.5px] font-semibold text-amber-900 transition-colors cursor-pointer'
                                    title='Xem danh sách nguyên vật liệu'
                                  >
                                    <span>Xem nguyên liệu</span>
                                    <ExternalLink size={12} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => navigate('/business-owner/purchase-expenses')}
                                    className='inline-flex items-center gap-1 rounded-md bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 text-[11.5px] font-semibold text-amber-900 transition-colors cursor-pointer'
                                    title='Đi tới trang nhập hàng'
                                  >
                                    <span>Xem nhập hàng</span>
                                    <ExternalLink size={12} />
                                  </button>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>

                      {items.length > PREVIEW_LIMIT && (
                        <button
                          onClick={() => toggleItems(code)}
                          className='mt-2 text-xs font-medium text-amber-800 hover:underline cursor-pointer'
                        >
                          {showAll ? '▲ Thu gọn' : `▼ Xem thêm ${items.length - PREVIEW_LIMIT} vấn đề`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!book ? (
        <div className='rounded-xl border border-dashed bg-white p-12 text-center text-gray-500'>
          {loading ? 'Đang tải sổ...' : 'Không có dữ liệu để hiển thị.'}
        </div>
      ) : book.items.length === 0 ? (
        <div className='rounded-xl border bg-white p-12 text-center text-gray-500'>
          Không có phát sinh kho trong kỳ.
        </div>
      ) : (
        <div className='space-y-5'>
          {/* Summary KPI Cards */}
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='rounded-xl border bg-white p-4'>
              <div className='text-xs text-gray-500 font-medium'>Tổng tồn đầu kỳ</div>
              <div className='mt-1 text-lg font-bold text-gray-900 tabular-nums'>{money.format(totals.opening)} đ</div>
            </div>
            <div className='rounded-xl border bg-white p-4'>
              <div className='text-xs text-gray-500 font-medium'>Tổng nhập trong kỳ (+)</div>
              <div className='mt-1 text-lg font-bold text-emerald-700 tabular-nums'>+{money.format(totals.inbound)} đ</div>
            </div>
            <div className='rounded-xl border bg-white p-4'>
              <div className='text-xs text-gray-500 font-medium'>Tổng xuất dùng S2c [10a] (−)</div>
              <div className='mt-1 text-lg font-bold text-orange-700 tabular-nums'>−{money.format(totals.outbound)} đ</div>
            </div>
            <div className='rounded-xl border bg-white p-4'>
              <div className='text-xs text-gray-500 font-medium'>Tổng tồn cuối kỳ (=)</div>
              <div className='mt-1 text-lg font-bold text-blue-900 tabular-nums'>{money.format(totals.ending)} đ</div>
            </div>
          </div>

          {/* DUAL VIEW MODE SWITCHER & CONTROLS */}
          <div className='flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs'>
            {/* View Mode Toggle: By Item vs By Order */}
            <div className='flex items-center gap-1 bg-gray-100 p-1 rounded-xl'>
              <button
                onClick={() => setViewMode('byItem')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'byItem'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package size={14} className={viewMode === 'byItem' ? 'text-[#9b0000]' : ''} />
                <span>Theo mặt hàng (Sổ S2d TT 88)</span>
              </button>

              <button
                onClick={() => setViewMode('byOrder')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'byOrder'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShoppingCart size={14} className={viewMode === 'byOrder' ? 'text-blue-600' : ''} />
                <span>Gom theo Đơn hàng & Chứng từ</span>
                <span className='rounded-full bg-blue-100 text-blue-800 px-1.5 py-0.2 text-[10px]'>
                  {groupedDocuments.length}
                </span>
              </button>
            </div>

            {/* Inbound / Outbound Filter Buttons */}
            <div className='flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200/80'>
              <button
                onClick={() => setMovementFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  movementFilter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setMovementFilter('inbound')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  movementFilter === 'inbound'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                +Nhập kho
              </button>
              <button
                onClick={() => setMovementFilter('outbound')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  movementFilter === 'outbound'
                    ? 'bg-orange-600 text-white'
                    : 'text-orange-800 hover:bg-orange-50'
                }`}
              >
                −Xuất kho
              </button>
            </div>

            {/* Search Input & Master Toggle */}
            <div className='flex items-center gap-2 flex-1 max-w-sm justify-end'>
              <div className='relative w-full'>
                <Search size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={viewMode === 'byItem' ? 'Tìm tên hàng, mã...' : 'Tìm mã đơn, nguyên liệu...'}
                  className='w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-xs text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors'
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className='absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600'
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                onClick={toggleAll}
                className='inline-flex whitespace-nowrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 cursor-pointer'
              >
                <Layers size={13} />
                <span>
                  {(viewMode === 'byItem'
                    ? collapsedItemIds.size === book.items.length
                    : collapsedDocIds.size === groupedDocuments.length)
                    ? 'Mở rộng'
                    : 'Thu gọn'}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Sort Filter Bar */}
          <div className='flex items-center justify-between px-1 text-xs text-gray-500'>
            <div className='flex items-center gap-2'>
              <span>Sắp xếp nhanh:</span>
              <button
                onClick={() => {
                  if (sortKey === 'documentDate') {
                    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                  } else {
                    setSortKey('documentDate')
                    setSortOrder('desc')
                  }
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-medium cursor-pointer transition-colors ${
                  sortKey === 'documentDate'
                    ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>Thời gian</span>
                {sortKey === 'documentDate' && (sortOrder === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
              </button>

              <button
                onClick={() => {
                  if (sortKey === 'value') {
                    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                  } else {
                    setSortKey('value')
                    setSortOrder('desc')
                  }
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-medium cursor-pointer transition-colors ${
                  sortKey === 'value'
                    ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>Giá trị tiền</span>
                {sortKey === 'value' && (sortOrder === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
              </button>

              {sortKey && (
                <button
                  onClick={() => setSortKey(null)}
                  className='text-blue-600 hover:underline ml-1 cursor-pointer'
                >
                  Mặc định
                </button>
              )}
            </div>

            <div>
              {viewMode === 'byItem'
                ? `Hiển thị ${filteredItems.length} / ${book.items.length} mặt hàng`
                : `Hiển thị ${groupedDocuments.length} đơn hàng & chứng từ`}
            </div>
          </div>

          {/* ========================================================= */}
          {/* VIEW MODE 1: BY ITEM (SỔ KHO THEO MẶT HÀNG - CHUẨN TT 88) */}
          {/* ========================================================= */}
          {viewMode === 'byItem' && (
            <div className='space-y-4'>
              {filteredItems.length === 0 ? (
                <div className='rounded-xl border bg-white p-8 text-center text-gray-500 text-sm'>
                  Không tìm thấy mặt hàng nào phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const key = itemKey(item)
                  const isCollapsed = collapsedItemIds.has(key)
                  const processed = processItemLines(item.lines)

                  return (
                    <div key={key} className='overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs'>
                      {/* Item Header */}
                      <div
                        onClick={() => toggleItemCollapse(key)}
                        className='flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-gray-50/90 to-white border-b border-gray-100 cursor-pointer select-none hover:from-gray-100/90 hover:to-gray-50 transition-colors'
                      >
                        <div>
                          <div className='flex items-center gap-2'>
                            <span className='text-base font-bold text-gray-900'>{item.itemName}</span>
                            {item.unit && (
                              <span className='rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'>
                                ĐVT: {item.unit}
                              </span>
                            )}
                            {item.isDeleted && (
                              <span className='text-xs text-red-500 font-normal'>(đã ngừng kinh doanh)</span>
                            )}
                          </div>
                          <div className='mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 tabular-nums'>
                            <span className='font-medium'>
                              Đầu kỳ: <strong>{number.format(item.openingQuantity)}</strong> ({money.format(item.openingValue)} đ)
                            </span>
                            <span className='text-gray-300'>|</span>
                            <span className='font-semibold text-emerald-700'>
                              +Nhập: {number.format(item.totalInboundQuantity)} ({money.format(item.totalInboundValue)} đ)
                            </span>
                            <span className='text-gray-300'>|</span>
                            <span className='font-semibold text-orange-700'>
                              −Xuất: {number.format(item.totalOutboundQuantity)} ({money.format(item.totalOutboundValue)} đ)
                            </span>
                          </div>
                        </div>

                        <div className='flex items-center gap-3'>
                          <div className='text-right'>
                            <div className='text-xs text-gray-500 font-medium'>Tồn cuối kỳ</div>
                            <div className='text-base font-bold text-blue-950 tabular-nums'>
                              {number.format(item.endingQuantity)} {item.unit ?? ''} · {money.format(item.endingValue)} đ
                            </div>
                          </div>
                          <span className='rounded-lg p-1.5 text-gray-400'>
                            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                          </span>
                        </div>
                      </div>

                      {/* Table Data */}
                      {!isCollapsed && (
                        <div className='overflow-x-auto'>
                          <table className='min-w-full text-sm'>
                            <thead className='bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-100'>
                              <tr>
                                <th className='whitespace-nowrap px-3 py-3 text-left'>Ngày</th>
                                <th className='whitespace-nowrap px-3 py-3 text-left'>Chứng từ</th>
                                <th className='whitespace-nowrap px-3 py-3 text-left'>Diễn giải nghiệp vụ</th>
                                <th className='whitespace-nowrap px-3 py-3 text-right'>Nhập (SL)</th>
                                <th className='whitespace-nowrap px-3 py-3 text-right'>Nhập tiền</th>
                                <th className='whitespace-nowrap px-3 py-3 text-right'>Xuất (SL)</th>
                                <th className='whitespace-nowrap px-3 py-3 text-right'>Xuất tiền</th>
                                <th className='whitespace-nowrap px-3 py-3 text-right'>Tồn (SL)</th>
                                <th className='whitespace-nowrap px-3 py-3 text-right'>Tồn tiền</th>
                              </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-100'>
                              {!sortKey && movementFilter !== 'outbound' && !searchQuery.trim() && (
                                <tr className='bg-blue-50/50 font-medium text-gray-900'>
                                  <td className='px-3 py-2.5' colSpan={7}>
                                    Số dư đầu kỳ
                                  </td>
                                  <td className='px-3 py-2.5 text-right tabular-nums'>{number.format(item.openingQuantity)}</td>
                                  <td className='px-3 py-2.5 text-right font-semibold tabular-nums'>{money.format(item.openingValue)} đ</td>
                                </tr>
                              )}

                              {processed.length === 0 ? (
                                <tr>
                                  <td colSpan={9} className='px-3 py-6 text-center text-xs text-gray-400'>
                                    Không có dòng phát sinh nào phù hợp với bộ lọc.
                                  </td>
                                </tr>
                              ) : (
                                processed.map((line) => {
                                  const isOrder = line.movementType === 'OrderOut'
                                  const isPurchase = line.movementType === 'PurchaseIn'
                                  const shortDoc = line.documentNumber.startsWith('KHO-')
                                    ? `#${line.documentNumber.slice(4, 12)}`
                                    : line.documentNumber

                                  return (
                                    <tr
                                      key={line.inventoryMovementId}
                                      onClick={() => setSelectedTrace({ line, item })}
                                      className='hover:bg-blue-50/60 cursor-pointer transition-colors group'
                                      title='Nhấp để xem nhanh liên kết đơn hàng'
                                    >
                                      <td className='whitespace-nowrap px-3 py-2.5 text-left text-gray-600 font-medium'>
                                        {new Date(line.documentDate).toLocaleDateString('vi-VN')}
                                      </td>
                                      <td className='whitespace-nowrap px-3 py-2.5 text-left'>
                                        <div className='inline-flex items-center gap-1.5'>
                                          {isOrder ? (
                                            <span className='inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-bold text-blue-700 group-hover:bg-blue-100'>
                                              <ShoppingCart size={11} />
                                              <span>{shortDoc}</span>
                                            </span>
                                          ) : isPurchase ? (
                                            <span className='inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-700 group-hover:bg-emerald-100'>
                                              <Receipt size={11} />
                                              <span>{shortDoc}</span>
                                            </span>
                                          ) : (
                                            <span className='font-semibold text-gray-700'>{line.documentNumber}</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className='min-w-52 px-3 py-2.5 text-left text-gray-800'>
                                        {isOrder && (line.description === 'OrderOut' || !line.description) ? (
                                          <span className='font-medium text-gray-700'>
                                            Xuất bán theo đơn hàng {shortDoc}
                                          </span>
                                        ) : line.description && !MOVEMENT_LABEL[line.description] ? (
                                          line.description
                                        ) : (
                                          MOVEMENT_LABEL[line.movementType] ?? line.description
                                        )}
                                      </td>
                                      <td className='px-3 py-2.5 text-right font-semibold text-emerald-700 tabular-nums'>
                                        {line.inboundQuantity == null ? '' : `+${number.format(line.inboundQuantity)}`}
                                      </td>
                                      <td className='px-3 py-2.5 text-right text-emerald-800 tabular-nums'>
                                        {line.inboundValue == null ? '' : `${money.format(line.inboundValue)} đ`}
                                      </td>
                                      <td className='px-3 py-2.5 text-right font-semibold text-orange-700 tabular-nums'>
                                        {line.outboundQuantity == null ? '' : `−${number.format(line.outboundQuantity)}`}
                                      </td>
                                      <td className='px-3 py-2.5 text-right text-orange-800 tabular-nums'>
                                        {line.outboundValue == null ? '' : `${money.format(line.outboundValue)} đ`}
                                      </td>
                                      <td className='px-3 py-2.5 text-right font-bold text-gray-900 tabular-nums'>
                                        {number.format(line.runningQuantity)}
                                      </td>
                                      <td className='px-3 py-2.5 text-right font-bold text-blue-950 tabular-nums'>
                                        {money.format(line.runningValue)} đ
                                      </td>
                                    </tr>
                                  )
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW MODE 2: BY ORDER (GOM CỤM THEO ĐƠN HÀNG & CHỨNG TỪ) */}
          {/* ========================================================= */}
          {viewMode === 'byOrder' && (
            <div className='space-y-3.5'>
              {groupedDocuments.length === 0 ? (
                <div className='rounded-xl border bg-white p-8 text-center text-gray-500 text-sm'>
                  Không có đơn hàng hoặc chứng từ nào phù hợp với bộ lọc.
                </div>
              ) : (
                groupedDocuments.map((doc) => {
                  const isCollapsed = collapsedDocIds.has(doc.id)
                  const isOrder = doc.movementType === 'OrderOut'
                  const isPurchase = doc.movementType === 'PurchaseIn'
                  const shortDoc = doc.documentNumber.startsWith('KHO-')
                    ? `#${doc.documentNumber.slice(4, 12)}`
                    : doc.documentNumber

                  return (
                    <div
                      key={doc.id}
                      className='overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xs transition-shadow hover:shadow-md'
                    >
                      {/* Document Card Header */}
                      <div
                        onClick={() => toggleDocCollapse(doc.id)}
                        className='flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-gray-50/90 to-white cursor-pointer select-none hover:from-gray-100/80 transition-colors'
                      >
                        <div className='flex items-center gap-3'>
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                              isOrder
                                ? 'bg-blue-100 text-blue-700'
                                : isPurchase
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {isOrder ? <ShoppingCart size={17} /> : isPurchase ? <Receipt size={17} /> : <Package size={17} />}
                          </div>

                          <div>
                            <div className='flex items-center gap-2'>
                              <strong className='font-bold text-gray-900 text-sm font-mono'>
                                {doc.documentNumber}
                              </strong>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isOrder
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : isPurchase
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {isOrder ? 'Xuất bán đơn hàng' : isPurchase ? 'Nhập kho mua hàng' : 'Kiểm kê kho'}
                              </span>
                            </div>
                            <div className='text-xs text-gray-500 mt-0.5'>
                              Ngày: {new Date(doc.documentDate).toLocaleDateString('vi-VN')} · Gồm{' '}
                              <strong>{doc.items.length} mặt hàng</strong> liên quan
                            </div>
                          </div>
                        </div>

                        <div className='flex items-center gap-4'>
                          <div className='text-right'>
                            <div className='text-xs text-gray-400 font-medium'>
                              {isOrder ? 'Tổng giá vốn xuất [10a]' : 'Tổng giá trị nhập'}
                            </div>
                            <div
                              className={`text-base font-black tabular-nums ${
                                isOrder ? 'text-orange-700' : 'text-emerald-700'
                              }`}
                            >
                              {isOrder
                                ? `−${money.format(doc.totalOutboundValue)} đ`
                                : `+${money.format(doc.totalInboundValue)} đ`}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateToOrigin(doc.movementType, doc.referenceId, doc.documentNumber)
                            }}
                            className='inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-50 transition-colors cursor-pointer'
                            title='Xem chứng từ gốc'
                          >
                            <span>Chi tiết</span>
                            <ExternalLink size={12} />
                          </button>

                          <span className='text-gray-400'>
                            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                          </span>
                        </div>
                      </div>

                      {/* Items breakdown inside this Document */}
                      {!isCollapsed && (
                        <div className='border-t border-gray-100 bg-white px-5 py-3'>
                          <div className='text-xs font-bold text-gray-600 mb-2'>
                            Danh sách các nguyên vật liệu {isOrder ? 'tiêu hao trong đơn này' : 'nhập vào đợt này'}:
                          </div>

                          <div className='divide-y divide-gray-100 border rounded-xl overflow-hidden text-xs'>
                            {doc.items.map((it, idx) => (
                              <div
                                key={`${doc.id}-${it.itemName}-${idx}`}
                                className='flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors'
                              >
                                <div className='flex items-center gap-2'>
                                  <span className='text-gray-400'>▸</span>
                                  <span className='font-bold text-gray-900'>{it.itemName}</span>
                                  {it.unit && (
                                    <span className='rounded bg-gray-100 px-1.5 py-0.2 text-[10px] text-gray-600 font-medium'>
                                      {it.unit}
                                    </span>
                                  )}
                                </div>

                                <div className='flex items-center gap-6 tabular-nums'>
                                  <span className='text-gray-600 font-medium'>
                                    SL: {isOrder ? `−${number.format(it.outboundQuantity ?? 0)}` : `+${number.format(it.inboundQuantity ?? 0)}`} {it.unit}
                                  </span>
                                  <span className={`font-bold min-w-20 text-right ${isOrder ? 'text-orange-700' : 'text-emerald-700'}`}>
                                    {isOrder ? `−${money.format(it.outboundValue ?? 0)} đ` : `+${money.format(it.inboundValue ?? 0)} đ`}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Mini Card Giải Trình Nguồn Gốc Nghiệp Vụ Siêu Gọn (Punchy Traceability Card) */}
      {selectedTrace && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150'>
          <div className='w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150'>
            {/* Header */}
            <div className='flex items-center justify-between border-b border-gray-100 bg-gray-50/90 px-5 py-3.5'>
              <div className='flex items-center gap-2'>
                {selectedTrace.line.movementType === 'OrderOut' ? (
                  <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700'>
                    <ShoppingCart size={15} />
                  </div>
                ) : selectedTrace.line.movementType === 'PurchaseIn' ? (
                  <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700'>
                    <Receipt size={15} />
                  </div>
                ) : (
                  <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-700'>
                    <Info size={15} />
                  </div>
                )}
                <div>
                  <h3 className='text-sm font-bold text-gray-900'>
                    {selectedTrace.line.movementType === 'OrderOut'
                      ? 'Nguồn gốc: Đơn hàng bán ra'
                      : selectedTrace.line.movementType === 'PurchaseIn'
                        ? 'Nguồn gốc: Phiếu nhập kho'
                        : 'Chi tiết phát sinh kho'}
                  </h3>
                  <p className='text-[11px] text-gray-500 font-medium truncate max-w-[240px]'>
                    {selectedTrace.item.itemName} ({selectedTrace.item.unit})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrace(null)}
                className='rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer'
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className='p-5 space-y-3.5 text-xs'>
              {traceLoading ? (
                <div className='flex items-center justify-center py-6 text-gray-400 gap-2'>
                  <Loader2 size={16} className='animate-spin text-blue-600' />
                  <span>Đang tải thông tin chứng từ...</span>
                </div>
              ) : selectedTrace.line.movementType === 'OrderOut' ? (
                <div className='space-y-3'>
                  <div className='flex items-center justify-between text-gray-600 bg-gray-50 px-3 py-2 rounded-lg'>
                    <span>Mã đơn: <strong className='text-gray-900 font-mono'>{traceOrder?.transactionCode || selectedTrace.line.documentNumber}</strong></span>
                    <span>{new Date(traceOrder?.transactionDate || selectedTrace.line.documentDate).toLocaleDateString('vi-VN')}</span>
                  </div>

                  <div className='space-y-2 rounded-xl border border-blue-100 bg-blue-50/40 p-3.5'>
                    <div className='flex items-center justify-between'>
                      <span className='text-gray-600'>Tổng bill bán (Doanh thu S2b):</span>
                      <strong className='text-sm font-bold text-emerald-700 tabular-nums'>
                        +{money.format(traceOrder?.totalAmount ?? 0)} đ
                      </strong>
                    </div>

                    <div className='flex items-center justify-between border-t border-blue-100/80 pt-2'>
                      <span className='text-gray-600'>
                        Giá vốn xuất dùng (S2c [10a]):
                      </span>
                      <strong className='text-sm font-bold text-orange-700 tabular-nums'>
                        −{money.format(selectedTrace.line.outboundValue ?? 0)} đ
                      </strong>
                    </div>
                  </div>

                  <div className='text-gray-500 flex items-center justify-between px-1'>
                    <span>Lượng xuất kho:</span>
                    <span className='font-semibold text-gray-800 tabular-nums'>
                      −{number.format(selectedTrace.line.outboundQuantity ?? 0)} {selectedTrace.item.unit} ({selectedTrace.item.itemName})
                    </span>
                  </div>
                </div>
              ) : selectedTrace.line.movementType === 'PurchaseIn' ? (
                <div className='space-y-3'>
                  <div className='flex items-center justify-between text-gray-600 bg-gray-50 px-3 py-2 rounded-lg'>
                    <span>Số phiếu: <strong className='text-gray-900 font-mono'>{tracePurchase?.voucherNumber || selectedTrace.line.documentNumber}</strong></span>
                    <span className='truncate max-w-[150px] font-medium text-gray-700'>{tracePurchase?.supplierName || 'Vãng lai'}</span>
                  </div>

                  <div className='space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5'>
                    <div className='flex items-center justify-between'>
                      <span className='text-gray-600'>Giá trị nhập kho:</span>
                      <strong className='text-sm font-bold text-emerald-700 tabular-nums'>
                        +{money.format(selectedTrace.line.inboundValue ?? 0)} đ
                      </strong>
                    </div>
                    <div className='flex items-center justify-between border-t border-emerald-100/80 pt-2 text-gray-500'>
                      <span>Số lượng nhập:</span>
                      <strong className='font-semibold text-gray-800 tabular-nums'>
                        +{number.format(selectedTrace.line.inboundQuantity ?? 0)} {selectedTrace.item.unit}
                      </strong>
                    </div>
                  </div>

                  {tracePurchase?.receiptImageUrl && (
                    <div className='flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg'>
                      <span className='text-gray-600 flex items-center gap-1.5'>
                        <ImageIcon size={13} className='text-emerald-600' />
                        <span>Ảnh hóa đơn chứng từ</span>
                      </span>
                      <a
                        href={tracePurchase.receiptImageUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5'
                      >
                        <span>Xem ảnh</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className='text-gray-600 bg-gray-50 p-3 rounded-lg text-center'>
                  Số dư đầu kỳ hoặc kiểm kê điều chỉnh nội bộ cửa hàng.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className='flex items-center justify-between border-t border-gray-100 bg-gray-50/80 px-5 py-3'>
              {selectedTrace.line.movementType === 'OrderOut' || selectedTrace.line.movementType === 'PurchaseIn' ? (
                <button
                  onClick={() => {
                    const line = selectedTrace.line
                    setSelectedTrace(null)
                    navigateToOrigin(line.movementType, line.referenceId, line.documentNumber)
                  }}
                  className='inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors cursor-pointer'
                >
                  <span>{selectedTrace.line.movementType === 'OrderOut' ? 'Xem đơn hàng đầy đủ' : 'Xem phiếu nhập đầy đủ'}</span>
                  <ExternalLink size={12} />
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => setSelectedTrace(null)}
                className='rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 transition-colors cursor-pointer'
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
