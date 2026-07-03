import { useState, useMemo } from 'react'
import { Eye, Search, FileDown, Box, X, Scan, RotateCcw } from 'lucide-react'
import type { OrderDetail } from '../../types/order.type'

const ORDERS: OrderDetail[] = [
  {
    transactionId: '1',
    transactionCode: 'SP000001',
    transactionDate: '07:40 16/6/2026',
    status: 'completed',
    invoiceNumber: 'HD000001',
    subTotal: 55000,
    discountAmount: 0,
    surchargeAmount: 0,
    totalAmount: 55000,
    payments: [
      {
        paymentId: 'pay1',
        paymentMethod: 'Tiền mặt',
        amount: 55000,
        paidAt: '07:40 16/6/2026'
      }
    ],
    items: [
      {
        transactionItemId: 'item1',
        productId: 'SP000001',
        productName: 'Pizza',
        unit: 'Cái',
        unitPrice: 55000,
        quantity: 1,
        discountAmount: 0,
        lineTotal: 55000
      }
    ]
  },
  {
    transactionId: '2',
    transactionCode: 'SP000002',
    transactionDate: '07:40 16/6/2026',
    status: 'completed',
    invoiceNumber: 'HD000002',
    subTotal: 35000,
    discountAmount: 0,
    surchargeAmount: 0,
    totalAmount: 35000,
    payments: [
      {
        paymentId: 'pay2',
        paymentMethod: 'Tiền mặt',
        amount: 35000,
        paidAt: '07:40 16/6/2026'
      }
    ],
    items: [
      {
        transactionItemId: 'item2',
        productId: 'SP000002',
        productName: 'Hamburger',
        unit: 'Cái',
        unitPrice: 35000,
        quantity: 1,
        discountAmount: 0,
        lineTotal: 35000
      }
    ]
  },
  {
    transactionId: '3',
    transactionCode: 'SP000003',
    transactionDate: '07:40 16/6/2026',
    status: 'completed',
    invoiceNumber: 'HD000003',
    subTotal: 20000,
    discountAmount: 0,
    surchargeAmount: 0,
    totalAmount: 20000,
    payments: [
      {
        paymentId: 'pay3',
        paymentMethod: 'Tiền mặt',
        amount: 20000,
        paidAt: '07:40 16/6/2026'
      }
    ],
    items: [
      {
        transactionItemId: 'item3',
        productId: 'SP000003',
        productName: 'Coca',
        unit: 'Lon',
        unitPrice: 20000,
        quantity: 1,
        discountAmount: 0,
        lineTotal: 20000
      }
    ]
  }
]

const PRODUCT_IMAGES: Record<string, string> = {
  SP000001: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=80&q=80',
  SP000002: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=80&q=80'
}

