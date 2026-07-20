import { useState, useMemo, useEffect } from 'react'
import { Eye, Search, FileDown, Box, X, Scan, RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { useBusiness } from '../../contexts/BusinessContext'
import { getOrders, getOrderById } from '../../apis/order.api'
import type { Order, OrderDetail } from '../../types/order.type'

export default function OrderPage() {
  const { currentBusiness } = useBusiness()
  const businessId = currentBusiness?.id

  // Data states
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('Tháng này')

  // Pagination (simple load more or fixed page size for POS list)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(100) // load a large page size to allow responsive local filters

  const fetchOrders = async () => {
    if (!businessId) return
    try {
      setLoading(true)
      const res = await getOrders(businessId, {
        page,
        pageSize,
        status: statusFilter !== 'all' ? statusFilter : null,
        paymentMethod: paymentFilter !== 'all' ? paymentFilter : null
      })

      if (res.success && res.data) {
        setOrders(res.data.items || [])
      }
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

  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setTimeFilter('Tháng này')
  }

  // Filter loaded orders by time and search query locally
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim()
        const matchesCode = order.transactionCode.toLowerCase().includes(query)
        const matchesInvoice = order.invoiceNumber?.toLowerCase().includes(query)
        if (!matchesCode && !matchesInvoice) return false
      }

      // 2. Time Filter
      const orderDate = new Date(order.transactionDate)
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
      }

      return true
    })
  }, [orders, searchQuery, timeFilter])

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
    const d = new Date(dateStr)
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handlePrintPdf = (invoiceNumber?: string) => {
    if (!invoiceNumber) {
      toast.warn('Hóa đơn chưa được phát hành.')
      return
    }
    const url = `http://localhost:5086/api/Invoice/${invoiceNumber}/pdf`
    window.open(url, '_blank')
  }

  const handleViewOfficialXml = (xmlUrl?: string) => {
    if (!xmlUrl) {
      toast.warn('Không tìm thấy tệp XML gốc.')
      return
    }
    window.open(xmlUrl, '_blank')
  }

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
            onChange={e => setSearchQuery(e.target.value)}
            className='grow bg-transparent outline-hidden text-[14px] text-gray-800 placeholder-gray-400 font-medium'
          />
          <Search className='text-gray-400 size-5 shrink-0 hover:text-gray-600 transition-colors cursor-pointer' />
        </div>

        <div className='flex justify-end'>
          <button className='flex items-center gap-2 px-4 py-2 border border-[#D32F2F] text-[#D32F2F] rounded-[8px] hover:bg-[#fef2f2] font-bold text-[13.5px] transition-colors cursor-pointer'>
            <FileDown size={16} />
            Xuất file
          </button>
        </div>
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
                    onChange={() => setStatusFilter(opt.val)}
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
                { val: 'EWallet', label: 'Thẻ' },
                { val: 'Transfer', label: 'Chuyển khoản' }
              ].map(opt => (
                <label key={opt.val} className='flex items-center gap-3 cursor-pointer group text-[13.5px] text-gray-700 select-none'>
                  <input
                    type='radio'
                    name='paymentFilter'
                    checked={paymentFilter === opt.val}
                    onChange={() => setPaymentFilter(opt.val)}
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
              {['Hôm nay', '7 ngày qua', '30 ngày qua', 'Tháng này', 'Tháng trước', 'Năm nay'].map(opt => (
                <label key={opt} className='flex items-center gap-3 cursor-pointer group text-[13.5px] text-gray-700 select-none'>
                  <input
                    type='radio'
                    name='timeFilter'
                    checked={timeFilter === opt}
                    onChange={() => setTimeFilter(opt)}
                    className='sr-only'
                  />
                  <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    timeFilter === opt
                      ? 'border-[#D32F2F] bg-white'
                      : 'border-gray-300 group-hover:border-gray-400 bg-white'
                  }`}>
                    {timeFilter === opt && (
                      <div className='size-2.5 rounded-full bg-[#D32F2F]' />
                    )}
                  </div>
                  <span className={`${timeFilter === opt ? 'font-bold text-[#D32F2F]' : 'text-gray-600 font-medium'}`}>
                    {opt}
                  </span>
                </label>
              ))}
            </div>
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
          ) : filteredOrders.length > 0 ? (
            <div className='bg-white rounded-[12px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden w-full'>
              <table className='w-full text-left border-collapse'>
                <thead>
                  <tr className='bg-[#e3effc] text-[#1e3a8a] text-[13.5px] font-bold border-b border-[#cbd5e1]/40 select-none'>
                    <th className='py-4 px-6 font-semibold tracking-wide'>Mã đơn hàng</th>
                    <th className='py-4 px-6 font-semibold tracking-wide'>Trạng thái hóa đơn</th>
                    <th className='py-4 px-6 font-semibold tracking-wide'>Số lượng món</th>
                    <th className='py-4 px-6 font-semibold tracking-wide'>Thời gian</th>
                    <th className='py-4 px-6 font-semibold tracking-wide text-right'>Tổng cộng</th>
                    <th className='py-4 px-6 font-semibold tracking-wide text-center w-28'>Thao tác</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {filteredOrders.map(order => (
                    <tr key={order.transactionId} className='hover:bg-[#fcfdfe] transition-colors group'>
                      <td className='py-4 px-6 text-[13.5px] text-gray-900 font-bold'>
                        {order.transactionCode}
                        {order.invoiceNumber && (
                          <span className='block text-[10px] text-gray-400 font-bold font-mono mt-0.5'>
                            HĐ: {order.invoiceNumber}
                          </span>
                        )}
                      </td>
                      <td className='py-4 px-6 text-[13.5px] text-gray-600 font-medium'>
                        {getStatusBadge(order.status)}
                      </td>
                      <td className='py-4 px-6 text-[13.5px] text-gray-600 font-bold font-mono'>
                        {order.itemCount} món
                      </td>
                      <td className='py-4 px-6 text-[13.5px] text-gray-500 font-semibold font-mono'>
                        {formatDateTime(order.transactionDate)}
                      </td>
                      <td className='py-4 px-6 text-right text-[14.5px] text-gray-900 font-black font-mono'>
                        {order.totalAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className='py-4 px-6 text-center'>
                        <button
                          onClick={() => handleViewDetails(order.transactionId)}
                          disabled={loadingDetail}
                          className='p-1.5 text-gray-400 hover:text-[#D32F2F] hover:bg-red-50 rounded-md transition-colors cursor-pointer'
                          title='Xem chi tiết'
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='bg-white rounded-[16px] border border-gray-200 py-20 px-6 text-center shadow-xs'>
              <div className='bg-slate-100 size-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400'>
                <Box size={32} />
              </div>
              <h3 className='text-[16px] font-bold text-gray-900'>Không tìm thấy đơn hàng nào</h3>
              <p className='text-gray-500 text-xs mt-1 max-w-sm mx-auto'>
                Thử thay đổi điều kiện lọc hoặc nhập một từ khóa khác để tìm kiếm lại.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex items-center justify-between px-8 py-4 bg-[#fef2f2] border-b border-red-100'>
              <h3 className='text-[16px] font-bold text-gray-900'>
                Chi tiết đơn hàng: {selectedOrder.transactionCode}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className='text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 cursor-pointer'
              >
                <X size={20} />
              </button>
            </div>

            <div className='p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto'>
              <div className='grid grid-cols-2 gap-4 text-[13.5px] border-b border-gray-100 pb-4 font-semibold text-slate-600'>
                <div>
                  <span className='text-gray-500 block text-[11px] font-bold uppercase tracking-wider mb-0.5'>Thời gian</span>
                  <span className='font-bold text-gray-800 font-mono'>{formatDateTime(selectedOrder.transactionDate)}</span>
                </div>
                <div>
                  <span className='text-gray-500 block text-[11px] font-bold uppercase tracking-wider mb-0.5'>Trạng thái</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              <div>
                <h4 className='text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-3 select-none'>Danh sách sản phẩm</h4>
                <div className='flex flex-col gap-3'>
                  {selectedOrder.items.map(item => (
                    <div
                      key={item.transactionItemId}
                      className='flex items-center justify-between gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50/50 transition-colors'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='w-11 h-11 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-400 bg-gray-50'>
                          <Box size={18} />
                        </div>
                        <div>
                          <span className='font-bold text-gray-900 block text-[13px]'>{item.productName}</span>
                          <span className='text-[11.5px] text-gray-500 font-semibold font-mono'>
                            Số lượng: {item.quantity} {item.unit || 'món'} x {item.unitPrice.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>
                      <span className='font-bold text-gray-900 text-[13.5px] font-mono'>
                        {item.lineTotal.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className='border-t border-gray-100 pt-4 flex flex-col gap-2 font-semibold text-slate-500 text-xs'>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Tạm tính:</span>
                  <span className='font-bold text-gray-800 font-mono'>{selectedOrder.subTotal.toLocaleString('vi-VN')} đ</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className='flex justify-between text-emerald-600'>
                    <span>Giảm giá:</span>
                    <span className='font-bold font-mono'>-{selectedOrder.discountAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Phương thức thanh toán:</span>
                  <span className='font-bold text-gray-800'>
                    {selectedOrder.payments[0]?.paymentMethod === 'Cash'
                      ? 'Tiền mặt'
                      : selectedOrder.payments[0]?.paymentMethod === 'Transfer'
                      ? 'Chuyển khoản'
                      : selectedOrder.payments[0]?.paymentMethod === 'EWallet'
                      ? 'Thẻ'
                      : 'Chưa thanh toán'}
                  </span>
                </div>
                {selectedOrder.payments[0]?.bankName && (
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Ngân hàng:</span>
                    <span className='font-bold text-gray-800'>{selectedOrder.payments[0].bankName}</span>
                  </div>
                )}

                <div className='flex justify-between text-[15px] border-t border-gray-100 pt-3 mt-1'>
                  <span className='font-black text-gray-800'>Tổng cộng:</span>
                  <span className='font-black text-[#D32F2F] text-[16.5px] font-mono'>
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
                        onClick={() => handleViewOfficialXml(`http://localhost:5086/api/Invoice/${selectedOrder.invoiceNumber}/pdf`)} // placeholder or real xml
                        className='flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-md text-[11.5px] font-bold transition-all cursor-pointer'
                      >
                        Tải XML gốc
                      </button>
                    )}
                  </div>
                )}
              </div>
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