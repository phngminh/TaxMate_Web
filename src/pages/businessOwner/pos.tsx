import { useState, useMemo, useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import { Search, Plus, X, Check, Utensils, Printer, Loader2, PlayCircle, RefreshCw, FileText, Sparkles, Building, Mail, MapPin, Hash } from 'lucide-react'
import { toast } from 'react-toastify'
import http from '../../utils/http'
import { useBusiness } from '../../contexts/BusinessContext'
import { useAuth } from '../../contexts/AuthContext'
import { getAllProducts, createProduct } from '../../apis/product.api'
import { getProductCategories } from '../../apis/productCategory.api'
import {
  createOrder,
  getOrderById,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  cancelOrder,
  checkoutOrder,
  confirmPayment
} from '../../apis/order.api'
import { getPaymentAccounts, createPaymentAccount, createSePayMockPayment } from '../../apis/paymentAccount.api'
import { getEInvoiceConfig } from '../../apis/einvoice.api'
import type { Product } from '../../types/product.type'
import type { ProductCategory } from '../../types/productCategory.type'
import type { OrderDetail } from '../../types/order.type'
import type { PaymentAccount } from '../../types/paymentAccount.type'

const BANK_OPTIONS = [
  { shortName: 'VCB', fullName: 'Vietcombank' },
  { shortName: 'TCB', fullName: 'Techcombank' },
  { shortName: 'MB', fullName: 'MBBank' },
  { shortName: 'ACB', fullName: 'ACB' },
  { shortName: 'VPB', fullName: 'VPBank' },
  { shortName: 'BIDV', fullName: 'BIDV' },
  { shortName: 'VTB', fullName: 'VietinBank' },
  { shortName: 'STB', fullName: 'Sacombank' },
  { shortName: 'TPB', fullName: 'TPBank' },
  { shortName: 'CAKE', fullName: 'CAKE' }
]

interface POSTab {
  tabId: string // e.g. "T-1", "T-2"
  orderId: string // Backend Guid transactionId
  code: string // Backend transactionCode
  items: any[]
  totalAmount: number
  status: string
}

export default function POS() {
  const { currentBusiness } = useBusiness()
  const businessId = currentBusiness?.id
  const { user } = useAuth()

  // Data state
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([])
  
  // UI filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')

  // Tab & Cart state
  const [tabs, setTabs] = useState<POSTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [loadingPOS, setLoadingPOS] = useState(true)
  const [loadingCart, setLoadingCart] = useState(false)

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'EWallet' | 'Transfer'>('Cash')
  const [checkingOut, setCheckingOut] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(null)

  // E-Invoice VAT State
  const [requireEInvoice, setRequireEInvoice] = useState(false)
  const [buyerTaxCode, setBuyerTaxCode] = useState('')
  const [buyerCompanyName, setBuyerCompanyName] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')

  // Quick Add Product state
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [quickName, setQuickName] = useState('')
  const [quickPrice, setQuickPrice] = useState('')
  const [quickSubmitting, setQuickSubmitting] = useState(false)

  // Inline Add Bank Account state
  const [showInlineAddBank, setShowInlineAddBank] = useState(false)
  const [inlineBankShortName, setInlineBankShortName] = useState('VCB')
  const [inlineBankFullName, setInlineBankFullName] = useState('Vietcombank')
  const [inlineAccountNumber, setInlineAccountNumber] = useState('')
  const [inlineAccountName, setInlineAccountName] = useState('')
  const [submittingInlineBank, setSubmittingInlineBank] = useState(false)
  
  // Awaiting payment overlay state
  const [showAwaitingOverlay, setShowAwaitingOverlay] = useState(false)
  const [awaitingOrderId, setAwaitingOrderId] = useState<string>('')
  const [awaitingOrderCode, setAwaitingOrderCode] = useState<string>('')
  const [awaitingAmount, setAwaitingAmount] = useState<number>(0)
  const [simulatingSePay, setSimulatingSePay] = useState(false)

  // success overlay state
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)
  const [successOrderCode, setSuccessOrderCode] = useState('')
  const [successAmount, setSuccessAmount] = useState(0)
  const [successInvoiceNumber, setSuccessInvoiceNumber] = useState<string | null>(null)
  const [successOfficialPdfUrl, setSuccessOfficialPdfUrl] = useState<string | null>(null)
  const [successOfficialXmlUrl, setSuccessOfficialXmlUrl] = useState<string | null>(null)
  const [successInvoiceStatus, setSuccessInvoiceStatus] = useState<string | null>(null)
  const [successTaxAuthorityCode, setSuccessTaxAuthorityCode] = useState<string | null>(null)

  // Flag to prevent concurrent initialization in StrictMode
  const isInitializingRef = useRef(false)

  // 1. Fetch initial products, categories, bank accounts and e-invoice preference
  const loadInitialData = async () => {
    if (!businessId) return
    try {
      setLoadingPOS(true)
      const [prodRes, catRes, accRes, configRes] = await Promise.all([
        getAllProducts(businessId, 1, 100),
        getProductCategories(businessId),
        getPaymentAccounts(businessId),
        getEInvoiceConfig(businessId).catch(() => null)
      ])

      if (prodRes.success) setProducts(prodRes.data.items || [])
      if (catRes.success) setCategories(catRes.data || [])
      if (accRes.success) {
        const accs = accRes.data || []
        setPaymentAccounts(accs)
        const defaultAcc = accs.find(x => x.isDefault) || accs[0] || null
        setSelectedAccount(defaultAcc)
      }
      if (configRes && configRes.success && configRes.data) {
        setRequireEInvoice(configRes.data.isEnabled || false)
      }

      // If no tab exists, initialize the first tab with concurrency protection
      if (tabs.length === 0 && !isInitializingRef.current) {
        isInitializingRef.current = true
        await initFirstTab(businessId)
      }
    } catch (err) {
      console.error(err)
      toast.error('Không thể tải dữ liệu bán hàng.')
    } finally {
      setLoadingPOS(false)
    }
  }

  const initFirstTab = async (bId: string) => {
    try {
      const orderRes = await createOrder(bId, { note: '' })
      const orderId = orderRes.data
      const detail = await getOrderById(orderId)
      
      const newTab: POSTab = {
        tabId: 'T-1',
        orderId: orderId,
        code: detail.data.transactionCode,
        items: detail.data.items || [],
        totalAmount: detail.data.totalAmount,
        status: detail.data.status
      }

      setTabs([newTab])
      setActiveTabId('T-1')
    } catch (err) {
      console.error('Init first tab failed:', err)
      toast.error('Không thể khởi tạo đơn hàng nháp.')
    } finally {
      isInitializingRef.current = false
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [businessId])

  // SignalR connection reference for payment monitoring
  const hubConnectionRef = useRef<signalR.HubConnection | null>(null)

  useEffect(() => {
    if (!showAwaitingOverlay || !awaitingOrderId) return

    const apiBaseUrl = (http.defaults.baseURL || '').replace(/\/api$/, '')
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}/paymentHub`)
      .withAutomaticReconnect()
      .build()

    hubConnectionRef.current = connection

    connection
      .start()
      .then(() => {
        console.log('[SignalR Web] Connected, joining order group:', awaitingOrderId)
        connection.invoke('JoinOrderGroup', awaitingOrderId)
      })
      .catch((err) => console.warn('[SignalR Web] Connection failed:', err))

    connection.on('PaymentConfirmed', async (transactionId: string) => {
      if (transactionId === awaitingOrderId) {
        console.log('[SignalR Web] Payment confirmed event received for:', transactionId)
        connection.stop()
        setShowAwaitingOverlay(false)
        toast.success('Hệ thống đã tự động ghi nhận thanh toán!')

        // Đợi 500ms để backend tạo hóa đơn điện tử xong
        await delay(600)

        // Gọi API lấy dữ liệu mới nhất
        try {
          const detail = await getOrderById(awaitingOrderId)
          setSuccessOrderCode(awaitingOrderCode)
          setSuccessAmount(awaitingAmount)
          setSuccessInvoiceNumber(detail.data?.invoiceNumber || null)
          setSuccessOfficialPdfUrl(detail.data?.officialPdfUrl || null)
          setSuccessOfficialXmlUrl(detail.data?.officialXmlUrl || null)
          setSuccessInvoiceStatus(detail.data?.invoiceStatus || null)
          setSuccessTaxAuthorityCode(detail.data?.taxAuthorityCode || null)
          setShowSuccessOverlay(true)

          if (activeTab) {
            await removeFinishedTab(activeTab.tabId)
          }
        } catch (err) {
          console.error('[SignalR Web] Failed to fetch updated order:', err)
        }
      }
    })

    return () => {
      console.log('[SignalR Web] Stopping connection for:', awaitingOrderId)
      connection.stop()
    }
  }, [showAwaitingOverlay, awaitingOrderId])

  // Get active tab object
  const activeTab = useMemo(() => {
    return tabs.find(t => t.tabId === activeTabId) || null
  }, [tabs, activeTabId])

  // Sync active tab cart details from backend
  const syncActiveTabDetails = async (tabId: string, orderId: string) => {
    try {
      setLoadingCart(true)
      const detail = await getOrderById(orderId)
      setTabs(prev =>
        prev.map(t =>
          t.tabId === tabId
            ? {
                ...t,
                items: detail.data.items || [],
                totalAmount: detail.data.totalAmount,
                status: detail.data.status
              }
            : t
        )
      )
    } catch (err) {
      console.error('Sync tab details failed:', err)
    } finally {
      setLoadingCart(false)
    }
  }

  // 2. Add product to cart
  const handleAddProductToCart = async (product: Product) => {
    if (!activeTab) return
    const orderId = activeTab.orderId
    const tabId = activeTab.tabId

    try {
      setLoadingCart(true)
      const existing = activeTab.items.find(x => x.productId === product.id)
      if (existing) {
        await updateOrderItem(orderId, existing.transactionItemId, {
          quantity: existing.quantity + 1
        })
      } else {
        await addOrderItem(orderId, {
          productId: product.id,
          quantity: 1
        })
      }
      await syncActiveTabDetails(tabId, orderId)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể thêm sản phẩm.')
    } finally {
      setLoadingCart(false)
    }
  }

  // 3. Update item quantity (+ / -)
  const handleUpdateQuantity = async (itemId: string, currentQty: number, delta: number) => {
    if (!activeTab) return
    const orderId = activeTab.orderId
    const tabId = activeTab.tabId
    const newQty = currentQty + delta

    try {
      setLoadingCart(true)
      if (newQty <= 0) {
        await removeOrderItem(orderId, itemId)
      } else {
        await updateOrderItem(orderId, itemId, {
          quantity: newQty
        })
      }
      await syncActiveTabDetails(tabId, orderId)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Cập nhật số lượng thất bại.')
    } finally {
      setLoadingCart(false)
    }
  }

  // 4. Create new tab
  const handleAddTab = async () => {
    if (!businessId) return
    try {
      setLoadingCart(true)
      const nextIndex =
        tabs.length > 0
          ? Math.max(
              ...tabs.map(t => {
                const match = t.tabId.match(/T-(\d+)/)
                return match ? parseInt(match[1]) : 0
              })
            ) + 1
          : 1

      const newTabId = `T-${nextIndex}`
      const orderRes = await createOrder(businessId, { note: '' })
      const orderId = orderRes.data
      const detail = await getOrderById(orderId)

      const newTab: POSTab = {
        tabId: newTabId,
        orderId: orderId,
        code: detail.data.transactionCode,
        items: detail.data.items || [],
        totalAmount: detail.data.totalAmount,
        status: detail.data.status
      }

      setTabs(prev => [...prev, newTab])
      setActiveTabId(newTabId)
    } catch (err) {
      console.error(err)
      toast.error('Không thể tạo tab đơn hàng mới.')
    } finally {
      setLoadingCart(false)
    }
  }

  // 5. Close a tab
  const handleCloseOrder = async (tabId: string, orderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!businessId) return

    try {
      // Cancel on backend
      await cancelOrder(orderId)

      if (tabs.length === 1) {
        // If it was the last tab, reset it by creating a new one
        setTabs([])
        await initFirstTab(businessId)
        return
      }

      const remaining = tabs.filter(t => t.tabId !== tabId)
      setTabs(remaining)
      if (activeTabId === tabId) {
        setActiveTabId(remaining[0].tabId)
        syncActiveTabDetails(remaining[0].tabId, remaining[0].orderId)
      }
    } catch (err) {
      console.error(err)
      toast.error('Hủy đơn hàng nháp thất bại.')
    }
  }

  // 6. Quick Add Product Handler
  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId) return
    if (!quickName.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm')
      return
    }
    const priceNum = parseFloat(quickPrice.replace(/\D/g, ''))
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Vui lòng nhập giá bán hợp lệ')
      return
    }

    try {
      setQuickSubmitting(true)
      const res = await createProduct(businessId, {
        name: quickName.trim(),
        currentPrice: priceNum,
        unit: 'Món',
        category: categories[0]?.name || 'Khác'
      })

      if (res.success && res.data) {
        toast.success('Đã tạo sản phẩm thành công!')
        const newProduct = res.data
        setProducts(prev => [newProduct, ...prev])
        setShowQuickAddModal(false)
        setQuickName('')
        setQuickPrice('')
        
        // Auto add to active cart
        await handleAddProductToCart(newProduct)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Tạo sản phẩm thất bại.')
    } finally {
      setQuickSubmitting(false)
    }
  }

  // Inline Bank Add Handler
  const handleAddInlineBank = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId) return
    if (!inlineAccountNumber.trim()) {
      toast.error('Vui lòng nhập số tài khoản')
      return
    }
    if (!inlineAccountName.trim()) {
      toast.error('Vui lòng nhập tên chủ tài khoản')
      return
    }

    try {
      setSubmittingInlineBank(true)
      const res = await createPaymentAccount(businessId, {
        bankShortName: inlineBankShortName,
        bankName: inlineBankFullName,
        accountNumber: inlineAccountNumber.trim(),
        accountName: inlineAccountName.trim().toUpperCase(),
        isDefault: false,
        description: 'Thêm nhanh tại POS'
      })

      if (res.success) {
        toast.success('Đã thêm tài khoản ngân hàng thành công!')
        const updatedAccs = await getPaymentAccounts(businessId)
        if (updatedAccs.success) {
          const accs = updatedAccs.data || []
          setPaymentAccounts(accs)
          const newAcc = accs.find(x => x.accountNumber === inlineAccountNumber.trim()) || accs[0]
          if (newAcc) setSelectedAccount(newAcc)
        }
        setShowInlineAddBank(false)
        setInlineAccountNumber('')
        setInlineAccountName('')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể thêm tài khoản ngân hàng.')
    } finally {
      setSubmittingInlineBank(false)
    }
  }

  // 7. Checkout Handlers
  const handleCheckoutClick = async () => {
    if (!activeTab || activeTab.items.length === 0) {
      toast.error('Giỏ hàng trống. V vui lòng thêm sản phẩm.')
      return
    }

    if (paymentMethod === 'Transfer') {
      if (paymentAccounts.length === 0) {
        setShowAccountModal(true)
        setShowInlineAddBank(true)
        return
      }
      setShowAccountModal(true)
    } else {
      // Cash or EWallet (Card) checkouts directly
      await executeCheckout(paymentMethod, null)
    }
  }

  const executeCheckout = async (method: 'Cash' | 'EWallet' | 'Transfer', bankAccountId: string | null) => {
    if (!activeTab || !businessId) return
    const orderId = activeTab.orderId
    const tabId = activeTab.tabId

    try {
      setCheckingOut(true)
      const res = await checkoutOrder(orderId, {
        payments: [
          {
            paymentMethod: method,
            amount: activeTab.totalAmount,
            paymentAccountId: bankAccountId
          }
        ],
        buyerTaxCode: requireEInvoice && buyerTaxCode.trim() ? buyerTaxCode.trim() : null,
        buyerCompanyName: requireEInvoice && buyerCompanyName.trim() ? buyerCompanyName.trim() : null,
        buyerAddress: requireEInvoice && buyerAddress.trim() ? buyerAddress.trim() : null,
        buyerEmail: requireEInvoice && buyerEmail.trim() ? buyerEmail.trim() : null
      })

      if (res.success) {
        if (method === 'Transfer' && selectedAccount) {
          // Open awaiting payment overlay with VietQR
          setAwaitingOrderId(orderId)
          setAwaitingOrderCode(activeTab.code)
          setAwaitingAmount(activeTab.totalAmount)
          setShowAwaitingOverlay(true)
          setShowAccountModal(false)
        } else {
          // Cash/Card completed immediately. Fetch fresh order details to get e-invoice fields if any
          const detail = await getOrderById(orderId)
          setSuccessOrderCode(activeTab.code)
          setSuccessAmount(activeTab.totalAmount)
          setSuccessInvoiceNumber(detail.data?.invoiceNumber || null)
          setSuccessOfficialPdfUrl(detail.data?.officialPdfUrl || null)
          setSuccessOfficialXmlUrl(detail.data?.officialXmlUrl || null)
          setSuccessInvoiceStatus(detail.data?.invoiceStatus || null)
          setSuccessTaxAuthorityCode(detail.data?.taxAuthorityCode || null)
          setShowSuccessOverlay(true)
          await removeFinishedTab(tabId)
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Thanh toán thất bại.')
    } finally {
      setCheckingOut(false)
    }
  }

  const removeFinishedTab = async (tabId: string) => {
    if (!businessId) return
    const remaining = tabs.filter(t => t.tabId !== tabId)
    if (remaining.length > 0) {
      setTabs(remaining)
      setActiveTabId(remaining[0].tabId)
      syncActiveTabDetails(remaining[0].tabId, remaining[0].orderId)
    } else {
      setTabs([])
      await initFirstTab(businessId)
    }
  }

  // Helper delay function
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // 8. VietQR & Webhook Handlers
  const handleSimulatePayment = async () => {
    if (!awaitingOrderId || !awaitingOrderCode || awaitingAmount <= 0) return
    try {
      setSimulatingSePay(true)
      const res = await createSePayMockPayment(awaitingOrderId, selectedAccount?.paymentAccountId || '')

      if (res.success) {
        toast.success('Đã gửi Webhook SePay thành công!')
        setShowAwaitingOverlay(false)

        // Đợi 500ms để backend xử lý webhook cập nhật trạng thái đơn hàng & hóa đơn đỏ
        await delay(600)

        // Gọi API lấy dữ liệu mới nhất
        const detail = await getOrderById(awaitingOrderId)
        setSuccessOrderCode(awaitingOrderCode)
        setSuccessAmount(awaitingAmount)
        setSuccessInvoiceNumber(detail.data?.invoiceNumber || null)
        setSuccessOfficialPdfUrl(detail.data?.officialPdfUrl || null)
        setSuccessOfficialXmlUrl(detail.data?.officialXmlUrl || null)
        setSuccessInvoiceStatus(detail.data?.invoiceStatus || null)
        setSuccessTaxAuthorityCode(detail.data?.taxAuthorityCode || null)
        setShowSuccessOverlay(true)

        if (activeTab) {
          await removeFinishedTab(activeTab.tabId)
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Giả lập SePay thất bại.')
    } finally {
      setSimulatingSePay(false)
    }
  }

  const handleManualConfirm = async () => {
    if (!awaitingOrderId) return
    try {
      setCheckingOut(true)
      const res = await confirmPayment(awaitingOrderId)
      if (res.success) {
        toast.success('Xác nhận thanh toán thủ công thành công!')
        setShowAwaitingOverlay(false)

        // Đợi 300ms để backend tạo hóa đơn điện tử
        await delay(400)

        const detail = await getOrderById(awaitingOrderId)
        setSuccessOrderCode(awaitingOrderCode)
        setSuccessAmount(awaitingAmount)
        setSuccessInvoiceNumber(detail.data?.invoiceNumber || null)
        setSuccessOfficialPdfUrl(detail.data?.officialPdfUrl || null)
        setSuccessOfficialXmlUrl(detail.data?.officialXmlUrl || null)
        setSuccessInvoiceStatus(detail.data?.invoiceStatus || null)
        setSuccessTaxAuthorityCode(detail.data?.taxAuthorityCode || null)
        setShowSuccessOverlay(true)

        if (activeTab) {
          await removeFinishedTab(activeTab.tabId)
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xác nhận thất bại.')
    } finally {
      setCheckingOut(false)
    }
  }

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        selectedCategoryId === 'all' || p.category === selectedCategoryId
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategoryId])

  const formatPrice = (value: number) => {
    return value.toLocaleString('vi-VN')
  }

  const handlePrint = () => {
    if (!successInvoiceNumber) {
      toast.warn('Hóa đơn chưa được phát hành.')
      return
    }
    const apiBaseUrl = (http.defaults.baseURL || '').replace(/\/api$/, '')
    const url = `${apiBaseUrl}/api/Invoice/${successInvoiceNumber}/pdf`
    window.open(url, '_blank')
  }

  return (
    <div className='flex bg-[#004795] p-3 gap-3 h-screen w-full text-slate-800 overflow-hidden relative'>
      {/* CỘT TRÁI - DANH SÁCH SẢN PHẨM */}
      <div className='w-7/12 flex flex-col bg-white rounded-md overflow-hidden shadow-md h-full'>
        <div className='bg-[#004795] flex items-center justify-between px-3 pt-2'>
          <div className='bg-white text-[#004795] font-bold px-5 py-2.5 rounded-t-md text-sm border-b-2 border-white select-none'>
            Danh sách sản phẩm
          </div>
          <div className='flex items-center gap-2 pb-2'>
            <div className='relative flex items-center'>
              <Search className='absolute left-3 text-slate-400 size-4' />
              <input
                type='text'
                placeholder='Tìm sản phẩm...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='bg-white border-0 text-slate-800 text-xs pl-9 pr-4 py-2 w-56 rounded-md shadow-inner outline-hidden focus:ring-1 focus:ring-[#004795]/20 font-medium'
              />
            </div>
            <button
              onClick={() => setShowQuickAddModal(true)}
              className='bg-[#b90a0a] hover:bg-[#a00909] text-white px-3 py-2 rounded-md text-xs font-bold transition-colors flex items-center gap-1 shrink-0 shadow-xs cursor-pointer'
              title='Tạo nhanh sản phẩm mới'
            >
              <Plus size={14} className='stroke-3' />
              Tạo nhanh
            </button>
          </div>
        </div>

        {/* Danh mục tabs */}
        <div className='p-4 flex gap-2 border-b border-slate-100 overflow-x-auto scrollbar-none select-none'>
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              selectedCategoryId === 'all'
                ? 'bg-[#b90a0a] text-white font-bold'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.name)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                selectedCategoryId === cat.name
                  ? 'bg-[#b90a0a] text-white font-bold'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid sản phẩm */}
        {loadingPOS ? (
          <div className='grow flex items-center justify-center'>
            <Loader2 className='animate-spin text-[#004795] size-10' />
          </div>
        ) : (
          <div className='p-4 grow overflow-y-auto min-h-0 grid grid-cols-4 gap-4 content-start'>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => handleAddProductToCart(product)}
                className='border border-slate-100 rounded-md overflow-hidden cursor-pointer shadow-xs hover:shadow-md hover:border-slate-200 transition-all flex flex-col items-center p-3 text-center bg-white group'
              >
                <div className='bg-[#ffebeb] w-full aspect-square rounded-md flex items-center justify-center mb-3 group-hover:scale-102 transition-transform duration-200'>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className='w-full h-full object-cover rounded-md' />
                  ) : (
                    <Utensils className='text-[#b90a0a] size-8 stroke-[1.5]' />
                  )}
                </div>
                <div className='text-[11.5px] font-bold text-slate-700 mb-1 line-clamp-2 min-h-8 flex items-center justify-center'>
                  {product.name}
                </div>
                <div className='text-xs font-black text-slate-900'>
                  {formatPrice(product.currentPrice ?? 0)} đ
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className='col-span-4 text-center py-20 text-slate-400 text-sm font-semibold'>
                Không tìm thấy sản phẩm phù hợp.
              </div>
            )}
          </div>
        )}
      </div>

      {/* CỘT PHẢI - GIỎ HÀNG & THANH TOÁN */}
      <div className='w-5/12 flex flex-col bg-white rounded-md overflow-hidden shadow-md h-full relative'>
        <div className='bg-[#004795] flex items-center justify-between px-3 pt-2 select-none'>
          {/* Đơn hàng tabs */}
          <div className='flex items-center gap-1 overflow-x-auto max-w-[60%] scrollbar-none'>
            {tabs.map(order => {
              const isActive = order.tabId === activeTabId
              return (
                <div
                  key={order.tabId}
                  onClick={() => {
                    setActiveTabId(order.tabId)
                    syncActiveTabDetails(order.tabId, order.orderId)
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-md text-xs font-extrabold cursor-pointer transition-colors shrink-0 ${
                    isActive
                      ? 'bg-white text-[#004795]'
                      : 'bg-[#003875] text-[#b0cde8] hover:bg-[#003c7e] hover:text-white'
                  }`}
                >
                  <span>Đơn {order.tabId}</span>
                  <X
                    className='size-3 hover:text-red-500 cursor-pointer stroke-3'
                    onClick={e => handleCloseOrder(order.tabId, order.orderId, e)}
                  />
                </div>
              )
            })}
            <button
              onClick={handleAddTab}
              className='bg-[#005fb8] hover:bg-[#006bd1] text-white p-1.5 rounded-md transition-colors'
            >
              <Plus className='size-3.5 stroke-3' />
            </button>
          </div>

          <div className='flex items-center gap-2 text-white pb-2 text-xs font-bold'>
            <span>Xin chào, {user?.fullName || 'Nhân viên'}</span>
          </div>
        </div>

        {/* Khách hàng (mocked) */}
        <div className='p-4 border-b border-slate-100 flex gap-2'>
          <div className='relative grow flex items-center'>
            <Search className='absolute left-3 text-slate-400 size-4' />
            <input
              type='text'
              readOnly
              value='Khách vãng lai'
              className='bg-slate-50 border border-slate-200 text-slate-500 text-xs pl-9 pr-4 py-2 w-full rounded-md outline-hidden font-bold select-none cursor-not-allowed'
            />
          </div>
        </div>

        {/* Danh sách dòng hàng */}
        {loadingCart ? (
          <div className='grow flex items-center justify-center'>
            <Loader2 className='animate-spin text-[#004795] size-8' />
          </div>
        ) : activeTab ? (
          <div className='grow p-4 overflow-y-auto min-h-0 space-y-4'>
            {activeTab.items.map((item, index) => (
              <div key={item.transactionItemId} className='flex items-center justify-between text-xs py-1 border-b border-slate-50 pb-2'>
                <div className='w-1/2 font-bold text-slate-700 pr-2 leading-snug'>
                  {index + 1}. {item.productName}
                </div>
                <div className='flex items-center gap-3'>
                  <div className='flex items-center border border-[#b90a0a] rounded-md overflow-hidden bg-white'>
                    <button
                      onClick={() => handleUpdateQuantity(item.transactionItemId, item.quantity, -1)}
                      className='px-2 py-0.5 text-[#b90a0a] font-black hover:bg-[#ffebeb] transition-colors text-xs select-none'
                    >
                      -
                    </button>
                    <span className='px-2.5 text-slate-800 font-bold text-xs font-mono select-none'>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.transactionItemId, item.quantity, 1)}
                      className='px-2 py-0.5 text-[#b90a0a] font-black hover:bg-[#ffebeb] transition-colors text-xs select-none'
                    >
                      +
                    </button>
                  </div>
                  <div className='w-14 text-right text-slate-400 font-bold font-mono'>
                    {formatPrice(item.unitPrice)}
                  </div>
                  <div className='w-20 text-right font-black text-slate-900 font-mono'>
                    {formatPrice(item.lineTotal)}
                  </div>
                </div>
              </div>
            ))}
            {activeTab.items.length === 0 && (
              <div className='text-center py-20 text-slate-400 text-xs font-bold'>
                Đơn hàng chưa có sản phẩm.
              </div>
            )}
          </div>
        ) : null}

        {/* Thanh toán & checkout */}
        {activeTab && (
          <div className='p-4 border-t border-slate-200 bg-slate-50/50 space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2 select-none'>
                <span className='font-extrabold text-[#003B95] text-[15px]'>Tổng thanh toán</span>
                <span className='bg-[#b90a0a] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center font-mono'>
                  {activeTab.items.reduce((acc, curr) => acc + curr.quantity, 0)}
                </span>
              </div>
              <div className='font-black text-[#003B95] text-lg font-mono'>
                {formatPrice(activeTab.totalAmount)} đ
              </div>
            </div>

            {/* Chọn phương thức thanh toán */}
            <div className='flex items-center justify-between text-xs select-none pt-1 border-t border-slate-100'>
              <span className='text-slate-500 font-bold'>Phương thức thanh toán</span>
              <div className='flex gap-4'>
                <label className='flex items-center gap-1.5 cursor-pointer font-bold text-slate-600'>
                  <input
                    type='radio'
                    name='payment'
                    checked={paymentMethod === 'Cash'}
                    onChange={() => setPaymentMethod('Cash')}
                    className='accent-[#004795] cursor-pointer'
                  />
                  Tiền mặt
                </label>
                <label className='flex items-center gap-1.5 cursor-pointer font-bold text-slate-600'>
                  <input
                    type='radio'
                    name='payment'
                    checked={paymentMethod === 'EWallet'}
                    onChange={() => setPaymentMethod('EWallet')}
                    className='accent-[#004795] cursor-pointer'
                  />
                  Thẻ
                </label>
                <label className='flex items-center gap-1.5 cursor-pointer font-bold text-slate-600'>
                  <input
                    type='radio'
                    name='payment'
                    checked={paymentMethod === 'Transfer'}
                    onChange={() => setPaymentMethod('Transfer')}
                    className='accent-[#004795] cursor-pointer'
                  />
                  Chuyển khoản
                </label>
              </div>
            </div>

            {/* Công tắc Xuất Hóa đơn đỏ (VAT) */}
            <div className='pt-2 border-t border-slate-100 flex flex-col gap-2'>
              <div className='flex items-center justify-between text-xs select-none'>
                <span className='text-slate-700 font-bold flex items-center gap-1.5'>
                  <FileText className='text-[#b90a0a] size-4' />
                  Xuất hóa đơn đỏ (VAT)
                </span>
                <input
                  type='checkbox'
                  checked={requireEInvoice}
                  onChange={e => setRequireEInvoice(e.target.checked)}
                  className='accent-[#b90a0a] size-4 rounded-xs cursor-pointer'
                />
              </div>

              {requireEInvoice && (
                <div className='bg-slate-100/70 p-3 rounded-md border border-slate-200/60 flex flex-col gap-2 text-xs animate-in fade-in duration-200'>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <label className='text-[10px] font-bold text-slate-500 block mb-0.5'>Mã số thuế</label>
                      <input
                        type='text'
                        placeholder='MST (tùy chọn)...'
                        value={buyerTaxCode}
                        onChange={e => setBuyerTaxCode(e.target.value)}
                        className='w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono font-medium outline-hidden focus:border-[#b90a0a]'
                      />
                    </div>
                    <div>
                      <label className='text-[10px] font-bold text-slate-500 block mb-0.5'>Email nhận HĐ</label>
                      <input
                        type='email'
                        placeholder='Email...'
                        value={buyerEmail}
                        onChange={e => setBuyerEmail(e.target.value)}
                        className='w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium outline-hidden focus:border-[#b90a0a]'
                      />
                    </div>
                  </div>
                  <div>
                    <label className='text-[10px] font-bold text-slate-500 block mb-0.5'>Tên công ty / đơn vị</label>
                    <input
                      type='text'
                      placeholder='Tên công ty / đơn vị mua hàng...'
                      value={buyerCompanyName}
                      onChange={e => setBuyerCompanyName(e.target.value)}
                      className='w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium outline-hidden focus:border-[#b90a0a]'
                    />
                  </div>
                  <div>
                    <label className='text-[10px] font-bold text-slate-500 block mb-0.5'>Địa chỉ công ty</label>
                    <input
                      type='text'
                      placeholder='Địa chỉ đăng ký thuế...'
                      value={buyerAddress}
                      onChange={e => setBuyerAddress(e.target.value)}
                      className='w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium outline-hidden focus:border-[#b90a0a]'
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Nút checkout */}
            <div className='pt-1'>
              <button
                onClick={handleCheckoutClick}
                disabled={checkingOut || loadingCart}
                className='w-full flex items-center justify-center gap-2 bg-[#b90a0a] hover:bg-[#a00909] disabled:bg-gray-300 text-white font-extrabold py-2.5 px-4 rounded-md text-xs transition-colors shadow-xs cursor-pointer'
              >
                {checkingOut ? (
                  <Loader2 className='animate-spin size-4' />
                ) : (
                  <Check className='size-4 stroke-3' />
                )}
                Xác nhận & Thanh toán
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OVERLAY 1 - CHỌN TÀI KHOẢN NGÂN HÀNG NHẬN CHUYỂN KHOẢN */}
      {showAccountModal && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex items-center justify-between px-8 py-4 bg-[#fef2f2] border-b border-red-100'>
              <h3 className='text-[15px] font-bold text-gray-900 flex items-center gap-2'>
                <Utensils className='text-[#b90a0a] size-5' />
                Chọn tài khoản nhận tiền
              </h3>
              <button
                onClick={() => setShowAccountModal(false)}
                className='p-1 text-gray-400 hover:text-gray-700 transition-colors'
              >
                <X size={18} />
              </button>
            </div>

            <div className='p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto'>
              <div className='flex items-center justify-between'>
                <p className='text-xs text-gray-500 font-medium leading-relaxed'>
                  Chọn một trong các tài khoản ngân hàng dưới đây để sinh mã QR thanh toán động.
                </p>
                <button
                  type='button'
                  onClick={() => setShowInlineAddBank(!showInlineAddBank)}
                  className='text-xs text-[#b90a0a] font-bold hover:underline shrink-0 ml-2 cursor-pointer'
                >
                  {showInlineAddBank ? '← Danh sách STK' : '+ Thêm STK mới'}
                </button>
              </div>

              {showInlineAddBank ? (
                <form onSubmit={handleAddInlineBank} className='bg-slate-50 p-4 rounded-[12px] border border-slate-200 flex flex-col gap-3 text-xs'>
                  <h4 className='font-bold text-slate-800 text-[13px]'>Thêm tài khoản ngân hàng nhanh</h4>
                  <div>
                    <label className='font-bold text-slate-600 block mb-1'>Ngân hàng</label>
                    <select
                      value={inlineBankShortName}
                      onChange={e => {
                        const selected = BANK_OPTIONS.find(b => b.shortName === e.target.value)
                        if (selected) {
                          setInlineBankShortName(selected.shortName)
                          setInlineBankFullName(selected.fullName)
                        }
                      }}
                      className='w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-semibold outline-hidden focus:border-[#b90a0a]'
                    >
                      {BANK_OPTIONS.map(b => (
                        <option key={b.shortName} value={b.shortName}>
                          {b.shortName} - {b.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='font-bold text-slate-600 block mb-1'>Số tài khoản</label>
                    <input
                      type='text'
                      required
                      placeholder='Nhập số tài khoản...'
                      value={inlineAccountNumber}
                      onChange={e => setInlineAccountNumber(e.target.value.replace(/\s+/g, ''))}
                      className='w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-mono font-bold outline-hidden focus:border-[#b90a0a]'
                    />
                  </div>
                  <div>
                    <label className='font-bold text-slate-600 block mb-1'>Tên chủ tài khoản</label>
                    <input
                      type='text'
                      required
                      placeholder='Ví dụ: NGUYEN VAN A...'
                      value={inlineAccountName}
                      onChange={e => setInlineAccountName(e.target.value)}
                      className='w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs uppercase font-bold outline-hidden focus:border-[#b90a0a]'
                    />
                  </div>
                  <div className='flex justify-end gap-2 pt-2'>
                    <button
                      type='button'
                      onClick={() => setShowInlineAddBank(false)}
                      className='px-4 py-1.5 border border-slate-300 text-slate-600 rounded-md font-bold hover:bg-slate-100'
                    >
                      Hủy
                    </button>
                    <button
                      type='submit'
                      disabled={submittingInlineBank}
                      className='px-4 py-1.5 bg-[#b90a0a] hover:bg-[#a00909] text-white rounded-md font-bold flex items-center gap-1 shadow-xs'
                    >
                      {submittingInlineBank && <Loader2 size={12} className='animate-spin' />}
                      Lưu tài khoản
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {paymentAccounts.map(acc => (
                    <div
                      key={acc.paymentAccountId}
                      onClick={() => setSelectedAccount(acc)}
                      className={`border rounded-[12px] p-4 cursor-pointer transition-all flex items-center justify-between ${
                        selectedAccount?.paymentAccountId === acc.paymentAccountId
                          ? 'border-[#b90a0a] bg-red-50/50 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <div className='bg-[#ffd6d8] text-[#9b0000] size-9 rounded-[8px] flex items-center justify-center font-black text-xs'>
                          {acc.bankShortName}
                        </div>
                        <div>
                          <h4 className='font-bold text-slate-800 text-[13.5px]'>{acc.bankShortName}</h4>
                          <p className='text-slate-500 text-[11px] font-medium mt-0.5'>{acc.accountNumber} - {acc.accountName}</p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        {acc.sePayBankAccountXid && (
                          <span className='bg-blue-50 text-blue-600 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-blue-100 shadow-3xs'>
                            SePay Hub
                          </span>
                        )}
                        {acc.isDefault && (
                          <span className='bg-emerald-50 text-emerald-600 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-emerald-100'>
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {paymentAccounts.length === 0 && (
                    <div className='py-8 text-center bg-slate-50 rounded-[12px] border border-dashed border-slate-200 text-slate-400 text-xs font-semibold'>
                      Chưa có tài khoản ngân hàng nào. Bấm nút "+ Thêm STK mới" phía trên để tạo nhanh.
                    </div>
                  )}

                  {paymentAccounts.length > 0 && (
                    <p className='text-[11px] text-gray-400 font-semibold mt-3 text-center'>
                      Muốn tự động đối soát thanh toán? 
                      <a href='/business/bank-config' className='text-[#b90a0a] hover:underline ml-1 font-bold'>
                        Liên kết SePay Bank Hub
                      </a>
                    </p>
                  )}
                </>
              )}

              <div className='flex items-center justify-end gap-3 mt-2 pt-4 border-t border-gray-100 select-none'>
                <button
                  type='button'
                  onClick={() => {
                    setShowAccountModal(false)
                    setShowInlineAddBank(false)
                  }}
                  className='px-6 py-2 border border-gray-300 text-gray-600 text-[12px] font-bold rounded-[8px] hover:bg-gray-50 transition-colors'
                >
                  Hủy
                </button>
                <button
                  type='button'
                  onClick={() => {
                    if (selectedAccount) {
                      executeCheckout('Transfer', selectedAccount.paymentAccountId)
                    } else {
                      toast.error('Vui lòng chọn tài khoản ngân hàng.')
                    }
                  }}
                  className='px-6 py-2 bg-[#b90a0a] hover:bg-[#a00909] text-white text-[12px] font-bold rounded-[8px] transition-colors shadow-xs'
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 2 - CHỜ THANH TOÁN (VIETQR & SEPAY WEBHOOK) */}
      {showAwaitingOverlay && selectedAccount && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 p-6 flex flex-col items-center text-center'>
            <div className='w-full flex items-center justify-between pb-3 border-b border-gray-100 mb-4'>
              <h3 className='font-bold text-gray-800 text-[15px]'>Quét mã QR để Thanh toán</h3>
              <button
                onClick={() => {
                  setShowAwaitingOverlay(false)
                  toast.info('Đơn hàng vẫn đang ở trạng thái Chờ thanh toán.')
                }}
                className='p-1 text-gray-400 hover:text-gray-700 transition-colors'
              >
                <X size={18} />
              </button>
            </div>

            <div className='flex items-center justify-center gap-2 mb-2'>
              <Loader2 className='animate-spin text-[#004795] size-4' />
              <span className='text-xs font-bold text-slate-500'>Đang chờ nhận tiền...</span>
            </div>

            <h4 className='text-2xl font-black text-[#004795] font-mono mb-1'>
              {formatPrice(awaitingAmount)} VND
            </h4>
            <p className='text-xs text-gray-400 mb-4 font-semibold'>
              Mã đơn: <span className='font-bold text-slate-700'>{awaitingOrderCode}</span>
            </p>

            {/* DYNAMIC VIETQR IMAGE */}
            <div className='bg-white border-2 border-slate-100 p-2.5 rounded-[12px] shadow-xs mb-4 w-52 h-52 flex items-center justify-center'>
              <img
                src={`https://img.vietqr.io/image/${selectedAccount.bankShortName}-${selectedAccount.accountNumber}-compact2.png?amount=${awaitingAmount}&addInfo=${awaitingOrderCode}&accountName=${encodeURIComponent(selectedAccount.accountName)}`}
                alt='VietQR Payment Code'
                className='w-full h-full object-contain'
              />
            </div>

            <div className='bg-slate-50 rounded-[12px] p-3 border border-slate-100 text-left w-full text-xs space-y-1 mb-5 font-semibold text-slate-600'>
              <div className='flex justify-between'>
                <span>Ngân hàng:</span>
                <span className='font-bold text-slate-800'>{selectedAccount.bankShortName}</span>
              </div>
              <div className='flex justify-between'>
                <span>Số tài khoản:</span>
                <span className='font-bold text-slate-800 font-mono'>{selectedAccount.accountNumber}</span>
              </div>
              <div className='flex justify-between'>
                <span>Chủ tài khoản:</span>
                <span className='font-bold text-slate-800 uppercase'>{selectedAccount.accountName}</span>
              </div>
            </div>

            {/* SANDBOX CONTROLS */}
            <div className='w-full border-t border-gray-100 pt-4 flex flex-col gap-2.5'>
              <button
                type='button'
                onClick={handleSimulatePayment}
                disabled={simulatingSePay}
                className='w-full bg-[#FF8C00] hover:bg-[#e07b00] disabled:bg-gray-300 text-white py-2 rounded-md text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer'
              >
                {simulatingSePay ? (
                  <Loader2 className='animate-spin size-4' />
                ) : (
                  <PlayCircle size={16} />
                )}
                Giả lập SePay Sandbox Webhook
              </button>
              <button
                type='button'
                onClick={handleManualConfirm}
                className='w-full border border-[#b90a0a] text-[#b90a0a] hover:bg-[#ffebeb] py-2 rounded-md text-xs font-bold transition-all cursor-pointer'
              >
                Xác nhận đã nhận tiền (Thủ công)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY 3 - THANH TOÁN THÀNH CÔNG */}
      {showSuccessOverlay && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 p-6 flex flex-col items-center text-center'>
            <div className='bg-emerald-500 text-white size-16 rounded-full flex items-center justify-center mb-4 shadow-sm animate-bounce'>
              <Check size={36} className='stroke-3' />
            </div>
            
            <h3 className='text-emerald-600 text-xl font-extrabold mb-1 select-none'>Thanh toán thành công!</h3>
            <h4 className='text-3xl font-black text-slate-900 font-mono mb-4'>
              {formatPrice(successAmount)} đ
            </h4>

            <div className='bg-slate-50 rounded-[12px] p-4 border border-slate-100 text-left w-full text-xs space-y-2 mb-6 font-semibold text-slate-500'>
              <div className='flex justify-between'>
                <span>Mã đơn hàng:</span>
                <span className='font-bold text-slate-800'>{successOrderCode}</span>
              </div>
              {successInvoiceNumber && (
                <div className='flex justify-between'>
                  <span>Số hóa đơn bán lẻ:</span>
                  <span className='font-bold text-slate-800 font-mono'>{successInvoiceNumber}</span>
                </div>
              )}
              {successInvoiceStatus === 'Issued' && successTaxAuthorityCode && (
                <div className='flex justify-between'>
                  <span>Mã cơ quan thuế:</span>
                  <span className='font-bold text-blue-600 font-mono'>{successTaxAuthorityCode}</span>
                </div>
              )}
              {successInvoiceStatus && (
                <div className='flex justify-between'>
                  <span>Trạng thái HĐĐT:</span>
                  <span className={`font-bold ${successInvoiceStatus === 'Issued' ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {successInvoiceStatus === 'Issued' ? 'Đã phát hành hóa đơn đỏ' : 'Chờ xử lý'}
                  </span>
                </div>
              )}
              <div className='flex justify-between'>
                <span>Thời gian:</span>
                <span className='font-bold text-slate-800'>{new Date().toLocaleString('vi-VN')}</span>
              </div>
            </div>

            {/* Hóa đơn actions */}
            <div className='w-full flex flex-col gap-2.5 mb-6 select-none'>
              <div className='flex gap-3'>
                <button
                  onClick={handlePrint}
                  className='flex-1 border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs'
                >
                  <Printer size={15} />
                  In hóa đơn bán lẻ
                </button>
                {successInvoiceStatus === 'Issued' && successOfficialPdfUrl && (
                  <button
                    onClick={() => {
                      const pdfUrl = successOfficialPdfUrl.includes('mock.com.vn')
                        ? `${(http.defaults.baseURL || '').replace(/\/api$/, '')}/api/Invoice/${successInvoiceNumber}/pdf`
                        : successOfficialPdfUrl
                      window.open(pdfUrl, '_blank')
                    }}
                    className='flex-1 border-2 border-[#b90a0a] text-[#b90a0a] hover:bg-[#ffebeb] py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs'
                  >
                    <FileText size={15} />
                    Xem HĐ đỏ (PDF)
                  </button>
                )}
              </div>
              {successInvoiceStatus === 'Issued' && successOfficialXmlUrl && (
                <button
                  onClick={() => window.open(successOfficialXmlUrl, '_blank')}
                  className='w-full border-2 border-blue-200 hover:border-blue-300 text-blue-700 bg-blue-50/50 hover:bg-blue-50 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs'
                >
                  <Sparkles size={15} />
                  Tải tệp XML gốc hóa đơn đỏ
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setShowSuccessOverlay(false)
                setSuccessOfficialPdfUrl(null)
                setSuccessOfficialXmlUrl(null)
                setSuccessInvoiceStatus(null)
                setSuccessTaxAuthorityCode(null)
              }}
              className='w-full bg-[#b90a0a] hover:bg-[#a00909] text-white py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer shadow-xs select-none'
            >
              Đơn hàng mới
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY 4 - MODAL TẠO SẢN PHẨM NHANH */}
      {showQuickAddModal && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex items-center justify-between px-6 py-4 bg-[#fef2f2] border-b border-red-100'>
              <h3 className='text-[15px] font-bold text-gray-900 flex items-center gap-2'>
                <Utensils className='text-[#b90a0a] size-5' />
                Tạo nhanh sản phẩm mới
              </h3>
              <button
                type='button'
                onClick={() => setShowQuickAddModal(false)}
                className='p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer'
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickAddProduct} className='p-6 flex flex-col gap-4 text-xs'>
              <p className='text-gray-500 font-medium leading-relaxed'>
                Tạo nhanh sản phẩm mới vào danh mục và tự động thêm vào đơn hàng hiện tại.
              </p>

              <div>
                <label className='font-bold text-gray-700 block mb-1'>
                  Tên sản phẩm <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  required
                  placeholder='Ví dụ: Oishi Snack cay, Nước ngọt...'
                  value={quickName}
                  onChange={e => setQuickName(e.target.value)}
                  className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[13.5px] outline-hidden focus:border-[#b90a0a] font-semibold text-gray-800'
                />
              </div>

              <div>
                <label className='font-bold text-gray-700 block mb-1'>
                  Giá bán (VND) <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  required
                  placeholder='0'
                  value={quickPrice}
                  onChange={e => setQuickPrice(e.target.value)}
                  className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[13.5px] outline-hidden focus:border-[#b90a0a] font-mono font-bold text-gray-800'
                />
              </div>

              <div className='flex items-center justify-end gap-3 mt-3 pt-4 border-t border-gray-100 select-none'>
                <button
                  type='button'
                  onClick={() => setShowQuickAddModal(false)}
                  className='px-6 py-2 border border-gray-300 text-gray-600 text-[13px] font-bold rounded-[8px] hover:bg-gray-50 transition-colors cursor-pointer'
                  disabled={quickSubmitting}
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  disabled={quickSubmitting}
                  className='px-6 py-2 bg-[#b90a0a] hover:bg-[#a00909] text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer'
                >
                  {quickSubmitting && <Loader2 size={14} className='animate-spin' />}
                  Tạo & Thêm vào đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}