export default function Order() {
  const [orders] = useState<OrderDetail[]>(ORDERS)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('Tháng này')

  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setTimeFilter('Tháng này')
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim()
        const matchesCode = order.transactionCode.toLowerCase().includes(query)
        const matchesCustomer = 'khách a'.includes(query)
        if (!matchesCode && !matchesCustomer) return false
      }

      if (statusFilter === 'completed' && order.status !== 'completed') return false
      if (statusFilter === 'cancelled' && order.status !== 'cancelled') return false
      
      if (paymentFilter !== 'all') {
        const paymentMethods = order.payments.map(p => p.paymentMethod)
        if (!paymentMethods.includes(paymentFilter)) return false
      }
      
      return true
    })
  }, [orders, searchQuery, statusFilter, paymentFilter])

  return (
    <div className='flex flex-col w-full bg-[#f8f9fa] h-[calc(100vh-51px)] overflow-hidden'>
      <div className='flex items-center justify-between px-8 py-4 gap-4 bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'>
        <div className='ml-96 flex-1 max-w-4xl flex items-center bg-white border border-gray-300 rounded-lg px-5 py-2.5 shadow-sm focus-within:border-[#D32F2F] focus-within:ring-1 focus-within:ring-[#D32F2F]/20 transition-all'>
          <Scan className='text-[#D32F2F] mr-3 size-5 shrink-0 stroke-[2]' />
          <input
            type='text'
            placeholder='Tìm kiếm thông minh..'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='flex-grow bg-transparent outline-none text-[14px] text-gray-800 placeholder-gray-400 font-medium'
          />
          <Search className='text-gray-400 size-5 shrink-0 hover:text-gray-600 transition-colors cursor-pointer' />
        </div>

        <div className='flex justify-end'>
          <button className='flex items-center gap-2 px-4 py-2 border border-[#D32F2F] text-[#D32F2F] rounded-[8px] hover:bg-[#fef2f2] font-bold text-[13.5px] transition-colors'>
            <FileDown size={16} />
            Xuất file
          </button>
        </div>
      </div>

      <div className='flex flex-grow w-full overflow-hidden'>
        <div className='w-72 bg-white border-r border-[#ffe5e5] p-6 flex flex-col gap-6 shrink-0 overflow-y-auto'>
        <div className='flex flex-col gap-3'>
          <span className='text-[13px] font-bold text-gray-500'>Trạng thái</span>
          <div className='flex flex-col gap-3.5'>
            {[
              { val: 'all', label: 'Tất cả' },
              { val: 'completed', label: 'Hoàn thành' },
              { val: 'cancelled', label: 'Đã hủy' }
            ].map((opt) => (
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

        <div className='flex flex-col gap-3'>
          <span className='text-[13px] font-bold text-gray-500'>Loại thanh toán</span>
          <div className='flex flex-col gap-3.5'>
            {[
              { val: 'all', label: 'Tất cả' },
              { val: 'Tiền mặt', label: 'Tiền mặt' },
              { val: 'Ví điện tử', label: 'Ví điện tử' },
              { val: 'Chuyển khoản', label: 'Chuyển khoản' }
            ].map((opt) => (
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

        <div className='flex flex-col gap-3'>
          <span className='text-[13px] font-bold text-gray-500'>Thời gian</span>
          <div className='flex flex-col gap-3.5'>
            {[
              'Hôm nay',
              '7 ngày qua',
              '30 ngày qua',
              'Tháng này',
              'Tháng trước',
              'Năm nay',
              'Tùy chọn'
            ].map((opt) => (
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

        {(searchQuery || statusFilter !== 'all' || paymentFilter !== 'all' || timeFilter !== 'Tháng này') && (
          <button
            onClick={handleResetFilters}
            className='mt-auto flex items-center justify-center gap-2 border border-dashed border-[#D32F2F] hover:bg-[#fef2f2] text-[#D32F2F] text-[13px] font-bold py-2.5 rounded-[8px] transition-colors'
          >
            <RotateCcw size={14} /> Xoá bộ lọc
          </button>
        )}
      </div>

      <div className='flex-grow p-8 flex flex-col gap-4 overflow-y-auto'>
        <div className='bg-white rounded-[12px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden w-full'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='bg-[#e3effc] text-[#1e3a8a] text-[13.5px] font-bold border-b border-[#cbd5e1]/40'>
                <th className='py-4 px-6 font-semibold tracking-wide'>Mã đơn hàng</th>
                <th className='py-4 px-6 font-semibold tracking-wide'>Phương thức thanh toán</th>
                <th className='py-4 px-6 font-semibold tracking-wide'>Khách hàng</th>
                <th className='py-4 px-6 font-semibold tracking-wide'>Thời gian</th>
                <th className='py-4 px-6 font-semibold tracking-wide text-right'>Tổng cộng</th>
                <th className='py-4 px-6 font-semibold tracking-wide text-center w-28'>Thao tác</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {filteredOrders.map((order) => (
                <tr key={order.transactionId} className='hover:bg-[#fcfdfe] transition-colors group'>
                  <td className='py-4 px-6 text-[13.5px] text-gray-900 font-bold'>
                    {order.transactionCode}
                  </td>
                  <td className='py-4 px-6 text-[13.5px] text-gray-600 font-medium'>
                    {order.payments[0]?.paymentMethod || 'Chưa thanh toán'}
                  </td>
                  <td className='py-4 px-6 text-[13.5px] text-gray-600 font-medium'>
                    Khách A
                  </td>
                  <td className='py-4 px-6 text-[13.5px] text-gray-500 font-medium'>
                    {order.transactionDate}
                  </td>
                  <td className='py-4 px-6 text-right text-[14.5px] text-gray-900 font-bold'>
                    {order.totalAmount.toLocaleString('vi-VN')}
                  </td>
                  <td className='py-4 px-6 text-center'>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className='p-1.5 text-gray-400 hover:text-[#D32F2F] hover:bg-red-50 rounded-md transition-colors'
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
      </div>

      {selectedOrder && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex items-center justify-between px-8 py-4 bg-[#fef2f2] border-b border-red-100'>
              <h3 className='text-[16px] font-bold text-gray-900'>
                Chi tiết đơn hàng: {selectedOrder.transactionCode}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className='text-gray-400 hover:text-gray-600 transition-colors'>
                <X size={20} />
              </button>
            </div>

            <div className='p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto'>
              <div className='grid grid-cols-2 gap-4 text-[13.5px] border-b border-gray-100 pb-4'>
                <div>
                  <span className='text-gray-500 block'>Thời gian</span>
                  <span className='font-bold text-gray-800'>{selectedOrder.transactionDate}</span>
                </div>
                <div>
                  <span className='text-gray-500 block'>Trạng thái</span>
                  <span className='inline-block bg-green-100 text-green-800 text-[12px] px-2.5 py-0.5 rounded-full font-bold'>
                    {selectedOrder.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className='text-[14px] font-bold text-gray-700 mb-3'>Danh sách sản phẩm</h4>
                <div className='flex flex-col gap-3'>
                  {selectedOrder.items.map((item) => {
                    const imageUrl = PRODUCT_IMAGES[item.productId || '']
                    return (
                      <div key={item.transactionItemId} className='flex items-center justify-between gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors'>
                        <div className='flex items-center gap-3'>
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.productName}
                              className='w-12 h-12 object-cover rounded-lg border border-gray-200'
                            />
                          ) : (
                            <div className='w-12 h-12 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 bg-gray-50'>
                              <Box size={20} />
                            </div>
                          )}
                          <div>
                            <span className='font-bold text-gray-900 block'>{item.productName}</span>
                            <span className='text-[12.5px] text-gray-500'>
                              Số lượng: {item.quantity} {item.unit} x {item.unitPrice.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        </div>
                        <span className='font-bold text-gray-900 text-[14px]'>
                          {item.lineTotal.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className='border-t border-gray-100 pt-4 flex flex-col gap-2'>
                <div className='flex justify-between text-[13.5px]'>
                  <span className='text-gray-500'>Tạm tính:</span>
                  <span className='font-semibold text-gray-800'>{selectedOrder.subTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className='flex justify-between text-[13.5px]'>
                  <span className='text-gray-500'>Phương thức thanh toán:</span>
                  <span className='font-semibold text-gray-800'>{selectedOrder.payments[0]?.paymentMethod}</span>
                </div>
                <div className='flex justify-between text-[15px] border-t border-gray-100 pt-3'>
                  <span className='font-bold text-gray-800'>Tổng cộng:</span>
                  <span className='font-bold text-[#D32F2F] text-[16px]'>
                    {selectedOrder.totalAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}