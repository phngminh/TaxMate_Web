import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, Search, Box, X, Scan, RotateCcw, Loader2, PlayCircle, Trash2, CheckCircle } from 'lucide-react'
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
export default function OrderPage() {
  const { currentBusiness } = useBusiness()
  const businessId = currentBusiness?.id
  const navigate = useNavigate()

  // Data states
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Confirm cancel state
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false)
  const [targetCancelOrderId, setTargetCancelOrderId] = useState<string | null>(null)
  const [cancellingOrder, setCancellingOrder] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('Tháng này')
  const [customDate, setCustomDate] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Pagination
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')
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

  const fetchOrders = async () => {
    if (!businessId) return
    try {
      setLoading(true)
      const res = await getOrders(businessId, {
        pageNumber: 1,
        pageSize: 100,
        status: statusFilter !== 'all' ? statusFilter : null,
        paymentMethod: paymentFilter !== 'all' ? paymentFilter : null
      })

      if (res.success && res.data) {
        setOrders(res.data.items || [])
      }
      console.log('Fetched orders:', res.data?.items)
    } catch (err: any) {
      console.error(err)
      toast.error('Không thể tải danh sách đơn hàng.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [businessId, statusFilter, paymentFilter, page])

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

  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setTimeFilter('Tháng này')
    changePage(1)
  }

  // Filter loaded orders by time and search query locally
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (order.status === 'Draft' && order.itemCount === 0) return false

      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim()
        const matchesCode = order.transactionCode.toLowerCase().includes(query)
        const matchesInvoice = order.invoiceNumber?.toLowerCase().includes(query)
        if (!matchesCode && !matchesInvoice) return false
      }

      // 2. Time Filter
      const utcDateStr = order.transactionDate.endsWith('Z') ? order.transactionDate : `${order.transactionDate}Z`
      const orderDate = new Date(typeof utcDateStr === 'string' && !utcDateStr.endsWith('Z') ? utcDateStr + 'Z' : utcDateStr)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - orderDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (timeFilter === 'Hôm nay') {
        const isToday =
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        if (!isToday) return false
      } else if (timeFilter === '7 ngày qua') {
        if (diffDays > 7) return false
      } else if (timeFilter === '30 ngày qua') {
        if (diffDays > 30) return false
      } else if (timeFilter === 'Tháng này') {
        const isThisMonth =
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        if (!isThisMonth) return false
      } else if (timeFilter === 'Tháng trước') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
        const yearOfLastMonth = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        const isLastMonth =
          orderDate.getMonth() === lastMonth && orderDate.getFullYear() === yearOfLastMonth
        if (!isLastMonth) return false
      } else if (timeFilter === 'Năm nay') {
        const isThisYear = orderDate.getFullYear() === now.getFullYear()
        if (!isThisYear) return false
      } else if (timeFilter === 'Tùy chọn') {
        if (customDate) {
          const selectedDate = new Date(typeof customDate === 'string' && !customDate.endsWith('Z') ? customDate + 'Z' : customDate)

          const isSameDate =
            orderDate.getDate() === selectedDate.getDate() &&
            orderDate.getMonth() === selectedDate.getMonth() &&
            orderDate.getFullYear() === selectedDate.getFullYear()

          if (!isSameDate) return false
        }
      }

      return true
    })
  }, [orders, searchQuery, timeFilter])

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredOrders.slice(start, start + pageSize)
  }, [filteredOrders, page])

  const totalPages = Math.ceil(filteredOrders.length / pageSize)

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

        {/* <div className='flex justify-end'>
          <button className='flex items-center gap-2 px-4 py-2 border border-[#D32F2F] text-[#D32F2F] rounded-[8px] hover:bg-[#fef2f2] font-bold text-[13.5px] transition-colors cursor-pointer'>
            <FileDown size={16} />
            Xuất file
          </button>
        </div> */}
      </div>

      <div className='flex grow w-full overflow-hidden'>
        {/* SIDEBAR BỘ LỌC */}
        <div className='w-72 bg-white border-r border-[#ffe5e5] p-6 flex flex-col gap-6 shrink-0 overflow-y-auto select-none'>
          {/* Trạng thái */}
          <div className='flex flex-col gap-3'>
            <span className='text-[13px] font-bold text-gray-500'>Trạng thái</span>
            <div className='flex flex-col gap-3.5'>
              {[
                { val: 'all', label: 'Tất cả' },
                { val: 'Completed', label: 'Hoàn thành' },
                { val: 'AwaitingPayment', label: 'Chờ thanh toán' },
                { val: 'Cancelled', label: 'Đã hủy' },
                { val: 'Draft', label: 'Đơn nháp' }
              ].map(opt => (
                <label key={opt.val} className='flex items-center gap-3 cursor-pointer group text-[13.5px] text-gray-700 select-none'>
                  <input
                    type='radio'
                    name='statusFilter'
                    checked={statusFilter === opt.val}
                    onChange={() => {
                      setStatusFilter(opt.val)
                      changePage(1)
                    }}
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

          {/* Loại thanh toán */}
          <div className='flex flex-col gap-3'>
            <span className='text-[13px] font-bold text-gray-500'>Loại thanh toán</span>
            <div className='flex flex-col gap-3.5'>
              {[
                { val: 'all', label: 'Tất cả' },
                { val: 'Cash', label: 'Tiền mặt' },
                // { val: 'EWallet', label: 'Thẻ' },
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
              {['Hôm nay', '7 ngày qua', '30 ngày qua', 'Tháng này', 'Tháng trước', 'Năm nay', 'Tùy chọn'].map(opt => (
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
                        setTimeFilter(opt)
                        changePage(1)
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
          {(searchQuery || statusFilter !== 'all' || paymentFilter !== 'all' || timeFilter !== 'Tháng này') && (
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
          {!loading && filteredOrders.length > 0 && (
            <div className='p-4 border-t border-gray-100 flex items-center justify-between'>
              <span className='text-[13px] text-gray-500 font-semibold'>
                Hiển thị <span className='font-bold text-gray-800'>{filteredOrders.length}</span> đơn hàng
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
                      className={filteredOrders.length < pageSize ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
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
                    {selectedOrder.payments[0]?.paymentMethod === 'Transfer' && (
                      <button
                        onClick={() => handleViewOfficialXml(getInvoicePdfUrl(selectedOrder.invoiceNumber!))}
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
