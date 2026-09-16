import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, Search, Box, X, Scan, RotateCcw, Loader2, PlayCircle, Trash2, CheckCircle, Store } from 'lucide-react'
import { toast } from 'react-toastify'
import { useBusiness } from '../../contexts/BusinessContext'
import { getOrders, getOrderById, cancelOrder, confirmPayment } from '../../apis/order.api'
import type { Order, OrderDetail } from '../../types/order.type'
import path from '../../constants/path'
import http from '../../utils/http'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../components/ui/pagination'
// Database timestamps are UTC without an offset; calendar filters use Bangkok days.
function orderDateRange(filter: string, custom: string) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const [y, m, d] = today.split('-').map(Number)
  let start = Date.UTC(y, m - 1, d)
  let end = start + 86400000
  if (filter === '7 ngày qua') start -= 6 * 86400000
  else if (filter === '30 ngày qua') start -= 29 * 86400000
  else if (filter === 'Tháng này') { start = Date.UTC(y, m - 1, 1); end = Date.UTC(y, m, 1) }
  else if (filter === 'Tháng trước') { start = Date.UTC(y, m - 2, 1); end = Date.UTC(y, m - 1, 1) }
  else if (filter === 'Năm nay') { start = Date.UTC(y, 0, 1); end = Date.UTC(y + 1, 0, 1) }
  else if (filter === 'Tùy chọn') {
    if (!custom) return {}
    start = Date.parse(`${custom}T00:00:00Z`); end = start + 86400000
  }
  return { startDate: new Date(start - 7 * 3600000).toISOString().slice(0, -1), endDate: new Date(end - 7 * 3600000).toISOString().slice(0, -1) }
}

