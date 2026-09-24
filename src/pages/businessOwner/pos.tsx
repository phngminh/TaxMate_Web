import { useState, useMemo, useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import {
  Search,
  Plus,
  X,
  Check,
  Utensils,
  Printer,
  Loader2,
  PlayCircle,
  RefreshCw,
  FileText,
  Sparkles,
  Building,
  Mail,
  MapPin,
  Hash,
  House,
  ClipboardList,
  Package,
  ArrowRight,
  RotateCcw,
  Trash2,
  Minus,
  ShoppingCart,
  User,
  QrCode,
  Edit3,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-toastify'
import http from '../../utils/http'
import { useBusiness } from '../../contexts/BusinessContext'
import { useAuth } from '../../contexts/AuthContext'
import { getAllProducts, createProduct } from '../../apis/product.api'
import { getProductCategories } from '../../apis/product.category.api'
import {
  createOrder,
  getOrders,
  getOrderById,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  reopenOrder,
  cancelOrder,
  cancelAllDrafts,
  checkoutOrder,
  confirmPayment
} from '../../apis/order.api'
import { getPaymentAccounts, createPaymentAccount, createSePayMockPayment } from '../../apis/paymentAccount.api'
import { getEInvoiceConfig } from '../../apis/einvoice.api'
import type { Product } from '../../types/product.type'
import type { ProductCategory } from '../../types/product.category.type'
import type { PaymentAccount } from '../../types/paymentAccount.type'
import type { Order } from '../../types/order.type'
import { useNavigate } from 'react-router-dom'
import path from '../../constants/path'

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

export interface POSTab {
  tabId: string // e.g. "T-1", "T-2"
  orderId: string | null // Backend Guid transactionId, null if local draft
  code: string // Backend transactionCode or "Đơn 1"
  items: any[]
  totalAmount: number
  status: string
  isPersisted: boolean
}

export default function POS() {
  const { currentBusiness } = useBusiness()
  const businessId = currentBusiness?.id
  const { user } = useAuth()
  const navigate = useNavigate()

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

  // Resizable Splitter state (persisted in localStorage, min 35%, max 75%)
  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pos_layout_left_width')
      if (saved) {
        const parsed = parseFloat(saved)
        if (!isNaN(parsed) && parsed >= 35 && parsed <= 75) return parsed
      }
    } catch {}
    return 58
  })
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Tab scroll & drag state
  const tabBarRef = useRef<HTMLDivElement>(null)
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null)
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null)

  // Open Orders Drawer state
  const [showOpenOrdersPanel, setShowOpenOrdersPanel] = useState(false)
  const [openDraftOrders, setOpenDraftOrders] = useState<Order[]>([])
  const [loadingOpenOrders, setLoadingOpenOrders] = useState(false)
  const [openDraftCount, setOpenDraftCount] = useState(0)
  const [showConfirmCancelAll, setShowConfirmCancelAll] = useState(false)
  const [cancellingAll, setCancellingAll] = useState(false)

  // Mutex lock to prevent duplicate order creation on rapid clicks
  const creatingDraftTabIdsRef = useRef<Set<string>>(new Set())

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash')
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
  const [quickProductCode, setQuickProductCode] = useState('')
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

  // Confirm Reopen / Edit Order State
  const [showConfirmReopenModal, setShowConfirmReopenModal] = useState(false)
  const [targetReopenOrderId, setTargetReopenOrderId] = useState<string | null>(null)
  const [reopeningOrder, setReopeningOrder] = useState(false)

  // Confirm Cancel Order State
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false)
  const [targetCancelOrderId, setTargetCancelOrderId] = useState<string | null>(null)
  const [cancellingOrder, setCancellingOrder] = useState(false)

  // Flag to prevent concurrent initialization in StrictMode
  const isInitializingRef = useRef(false)

  // Debounced quantity updates map (itemId -> { timer, targetQty, orderId, tabId })
  const debouncedQuantityUpdatesRef = useRef<
    Map<
      string,
      {
        timer: ReturnType<typeof setTimeout>
        targetQty: number
        orderId: string
        tabId: string
      }
    >
  >(new Map())

  // Flush any pending debounced updates immediately (used before checkout or closing tabs)
  const flushPendingQuantityUpdates = async () => {
    const pendingList = Array.from(debouncedQuantityUpdatesRef.current.entries())
    if (pendingList.length === 0) return

    debouncedQuantityUpdatesRef.current.clear()
    const promises = pendingList.map(([itemId, pending]) => {
      clearTimeout(pending.timer)
      if (pending.targetQty <= 0) {
        return removeOrderItem(pending.orderId, itemId)
      } else {
        return updateOrderItem(pending.orderId, itemId, { quantity: pending.targetQty })
      }
    })

    await Promise.allSettled(promises)
  }

  // Helper to sync active order IDs to sessionStorage
  const updateSessionTabs = (tabList: POSTab[]) => {
    if (!businessId) return
    const persistedOrderIds = tabList
      .map(t => t.orderId)
      .filter((id): id is string => Boolean(id))
    if (persistedOrderIds.length > 0) {
      sessionStorage.setItem('pos_active_tabs_' + businessId, JSON.stringify(persistedOrderIds))
    } else {
      sessionStorage.removeItem('pos_active_tabs_' + businessId)
    }
  }

  // Format relative time helper
  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const utcDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`
      const date = new Date(utcDateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffSec = Math.floor(diffMs / 1000)
      const diffMin = Math.floor(diffSec / 60)
      const diffHours = Math.floor(diffMin / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMin < 1) return 'Vừa xong'
      if (diffMin < 60) return `${diffMin} phút trước`
      if (diffHours < 24) return `${diffHours} giờ trước`
      if (diffDays < 7) return `${diffDays} ngày trước`
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    } catch {
      return ''
    }
  }

  // Fetch open drafts count for header badge (bao gồm Draft và AwaitingPayment song song trực tiếp từ DB)
  const fetchOpenDraftCount = async () => {
    if (!businessId) return
    try {
      const [draftsRes, awaitingRes] = await Promise.all([
        getOrders(businessId, { status: 'Draft', pageSize: 50 }),
        getOrders(businessId, { status: 'AwaitingPayment', pageSize: 50 })
      ])
      const drafts = draftsRes.success && draftsRes.data?.items ? draftsRes.data.items : []
      const awaiting = awaitingRes.success && awaitingRes.data?.items ? awaitingRes.data.items : []
      const combined = [...drafts, ...awaiting].filter(o => o.itemCount > 0)
      setOpenDraftCount(combined.length)
    } catch (err) {
      console.error('Failed to fetch open draft count:', err)
    }
  }

  // Fetch open drafts list for drawer (bao gồm Draft và AwaitingPayment song song trực tiếp từ DB)
  const fetchOpenDraftOrders = async () => {
    if (!businessId) return
    try {
      setLoadingOpenOrders(true)
      const [draftsRes, awaitingRes] = await Promise.all([
        getOrders(businessId, { status: 'Draft', pageSize: 50 }),
        getOrders(businessId, { status: 'AwaitingPayment', pageSize: 50 })
      ])
      const drafts = draftsRes.success && draftsRes.data?.items ? draftsRes.data.items : []
      const awaiting = awaitingRes.success && awaitingRes.data?.items ? awaitingRes.data.items : []
      const combined = [...drafts, ...awaiting].filter(o => o.itemCount > 0)
      setOpenDraftOrders(combined)
      setOpenDraftCount(combined.length)
    } catch (err) {
      console.error('Failed to fetch open draft orders:', err)
      toast.error('Không thể tải danh sách đơn chờ.')
    } finally {
      setLoadingOpenOrders(false)
    }
  }

  // Resume draft order into POS tab
  const handleResumeDraftOrder = async (order: Order) => {
    const existingTab = tabs.find(t => t.orderId === order.transactionId)
    if (existingTab) {
      setActiveTabId(existingTab.tabId)
      setShowOpenOrdersPanel(false)
      toast.info(`Đơn ${order.transactionCode} đang mở tại tab ${existingTab.tabId}`)
      return
    }

    try {
      setLoadingCart(true)
      const detail = await getOrderById(order.transactionId)
      if (!detail.success || !detail.data) return

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
      const resumedTab: POSTab = {
        tabId: newTabId,
        orderId: detail.data.transactionId,
        code: detail.data.transactionCode,
        items: detail.data.items || [],
        totalAmount: detail.data.totalAmount,
        status: detail.data.status,
        isPersisted: true
      }

      let updatedTabs: POSTab[] = []
      if (tabs.length === 1 && !tabs[0].isPersisted && tabs[0].items.length === 0) {
        resumedTab.tabId = 'T-1'
        updatedTabs = [resumedTab]
      } else {
        updatedTabs = [...tabs, resumedTab]
      }

      if (detail.data.status === 'AwaitingPayment') {
        const transferPayment = detail.data.payments?.find(p => p.paymentMethod === 'Transfer' && p.paymentAccountId)
        if (transferPayment?.paymentAccountId) {
          const matchedAcc = paymentAccounts.find(
            a => a.paymentAccountId.toLowerCase() === transferPayment.paymentAccountId!.toLowerCase()
          )
          if (matchedAcc) {
            setSelectedAccount(matchedAcc)
          }
        }
      }

      setTabs(updatedTabs)
      setActiveTabId(resumedTab.tabId)
      updateSessionTabs(updatedTabs)
      setShowOpenOrdersPanel(false)
      toast.success(`Đã mở lại đơn ${order.transactionCode}`)
    } catch (err) {
      console.error('Resume draft order failed:', err)
      toast.error('Không thể mở lại đơn hàng.')
    } finally {
      setLoadingCart(false)
    }
  }

  // Cancel draft directly from drawer
  const handleCancelDraftFromPanel = async (orderId: string) => {
    try {
      await cancelOrder(orderId)
      toast.success('Đã hủy đơn nháp thành công.')
      const remaining = tabs.filter(t => t.orderId !== orderId)
      if (remaining.length !== tabs.length) {
        if (remaining.length === 0) {
          const resetTab: POSTab = {
            tabId: 'T-1',
            orderId: null,
            code: 'Đơn 1',
            items: [],
            totalAmount: 0,
            status: 'Draft',
            isPersisted: false
          }
          setTabs([resetTab])
          setActiveTabId('T-1')
          updateSessionTabs([])
        } else {
          setTabs(remaining)
          updateSessionTabs(remaining)
          if (!remaining.some(t => t.tabId === activeTabId)) {
            setActiveTabId(remaining[0].tabId)
          }
        }
      }
      fetchOpenDraftOrders()
    } catch (err) {
      console.error('Cancel draft failed:', err)
      toast.error('Hủy đơn hàng nháp thất bại.')
    }
  }

  // Cancel all drafts (chỉ xóa tab Draft, giữ nguyên tab và đơn AwaitingPayment)
  const handleCancelAllDrafts = async () => {
    if (!businessId) return
    try {
      setCancellingAll(true)
      await cancelAllDrafts(businessId)
      toast.success('Đã hủy tất cả đơn nháp thành công.')

      // Giữ lại các tab AwaitingPayment
      const awaitingTabs = tabs.filter(t => t.status === 'AwaitingPayment')
      if (awaitingTabs.length > 0) {
        setTabs(awaitingTabs)
        setActiveTabId(awaitingTabs[0].tabId)
        updateSessionTabs(awaitingTabs)
      } else {
        const resetTab: POSTab = {
          tabId: 'T-1',
          orderId: null,
          code: 'Đơn 1',
          items: [],
          totalAmount: 0,
          status: 'Draft',
          isPersisted: false
        }
        setTabs([resetTab])
        setActiveTabId('T-1')
        updateSessionTabs([])
      }

      setShowConfirmCancelAll(false)
      setShowOpenOrdersPanel(false)
      fetchOpenDraftOrders()
      fetchOpenDraftCount()
    } catch (err: any) {
      console.error('Cancel all drafts failed:', err)
      toast.error(err?.response?.data?.message || 'Không thể hủy danh sách đơn nháp.')
    } finally {
      setCancellingAll(false)
    }
  }

  // Helper to extract full initials (e.g. "Nguyễn Văn An" -> "NVA")
  const getUserInitials = (name?: string) => {
    if (!name?.trim()) return 'NV'
    const words = name.trim().split(/\s+/)
    return words.map(w => w[0]?.toUpperCase()).join('').slice(0, 4)
  }

  // Splitter dragging listener
  const handleSplitterPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    setIsDraggingSplitter(true)
  }

  useEffect(() => {
    if (!isDraggingSplitter) return

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newPercent = ((e.clientX - rect.left) / rect.width) * 100
      const clamped = Math.min(Math.max(newPercent, 35), 75)
      setLeftWidthPercent(clamped)
    }

    const handlePointerUp = () => {
      setIsDraggingSplitter(false)
      try {
        localStorage.setItem('pos_layout_left_width', leftWidthPercent.toString())
      } catch {}
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDraggingSplitter, leftWidthPercent])

  // Tab horizontal wheel scroll handler
  const handleTabBarWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (tabBarRef.current) {
      tabBarRef.current.scrollLeft += e.deltaY + e.deltaX
    }
  }

  // Tab Drag and Drop handlers
  const handleTabDragStart = (tabId: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', tabId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedTabId(tabId)
  }

  const handleTabDragOver = (tabId: string, e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverTabId !== tabId) {
      setDragOverTabId(tabId)
    }
  }

  const handleTabDrop = (targetTabId: string, e: React.DragEvent) => {
    e.preventDefault()
    const sourceTabId = e.dataTransfer.getData('text/plain') || draggedTabId
    if (!sourceTabId || sourceTabId === targetTabId) {
      setDraggedTabId(null)
      setDragOverTabId(null)
      return
    }

    setTabs(prevTabs => {
      const fromIndex = prevTabs.findIndex(t => t.tabId === sourceTabId)
      const toIndex = prevTabs.findIndex(t => t.tabId === targetTabId)
      if (fromIndex === -1 || toIndex === -1) return prevTabs

      const reordered = [...prevTabs]
      const [movedTab] = reordered.splice(fromIndex, 1)
      reordered.splice(toIndex, 0, movedTab)
      updateSessionTabs(reordered)
      return reordered
    })

    setDraggedTabId(null)
    setDragOverTabId(null)
  }

  const handleTabDragEnd = () => {
    setDraggedTabId(null)
    setDragOverTabId(null)
  }

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

      // 2. Tab Initialization & Multi-Tab Session Recovery
      if (tabs.length === 0 && !isInitializingRef.current) {
        isInitializingRef.current = true

        // A. Check for URL resumeOrderId (transferred from Order history)
        const searchParams = new URLSearchParams(window.location.search)
        const resumeOrderId = searchParams.get('resumeOrderId')

        if (resumeOrderId) {
          try {
            const detailRes = await getOrderById(resumeOrderId)
            if (detailRes.success && detailRes.data && (detailRes.data.status === 'Draft' || detailRes.data.status === 'AwaitingPayment')) {
              const draft = detailRes.data
              const resumedTab: POSTab = {
                tabId: 'T-1',
                orderId: draft.transactionId,
                code: draft.transactionCode,
                items: draft.items || [],
                totalAmount: draft.totalAmount,
                status: draft.status,
                isPersisted: true
              }
              setTabs([resumedTab])
              setActiveTabId('T-1')
              updateSessionTabs([resumedTab])
              fetchOpenDraftCount()
              isInitializingRef.current = false
              return
            }
          } catch (err) {
            console.error('Failed to resume order from url:', err)
          }
        }

        // B. Check sessionStorage for multi-tab recovery
        let savedOrderIds: string[] = []
        try {
          const savedTabsJson = sessionStorage.getItem('pos_active_tabs_' + businessId)
          if (savedTabsJson) savedOrderIds = JSON.parse(savedTabsJson)
        } catch {
          savedOrderIds = []
        }

        // Fallback for single session key
        if (savedOrderIds.length === 0) {
          const legacyId = sessionStorage.getItem('pos_active_order_' + businessId)
          if (legacyId) savedOrderIds = [legacyId]
        }

        if (savedOrderIds.length > 0) {
          try {
            const results = await Promise.allSettled(savedOrderIds.map(id => getOrderById(id)))
            const validTabs: POSTab[] = []
            let tabIndex = 1

            for (const res of results) {
              if (res.status === 'fulfilled' && res.value.success && res.value.data && (res.value.data.status === 'Draft' || res.value.data.status === 'AwaitingPayment')) {
                const order = res.value.data
                validTabs.push({
                  tabId: `T-${tabIndex++}`,
                  orderId: order.transactionId,
                  code: order.transactionCode,
                  items: order.items || [],
                  totalAmount: order.totalAmount,
                  status: order.status,
                  isPersisted: true
                })
              }
            }

            if (validTabs.length > 0) {
              setTabs(validTabs)
              setActiveTabId(validTabs[0].tabId)
              updateSessionTabs(validTabs)
              fetchOpenDraftCount()
              isInitializingRef.current = false
              return
            }
          } catch (err) {
            console.error('Session recovery failed:', err)
          }
        }

        // C. LAZY DRAFT: Create 1 single empty local tab without calling backend API
        const defaultLocalTab: POSTab = {
          tabId: 'T-1',
          orderId: null,
          code: 'Đơn 1',
          items: [],
          totalAmount: 0,
          status: 'Draft',
          isPersisted: false
        }
        setTabs([defaultLocalTab])
        setActiveTabId('T-1')
        fetchOpenDraftCount()
        isInitializingRef.current = false
      }
    } catch (err) {
      console.error(err)
      toast.error('Không thể tải dữ liệu bán hàng.')
    } finally {
      setLoadingPOS(false)
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

  let disposed = false
  let handled = false
  let checking = false
  let pollTimer: ReturnType<typeof window.setInterval> | undefined

  const finishPayment = async () => {
    if (disposed || handled || checking) return

    checking = true
    try {
      const detail = await getOrderById(awaitingOrderId)

      // Chưa thanh toán xong thì lần polling sau kiểm tra tiếp
      if (
        disposed ||
        !detail.success ||
        !detail.data ||
        detail.data.status !== 'Completed'
      ) {
        return
      }

      handled = true

      if (pollTimer) {
        window.clearInterval(pollTimer)
      }

      void connection.stop().catch(() => undefined)

      setShowAwaitingOverlay(false)
      setSuccessOrderCode(detail.data.transactionCode || awaitingOrderCode)
      setSuccessAmount(detail.data.totalAmount || awaitingAmount)
      setSuccessInvoiceNumber(detail.data.invoiceNumber || null)
      setSuccessOfficialPdfUrl(detail.data.officialPdfUrl || null)
      setSuccessOfficialXmlUrl(detail.data.officialXmlUrl || null)
      setSuccessInvoiceStatus(detail.data.invoiceStatus || null)
      setSuccessTaxAuthorityCode(detail.data.taxAuthorityCode || null)
      setShowSuccessOverlay(true)

      const completedTab = tabs.find(t => t.orderId === awaitingOrderId)
      if (completedTab) {
        await removeFinishedTab(completedTab.tabId)
      }
    } catch (err) {
      // Không đóng polling khi API lỗi tạm thời
      console.warn('[Payment Polling] Failed to check order:', err)
    } finally {
      checking = false
    }
  }

  connection.on('PaymentConfirmed', (transactionId: string) => {
    if (transactionId === awaitingOrderId) {
      console.log('[SignalR Web] Payment confirmed:', transactionId)
      void finishPayment()
    }
  })

  const startConnection = async () => {
    try {
      await connection.start()

      if (disposed) {
        await connection.stop()
        return
      }

      console.log(
        '[SignalR Web] Connected, joining order group:',
        awaitingOrderId
      )

      await connection.invoke('JoinOrderGroup', awaitingOrderId)
    } catch (err) {
      // Polling bên dưới vẫn tiếp tục hoạt động dù SignalR lỗi
      console.warn('[SignalR Web] Connection failed:', err)
    }
  }

  void startConnection()

  // Kiểm tra ngay và tiếp tục mỗi 2 giây
  void finishPayment()
  pollTimer = window.setInterval(() => {
    void finishPayment()
  }, 2000)

  return () => {
    disposed = true

    if (pollTimer) {
      window.clearInterval(pollTimer)
    }

    void connection.stop().catch(() => undefined)
  }
}, [showAwaitingOverlay, awaitingOrderId])

  // Get active tab object
  const activeTab = useMemo(() => {
    return tabs.find(t => t.tabId === activeTabId) || null
  }, [tabs, activeTabId])

  // Sync active tab cart details from backend
  const syncActiveTabDetails = async (tabId: string, orderId: string, showLoading = false) => {
    try {
      if (showLoading) setLoadingCart(true)
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
      if (showLoading) setLoadingCart(false)
    }
  }

  // 2. Add product to cart (Lazy Backend Order Creation & Optimistic UI)
  const handleAddProductToCart = async (product: Product) => {
    if (!activeTab || !businessId) return
    const tabId = activeTab.tabId

    try {
      // A. Tab is NOT persisted yet -> create draft on backend first
      if (!activeTab.isPersisted || !activeTab.orderId) {
        if (creatingDraftTabIdsRef.current.has(tabId)) return
        creatingDraftTabIdsRef.current.add(tabId)

        try {
          setLoadingCart(true)
          const orderRes = await createOrder(businessId, { note: '' })
          const newOrderId = orderRes.data
          await addOrderItem(newOrderId, {
            productId: product.id,
            quantity: 1
          })
          const detail = await getOrderById(newOrderId)

          const updatedTabs = tabs.map(t =>
            t.tabId === tabId
              ? {
                  ...t,
                  orderId: newOrderId,
                  code: detail.data.transactionCode,
                  items: detail.data.items || [],
                  totalAmount: detail.data.totalAmount,
                  status: detail.data.status,
                  isPersisted: true
                }
              : t
          )

          setTabs(updatedTabs)
          updateSessionTabs(updatedTabs)
          fetchOpenDraftCount()
        } finally {
          setLoadingCart(false)
          creatingDraftTabIdsRef.current.delete(tabId)
        }
        return
      }

      // B. Tab is already persisted -> Optimistic UI update & Debounce
      const existing = activeTab.items.find(x => x.productId === product.id)
      if (existing) {
        handleUpdateQuantity(existing.transactionItemId, existing.quantity, 1)
        return
      }

      const orderId = activeTab.orderId
      await addOrderItem(orderId, {
        productId: product.id,
        quantity: 1
      })
      await syncActiveTabDetails(tabId, orderId, false)
      fetchOpenDraftCount()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể thêm sản phẩm.')
      if (activeTab.orderId) {
        await syncActiveTabDetails(tabId, activeTab.orderId, false)
      }
    }
  }

  // 3. Update item quantity (+ / -) with Debounced Backend Sync (0ms latency, zero race condition)
  const handleUpdateQuantity = (itemId: string, currentQty: number, delta: number) => {
    if (!activeTab || !activeTab.orderId) return
    const orderId = activeTab.orderId
    const tabId = activeTab.tabId

    // Check if there is already a pending target quantity for this item
    const existingPending = debouncedQuantityUpdatesRef.current.get(itemId)
    const baseQty = existingPending ? existingPending.targetQty : currentQty
    const targetQty = baseQty + delta

    // 1. Optimistic UI update immediately (0ms delay)
    setTabs(prev =>
      prev.map(t => {
        if (t.tabId !== tabId) return t
        let nextItems = [...t.items]
        if (targetQty <= 0) {
          nextItems = nextItems.filter(item => item.transactionItemId !== itemId)
        } else {
          nextItems = nextItems.map(item =>
            item.transactionItemId === itemId
              ? {
                  ...item,
                  quantity: targetQty,
                  lineTotal: targetQty * item.unitPrice
                }
              : item
          )
        }
        const nextTotal = nextItems.reduce((acc, curr) => acc + curr.lineTotal, 0)
        return {
          ...t,
          items: nextItems,
          totalAmount: nextTotal
        }
      })
    )

    // 2. Clear any existing timer for this item
    if (existingPending) {
      clearTimeout(existingPending.timer)
    }

    // 3. Schedule debounced API call (300ms)
    const timer = setTimeout(async () => {
      debouncedQuantityUpdatesRef.current.delete(itemId)
      try {
        if (targetQty <= 0) {
          await removeOrderItem(orderId, itemId)
        } else {
          await updateOrderItem(orderId, itemId, {
            quantity: targetQty
          })
        }
        // Only sync from backend if no newer clicks are pending in flight
        if (debouncedQuantityUpdatesRef.current.size === 0) {
          await syncActiveTabDetails(tabId, orderId, false)
          fetchOpenDraftCount()
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Cập nhật số lượng thất bại.')
        await syncActiveTabDetails(tabId, orderId, false)
      }
    }, 300)

    debouncedQuantityUpdatesRef.current.set(itemId, {
      timer,
      targetQty,
      orderId,
      tabId
    })
  }

  // 3.1. Direct Remove item from cart with Optimistic UI
  const handleRemoveItem = async (itemId: string) => {
    if (!activeTab || !activeTab.orderId) return
    const orderId = activeTab.orderId
    const tabId = activeTab.tabId

    // Clear any pending debounced timer for this item
    const existingPending = debouncedQuantityUpdatesRef.current.get(itemId)
    if (existingPending) {
      clearTimeout(existingPending.timer)
      debouncedQuantityUpdatesRef.current.delete(itemId)
    }

    // 1. Optimistic remove immediately
    setTabs(prev =>
      prev.map(t => {
        if (t.tabId !== tabId) return t
        const nextItems = t.items.filter(item => item.transactionItemId !== itemId)
        const nextTotal = nextItems.reduce((acc, curr) => acc + curr.lineTotal, 0)
        return {
          ...t,
          items: nextItems,
          totalAmount: nextTotal
        }
      })
    )

    // 2. Call backend in background
    try {
      await removeOrderItem(orderId, itemId)
      if (debouncedQuantityUpdatesRef.current.size === 0) {
        await syncActiveTabDetails(tabId, orderId, false)
        fetchOpenDraftCount()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xóa món thất bại.')
      await syncActiveTabDetails(tabId, orderId, false)
    }
  }

  // 4. Create new tab (Lazy Tab Creation)
  const handleAddTab = () => {
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
    const newTab: POSTab = {
      tabId: newTabId,
      orderId: null,
      code: `Đơn ${nextIndex}`,
      items: [],
      totalAmount: 0,
      status: 'Draft',
      isPersisted: false
    }

    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTabId)
  }

  // 5. Close a tab
  const handleCloseOrder = async (tabId: string, orderId: string | null, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!businessId) return
    await flushPendingQuantityUpdates()

    try {
      if (orderId) {
        await cancelOrder(orderId)
      }

      if (tabs.length === 1) {
        const resetTab: POSTab = {
          tabId: 'T-1',
          orderId: null,
          code: 'Đơn 1',
          items: [],
          totalAmount: 0,
          status: 'Draft',
          isPersisted: false
        }
        setTabs([resetTab])
        setActiveTabId('T-1')
        updateSessionTabs([])
        fetchOpenDraftCount()
        return
      }

      const remaining = tabs.filter(t => t.tabId !== tabId)
      setTabs(remaining)
      updateSessionTabs(remaining)
      fetchOpenDraftCount()
      if (activeTabId === tabId) {
        setActiveTabId(remaining[0].tabId)
        if (remaining[0].orderId) {
          syncActiveTabDetails(remaining[0].tabId, remaining[0].orderId)
        }
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
        productCode: quickProductCode.trim(),
        name: quickName.trim(),
        currentPrice: priceNum
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
    await flushPendingQuantityUpdates()
    if (!activeTab || activeTab.items.length === 0) {
      toast.error('Giỏ hàng trống. Vui lòng thêm sản phẩm.')
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
      // Cash checkout completes directly.
      await executeCheckout(paymentMethod, null)
    }
  }

  const executeCheckout = async (method: 'Cash' | 'Transfer', bankAccountId: string | null) => {
    if (!activeTab || !businessId || !activeTab.orderId) return
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
        // Kiểm tra xem tài khoản ngân hàng có liên kết SePay (QR động) hay không
        const isDynamicQR =
          method === 'Transfer' &&
          selectedAccount &&
          (selectedAccount.isSePayConnected || !!selectedAccount.sePayBankAccountXid)
        if (isDynamicQR) {
          // Cập nhật tab sang trạng thái AwaitingPayment
          const updatedTabs = tabs.map(t =>
            t.tabId === tabId ? { ...t, status: 'AwaitingPayment' } : t
          )
          setTabs(updatedTabs)
          updateSessionTabs(updatedTabs)
          fetchOpenDraftCount()

          // Nếu là QR động (SePay): Mở overlay "Đang chờ nhận tiền..." và chờ SignalR đối soát tự động
          setAwaitingOrderId(orderId)
          setAwaitingOrderCode(activeTab.code)
          setAwaitingAmount(activeTab.totalAmount)
          setShowAwaitingOverlay(true)
          setShowAccountModal(false)
        } else {
          // Tiền mặt, Thẻ, hoặc QR tĩnh (không SePay): Hoàn tất đơn lập tức
          const detail = await getOrderById(orderId)
          setSuccessOrderCode(activeTab.code)
          setSuccessAmount(activeTab.totalAmount)
          setSuccessInvoiceNumber(detail.data?.invoiceNumber || null)
          setSuccessOfficialPdfUrl(detail.data?.officialPdfUrl || null)
          setSuccessOfficialXmlUrl(detail.data?.officialXmlUrl || null)
          setSuccessInvoiceStatus(detail.data?.invoiceStatus || null)
          setSuccessTaxAuthorityCode(detail.data?.taxAuthorityCode || null)
          setShowSuccessOverlay(true)
          setShowAccountModal(false)
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
      updateSessionTabs(remaining)
      if (remaining[0].orderId) {
        syncActiveTabDetails(remaining[0].tabId, remaining[0].orderId)
      }
    } else {
      const resetTab: POSTab = {
        tabId: 'T-1',
        orderId: null,
        code: 'Đơn 1',
        items: [],
        totalAmount: 0,
        status: 'Draft',
        isPersisted: false
      }
      setTabs([resetTab])
      setActiveTabId('T-1')
      updateSessionTabs([])
    }
    fetchOpenDraftCount()
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

  const handleManualConfirm = async (customOrderId?: string) => {
    const orderIdToConfirm = customOrderId || awaitingOrderId || activeTab?.orderId
    if (!orderIdToConfirm) return
    try {
      setCheckingOut(true)
      const res = await confirmPayment(orderIdToConfirm)
      if (res.success) {
        toast.success('Xác nhận thanh toán thủ công thành công!')
        setShowAwaitingOverlay(false)

        // Đợi 300ms để backend tạo hóa đơn điện tử
        await delay(400)

        const detail = await getOrderById(orderIdToConfirm)
        setSuccessOrderCode(detail.data?.transactionCode || awaitingOrderCode || activeTab?.code || '')
        setSuccessAmount(detail.data?.totalAmount || awaitingAmount || activeTab?.totalAmount || 0)
        setSuccessInvoiceNumber(detail.data?.invoiceNumber || null)
        setSuccessOfficialPdfUrl(detail.data?.officialPdfUrl || null)
        setSuccessOfficialXmlUrl(detail.data?.officialXmlUrl || null)
        setSuccessInvoiceStatus(detail.data?.invoiceStatus || null)
        setSuccessTaxAuthorityCode(detail.data?.taxAuthorityCode || null)
        setShowSuccessOverlay(true)

        const targetTab = tabs.find(t => t.orderId === orderIdToConfirm)
        if (targetTab) {
          await removeFinishedTab(targetTab.tabId)
        } else if (activeTab) {
          await removeFinishedTab(activeTab.tabId)
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xác nhận thất bại.')
    } finally {
      setCheckingOut(false)
    }
  }

  // 9. Thao tác xử lý Đơn AwaitingPayment (Tiếp tục, Chỉnh sửa, Hủy)
  const handleContinuePayment = async (orderId: string, code: string, amount: number) => {
    let matchedAcc: PaymentAccount | null = null
    try {
      const detail = await getOrderById(orderId)
      if (detail.success && detail.data) {
        const transferPayment = detail.data.payments?.find(p => p.paymentMethod === 'Transfer' && p.paymentAccountId)
        if (transferPayment?.paymentAccountId) {
          matchedAcc =
            paymentAccounts.find(
              a => a.paymentAccountId.toLowerCase() === transferPayment.paymentAccountId!.toLowerCase()
            ) || null
        }
      }
    } catch (err) {
      console.error('Failed to load order payment account for QR:', err)
    }

    if (!matchedAcc) {
      toast.error('Không tìm thấy tài khoản ngân hàng đã dùng cho đơn này. Vui lòng chỉnh sửa hoặc hủy đơn.')
      return
    }

    setSelectedAccount(matchedAcc)
    setAwaitingOrderId(orderId)
    setAwaitingOrderCode(code)
    setAwaitingAmount(amount)
    setShowAwaitingOverlay(true)
  }

  const triggerReopenOrder = (orderId: string) => {
    setTargetReopenOrderId(orderId)
    setShowConfirmReopenModal(true)
  }

  const handleConfirmReopenOrder = async () => {
    if (!targetReopenOrderId) return
    try {
      setReopeningOrder(true)
      const res = await reopenOrder(targetReopenOrderId)
      if (res.success) {
        toast.success('Đã chuyển đơn về nháp để chỉnh sửa.')
        setShowConfirmReopenModal(false)
        setShowAwaitingOverlay(false)

        const updatedTabs = tabs.map(t =>
          t.orderId === targetReopenOrderId ? { ...t, status: 'Draft' } : t
        )
        setTabs(updatedTabs)
        updateSessionTabs(updatedTabs)
        fetchOpenDraftCount()
        fetchOpenDraftOrders()
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error('Đơn hàng đã được thanh toán qua ngân hàng, không thể chỉnh sửa.')
        setShowConfirmReopenModal(false)
        setShowAwaitingOverlay(false)
        fetchOpenDraftOrders()
        fetchOpenDraftCount()
      } else {
        toast.error(err?.response?.data?.message || 'Chuyển đơn về nháp thất bại.')
      }
    } finally {
      setReopeningOrder(false)
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
        setShowAwaitingOverlay(false)

        const targetTab = tabs.find(t => t.orderId === targetCancelOrderId)
        if (targetTab) {
          await removeFinishedTab(targetTab.tabId)
        }
        fetchOpenDraftOrders()
        fetchOpenDraftCount()
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error('Đơn hàng đã được thanh toán qua ngân hàng, không thể hủy.')
        setShowConfirmCancelModal(false)
        setShowAwaitingOverlay(false)
        fetchOpenDraftOrders()
        fetchOpenDraftCount()
      } else {
        toast.error(err?.response?.data?.message || 'Hủy đơn hàng thất bại.')
      }
    } finally {
      setCancellingOrder(false)
    }
  }

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        selectedCategoryId === 'all' || p.productCategoryId === selectedCategoryId
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategoryId])

  // Count of purely 'Draft' orders for bulk cancellation
  const draftOrderCount = useMemo(
    () => openDraftOrders.filter(o => o.status === 'Draft').length,
    [openDraftOrders]
  )

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
    <div
      ref={containerRef}
      className={`flex bg-[#004795] p-3 gap-2 h-screen w-full text-slate-800 overflow-hidden relative ${
        isDraggingSplitter ? 'select-none cursor-col-resize' : ''
      }`}
    >
      {/* CỘT TRÁI - DANH SÁCH SẢN PHẨM */}
      <div
        style={{ width: `${leftWidthPercent}%` }}
        className='flex flex-col bg-white rounded-md overflow-hidden shadow-md h-full shrink-0'
      >
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
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                selectedCategoryId === cat.id
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
          <div className='p-4 grow overflow-y-auto min-h-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 content-start'>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => handleAddProductToCart(product)}
                className='border border-slate-200/90 rounded-xl cursor-pointer shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col p-2.5 bg-white group select-none relative'
              >
                <div className='bg-[#ffebeb] w-full aspect-square rounded-lg flex items-center justify-center mb-2 group-hover:scale-102 transition-transform duration-200 shrink-0 overflow-hidden'>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className='w-full h-full object-cover' />
                  ) : (
                    <Utensils className='text-[#b90a0a] size-7 stroke-[1.5]' />
                  )}
                </div>
                <div className='text-[12px] font-semibold text-slate-700 mb-1 line-clamp-2 min-h-8 text-center leading-snug flex items-center justify-center'>
                  {product.name}
                </div>
                <div className='text-[12.5px] font-black text-slate-900 text-center mt-auto'>
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

      {/* RESIZABLE SPLITTER DIVIDER */}
      <div
        onPointerDown={handleSplitterPointerDown}
        className={`w-2 -mx-1 shrink-0 flex items-center justify-center cursor-col-resize select-none z-20 group transition-colors duration-150 ${
          isDraggingSplitter ? 'bg-white/40' : 'hover:bg-white/20'
        }`}
        title='Kéo sang trái / phải để điều chỉnh kích thước 2 bên'
      >
        <div
          className={`w-1 rounded-full transition-all duration-150 ${
            isDraggingSplitter
              ? 'bg-white h-12 shadow-sm'
              : 'bg-white/30 group-hover:bg-white/90 h-8 group-hover:h-11'
          }`}
        />
      </div>

      {/* CỘT PHẢI - GIỎ HÀNG & THANH TOÁN */}
      <div
        style={{ width: `${100 - leftWidthPercent}%` }}
        className='flex flex-col bg-white rounded-md overflow-hidden shadow-md h-full relative shrink-0 min-w-0'
      >
        <div className='bg-[#004795] flex items-center px-3 pt-2 select-none'>
          {/* Đơn hàng tabs - Chiếm trọn 100% không gian trống tới sát cụm avatar */}
          <div
            ref={tabBarRef}
            onWheel={handleTabBarWheel}
            className='flex-1 min-w-0 flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 mr-2'
          >
            {tabs.map(order => {
              const isActive = order.tabId === activeTabId
              const isDragging = draggedTabId === order.tabId
              const isDragOver = dragOverTabId === order.tabId && !isDragging

              return (
                <div
                  key={order.tabId}
                  draggable
                  onDragStart={e => handleTabDragStart(order.tabId, e)}
                  onDragOver={e => handleTabDragOver(order.tabId, e)}
                  onDrop={e => handleTabDrop(order.tabId, e)}
                  onDragEnd={handleTabDragEnd}
                  onClick={() => {
                    setActiveTabId(order.tabId)
                    if (order.orderId) syncActiveTabDetails(order.tabId, order.orderId)
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-md text-xs font-extrabold cursor-grab active:cursor-grabbing transition-all duration-150 shrink-0 ${
                    isActive
                      ? 'bg-white text-[#004795]'
                      : 'bg-[#003875] text-[#b0cde8] hover:bg-[#003c7e] hover:text-white'
                  } ${isDragging ? 'opacity-40 scale-95' : ''} ${
                    isDragOver ? 'ring-2 ring-amber-400 bg-[#004c9e]' : ''
                  }`}
                >
                  {/* Dot indicator: xanh lá = có món, ẩn = tab rỗng */}
                  {order.items.length > 0 && (
                    <span
                      className={`size-1.5 rounded-full shrink-0 ${
                        isActive ? 'bg-emerald-500' : 'bg-emerald-400/70'
                      }`}
                    />
                  )}
                  <span>Đơn {order.tabId}</span>
                  <X
                    className='size-3 hover:text-red-400 cursor-pointer stroke-3'
                    onClick={e => handleCloseOrder(order.tabId, order.orderId, e)}
                  />
                </div>
              )
            })}
            <button
              onClick={handleAddTab}
              title='Mở thêm tab bán hàng mới'
              className='bg-[#005fb8] hover:bg-[#006bd1] text-white p-1.5 rounded-md transition-colors cursor-pointer shrink-0'
            >
              <Plus className='size-3.5 stroke-3' />
            </button>

            {/* Nút Danh sách Đơn Chờ (Open Orders Panel) */}
            <button
              onClick={() => {
                setShowOpenOrdersPanel(true)
                fetchOpenDraftOrders()
              }}
              title='Xem danh sách đơn đang chờ xử lý'
              className='relative ml-1 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-md transition-all duration-150 cursor-pointer select-none shrink-0'
            >
              <ClipboardList size={13} className='shrink-0' />
              <span>Đơn chờ</span>
              {openDraftCount > 0 && (
                <span className='absolute -top-1.5 -right-1.5 bg-[#b90a0a] text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-sm animate-pulse'>
                  {openDraftCount > 9 ? '9+' : openDraftCount}
                </span>
              )}
            </button>
          </div>

          {/* Cụm Action Icons — Avatar Initials + Home */}
          <div className='flex items-center gap-1.5 pb-2 shrink-0 select-none'>
            {/* Avatar Initials + Tooltip */}
            <div className='relative group/avatar'>
              <div
                className='size-7 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center cursor-default transition-all shadow-xs'
                title={`Xin chào, ${user?.fullName || 'Nhân viên'}`}
              >
                <span className='text-white font-black text-[10px] tracking-wider leading-none'>
                  {getUserInitials(user?.fullName)}
                </span>
              </div>

              {/* Tooltip hover */}
              <div className='absolute right-0 top-full mt-1.5 bg-slate-900/95 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap invisible group-hover/avatar:visible opacity-0 group-hover/avatar:opacity-100 translate-y-1 group-hover/avatar:translate-y-0 transition-all duration-150 z-50 pointer-events-none'>
                Xin chào, {user?.fullName || 'Nhân viên'}
              </div>
            </div>

            {/* Nút Home */}
            <button
              onClick={() => navigate(-1)}
              className='p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer'
              title='Về trang chủ quản lý'
            >
              <House size={16} />
            </button>
          </div>
        </div>

        {/* Khách hàng */}
        <div className='px-4 py-2.5 border-b border-slate-100 bg-white flex items-center gap-2 select-none'>
          <div className='relative grow flex items-center'>
            <User className='absolute left-3 text-slate-400 size-3.5' />
            <input
              type='text'
              readOnly
              value='Khách vãng lai'
              className='bg-slate-50 border border-slate-200/80 text-slate-600 text-xs pl-8 pr-3 py-1.5 w-full rounded-md outline-hidden font-bold select-none cursor-default'
            />
          </div>
        </div>

        {/* Column Headers (Chỉ hiện khi có món trong giỏ) */}
        {activeTab && activeTab.items.length > 0 && (
          <div className='grid grid-cols-[minmax(0,1fr)_88px_90px] gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 select-none'>
            <span>Sản phẩm</span>
            <span className='text-center'>Số lượng</span>
            <span className='text-right'>Thành tiền</span>
          </div>
        )}

        {/* Danh sách dòng hàng */}
        {activeTab ? (
          <div className='grow overflow-y-auto min-h-0 divide-y divide-slate-100/80'>
            {activeTab.items.map((item, index) => (
              <div
                key={item.transactionItemId}
                className='group relative grid grid-cols-[minmax(0,1fr)_88px_90px] gap-2 items-center px-4 py-3 hover:bg-slate-50/80 transition-colors'
              >
                {/* Cột 1: Tên sản phẩm + Đơn giá */}
                <div className='min-w-0 pr-1 flex flex-col justify-center'>
                  <div className='flex items-baseline gap-1.5'>
                    <span className='text-[10px] text-slate-400 font-bold shrink-0 tabular-nums select-none'>
                      {index + 1}.
                    </span>
                    <span
                      className='font-bold text-slate-800 text-xs truncate leading-snug'
                      title={item.productName}
                    >
                      {item.productName}
                    </span>
                  </div>
                  <div className='text-[10.5px] text-slate-400 font-semibold mt-0.5 ml-3.5 tabular-nums select-none flex items-center gap-1.5'>
                    <span>{formatPrice(item.unitPrice)} đ</span>
                    {/* Nút xóa nhanh khi hover */}
                    <button
                      onClick={() => handleRemoveItem(item.transactionItemId)}
                      className='opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-0.5 rounded cursor-pointer hover:bg-rose-50'
                      title='Xóa món này'
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Cột 2: Stepper Pill Modern */}
                <div className='flex items-center justify-center select-none'>
                  <div className='flex items-center bg-slate-100 hover:bg-slate-200/60 p-0.5 rounded-full transition-colors border border-slate-200/60 shadow-2xs'>
                    <button
                      onClick={() => handleUpdateQuantity(item.transactionItemId, item.quantity, -1)}
                      className='size-6 rounded-full bg-white flex items-center justify-center text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:scale-90 shadow-2xs transition-all cursor-pointer font-black text-xs'
                      title='Giảm 1'
                    >
                      <Minus className='size-3 stroke-[2.5]' />
                    </button>
                    <span className='min-w-6 px-1 text-center font-bold text-slate-800 text-xs tabular-nums'>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.transactionItemId, item.quantity, 1)}
                      className='size-6 rounded-full bg-white flex items-center justify-center text-[#004795] hover:bg-blue-50 hover:text-[#003b95] active:scale-90 shadow-2xs transition-all cursor-pointer font-black text-xs'
                      title='Tăng 1'
                    >
                      <Plus className='size-3 stroke-[2.5]' />
                    </button>
                  </div>
                </div>

                {/* Cột 3: Thành tiền */}
                <div className='text-right select-none pr-0.5'>
                  <div className='font-black text-slate-900 text-xs tabular-nums whitespace-nowrap'>
                    {formatPrice(item.lineTotal)} đ
                  </div>
                </div>
              </div>
            ))}

            {activeTab.items.length === 0 && (
              <div className='flex flex-col items-center justify-center py-20 gap-3 select-none text-center px-4'>
                <div className='size-14 rounded-2xl bg-slate-100/90 border border-slate-200/50 flex items-center justify-center shadow-2xs text-slate-300'>
                  <ShoppingCart className='size-7' strokeWidth={1.75} />
                </div>
                <div>
                  <p className='text-slate-600 font-bold text-xs'>Đơn hàng chưa có món nào</p>
                  <p className='text-slate-400 text-[11px] mt-0.5 font-medium'>
                    Chọn sản phẩm từ danh mục bên trái để thêm vào đơn
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Thanh toán & checkout */}
        {activeTab && (
          <div className='p-4 border-t border-slate-200 bg-slate-50/70 space-y-3.5 shadow-xs'>
            {/* Summary Breakdown */}
            <div className='space-y-1.5'>
              <div className='flex items-center justify-between text-xs text-slate-500 font-semibold select-none'>
                <span>
                  Số lượng mặt hàng:{' '}
                  <strong className='text-slate-700 font-bold'>
                    {activeTab.items.length} món
                  </strong>{' '}
                  ({activeTab.items.reduce((acc, curr) => acc + curr.quantity, 0)} sản phẩm)
                </span>
              </div>

              <div className='flex items-baseline justify-between pt-1 border-t border-slate-200/60 select-none'>
                <span className='font-black text-[#003B95] text-sm tracking-tight'>
                  Tổng thanh toán
                </span>
                <div className='font-black text-[#003B95] text-xl tabular-nums tracking-tight'>
                  {formatPrice(activeTab.totalAmount)}{' '}
                  <span className='text-xs font-bold text-slate-500'>đ</span>
                </div>
              </div>
            </div>

            {/* Chọn phương thức thanh toán */}
            <div className='flex items-center justify-between text-xs select-none pt-2 border-t border-slate-200/60'>
              <span className='text-slate-500 font-bold'>Phương thức</span>
              <div className='flex gap-1.5 bg-white p-1 rounded-lg border border-slate-200/80 shadow-2xs'>
                <label
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md cursor-pointer font-bold text-xs transition-all ${
                    paymentMethod === 'Cash'
                      ? 'bg-[#004795] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type='radio'
                    name='payment'
                    checked={paymentMethod === 'Cash'}
                    onChange={() => setPaymentMethod('Cash')}
                    className='hidden'
                  />
                  Tiền mặt
                </label>
                <label
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md cursor-pointer font-bold text-xs transition-all ${
                    paymentMethod === 'Transfer'
                      ? 'bg-[#004795] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type='radio'
                    name='payment'
                    checked={paymentMethod === 'Transfer'}
                    onChange={() => setPaymentMethod('Transfer')}
                    className='hidden'
                  />
                  Chuyển khoản
                </label>
              </div>
            </div>

            {/* Công tắc Xuất Hóa đơn đỏ (VAT) */}
            <div className='pt-2 border-t border-slate-200/60 flex flex-col gap-2'>
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
                <div className='bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col gap-2 text-xs animate-in fade-in duration-200'>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <label className='text-[10px] font-bold text-slate-500 block mb-0.5'>Mã số thuế</label>
                      <input
                        type='text'
                        placeholder='MST (tùy chọn)...'
                        value={buyerTaxCode}
                        onChange={e => setBuyerTaxCode(e.target.value)}
                        className='w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium outline-hidden focus:border-[#b90a0a] focus:bg-white'
                      />
                    </div>
                    <div>
                      <label className='text-[10px] font-bold text-slate-500 block mb-0.5'>Email nhận HĐ</label>
                      <input
                        type='email'
                        placeholder='Email...'
                        value={buyerEmail}
                        onChange={e => setBuyerEmail(e.target.value)}
                        className='w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium outline-hidden focus:border-[#b90a0a] focus:bg-white'
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
                      className='w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium outline-hidden focus:border-[#b90a0a] focus:bg-white'
                    />
                  </div>
                  <div>
                    <label className='text-[10px] font-bold text-slate-500 block mb-0.5'>Địa chỉ công ty</label>
                    <input
                      type='text'
                      placeholder='Địa chỉ đăng ký thuế...'
                      value={buyerAddress}
                      onChange={e => setBuyerAddress(e.target.value)}
                      className='w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium outline-hidden focus:border-[#b90a0a] focus:bg-white'
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Nút checkout VIP hoặc 4 thao tác AwaitingPayment */}
            {activeTab.status === 'AwaitingPayment' ? (
              <div className='pt-1 space-y-2.5'>
                <div className='bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs flex items-center gap-2 font-bold'>
                  <Loader2 className='size-4 text-amber-600 animate-spin shrink-0' />
                  <span>Đơn hàng đang chờ thanh toán SePay</span>
                </div>
                <div className='grid grid-cols-2 gap-2 select-none'>
                  <button
                    type='button'
                    onClick={() => handleContinuePayment(activeTab.orderId || '', activeTab.code, activeTab.totalAmount)}
                    className='bg-[#004795] hover:bg-[#003875] text-white py-2.5 px-3 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer'
                  >
                    <QrCode size={15} />
                    Tiếp tục thanh toán
                  </button>
                  <button
                    type='button'
                    onClick={() => handleManualConfirm(activeTab.orderId || '')}
                    disabled={checkingOut}
                    className='bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-2.5 px-3 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer'
                  >
                    {checkingOut ? <Loader2 size={15} className='animate-spin' /> : <Check size={15} />}
                    Xác nhận đã nhận tiền
                  </button>
                  <button
                    type='button'
                    onClick={() => triggerReopenOrder(activeTab.orderId || '')}
                    className='border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer'
                  >
                    <Edit3 size={15} />
                    Chỉnh sửa đơn
                  </button>
                  <button
                    type='button'
                    onClick={() => triggerCancelOrder(activeTab.orderId || '')}
                    className='border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer'
                  >
                    <Trash2 size={15} />
                    Hủy đơn
                  </button>
                </div>
              </div>
            ) : (
              <div className='pt-1'>
                <button
                  onClick={handleCheckoutClick}
                  disabled={checkingOut || loadingCart || activeTab.items.length === 0}
                  className='w-full flex items-center justify-between bg-[#b90a0a] hover:bg-[#a00909] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all shadow-sm hover:shadow-md active:scale-[0.99] cursor-pointer'
                >
                  <div className='flex items-center gap-2'>
                    {checkingOut ? (
                      <Loader2 className='animate-spin size-4' />
                    ) : (
                      <Check className='size-4 stroke-3' />
                    )}
                    <span className='font-extrabold text-[13px]'>Xác nhận & Thanh toán</span>
                  </div>
                  <span className='font-black text-sm tabular-nums bg-white/15 px-2.5 py-0.5 rounded-md'>
                    {formatPrice(activeTab.totalAmount)} đ
                  </span>
                </button>
              </div>
            )}
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
                  Chọn tài khoản ngân hàng (QR động SePay tự động đối soát, QR tĩnh hoàn tất ngay).
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
                      className='w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-bold outline-hidden focus:border-[#b90a0a]'
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
                        {acc.isSePayConnected || acc.sePayBankAccountXid ? (
                          <span className='bg-blue-50 text-blue-600 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-blue-100 shadow-3xs'>
                            QR động (SePay)
                          </span>
                        ) : (
                          <span className='bg-amber-50 text-amber-700 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-amber-200/60'>
                            QR tĩnh
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

            <h4 className='text-2xl font-black text-[#004795] mb-1'>
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
                <span className='font-bold text-slate-800'>{selectedAccount.accountNumber}</span>
              </div>
              <div className='flex justify-between'>
                <span>Chủ tài khoản:</span>
                <span className='font-bold text-slate-800 uppercase'>{selectedAccount.accountName}</span>
              </div>
            </div>

            {/* THAO TÁC XỬ LÝ ĐƠN CHỜ THANH TOÁN */}
            <div className='w-full border-t border-gray-100 pt-4 flex flex-col gap-2'>
              <button
                type='button'
                onClick={() => handleManualConfirm(awaitingOrderId)}
                disabled={checkingOut}
                className='w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-2 rounded-md text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer'
              >
                {checkingOut ? <Loader2 className='animate-spin size-4' /> : <Check size={16} />}
                Xác nhận đã nhận tiền (Thủ công)
              </button>

              <div className='grid grid-cols-2 gap-2'>
                <button
                  type='button'
                  onClick={() => triggerReopenOrder(awaitingOrderId)}
                  className='border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer'
                >
                  <Edit3 size={14} />
                  Chỉnh sửa đơn
                </button>
                <button
                  type='button'
                  onClick={() => triggerCancelOrder(awaitingOrderId)}
                  className='border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer'
                >
                  <Trash2 size={14} />
                  Hủy đơn
                </button>
              </div>

              <button
                type='button'
                onClick={handleSimulatePayment}
                disabled={simulatingSePay}
                className='w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1'
              >
                {simulatingSePay ? (
                  <Loader2 className='animate-spin size-3.5' />
                ) : (
                  <PlayCircle size={14} />
                )}
                Giả lập SePay Sandbox Webhook (Test)
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
            <h4 className='text-3xl font-black text-slate-900 mb-4'>
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
                  <span className='font-bold text-slate-800'>{successInvoiceNumber}</span>
                </div>
              )}
              {successInvoiceStatus === 'Issued' && successTaxAuthorityCode && (
                <div className='flex justify-between'>
                  <span>Mã cơ quan thuế:</span>
                  <span className='font-bold text-blue-600'>{successTaxAuthorityCode}</span>
                </div>
              )}
              {successInvoiceStatus && (
                <div className='flex justify-between'>
                  <span>{successOfficialPdfUrl || successTaxAuthorityCode ? 'Trạng thái HĐĐT:' : 'Trạng thái hóa đơn:'}</span>
                  <span className={`font-bold ${successInvoiceStatus === 'Issued' ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {successInvoiceStatus === 'Issued'
                      ? (successOfficialPdfUrl || successTaxAuthorityCode ? 'Đã phát hành hóa đơn đỏ' : 'Đã xuất hóa đơn bán lẻ')
                      : 'Chờ xử lý'}
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

            <div className='grid grid-cols-2 gap-2.5'>
              <button
                onClick={() => navigate(path.BUSINESS_OWNER_HOME)}
                className='border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer shadow-xs select-none flex items-center justify-center gap-1.5'
              >
                <House size={15} />
                Về trang chủ
              </button>
              <button
                onClick={() => {
                  setShowSuccessOverlay(false)
                  setSuccessOfficialPdfUrl(null)
                  setSuccessOfficialXmlUrl(null)
                  setSuccessInvoiceStatus(null)
                  setSuccessTaxAuthorityCode(null)
                }}
                className='bg-[#b90a0a] hover:bg-[#a00909] text-white py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer shadow-xs select-none'
              >
                Đơn hàng mới
              </button>
            </div>
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
                  Mã sản phẩm <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  required
                  placeholder='Ví dụ: SP0001...'
                  value={quickProductCode}
                  onChange={e => setQuickProductCode(e.target.value)}
                  className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[13.5px] outline-hidden focus:border-[#b90a0a] font-semibold text-gray-800'
                />
              </div>

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
                  className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[13.5px] outline-hidden focus:border-[#b90a0a] font-bold text-gray-800'
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

      {/* DRAWER - DANH SÁCH ĐƠN HÀNG ĐANG CHỜ (OPEN ORDERS PANEL) */}
      {showOpenOrdersPanel && (
        <>
          {/* Dim overlay */}
          <div
            className='fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 animate-in fade-in duration-200'
            onClick={() => setShowOpenOrdersPanel(false)}
          />

          {/* Drawer slide-in from right */}
          <div className='fixed right-0 top-0 bottom-0 w-90 bg-white z-50 shadow-[-8px_0_32px_rgba(0,0,0,0.15)] flex flex-col animate-in slide-in-from-right duration-250'>
            {/* Drawer Header */}
            <div className='bg-[#004795] px-5 py-4 flex items-center justify-between shrink-0 select-none'>
              <div className='flex items-center gap-2.5'>
                <ClipboardList size={18} className='text-white/80' />
                <div>
                  <h2 className='text-white font-extrabold text-[14px] leading-tight'>
                    Đơn hàng đang chờ
                  </h2>
                  <p className='text-white/60 text-[10px] font-semibold mt-0.5'>
                    {openDraftOrders.length > 0
                      ? `${openDraftOrders.length} đơn có sản phẩm chưa thanh toán`
                      : 'Không có đơn nào đang chờ'}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-1.5'>
                {draftOrderCount > 0 && (
                  <button
                    onClick={() => setShowConfirmCancelAll(true)}
                    className='flex items-center gap-1 px-2.5 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-md text-[11px] font-bold transition-all shadow-xs cursor-pointer'
                    title='Hủy toàn bộ đơn nháp'
                  >
                    <Trash2 size={12} />
                    <span>Hủy tất cả ({draftOrderCount})</span>
                  </button>
                )}
                <button
                  onClick={() => setShowOpenOrdersPanel(false)}
                  className='p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer'
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className='flex-1 overflow-y-auto px-4 py-3 space-y-2.5 bg-[#f7f9fc]'>
              {/* Skeleton loading */}
              {loadingOpenOrders &&
                [...Array(3)].map((_, i) => (
                  <div key={i} className='bg-white rounded-[12px] p-4 border border-slate-100 animate-pulse'>
                    <div className='h-3 bg-slate-200 rounded w-2/5 mb-2' />
                    <div className='h-2.5 bg-slate-100 rounded w-3/5 mb-3' />
                    <div className='flex gap-2'>
                      <div className='h-7 bg-slate-100 rounded-md flex-1' />
                      <div className='h-7 bg-slate-100 rounded-md w-16' />
                    </div>
                  </div>
                ))}

              {/* Empty state */}
              {!loadingOpenOrders && openDraftOrders.length === 0 && (
                <div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
                  <div className='size-14 bg-slate-100 rounded-full flex items-center justify-center mb-3'>
                    <ClipboardList size={24} className='text-slate-300' />
                  </div>
                  <p className='text-slate-500 font-bold text-[13px] mb-1'>Không có đơn nháp nào</p>
                  <p className='text-slate-400 text-[11px] font-medium leading-relaxed'>
                    Các đơn có sản phẩm đang chờ thanh toán sẽ xuất hiện ở đây.
                  </p>
                </div>
              )}

              {/* Draft Order Cards */}
              {!loadingOpenOrders &&
                openDraftOrders.map(order => {
                  const isOpenInTab = tabs.find(t => t.orderId === order.transactionId)
                  const relativeTime = formatRelativeTime(order.transactionDate)

                  return (
                    <div
                      key={order.transactionId}
                      className='bg-white rounded-[12px] p-4 border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_3px_10px_rgba(0,0,0,0.08)] hover:border-slate-200 transition-all duration-150 group'
                    >
                      {/* Card Header: Mã đơn + Thời gian + Badge */}
                      <div className='flex items-start justify-between mb-2.5 gap-2'>
                        <div>
                          <span className='font-extrabold text-slate-800 text-[13px] leading-tight block'>
                            {order.transactionCode}
                          </span>
                          <span className='text-[10.5px] text-slate-400 font-semibold'>
                            {relativeTime}
                          </span>
                        </div>
                        {isOpenInTab ? (
                          <span className='shrink-0 flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-emerald-100'>
                            <span className='size-1.5 bg-emerald-400 rounded-full inline-block' />
                            Tab {isOpenInTab.tabId}
                          </span>
                        ) : order.status === 'AwaitingPayment' ? (
                          <span className='shrink-0 bg-amber-50 text-amber-700 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-amber-300'>
                            Chờ chuyển khoản
                          </span>
                        ) : (
                          <span className='shrink-0 bg-slate-100 text-slate-600 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-slate-200'>
                            Đơn nháp
                          </span>
                        )}
                      </div>

                      {/* Card Body: Số món + Tổng tiền */}
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center gap-1.5 text-slate-500'>
                          <div className='size-5 bg-slate-100 rounded flex items-center justify-center'>
                            <Package size={11} className='text-slate-400' />
                          </div>
                          <span className='text-[11px] font-bold'>{order.itemCount} sản phẩm</span>
                        </div>
                        <span className='font-black text-[#004795] text-[13.5px]'>
                          {formatPrice(order.totalAmount)} đ
                        </span>
                      </div>

                      {/* Card Footer: Action Buttons */}
                      <div className='flex gap-2 pt-2.5 border-t border-slate-50 select-none'>
                        {isOpenInTab ? (
                          <button
                            onClick={() => {
                              setActiveTabId(isOpenInTab.tabId)
                              setShowOpenOrdersPanel(false)
                            }}
                            className='flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold py-1.5 rounded-md transition-colors cursor-pointer'
                          >
                            <ArrowRight size={13} />
                            Chuyển đến {isOpenInTab.tabId}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleResumeDraftOrder(order)}
                              className='flex-1 flex items-center justify-center gap-1.5 bg-[#004795] hover:bg-[#003875] text-white text-[11px] font-bold py-1.5 rounded-md transition-colors cursor-pointer shadow-xs'
                            >
                              <PlayCircle size={13} />
                              Mở lại đơn này
                            </button>
                            <button
                              onClick={() => triggerCancelOrder(order.transactionId)}
                              className='flex items-center justify-center gap-1 border border-slate-200 hover:border-red-300 hover:bg-red-50 hover:text-[#b90a0a] text-slate-400 text-[11px] font-bold px-3 py-1.5 rounded-md transition-colors cursor-pointer'
                              title='Hủy đơn'
                            >
                              <Trash2 size={12} />
                              Hủy
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Drawer Footer */}
            <div className='shrink-0 px-4 py-3 border-t border-slate-100 bg-white select-none'>
              <button
                onClick={() => {
                  setShowOpenOrdersPanel(false)
                  navigate(path.BUSINESS_OWNER_ORDERS)
                }}
                className='w-full flex items-center justify-center gap-2 text-slate-400 hover:text-[#004795] text-[11px] font-bold py-2 rounded-md hover:bg-slate-50 transition-colors cursor-pointer'
              >
                <RotateCcw size={12} />
                Xem toàn bộ lịch sử đơn hàng
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODAL XÁC NHẬN HỦY TẤT CẢ ĐƠN NHÁP */}
      {showConfirmCancelAll && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-xs z-60 flex items-center justify-center p-4 animate-in fade-in duration-150'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-150 p-6 text-center select-none'>
            <div className='bg-red-100 text-red-600 size-14 rounded-full flex items-center justify-center mx-auto mb-3'>
              <Trash2 size={24} />
            </div>
            <h3 className='text-slate-900 font-extrabold text-[16px] mb-1.5'>
              Hủy toàn bộ đơn nháp?
            </h3>
            <p className='text-slate-500 text-xs font-medium leading-relaxed mb-6'>
              Bạn có chắc chắn muốn hủy tất cả <span className='font-bold text-red-600'>{draftOrderCount}</span> đơn hàng nháp? Thao tác này sẽ xóa các đơn nháp và làm mới giao diện POS.
            </p>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => setShowConfirmCancelAll(false)}
                disabled={cancellingAll}
                className='flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer'
              >
                Giữ lại
              </button>
              <button
                type='button'
                onClick={handleCancelAllDrafts}
                disabled={cancellingAll}
                className='flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer'
              >
                {cancellingAll && <Loader2 size={13} className='animate-spin' />}
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN CHỈNH SỬA ĐƠN HÀNG (REOPEN) */}
      {showConfirmReopenModal && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-xs z-60 flex items-center justify-center p-4 animate-in fade-in duration-150'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-150 p-6 text-center select-none'>
            <div className='bg-amber-100 text-amber-600 size-14 rounded-full flex items-center justify-center mx-auto mb-3'>
              <Edit3 size={24} />
            </div>
            <h3 className='text-slate-900 font-extrabold text-[16px] mb-1.5'>
              Chỉnh sửa đơn hàng?
            </h3>
            <p className='text-slate-600 text-xs font-semibold leading-relaxed mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200'>
              “Tôi đã xác nhận khách chưa chuyển khoản”
            </p>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => setShowConfirmReopenModal(false)}
                disabled={reopeningOrder}
                className='flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer'
              >
                Quay lại
              </button>
              <button
                type='button'
                onClick={handleConfirmReopenOrder}
                disabled={reopeningOrder}
                className='flex-1 py-2.5 bg-[#004795] hover:bg-[#003875] disabled:bg-gray-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer'
              >
                {reopeningOrder && <Loader2 size={13} className='animate-spin' />}
                Xác nhận sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN HỦY ĐƠN HÀNG (CANCEL) */}
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
    </div>
  )
}
