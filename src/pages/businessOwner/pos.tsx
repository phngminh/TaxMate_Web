import { useState, useMemo } from 'react'
import { Search, Plus, Printer, Menu, X, Check, Utensils } from 'lucide-react'
import type { Product } from '../../types/product.type'

const PRODUCTS: Product[] = [
  { id: 'SP000001', name: 'Pizza', currentPrice: 55000, category: 'Fast food', status: 'active' },
  { id: 'SP000002', name: 'Hamburger', currentPrice: 35000, category: 'Fast food', status: 'active' },
  { id: 'SP000003', name: 'Coca', currentPrice: 20000, category: 'Đồ uống', status: 'active' },
  { id: 'SP000004', name: 'Trà đào', currentPrice: 25000, category: 'Đồ uống', status: 'active' },
  { id: 'SP000005', name: 'Khoai tây chiên', currentPrice: 30000, category: 'Fast food', status: 'active' },
  { id: 'SP000006', name: 'Mì Ý', currentPrice: 65000, category: 'Món chính', status: 'active' },
]

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface DraftOrder {
  id: string
  items: OrderItem[]
  customerName: string
  discountType: 'VND' | '%'
  discountValue: number
  paymentMethod: 'cash' | 'card' | 'transfer'
}

export default function POS() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Fast food'>('all')
  const [activeOrderId, setActiveOrderId] = useState<string>('T-1')
  
  const [orders, setOrders] = useState<DraftOrder[]>([
    {
      id: 'T-1',
      items: [
        { id: 'SP000001', name: 'Pizza', price: 55000, quantity: 1 },
        { id: 'SP000002', name: 'Hamburger', price: 35000, quantity: 1 },
        { id: 'SP000003', name: 'Coca', price: 20000, quantity: 1 }
      ],
      customerName: '',
      discountType: 'VND',
      discountValue: 0,
      paymentMethod: 'card'
    }
  ])

  const handleAddOrder = () => {
    const nextIndex =
      orders.length > 0
        ? Math.max(
            ...orders.map(o => {
              const match = o.id.match(/T-(\d+)/)
              return match ? parseInt(match[1]) : 0
            })
          ) + 1
        : 1

    const newId = `T-${nextIndex}`

    const newOrder: DraftOrder = {
      id: newId,
      items: [],
      customerName: '',
      discountType: 'VND',
      discountValue: 0,
      paymentMethod: 'card'
    }

    setOrders(prev => [...prev, newOrder])
    setActiveOrderId(newId)
  }

  const handleCloseOrder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (orders.length === 1) {
      const newId = 'TXM-20260601'
      setOrders([
        {
          id: newId,
          items: [],
          customerName: '',
          discountType: 'VND',
          discountValue: 0,
          paymentMethod: 'card'
        }
      ])
      setActiveOrderId(newId)
      return
    }

    const remaining = orders.filter(o => o.id !== id)
    setOrders(remaining)
    if (activeOrderId === id) {
      setActiveOrderId(remaining[0].id)
    }
  }

  const activeOrder = useMemo(() => {
    return orders.find(o => o.id === activeOrderId) || orders[0]
  }, [orders, activeOrderId])

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || p.category === 'Fast food'
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  const handleAddProductToCart = (product: Product) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== activeOrderId) return o
      const existing = o.items.find(item => item.id === product.id)
      if (existing) {
        return {
          ...o,
          items: o.items.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        }
      } else {
        return {
          ...o,
          items: [...o.items, { id: product.id, name: product.name, price: product.currentPrice ?? 0, quantity: 1 }]
        }
      }
    }))
  }

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== activeOrderId) return o
      return {
        ...o,
        items: o.items.map(item => {
          if (item.id === productId) {
            const nextQty = item.quantity + delta
            return nextQty > 0 ? { ...item, quantity: nextQty } : null
          }
          return item
        }).filter((item): item is OrderItem => item !== null)
      }
    }))
  }

  const handleDiscountTypeChange = (type: 'VND' | '%') => {
    setOrders(prev => prev.map(o => {
      if (o.id !== activeOrderId) return o
      return { ...o, discountType: type, discountValue: 0 }
    }))
  }

  const handleDiscountValueChange = (val: string) => {
    const numeric = parseFloat(val.replace(/,/g, '')) || 0
    setOrders(prev => prev.map(o => {
      if (o.id !== activeOrderId) return o
      return { ...o, discountValue: numeric }
    }))
  }

  const handlePaymentMethodChange = (method: 'cash' | 'card' | 'transfer') => {
    setOrders(prev => prev.map(o => {
      if (o.id !== activeOrderId) return o
      return { ...o, paymentMethod: method }
    }))
  }

  const handleCustomerNameChange = (name: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== activeOrderId) return o
      return { ...o, customerName: name }
    }))
  }

  const subtotal = useMemo(() => {
    return activeOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [activeOrder])

  const itemCount = useMemo(() => {
    return activeOrder.items.reduce((sum, item) => sum + item.quantity, 0)
  }, [activeOrder])

  const discountAmount = useMemo(() => {
    if (activeOrder.discountType === 'VND') {
      return activeOrder.discountValue
    }
    return Math.round((subtotal * activeOrder.discountValue) / 100)
  }, [subtotal, activeOrder.discountType, activeOrder.discountValue])

  const totalPayment = useMemo(() => {
    return Math.max(0, subtotal - discountAmount)
  }, [subtotal, discountAmount])

  const formatPrice = (val: number) => {
    return val.toLocaleString('vi-VN')
  }

  return (
    <div className='flex bg-[#004795] p-3 gap-3 min-h-[calc(100vh-51px)] w-full text-slate-800'>
      <div className='w-7/12 flex flex-col bg-white rounded-md overflow-hidden shadow-md h-full'>
        <div className='bg-[#004795] flex items-center justify-between px-3 pt-2'>
          <div className='bg-white text-[#004795] font-bold px-5 py-2.5 rounded-t-md text-sm border-b-2 border-white'>
            Danh sách sản phẩm
          </div>
          <div className='flex items-center gap-2 pb-2'>
            <div className='relative flex items-center'>
              <Search className='absolute left-3 text-slate-400 size-4' />
              <input
                type='text'
                placeholder='Tìm sản phẩm'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='bg-white border-0 text-slate-800 text-xs pl-9 pr-4 py-2 w-64 rounded-md shadow-inner outline-none focus:ring-1 focus:ring-[#004795]/20'
              />
            </div>
            <button className='bg-[#005fb8] hover:bg-[#006bd1] text-white p-2 rounded-md transition-colors shadow-sm'>
              <Plus className='size-4 stroke-[3]' />
            </button>
          </div>
        </div>

        <div className='p-4 flex gap-2 border-b border-slate-100'>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#b90a0a] text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setSelectedCategory('Fast food')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedCategory === 'Fast food'
                ? 'bg-[#b90a0a] text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Danh mục 1
          </button>
        </div>

        <div className='p-4 flex-grow overflow-y-auto max-h-[650px] grid grid-cols-4 gap-4'>
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleAddProductToCart(product)}
              className='border border-slate-100 rounded-md overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col items-center p-3 text-center'
            >
              <div className='bg-[#ffebeb] w-full aspect-square rounded-md flex items-center justify-center mb-3'>
                <Utensils className='text-[#d32f2f] size-8 stroke-[1.5]' />
              </div>
              <div className='text-xs font-medium text-slate-700 mb-1 line-clamp-2 min-h-[32px] flex items-center justify-center'>
                {product.name}
              </div>
              <div className='text-xs font-bold text-slate-900'>
                {formatPrice(product.currentPrice ?? 0)} đ
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className='col-span-4 text-center py-10 text-slate-400 text-sm'>
              Không tìm thấy sản phẩm phù hợp.
            </div>
          )}
        </div>
      </div>

      <div className='w-5/12 flex flex-col bg-white rounded-md overflow-hidden shadow-md'>
        <div className='bg-[#004795] flex items-center justify-between px-3 pt-2'>
          <div className='flex items-center gap-1 overflow-x-auto max-w-[60%] scrollbar-none'>
            {orders.map((order) => {
              const isActive = order.id === activeOrderId
              return (
                <div
                  key={order.id}
                  onClick={() => setActiveOrderId(order.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-md text-xs font-bold cursor-pointer transition-colors shrink-0 ${
                    isActive
                      ? 'bg-white text-[#004795]'
                      : 'bg-[#003875] text-[#b0cde8] hover:bg-[#003c7e] hover:text-white'
                  }`}
                >
                  <span>Đơn hàng {order.id}</span>
                  <X
                    className='size-3 hover:text-red-500 cursor-pointer'
                    onClick={(e) => handleCloseOrder(order.id, e)}
                  />
                </div>
              )
            })}
            <button
              onClick={handleAddOrder}
              className='bg-[#005fb8] hover:bg-[#006bd1] text-white p-1.5 rounded-md transition-colors'
            >
              <Plus className='size-3.5 stroke-[3]' />
            </button>
          </div>
          <div className='flex items-center gap-3 text-white pb-2'>
            <span className='text-xs font-semibold'>Xin chào, Minh Nguyễn</span>
            <Printer className='size-4 cursor-pointer hover:opacity-80' />
            <Menu className='size-4 cursor-pointer hover:opacity-80' />
          </div>
        </div>

        <div className='p-4 border-b border-slate-100 flex gap-2'>
          <div className='relative flex-grow flex items-center'>
            <Search className='absolute left-3 text-slate-400 size-4' />
            <input
              type='text'
              placeholder='Nhập tên khách hàng'
              value={activeOrder.customerName}
              onChange={(e) => handleCustomerNameChange(e.target.value)}
              className='bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-9 pr-4 py-2 w-full rounded-md outline-none focus:bg-white focus:ring-1 focus:ring-[#004795]/20'
            />
          </div>
          <button className='bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-md text-slate-500 transition-colors'>
            <Plus className='size-4' />
          </button>
        </div>

        <div className='flex-grow p-4 overflow-y-auto max-h-[350px] space-y-4'>
          {activeOrder.items.map((item, index) => (
            <div key={item.id} className='flex items-center justify-between text-xs py-1'>
              <div className='w-1/2 font-semibold text-slate-700'>
                {index + 1}. {item.name}
              </div>
              <div className='flex items-center gap-4'>
                <div className='flex items-center border border-[#d32f2f] rounded-md overflow-hidden bg-white'>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, -1)}
                    className='px-2 py-1 text-[#d32f2f] font-bold hover:bg-[#ffebeb] transition-colors text-sm'
                  >
                    -
                  </button>
                  <span className='px-3 text-slate-800 font-bold text-xs'>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, 1)}
                    className='px-2 py-1 text-[#d32f2f] font-bold hover:bg-[#ffebeb] transition-colors text-sm'
                  >
                    +
                  </button>
                </div>
                <div className='w-16 text-right text-slate-400'>
                  {formatPrice(item.price)}
                </div>
                <div className='w-20 text-right font-bold text-slate-900'>
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            </div>
          ))}
          {activeOrder.items.length === 0 && (
            <div className='text-center py-10 text-slate-400'>
              Đơn hàng chưa có sản phẩm.
            </div>
          )}
        </div>

        <div className='p-4 border-t border-slate-200 bg-slate-50/50 space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='font-extrabold text-[#003B95] text-base'>Tổng thanh toán</span>
              <span className='bg-[#b90a0a] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center'>
                {itemCount}
              </span>
            </div>
            <div className='font-extrabold text-[#003B95] text-lg'>
              {formatPrice(totalPayment)}
            </div>
          </div>

          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-1.5'>
              <span className='text-xs text-slate-500'>Giảm giá</span>
              <div className='flex bg-slate-100 rounded-md p-0.5 border border-slate-200'>
                <button
                  onClick={() => handleDiscountTypeChange('VND')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                    activeOrder.discountType === 'VND'
                      ? 'bg-[#22c55e]/20 text-[#16a34a]'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  VND
                </button>
                <button
                  onClick={() => handleDiscountTypeChange('%')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                    activeOrder.discountType === '%'
                      ? 'bg-[#22c55e]/20 text-[#16a34a]'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  %
                </button>
              </div>
            </div>
            <input
              type='text'
              value={activeOrder.discountValue === 0 ? '0' : activeOrder.discountValue.toLocaleString()}
              onChange={(e) => handleDiscountValueChange(e.target.value)}
              className='bg-white border border-slate-200 text-slate-800 text-xs text-right px-3 py-1.5 w-44 rounded-md outline-none focus:ring-1 focus:ring-[#004795]/20 font-bold'
            />
          </div>

          <div className='flex items-center justify-between text-xs'>
            <span className='text-slate-500'>Phương thức thanh toán</span>
            <div className='flex gap-4'>
              <label className='flex items-center gap-1.5 cursor-pointer font-medium text-slate-600'>
                <input
                  type='radio'
                  name='payment'
                  checked={activeOrder.paymentMethod === 'cash'}
                  onChange={() => handlePaymentMethodChange('cash')}
                  className='accent-[#004795] cursor-pointer'
                />
                Tiền mặt
              </label>
              <label className='flex items-center gap-1.5 cursor-pointer font-medium text-slate-600'>
                <input
                  type='radio'
                  name='payment'
                  checked={activeOrder.paymentMethod === 'card'}
                  onChange={() => handlePaymentMethodChange('card')}
                  className='accent-[#004795] cursor-pointer'
                />
                Thẻ
              </label>
              <label className='flex items-center gap-1.5 cursor-pointer font-medium text-slate-600'>
                <input
                  type='radio'
                  name='payment'
                  checked={activeOrder.paymentMethod === 'transfer'}
                  onChange={() => handlePaymentMethodChange('transfer')}
                  className='accent-[#004795] cursor-pointer'
                />
                Chuyển khoản
              </label>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4 pt-1'>
            <button className='flex items-center justify-center gap-2 border border-[#b90a0a] text-[#b90a0a] hover:bg-[#ffebeb] font-bold py-2 px-4 rounded-md text-xs transition-colors shadow-sm'>
              <Printer className='size-4' /> In hóa đơn
            </button>
            <button className='flex items-center justify-center gap-2 bg-[#b90a0a] hover:bg-[#a00909] text-white font-bold py-2 px-4 rounded-md text-xs transition-colors shadow-sm'>
              <Check className='size-4 stroke-[3]' /> Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}