export default function OrderPage() {
  const { businesses, currentBusiness, setCurrentBusiness } = useBusiness()
  const businessId = currentBusiness?.id
  const navigate = useNavigate()

  // Data states
  const [totalCount, setTotalCount] = useState(0)
  const requestVersion = useRef(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Confirm cancel state
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false)
  const [targetCancelOrderId, setTargetCancelOrderId] = useState<string | null>(null)
  const [cancellingOrder, setCancellingOrder] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)

  // Pagination & URL params
  const [searchParams, setSearchParams] = useSearchParams()
  const orderCodeFromUrl = searchParams.get('orderCode') || searchParams.get('search') || ''
  const statusFromUrl = searchParams.get('status') || 'all'
  const hasInvoiceFromUrl = searchParams.get('hasInvoice') || 'all'
  const timeFilterFromUrl = searchParams.get('timeFilter')
  const startDateFromUrl = searchParams.get('startDate')
  const endDateFromUrl = searchParams.get('endDate')
  const autoOpenFromUrl = searchParams.get('autoOpen') === 'true'
  const autoOpenedRef = useRef(false)

  // Filters state
  const [searchQuery, setSearchQuery] = useState(orderCodeFromUrl)
  const [statusFilter, setStatusFilter] = useState(statusFromUrl)
  const [hasInvoiceFilter, setHasInvoiceFilter] = useState(hasInvoiceFromUrl)
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState(
    timeFilterFromUrl || (startDateFromUrl && endDateFromUrl ? 'Kỳ kê khai' : orderCodeFromUrl ? 'Năm nay' : 'Tháng này')
  )
  const [customDate, setCustomDate] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const requestedPage = Number(searchParams.get('page') ?? '1')
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const pageSize = 10

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    if (newPage === 1) {
      params.delete('page')
    } else {
      params.set('page', newPage.toString())
    }
    setSearchParams(params, { replace: true })
  }

  // Sync filters if URL params change
  useEffect(() => {
    const code = searchParams.get('orderCode') || searchParams.get('search') || ''
    if (code !== searchQuery) {
      setSearchQuery(code)
      autoOpenedRef.current = false
    }

    const stat = searchParams.get('status') || 'all'
    if (stat !== statusFilter) {
      setStatusFilter(stat)
    }

    const inv = searchParams.get('hasInvoice') || 'all'
    if (inv !== hasInvoiceFilter) {
      setHasInvoiceFilter(inv)
    }

    const sDate = searchParams.get('startDate')
    const eDate = searchParams.get('endDate')
    const tf = searchParams.get('timeFilter')
    if (sDate && eDate) {
      setTimeFilter('Kỳ kê khai')
    } else if (tf && tf !== timeFilter) {
      setTimeFilter(tf)
    } else if (!sDate && !eDate && !tf && timeFilter === 'Kỳ kê khai') {
      setTimeFilter('Tháng này')
    }
  }, [searchParams])

  const businessIdFromUrl = searchParams.get('businessId')
  useEffect(() => {
    if (businessIdFromUrl && businesses.length > 0) {
      const target = businesses.find((b) => b.id === businessIdFromUrl)
      if (target && target.id !== currentBusiness?.id) {
        setCurrentBusiness(target)
      }
    }
  }, [businessIdFromUrl, businesses, currentBusiness, setCurrentBusiness])

  const handleSwitchBusiness = (business: any) => {
    setCurrentBusiness(business)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('businessId', business.id)
    newParams.delete('page')
    setSearchParams(newParams, { replace: true })
  }

  const fetchOrders = async () => {
    if (!businessId) return
    const version = ++requestVersion.current
    try {
      setLoading(true)

      // Use exact startDate and endDate from URL if provided and timeFilter is 'Kỳ kê khai' or custom
      const dateParams = (startDateFromUrl && endDateFromUrl && (timeFilter === 'Kỳ kê khai' || timeFilter === 'Năm nay' || timeFilter === 'Tùy chọn'))
        ? { startDate: startDateFromUrl, endDate: endDateFromUrl }
        : orderDateRange(timeFilter, customDate)

      const res = await getOrders(businessId, {
        pageNumber: page,
        pageSize,
        ...dateParams,
        search: searchQuery,
        excludeEmptyDrafts: true,
        status: statusFilter !== 'all' ? statusFilter : null,
        paymentMethod: paymentFilter !== 'all' ? paymentFilter : null,
        hasInvoice: hasInvoiceFilter === 'all' ? null : hasInvoiceFilter === 'true'
      })

      if (version !== requestVersion.current) return
      if (res.success && res.data) {
        setTotalCount(res.data.totalCount)
        setOrders(res.data.items || [])
      }
      console.log('Fetched orders:', res.data?.items)
    } catch (err: any) {
      if (version !== requestVersion.current) return
      setOrders([])
      setTotalCount(0)
      console.error(err)
      toast.error('Không thể tải danh sách đơn hàng.')
    } finally {
      if (version === requestVersion.current) setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    return () => { requestVersion.current++ }
  }, [businessId, statusFilter, hasInvoiceFilter, paymentFilter, page, timeFilter, customDate, searchQuery, startDateFromUrl, endDateFromUrl])

  // Fetch full details of an order on click
  const handleViewDetails = async (orderId: string) => {
    try {
      setLoadingDetail(true)
      const res = await getOrderById(orderId)
      if (res.success && res.data) {
        setSelectedOrder(res.data)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Không thể tải thông tin chi tiết đơn hàng.')
    } finally {
      setLoadingDetail(false)
    }
  }

  // Auto-open modal when navigating from S2d/S2e or external link with autoOpen=true
  useEffect(() => {
    if (autoOpenFromUrl && !autoOpenedRef.current) {
      const directId = searchParams.get('id')
      if (directId) {
        autoOpenedRef.current = true
        void handleViewDetails(directId)
        return
      }

      if (orders.length > 0) {
        const code = (searchParams.get('orderCode') || searchParams.get('search') || '').toLowerCase().trim()
        if (code) {
          const found = orders.find(
            o =>
              o.transactionCode.toLowerCase() === code ||
              o.transactionId.toLowerCase() === code ||
              (o.invoiceNumber && o.invoiceNumber.toLowerCase() === code)
          )
          if (found) {
            autoOpenedRef.current = true
            void handleViewDetails(found.transactionId)
          }
        } else {
          autoOpenedRef.current = true
          void handleViewDetails(orders[0].transactionId)
        }
      }
    }
  }, [orders, autoOpenFromUrl, searchParams])

  const triggerCancelOrder = (orderId: string) => {
    setTargetCancelOrderId(orderId)
    setShowConfirmCancelModal(true)
  }

  const handleConfirmCancelOrder = async () => {
    if (!targetCancelOrderId) return
    try {
      setCancellingOrder(true)
      const res = await cancelOrder(targetCancelOrderId)
      if (res.success) {
        toast.success('Đã hủy đơn hàng thành công.')
        setShowConfirmCancelModal(false)
        if (selectedOrder?.transactionId === targetCancelOrderId) {
          setSelectedOrder(null)
        }
        fetchOrders()
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error('Đơn hàng đã được thanh toán qua ngân hàng, không thể hủy.')
        setShowConfirmCancelModal(false)
        fetchOrders()
      } else {
        toast.error(err?.response?.data?.message || 'Hủy đơn hàng thất bại.')
      }
    } finally {
      setCancellingOrder(false)
    }
  }

  const handleConfirmPaymentOrder = async (orderId: string) => {
    try {
      setConfirmingPayment(true)
      const res = await confirmPayment(orderId)
      if (res.success) {
        toast.success('Xác nhận thanh toán thành công!')
        fetchOrders()
        const detailRes = await getOrderById(orderId)
        if (detailRes.success && detailRes.data) {
          setSelectedOrder(detailRes.data)
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xác nhận thanh toán thất bại.')
    } finally {
      setConfirmingPayment(false)
    }
  }

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val)
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('page')
    if (val !== 'all') {
      newParams.set('status', val)
    } else {
      newParams.delete('status')
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleInvoiceFilterChange = (val: string) => {
    setHasInvoiceFilter(val)
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('page')
    if (val !== 'all') {
      newParams.set('hasInvoice', val)
    } else {
      newParams.delete('hasInvoice')
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleTimeFilterChange = (opt: string) => {
    setTimeFilter(opt)
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('startDate')
    newParams.delete('endDate')
    newParams.delete('page')
    if (opt !== 'Tháng này') {
      newParams.set('timeFilter', opt)
    } else {
      newParams.delete('timeFilter')
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setHasInvoiceFilter('all')
    setPaymentFilter('all')
    setTimeFilter('Tháng này')
    setCustomDate('')
    navigate('/business-owner/orders')
  }

  const paginatedOrders = orders
  const totalPages = Math.ceil(totalCount / pageSize)

  const formatDateOnly = (dateStr: string) => {
    try {
      const utcDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`
      const d = new Date(utcDateStr)
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className='bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-100'>
            Hoàn thành
          </span>
        )
      case 'Cancelled':
        return (
          <span className='bg-gray-100 text-gray-500 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-gray-200'>
            Đã hủy
          </span>
        )
      case 'AwaitingPayment':
        return (
          <span className='bg-amber-50 text-amber-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-100 animate-pulse'>
            Chờ thanh toán
          </span>
        )
      case 'Draft':
        return (
          <span className='bg-blue-50 text-blue-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-blue-100'>
            Đơn nháp
          </span>
        )
      default:
        return (
          <span className='bg-slate-50 text-slate-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200'>
            {status}
          </span>
        )
    }
  }

  const formatDateTime = (dateStr: string) => {
    const utcDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`
    const d = new Date(typeof utcDateStr === 'string' && !utcDateStr.endsWith('Z') ? utcDateStr + 'Z' : utcDateStr)
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getInvoicePdfUrl = (invoiceNumber: string) => {
    const apiBaseUrl = (http.defaults.baseURL || '').replace(/\/$/, '')
    return `${apiBaseUrl}/Invoice/${invoiceNumber}/pdf`
  }

  const handlePrintPdf = (invoiceNumber?: string) => {
    if (!invoiceNumber) {
      toast.warn('Hóa đơn chưa được phát hành.')
      return
    }
    window.open(getInvoicePdfUrl(invoiceNumber), '_blank')
  }

  const handleViewOfficialXml = (xmlUrl?: string) => {
    if (!xmlUrl) {
      toast.warn('Không tìm thấy tệp XML gốc.')
      return
    }
    window.open(xmlUrl, '_blank')
  }

  const totalProducts = selectedOrder?.items.reduce((sum, item) => sum + item.quantity, 0) || 0

  return (
    <div className='flex flex-col w-full bg-[#f8f9fa] h-[calc(100vh-51px)] overflow-hidden relative'>
      {/* Search Header */}
      <div className='flex items-center justify-between px-8 py-4 gap-4 bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'>
        <div className='ml-96 flex-1 max-w-4xl flex items-center bg-white border border-gray-300 rounded-lg px-5 py-2.5 shadow-xs focus-within:border-[#D32F2F] focus-within:ring-1 focus-within:ring-[#D32F2F]/20 transition-all'>
          <Scan className='text-[#D32F2F] mr-3 size-5 shrink-0 stroke-2' />
          <input
            type='text'
            placeholder='Tìm kiếm nhanh theo mã đơn hàng, số hóa đơn...'
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              changePage(1)
            }}
            className='grow bg-transparent outline-hidden text-[14px] text-gray-800 placeholder-gray-400 font-medium'
          />
          <Search className='text-gray-400 size-5 shrink-0 hover:text-gray-600 transition-colors cursor-pointer' />
        </div>
      </div>

      <div className='flex grow w-full overflow-hidden'>
        {/* SIDEBAR BỘ LỌC */}
        <div className='w-72 bg-white border-r border-[#ffe5e5] p-6 flex flex-col gap-6 shrink-0 overflow-y-auto select-none'>
          {/* Trạng thái thanh toán */}
          <div className='flex flex-col gap-3'>
            <span className='text-[13px] font-bold text-gray-500'>Trạng thái thanh toán</span>
            <div className='flex flex-col gap-3.5'>
              {[
                { val: 'all', label: 'Tất cả' },
                { val: 'Completed', label: 'Hoàn thành' },
                { val: 'Unpaid', label: 'Chưa thanh toán' },
                { val: 'AwaitingPayment', label: 'Chờ thanh toán' },
                { val: 'Cancelled', label: 'Đã hủy' },
                { val: 'Draft', label: 'Đơn nháp' }
              ].map(opt => (
                <label key={opt.val} className='flex items-center gap-3 cursor-pointer group text-[13.5px] text-gray-700 select-none'>
                  <input
                    type='radio'
                    name='statusFilter'
                    checked={statusFilter === opt.val}
                    onChange={() => handleStatusFilterChange(opt.val)}
                    className='sr-only'
                  />
                  <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    statusFilter === opt.val
                      ? 'border-[#D32F2F] bg-white'
                      : 'border-gray-300 group-hover:border-gray-400 bg-white'
                  }`}>
                    {statusFilter === opt.val && (
                      <div className='size-2.5 rounded-full bg-[#D32F2F]' />
                    )}
                  </div>
                  <span className={`${statusFilter === opt.val ? 'font-bold text-[#D32F2F]' : 'text-gray-600 font-medium'}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Trạng thái Hóa đơn */}
          <div className='flex flex-col gap-3'>
            <span className='text-[13px] font-bold text-gray-500'>Hóa đơn điện tử</span>
            <div className='flex flex-col gap-3.5'>
              {[
                { val: 'all', label: 'Tất cả' },
                { val: 'false', label: 'Chưa có hóa đơn' },
                { val: 'true', label: 'Đã có hóa đơn' }
              ].map(opt => (
                <label key={opt.val} className='flex items-center gap-3 cursor-pointer group text-[13.5px] text-gray-700 select-none'>
                  <input
                    type='radio'
                    name='hasInvoiceFilter'
                    checked={hasInvoiceFilter === opt.val}
                    onChange={() => handleInvoiceFilterChange(opt.val)}
                    className='sr-only'
                  />
                  <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    hasInvoiceFilter === opt.val
                      ? 'border-[#D32F2F] bg-white'
                      : 'border-gray-300 group-hover:border-gray-400 bg-white'
                  }`}>
                    {hasInvoiceFilter === opt.val && (
                      <div className='size-2.5 rounded-full bg-[#D32F2F]' />
                    )}
                  </div>
                  <span className={`${hasInvoiceFilter === opt.val ? 'font-bold text-[#D32F2F]' : 'text-gray-600 font-medium'}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Loại thanh toán */}
          <div className='flex flex-col gap-3'>
            <span className='text-[13px] font-bold text-gray-500'>Loại thanh toán</span>
            <div className='flex flex-col gap-3.5'>
              {[
                { val: 'all', label: 'Tất cả' },
                { val: 'Cash', label: 'Tiền mặt' },
                { val: 'Transfer', label: 'Chuyển khoản' }
              ].map(opt => (
                <label key={opt.val} className='flex items-center gap-3 cursor-pointer group text-[13.5px] text-gray-700 select-none'>
                  <input
                    type='radio'
                    name='paymentFilter'
                    checked={paymentFilter === opt.val}
                    onChange={() => {
                      setPaymentFilter(opt.val)
                      changePage(1)
                    }}
                    className='sr-only'
                  />
                  <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    paymentFilter === opt.val
                      ? 'border-[#D32F2F] bg-white'
                      : 'border-gray-300 group-hover:border-gray-400 bg-white'
                  }`}>
                    {paymentFilter === opt.val && (
                      <div className='size-2.5 rounded-full bg-[#D32F2F]' />
                    )}
                  </div>
                  <span className={`${paymentFilter === opt.val ? 'font-bold text-[#D32F2F]' : 'text-gray-600 font-medium'}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Thời gian */}
          <div className='flex flex-col gap-3'>
            <span className='text-[13px] font-bold text-gray-500'>Thời gian</span>

            <div className='flex flex-col gap-3.5'>
              {(startDateFromUrl && endDateFromUrl
                ? ['Kỳ kê khai', 'Hôm nay', '7 ngày qua', '30 ngày qua', 'Tháng này', 'Tháng trước', 'Năm nay', 'Tùy chọn']
                : ['Hôm nay', '7 ngày qua', '30 ngày qua', 'Tháng này', 'Tháng trước', 'Năm nay', 'Tùy chọn']
              ).map(opt => (
                <label
                  key={opt}
                  className='flex items-center gap-3 cursor-pointer group text-[13.5px] text-gray-700 select-none'
                >
                  <input
                    type='radio'
                    name='timeFilter'
                    checked={timeFilter === opt}
                    onChange={() => {
                      if (opt !== 'Tùy chọn') {
                        handleTimeFilterChange(opt)
                      }
                    }}
                    onClick={() => {
                      if (opt === 'Tùy chọn') {
                        inputRef.current?.showPicker?.()
                      }
                    }}
                    className='sr-only'
                  />

                  <div
                    className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      timeFilter === opt
                        ? 'border-[#D32F2F] bg-white'
                        : 'border-gray-300 group-hover:border-gray-400 bg-white'
                    }`}
                  >
                    {timeFilter === opt && (
                      <div className='size-2.5 rounded-full bg-[#D32F2F]' />
                    )}
                  </div>

                  <span
                    className={`${
                      timeFilter === opt
                        ? 'font-bold text-[#D32F2F]'
                        : 'text-gray-600 font-medium'
                    }`}
                  >
                    {opt}
                  </span>
                </label>
              ))}
            </div>

            <input
              ref={inputRef}
              type='date'
              className='absolute opacity-0 w-0 h-0 mt-40'
              onChange={(e) => {
                setCustomDate(e.target.value)
                setTimeFilter('Tùy chọn')
                changePage(1)
              }}
            />
          </div>

          {/* Reset Filters */}
          {(searchQuery || statusFilter !== 'all' || hasInvoiceFilter !== 'all' || paymentFilter !== 'all' || timeFilter !== 'Tháng này' || startDateFromUrl || endDateFromUrl) && (
            <button
              onClick={handleResetFilters}
              className='mt-auto flex items-center justify-center gap-2 border border-dashed border-[#D32F2F] hover:bg-[#fef2f2] text-[#D32F2F] text-[13px] font-bold py-2.5 rounded-[8px] transition-colors cursor-pointer'
            >
              <RotateCcw size={14} /> Xoá bộ lọc
            </button>
          )}
        </div>

        {/* BẢNG DANH SÁCH ĐƠN HÀNG */}
        <div className='grow p-8 flex flex-col gap-4 overflow-y-auto'>
          {/* Multi-Store Switcher */}
          {businesses && businesses.length > 1 && (
            <div className='flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200/90 rounded-2xl p-3 px-4 shadow-xs'>
              <div className='flex items-center gap-3'>
                <div className='size-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black'>
                  <Store size={18} />
                </div>
                <div className='flex flex-col'>
                  <span className='text-[11px] font-medium text-gray-400 leading-none'>Cơ sở đang xem</span>
                  <span className='text-sm font-bold text-gray-900 flex items-center gap-2 mt-0.5'>
                    {currentBusiness?.businessName || 'Chưa chọn cơ sở'}
                    <span className='rounded-full bg-red-50 text-red-600 border border-red-100 text-[11px] font-bold px-2.5 py-0.2'>
                      {totalCount} đơn
                    </span>
                  </span>
                </div>
              </div>

              <div className='flex flex-wrap items-center gap-1.5'>
                <span className='text-xs text-gray-400 font-medium mr-1 hidden sm:inline'>Chuyển cơ sở:</span>
                {businesses.map((biz) => {
                  const isSelected = biz.id === currentBusiness?.id
                  return (
                    <button
                      key={biz.id}
                      type='button'
                      onClick={() => handleSwitchBusiness(biz)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border border-gray-200'
                      }`}
                    >
                      <span className={`size-2 rounded-full ${isSelected ? 'bg-white' : 'bg-gray-400'}`} />
                      <span className='truncate max-w-[140px]'>{biz.businessName}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Active filter banner */}
          {(startDateFromUrl || statusFilter !== 'all' || hasInvoiceFilter !== 'all' || searchQuery) && (
            <div className='flex flex-wrap items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-900 shadow-2xs'>
              <span className='font-bold flex items-center gap-1.5 text-amber-800'>
                <Search size={14} /> Đang lọc:
              </span>
              {startDateFromUrl && endDateFromUrl && timeFilter === 'Kỳ kê khai' && (
                <span className='inline-flex items-center gap-1 bg-white border border-amber-200 px-2.5 py-1 rounded-md font-semibold text-gray-800 shadow-2xs'>
                  Kỳ kê khai: {formatDateOnly(startDateFromUrl)} - {formatDateOnly(endDateFromUrl)}
                  <button
                    onClick={() => handleTimeFilterChange('Tháng này')}
                    className='text-gray-400 hover:text-red-500 ml-1 cursor-pointer'
                    title='Bỏ lọc thời gian'
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className='inline-flex items-center gap-1 bg-white border border-amber-200 px-2.5 py-1 rounded-md font-semibold text-gray-800 shadow-2xs'>
                  Trạng thái: {statusFilter === 'Unpaid' ? 'Chưa thanh toán' : statusFilter === 'Completed' ? 'Hoàn thành' : statusFilter === 'AwaitingPayment' ? 'Chờ thanh toán' : statusFilter === 'Draft' ? 'Đơn nháp' : 'Đã hủy'}
                  <button
                    onClick={() => handleStatusFilterChange('all')}
                    className='text-gray-400 hover:text-red-500 ml-1 cursor-pointer'
                    title='Bỏ lọc trạng thái'
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {hasInvoiceFilter !== 'all' && (
                <span className='inline-flex items-center gap-1 bg-white border border-amber-200 px-2.5 py-1 rounded-md font-semibold text-gray-800 shadow-2xs'>
                  Hóa đơn: {hasInvoiceFilter === 'false' ? 'Chưa có hóa đơn' : 'Đã có hóa đơn'}
                  <button
                    onClick={() => handleInvoiceFilterChange('all')}
                    className='text-gray-400 hover:text-red-500 ml-1 cursor-pointer'
                    title='Bỏ lọc hóa đơn'
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className='inline-flex items-center gap-1 bg-white border border-amber-200 px-2.5 py-1 rounded-md font-semibold text-gray-800 shadow-2xs'>
                  Tìm kiếm: "{searchQuery}"
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      const newP = new URLSearchParams(searchParams)
                      newP.delete('orderCode')
                      newP.delete('search')
                      setSearchParams(newP, { replace: true })
                    }}
                    className='text-gray-400 hover:text-red-500 ml-1 cursor-pointer'
                    title='Xóa tìm kiếm'
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className='ml-auto text-xs font-bold text-red-600 hover:underline cursor-pointer'
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {loading ? (
            <div className='flex justify-center items-center py-20'>
              <Loader2 className='animate-spin text-[#D32F2F] size-10' />
            </div>
          ) : (
            <div className='bg-white rounded-[12px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden w-full shrink-0'>
              <table className='w-full text-left border-collapse'>
                <thead>
                  <tr className='bg-[#e3effc] text-[#1e3a8a] text-[13.5px] font-bold border-b border-[#cbd5e1]/40 select-none'>
                    <th className='py-4 px-6 tracking-wide'>Mã đơn hàng</th>
                    <th className='py-4 px-6 tracking-wide'>Trạng thái hóa đơn</th>
                    <th className='py-4 px-6 tracking-wide'>Tổng sản phẩm</th>
                    <th className='py-4 px-6 tracking-wide'>Thời gian</th>
                    <th className='py-4 px-6 tracking-wide text-right'>Tổng cộng</th>
                    <th className='py-4 px-6 tracking-wide text-center w-28'>Thao tác</th>
                  </tr>
                </thead>

                <tbody className='divide-y divide-gray-100'>
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders
                      .map(order => (
                        <tr key={order.transactionId} className='hover:bg-[#fcfdfe] transition-colors group'>
                          <td className='py-4 px-6 text-[13.5px] text-gray-900 font-bold'>
                            {order.transactionCode}
                            {order.invoiceNumber && (
                              <span className='block text-[10px] text-gray-400 font-bold mt-0.5'>
                                HĐ: {order.invoiceNumber}
                              </span>
                            )}
                          </td>

                          <td className='py-4 px-6 text-[13.5px] text-gray-600 font-medium'>
                            {getStatusBadge(order.status)}
                          </td>

                          <td className='py-4 px-6 text-[13.5px] text-gray-600 font-bold'>
                            {order.itemCount} sản phẩm
                          </td>

                          <td className='py-4 px-6 text-[13.5px] text-gray-500 font-semibold'>
                            {formatDateTime(order.transactionDate)}
                          </td>

                          <td className='py-4 px-6 text-right text-[14.5px] text-gray-900 font-black'>
                            {order.totalAmount.toLocaleString('vi-VN')} đ
                          </td>

                          <td className='py-4 px-6 text-center'>
                            <div className='flex items-center justify-center gap-1 select-none'>
                              {(order.status === 'Draft' || order.status === 'AwaitingPayment') && order.itemCount > 0 && (
                                <button
                                  onClick={() => navigate(`${path.BUSINESS_OWNER_POS}?resumeOrderId=${order.transactionId}`)}
                                  className='p-1.5 text-[#004795] hover:text-white hover:bg-[#004795] rounded-md transition-all duration-150 cursor-pointer'
                                  title='Tiếp tục xử lý tại POS'
                                >
                                  <PlayCircle size={16} />
                                </button>
                              )}
                              {(order.status === 'Draft' || order.status === 'AwaitingPayment') && (
                                <button
                                  onClick={() => triggerCancelOrder(order.transactionId)}
                                  className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer'
                                  title='Hủy đơn hàng'
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => handleViewDetails(order.transactionId)}
                                disabled={loadingDetail}
                                className='p-1.5 text-gray-400 hover:text-[#D32F2F] hover:bg-red-50 rounded-md transition-colors cursor-pointer'
                                title='Xem chi tiết'
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8}>
                        <div className='flex flex-col items-center justify-center py-20 px-4'>
                          <Box
                            size={48}
                            className='text-gray-300 mb-4 stroke-[1.5]'
                          />
                          <p className='text-gray-500 font-bold text-[15px] mb-2'>
                            Không tìm thấy đơn hàng nào
                          </p>
                          <p className='text-gray-400 text-[13px] mb-4 text-center max-w-xs'>
                            Hãy thử đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc hiện tại của bạn.
                          </p>
                          <button
                            onClick={handleResetFilters}
                            className='px-4 py-2 bg-[#D32F2F] text-white text-[13px] font-bold rounded-[8px] hover:bg-[#B71C1C]'
                          >
                            Đặt lại bộ lọc
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Phân trang */}
          {!loading && totalCount > 0 && (
            <div className='p-4 border-t border-gray-100 flex items-center justify-between'>
              <span className='text-[13px] text-gray-500 font-semibold'>
                Hiển thị <span className='font-bold text-gray-800'>{totalCount}</span> đơn hàng
              </span>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => changePage(page - 1)}
                      className={page === 1 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive>{page}</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => changePage(page + 1)}
                      className={page >= totalPages ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {selectedOrder && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]'>
            {/* Header modal */}
            <div className='px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between'>
              <div>
                <h3 className='font-extrabold text-[15px] text-gray-800 flex items-center gap-2'>
                  <span>Chi tiết đơn: {selectedOrder.transactionCode}</span>
                  {getStatusBadge(selectedOrder.status)}
                </h3>
                <span className='text-[11px] font-semibold text-gray-400'>
                  Ngày tạo: {formatDateTime(selectedOrder.transactionDate)}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className='p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer'
              >
                <X size={18} />
              </button>
            </div>

            {/* Content body */}
            <div className='p-6 overflow-y-auto space-y-4 text-xs'>
              {/* Thông tin thanh toán & hóa đơn */}
              <div className='bg-slate-50 p-3.5 rounded-[12px] border border-slate-100 space-y-1.5 font-semibold text-slate-600'>
                <div className='flex justify-between'>
                  <span>Số hóa đơn:</span>
                  <span className='font-bold text-slate-800'>{selectedOrder.invoiceNumber || 'Chưa xuất'}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Phương thức:</span>
                  <span className='font-bold text-slate-800'>
                    {selectedOrder.payments.map(p => (p.paymentMethod === 'Cash' ? 'Tiền mặt' : p.paymentMethod === 'Transfer' ? 'Chuyển khoản' : p.paymentMethod)).join(', ') || 'Chưa thanh toán'}
                  </span>
                </div>
                {selectedOrder.officialPdfUrl && (
                  <div className='flex justify-between items-center pt-1 border-t border-slate-200/60'>
                    <span>Hóa đơn điện tử:</span>
                    <a
                      href={selectedOrder.officialPdfUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='text-blue-600 hover:underline font-bold'
                    >
                      Xem bản gốc PDF
                    </a>
                  </div>
                )}
              </div>

              {/* Danh sách món hàng */}
              <div>
                <h4 className='font-bold text-slate-800 text-[13px] mb-2'>Danh sách mặt hàng</h4>
                <div className='border border-slate-100 rounded-lg overflow-hidden divide-y divide-slate-100'>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={item.transactionItemId} className='p-2.5 flex items-center justify-between bg-white'>
                      <div>
                        <span className='font-bold text-slate-800 block text-[12px]'>{item.productName}</span>
                        <span className='text-slate-400 text-[10.5px] font-semibold'>
                          {item.quantity} x {item.unitPrice.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <span className='font-bold text-slate-800 text-[12px]'>
                        {item.lineTotal.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng cộng */}
              <div className='pt-2 border-t border-gray-100 space-y-1.5 text-right'>
                <div className='flex justify-between text-slate-500 font-semibold'>
                  <span>Tạm tính:</span>
                  <span>{selectedOrder.subTotal.toLocaleString('vi-VN')} đ</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className='flex justify-between text-emerald-600 font-semibold'>
                    <span>Giảm giá:</span>
                    <span>-{selectedOrder.discountAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                {selectedOrder.surchargeAmount > 0 && (
                  <div className='flex justify-between text-orange-600 font-semibold'>
                    <span>Phụ thu ({selectedOrder.surchargeName}):</span>
                    <span>+{selectedOrder.surchargeAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className='flex justify-between items-baseline pt-2 border-t border-gray-200'>
                  <span className='font-bold text-slate-800 text-[14px]'>Tổng thanh toán:</span>
                  <span className='font-black text-[#D32F2F] text-[16.5px]'>
                    {selectedOrder.totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {/* HÓA ĐƠN ĐỎ CHỈ HIỂN THỊ NẾU ĐÃ PHÁT HÀNH */}
                {selectedOrder.invoiceNumber && (
                  <div className='mt-4 pt-4 border-t border-dashed border-gray-200 flex gap-3 select-none'>
                    <button
                      onClick={() => handlePrintPdf(selectedOrder.invoiceNumber)}
                      className='flex-1 border-2 border-[#D32F2F] text-[#D32F2F] hover:bg-red-50 py-2 rounded-md text-[11.5px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer'
                    >
                      In hóa đơn (PDF)
                    </button>
                    {selectedOrder.officialXmlUrl && (
                      <button
                        onClick={() => handleViewOfficialXml(selectedOrder.officialXmlUrl)}
                        className='flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-md text-[11.5px] font-bold transition-all cursor-pointer'
                      >
                        Tải XML gốc
                      </button>
                    )}
                  </div>
                )}

                {/* THAO TÁC CHO ĐƠN NHÁP HOẶC CHỜ THANH TOÁN */}
                {(selectedOrder.status === 'Draft' || selectedOrder.status === 'AwaitingPayment') && (
                  <div className='mt-4 pt-3 border-t border-dashed border-blue-100 flex flex-col gap-2 select-none'>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => {
                          setSelectedOrder(null)
                          navigate(`${path.BUSINESS_OWNER_POS}?resumeOrderId=${selectedOrder.transactionId}`)
                        }}
                        className='flex-1 flex items-center justify-center gap-1.5 bg-[#004795] hover:bg-[#003875] text-white text-[12px] font-bold py-2.5 rounded-lg shadow-xs transition-all cursor-pointer'
                      >
                        <PlayCircle size={15} />
                        Tiếp tục xử lý tại POS
                      </button>

                      {selectedOrder.status === 'AwaitingPayment' && (
                        <button
                          onClick={() => handleConfirmPaymentOrder(selectedOrder.transactionId)}
                          disabled={confirmingPayment}
                          className='flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-[12px] font-bold py-2.5 rounded-lg shadow-xs transition-all cursor-pointer'
                        >
                          {confirmingPayment ? <Loader2 size={14} className='animate-spin' /> : <CheckCircle size={15} />}
                          Xác nhận đã nhận tiền
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => triggerCancelOrder(selectedOrder.transactionId)}
                      className='w-full flex items-center justify-center gap-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[12px] font-bold py-2 rounded-lg transition-all cursor-pointer'
                    >
                      <Trash2 size={14} />
                      Hủy đơn hàng này
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN HỦY ĐƠN HÀNG */}
      {showConfirmCancelModal && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-xs z-60 flex items-center justify-center p-4 animate-in fade-in duration-150'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-150 p-6 text-center select-none'>
            <div className='bg-red-100 text-red-600 size-14 rounded-full flex items-center justify-center mx-auto mb-3'>
              <Trash2 size={24} />
            </div>
            <h3 className='text-slate-900 font-extrabold text-[16px] mb-1.5'>
              Hủy đơn hàng này?
            </h3>
            <p className='text-slate-600 text-xs font-semibold leading-relaxed mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200'>
              “Tôi đã xác nhận khách chưa chuyển khoản”
            </p>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => setShowConfirmCancelModal(false)}
                disabled={cancellingOrder}
                className='flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer'
              >
                Quay lại
              </button>
              <button
                type='button'
                onClick={handleConfirmCancelOrder}
                disabled={cancellingOrder}
                className='flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer'
              >
                {cancellingOrder && <Loader2 size={13} className='animate-spin' />}
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOADER OVERLAY CHO CHI TIẾT */}
      {loadingDetail && (
        <div className='fixed inset-0 bg-black/10 backdrop-blur-xs z-50 flex items-center justify-center p-4'>
          <div className='bg-white p-4 rounded-xl shadow-lg flex items-center gap-2'>
            <Loader2 className='animate-spin text-[#D32F2F] size-5' />
            <span className='text-xs font-bold text-gray-600'>Đang tải chi tiết đơn...</span>
          </div>
        </div>
      )}
    </div>
  )
}
