import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Filter,
  Layers,
  Package,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { exportS2d, getS2dPreview } from '../../../apis/taxBook.api'
import { useBusiness } from '../../../contexts/BusinessContext'
import type { InventoryBookBlocker, S2dBook, S2dBookLine, S2dItemBook } from '../../../types/taxBook.type'
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

type MovementFilter = 'all' | 'inbound' | 'outbound'
type SortKey =
  | 'documentDate'
  | 'documentNumber'
  | 'description'
  | 'inboundQuantity'
  | 'inboundValue'
  | 'outboundQuantity'
  | 'outboundValue'
  | 'runningQuantity'
  | 'runningValue'
type SortOrder = 'asc' | 'desc'

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

  // New Filters & Sorting States
  const [movementFilter, setMovementFilter] = useState<MovementFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

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
    void load()
  }, [load])

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

  const toggleAllItems = () => {
    if (!book) return
    const allKeys = book.items.map(itemKey)
    if (collapsedItemIds.size === allKeys.length) {
      setCollapsedItemIds(new Set())
    } else {
      setCollapsedItemIds(new Set(allKeys))
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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else {
        setSortKey(null)
        setSortOrder('asc')
      }
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const goToLine = (line: {
    documentNumber: string
    description: string
    movementType: string
    referenceId?: string | null
  }) => {
    if (line.movementType === 'OrderOut') {
      const orderId = line.referenceId || ''
      const orderCode = line.documentNumber || ''
      const params = new URLSearchParams()
      if (orderId) params.set('id', orderId)
      if (orderCode) params.set('orderCode', orderCode)
      params.set('autoOpen', 'true')
      navigate(`/business-owner/orders?${params.toString()}`)
    } else if (line.movementType === 'PurchaseIn') {
      const purchaseId = line.referenceId || line.documentNumber || ''
      const voucherNumber = line.documentNumber || ''
      const params = new URLSearchParams()
      if (purchaseId) params.set('id', purchaseId)
      if (voucherNumber) params.set('voucherNumber', voucherNumber)
      params.set('autoOpen', 'true')
      navigate(`/business-owner/purchase-expenses?${params.toString()}`)
    } else {
      const params = new URLSearchParams()
      if (line.referenceId) params.set('id', line.referenceId)
      params.set('autoOpen', 'true')
      navigate(`/business-owner/expenses?${params.toString()}`)
    }
  }

  // Filter and sort items and lines
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
          item.lines.some(
            (l) =>
              (l.inboundQuantity != null && l.inboundQuantity > 0) ||
              l.movementType === 'PurchaseIn' ||
              l.movementType === 'AdjustmentIn'
          )
        return hasInbound
      } else if (movementFilter === 'outbound') {
        const hasOutbound =
          item.totalOutboundQuantity > 0 ||
          item.lines.some(
            (l) =>
              (l.outboundQuantity != null && l.outboundQuantity > 0) ||
              l.movementType === 'OrderOut' ||
              l.movementType === 'AdjustmentOut'
          )
        return hasOutbound
      }

      return true
    })
  }, [book, searchQuery, movementFilter])

  const processLines = (lines: S2dBookLine[]) => {
    let result = [...lines]

    // Movement filter
    if (movementFilter === 'inbound') {
      result = result.filter(
        (l) =>
          (l.inboundQuantity != null && l.inboundQuantity > 0) ||
          l.movementType === 'PurchaseIn' ||
          l.movementType === 'AdjustmentIn'
      )
    } else if (movementFilter === 'outbound') {
      result = result.filter(
        (l) =>
          (l.outboundQuantity != null && l.outboundQuantity > 0) ||
          l.movementType === 'OrderOut' ||
          l.movementType === 'AdjustmentOut'
      )
    }

    // Search query within lines
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (l) =>
          l.documentNumber?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q)
      )
    }

    // Sorting
    if (sortKey) {
      result.sort((a, b) => {
        let va: any = a[sortKey]
        let vb: any = b[sortKey]

        if (sortKey === 'documentDate') {
          va = new Date(a.documentDate).getTime()
          vb = new Date(b.documentDate).getTime()
        } else if (typeof va === 'string') {
          va = (va ?? '').toLowerCase()
          vb = (vb ?? '').toLowerCase()
          return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
        }

        va = va ?? 0
        vb = vb ?? 0
        return sortOrder === 'asc' ? va - vb : vb - va
      })
    }

    return result
  }

  const renderSortHeader = (key: SortKey, label: string, align: 'left' | 'right' = 'left') => {
    const isSorted = sortKey === key
    return (
      <th
        key={key}
        onClick={() => handleSort(key)}
        className={`whitespace-nowrap px-3 py-3 select-none cursor-pointer hover:bg-gray-100 transition-colors ${
          align === 'right' ? 'text-right' : 'text-left'
        }`}
        title={`Nhấp để sắp xếp theo ${label}`}
      >
        <div className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          <span>{label}</span>
          {isSorted ? (
            sortOrder === 'asc' ? (
              <ArrowUp size={13} className='text-blue-600 stroke-[2.5]' />
            ) : (
              <ArrowDown size={13} className='text-blue-600 stroke-[2.5]' />
            )
          ) : (
            <ArrowUpDown size={12} className='text-gray-400 opacity-40 hover:opacity-100' />
          )}
        </div>
      </th>
    )
  }

  return (
    <div className='mx-auto max-w-7xl p-6'>
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
          {/* Header */}
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

          {/* Group rows */}
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
                  {/* Group header */}
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

                  {/* Detail items */}
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

          {/* Classification Filter Tabs & Search Bar */}
          <div className='flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200'>
            {/* Movement Filter Tabs */}
            <div className='flex items-center gap-1 bg-gray-100 p-1 rounded-lg'>
              <button
                onClick={() => setMovementFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  movementFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>Tất cả phát sinh</span>
                <span className='rounded-full bg-gray-200 px-1.5 py-0.2 text-[10px] text-gray-700'>
                  {book.items.reduce((s, it) => s + it.lines.length, 0)}
                </span>
              </button>

              <button
                onClick={() => setMovementFilter('inbound')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  movementFilter === 'inbound'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <ArrowDownLeft size={13} />
                <span>Nhập kho (+)</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  movementFilter === 'inbound' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {book.items.reduce((s, it) => s + it.lines.filter(l => (l.inboundQuantity ?? 0) > 0 || l.movementType === 'PurchaseIn').length, 0)}
                </span>
              </button>

              <button
                onClick={() => setMovementFilter('outbound')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  movementFilter === 'outbound'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-orange-800 hover:bg-orange-50'
                }`}
              >
                <ArrowUpRight size={13} />
                <span>Xuất kho (−)</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  movementFilter === 'outbound' ? 'bg-orange-700 text-white' : 'bg-orange-100 text-orange-800'
                }`}>
                  {book.items.reduce((s, it) => s + it.lines.filter(l => (l.outboundQuantity ?? 0) > 0 || l.movementType === 'OrderOut').length, 0)}
                </span>
              </button>
            </div>

            {/* Search Input & Master Toggle */}
            <div className='flex items-center gap-2.5 flex-1 max-w-md justify-end'>
              <div className='relative w-full max-w-xs'>
                <Search size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Tìm tên hàng, mã, số chứng từ...'
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
                onClick={toggleAllItems}
                className='inline-flex whitespace-nowrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 cursor-pointer'
              >
                <Layers size={13} />
                <span>
                  {collapsedItemIds.size === book.items.length
                    ? 'Mở rộng tất cả'
                    : 'Thu gọn tất cả'}
                </span>
              </button>
            </div>
          </div>

          {/* Master Item Header Info */}
          <div className='flex items-center justify-between px-1'>
            <div className='flex items-center gap-2 text-xs font-semibold text-gray-600'>
              <Package size={15} className='text-gray-500' />
              <span>
                Hiển thị <strong>{filteredItems.length}</strong> / {book.items.length} mặt hàng
                {sortKey && (
                  <span className='ml-2 text-blue-600 font-normal'>
                    (Đang sắp xếp: <strong>{sortKey}</strong> - {sortOrder === 'asc' ? 'Tăng dần ↑' : 'Giảm dần ↓'})
                  </span>
                )}
              </span>
            </div>
            {sortKey && (
              <button
                onClick={() => {
                  setSortKey(null)
                  setSortOrder('asc')
                }}
                className='text-xs text-blue-600 hover:underline cursor-pointer'
              >
                Đặt lại sắp xếp mặc định
              </button>
            )}
          </div>

          {/* Item sections */}
          {filteredItems.length === 0 ? (
            <div className='rounded-xl border bg-white p-8 text-center text-gray-500 text-sm'>
              Không tìm thấy mặt hàng hoặc phát sinh phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredItems.map((item) => {
                const key = itemKey(item)
                const isCollapsed = collapsedItemIds.has(key)
                const processed = processLines(item.lines)

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
                              {renderSortHeader('documentDate', 'Ngày', 'left')}
                              {renderSortHeader('documentNumber', 'Chứng từ', 'left')}
                              {renderSortHeader('description', 'Diễn giải', 'left')}
                              {renderSortHeader('inboundQuantity', 'Nhập (SL)', 'right')}
                              {renderSortHeader('inboundValue', 'Nhập tiền', 'right')}
                              {renderSortHeader('outboundQuantity', 'Xuất (SL)', 'right')}
                              {renderSortHeader('outboundValue', 'Xuất tiền', 'right')}
                              {renderSortHeader('runningQuantity', 'Tồn (SL)', 'right')}
                              {renderSortHeader('runningValue', 'Tồn tiền', 'right')}
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-gray-100'>
                            {/* Opening balance row (only visible in 'all' or 'inbound' view when not searching/sorting lines) */}
                            {(!sortKey && movementFilter !== 'outbound' && !searchQuery.trim()) && (
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
                                  Không có dòng phát sinh nào phù hợp với bộ lọc hiện tại.
                                </td>
                              </tr>
                            ) : (
                              processed.map((line) => (
                                <tr
                                  key={line.inventoryMovementId}
                                  onClick={() => goToLine(line)}
                                  className='hover:bg-blue-50/50 cursor-pointer transition-colors group'
                                  title={
                                    line.movementType === 'OrderOut'
                                      ? 'Nhấp để xem chi tiết đơn hàng'
                                      : line.movementType === 'PurchaseIn'
                                        ? 'Nhấp để xem chi tiết phiếu nhập hàng'
                                        : 'Nhấp để xem chi tiết'
                                  }
                                >
                                  <td className='whitespace-nowrap px-3 py-2.5 text-left text-gray-600 font-medium'>
                                    {new Date(line.documentDate).toLocaleDateString('vi-VN')}
                                  </td>
                                  <td className='whitespace-nowrap px-3 py-2.5 text-left font-semibold text-blue-600 group-hover:underline'>
                                    <div className='inline-flex items-center gap-1'>
                                      <span>{line.documentNumber}</span>
                                      <ExternalLink size={11} className='opacity-0 group-hover:opacity-100 transition-opacity' />
                                    </div>
                                  </td>
                                  <td className='min-w-52 px-3 py-2.5 text-left text-gray-800'>
                                    {line.description && !MOVEMENT_LABEL[line.description]
                                      ? line.description
                                      : MOVEMENT_LABEL[line.movementType] ?? line.description}
                                    {line.isProvisionalValue ? (
                                      <Tip
                                        content='Kỳ thuế đang mở nên đơn giá xuất kho là tạm tính (TT 88). Hệ thống sẽ chốt đơn giá chính thức khi đóng kỳ.'
                                        side='top'
                                        align='start'
                                        maxWidth='max-w-sm'
                                      >
                                        <span className='ml-2 inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800 cursor-help'>
                                          Tạm tính ⓘ
                                        </span>
                                      </Tip>
                                    ) : null}
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
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
