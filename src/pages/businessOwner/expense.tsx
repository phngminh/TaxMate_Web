import { useState, useEffect, useMemo } from 'react'
import {
  ArrowUpCircle,
  RotateCcw,
  Plus,
  X,
  Loader2,
  Building2,
  Trash2,
  Edit,
  ClipboardList,
  UserPlus,
  Coins,
  Package,
  Calendar,
  FileText
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useBusiness } from '../../contexts/BusinessContext'
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  createExpenseCategory
} from '../../apis/expense.api'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../apis/supplier.api'
import { getIngredientPurchases, createIngredientPurchase, deleteIngredientPurchase } from '../../apis/ingredientPurchase.api'
import { getAllIngredients } from '../../apis/ingredient.api'
import { getAllProducts } from '../../apis/product.api'
import type { Supplier } from '../../types/supplier.type'
import type { ExpenseCategoryDTO, ExpenseDTO } from '../../types/expense.type'
import type { Ingredient } from '../../types/ingredient.type'
import type { Product } from '../../types/product.type'
import type { IngredientPurchaseResponse } from '../../types/ingredientPurchase.type'

interface PurchaseLineItem {
  itemId: string // Product or Ingredient ID
  name: string
  quantity: number
  costPrice: number
  discountValue: number
  taxPercent: number
}

export default function ExpensePage() {
  const { currentBusiness } = useBusiness()
  const businessId = currentBusiness?.id

  // Active tab state: 'ledger' | 'purchases' | 'suppliers'
  const [activeTab, setActiveTab] = useState<'ledger' | 'purchases' | 'suppliers'>('ledger')

  // Global loading
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Data lists
  const [expenses, setExpenses] = useState<ExpenseDTO[]>([])
  const [categories, setCategories] = useState<ExpenseCategoryDTO[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [materialPurchases, setMaterialPurchases] = useState<IngredientPurchaseResponse[]>([])
  
  // Lookups for Form dropdowns
  const [dbIngredients, setDbIngredients] = useState<Ingredient[]>([])
  const [dbProducts, setDbProducts] = useState<Product[]>([])

  // Modal control states
  const [showAddLedgerModal, setShowAddLedgerModal] = useState(false)
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [showSupplierDetailModal, setShowSupplierDetailModal] = useState(false)
  const [showPurchaseDetailModal, setShowPurchaseDetailModal] = useState(false)

  // --- FORM STATES ---
  // A. Operational Expense Form
  const [ledgerTitle, setLedgerTitle] = useState('')
  const [ledgerAmount, setLedgerAmount] = useState('')
  const [ledgerCategoryId, setLedgerCategoryId] = useState('')
  const [ledgerDate, setLedgerDate] = useState(new Date().toISOString().slice(0, 10))
  const [ledgerMethod, setLedgerMethod] = useState('Cash')
  const [ledgerNote, setLedgerNote] = useState('')

  // B. Supplier Form (Add/Edit)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supName, setSupName] = useState('')
  const [supContact, setSupContact] = useState('')
  const [supPhone, setSupPhone] = useState('')
  const [supAddress, setSupAddress] = useState('')
  const [supNote, setSupNote] = useState('')

  // C. Unified Purchase Invoice Form
  const [purchaseType, setPurchaseType] = useState<'Product' | 'Material'>('Product')
  const [purchaseSupplierId, setPurchaseSupplierId] = useState('')
  const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10))
  const [purchaseNote, setPurchaseNote] = useState('')
  const [purchaseItems, setPurchaseItems] = useState<PurchaseLineItem[]>([])
  
  // D. Selected items for details modal
  const [selectedExpenseDetail, setSelectedExpenseDetail] = useState<ExpenseDTO | null>(null)
  const [selectedMaterialDetail, setSelectedMaterialDetail] = useState<IngredientPurchaseResponse | null>(null)

  // E. Quick inline Add Supplier
  const [quickSupName, setQuickSupName] = useState('')
  const [quickSupPhone, setQuickSupPhone] = useState('')
  const [showQuickSupForm, setShowQuickSupForm] = useState(false)

  // 1. Fetch data depending on active tab
  const loadData = async () => {
    if (!businessId) return
    try {
      setLoading(true)
      if (activeTab === 'ledger') {
        const [expRes, catRes] = await Promise.all([
          getExpenses(businessId, { pageNumber: 1, pageSize: 100 }),
          getExpenseCategories(businessId)
        ])
        if (expRes.success) setExpenses(expRes.data.items || [])
        if (catRes.success) setCategories(catRes.data || [])
      } else if (activeTab === 'purchases') {
        const [matRes, expRes, supRes, ingRes, prodRes] = await Promise.all([
          getIngredientPurchases(businessId),
          getExpenses(businessId, { pageNumber: 1, pageSize: 100 }),
          getSuppliers(businessId),
          getAllIngredients(businessId),
          getAllProducts(businessId, 1, 100)
        ])
        if (matRes.success) setMaterialPurchases(matRes.data.items || [])
        if (expRes.success) setExpenses(expRes.data.items || [])
        if (supRes.success) setSuppliers(supRes.data || [])
        if (ingRes.success) setDbIngredients(ingRes.data || [])
        if (prodRes.success) setDbProducts(prodRes.data.items || [])
      } else if (activeTab === 'suppliers') {
        const res = await getSuppliers(businessId)
        if (res.success) setSuppliers(res.data || [])
      }
    } catch (err) {
      console.error(err)
      toast.error('Không thể nạp dữ liệu chi phí.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [businessId, activeTab])

  // Get or Create "Chi phí nhập hàng" Category dynamically to prevent errors
  const getOrCreateImportCategory = async (cats: ExpenseCategoryDTO[]) => {
    if (!businessId) throw new Error('Missing businessId')
    
    // Find existing category
    const found = cats.find(
      x => x.name.toLowerCase().includes('nhập hàng') || x.name.toLowerCase().includes('nhap hang')
    )
    if (found) return found.expenseCategoryId

    // Create new
    try {
      const res = await createExpenseCategory(businessId, {
        name: 'Chi phí nhập hàng',
        description: 'Chi phí nhập sản phẩm từ nhà cung cấp'
      })
      if (res.success && res.data) {
        return res.data.expenseCategoryId
      }
    } catch (err) {
      console.error('Failed to create default category:', err)
    }
    return cats[0]?.expenseCategoryId || ''
  }

  // --- ACTIONS HANDLERS ---
  // A. Add Operational Expense
  const handleAddLedgerExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId) return

    const amountNum = parseFloat(ledgerAmount.replace(/\D/g, ''))
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ')
      return
    }
    if (!ledgerTitle.trim()) {
      toast.error('Vui lòng nhập nội dung chi phí')
      return
    }

    try {
      setActionLoading(true)
      const res = await createExpense(businessId, {
        expenseCategoryId: ledgerCategoryId || categories[0]?.expenseCategoryId,
        expenseTitle: ledgerTitle.trim(),
        amount: amountNum,
        expenseDate: new Date(ledgerDate).toISOString(),
        paymentMethod: ledgerMethod,
        note: ledgerNote.trim() || null
      })

      if (res.success) {
        toast.success('Ghi nhận khoản chi thành công!')
        setShowAddLedgerModal(false)
        resetLedgerForm()
        loadData()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể lưu khoản chi.')
    } finally {
      setActionLoading(false)
    }
  }

  // B. Add/Edit Supplier
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId) return

    if (!supName.trim()) {
      toast.error('Vui lòng nhập tên nhà cung cấp')
      return
    }

    try {
      setActionLoading(true)
      let res
      if (editingSupplier) {
        res = await updateSupplier(editingSupplier.id, {
          name: supName.trim(),
          contactName: supContact.trim() || undefined,
          phoneNumber: supPhone.trim() || undefined,
          address: supAddress.trim() || undefined,
          note: supNote.trim() || undefined
        })
      } else {
        res = await createSupplier(businessId, {
          name: supName.trim(),
          contactName: supContact.trim() || undefined,
          phoneNumber: supPhone.trim() || undefined,
          address: supAddress.trim() || undefined,
          note: supNote.trim() || undefined
        })
      }

      if (res.success) {
        toast.success(editingSupplier ? 'Cập nhật nhà cung cấp thành công!' : 'Thêm nhà cung cấp thành công!')
        setShowSupplierModal(false)
        resetSupplierForm()
        loadData()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lưu nhà cung cấp thất bại.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đối tác nhà cung cấp này không?')) return

    try {
      const res = await deleteSupplier(id)
      if (res.success) {
        toast.success('Xóa nhà cung cấp thành công!')
        loadData()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể xóa nhà cung cấp.')
    }
  }

  // Quick inline add supplier inside purchase modal
  const handleQuickAddSupplier = async () => {
    if (!businessId || !quickSupName.trim()) return
    try {
      const res = await createSupplier(businessId, {
        name: quickSupName.trim(),
        phoneNumber: quickSupPhone.trim() || undefined
      })
      if (res.success && res.data) {
        toast.success('Đã thêm nhanh nhà cung cấp!')
        setSuppliers(prev => [...prev, res.data])
        setPurchaseSupplierId(res.data.id)
        setShowQuickSupForm(false)
        setQuickSupName('')
        setQuickSupPhone('')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể tạo nhanh nhà cung cấp.')
    }
  }

  // C. Unified Purchase Invoices Save
  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId) return

    if (purchaseItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một mặt hàng nhập kho.')
      return
    }
    if (!purchaseSupplierId) {
      toast.error('Vui lòng chọn nhà cung cấp.')
      return
    }
    if (!purchaseInvoiceNumber.trim()) {
      toast.error('Vui lòng nhập số hóa đơn.')
      return
    }

    const supplierObj = suppliers.find(s => s.id === purchaseSupplierId)
    const supplierName = supplierObj?.name || 'Unknown'

    try {
      setActionLoading(true)

      if (purchaseType === 'Material') {
        // Save raw materials to IngredientPurchase
        for (const item of purchaseItems) {
          let lineTotal = item.quantity * item.costPrice
          lineTotal = Math.max(0, lineTotal - item.discountValue)
          lineTotal = lineTotal * (1 + item.taxPercent / 100)

          await createIngredientPurchase(businessId, {
            ingredientId: item.itemId,
            quantity: item.quantity,
            totalCost: lineTotal,
            purchaseDate: new Date(purchaseDate).toISOString(),
            invoiceNumber: purchaseInvoiceNumber.trim(),
            supplierId: purchaseSupplierId,
            supplierName
          })
        }
      } else {
        // Save products as aggregated General Expense under "Chi phí nhập hàng"
        let totalProductCost = 0
        const detailsLines = purchaseItems.map(p => {
          let lineTotal = p.quantity * p.costPrice
          lineTotal = Math.max(0, lineTotal - p.discountValue)
          lineTotal = lineTotal * (1 + p.taxPercent / 100)
          totalProductCost += lineTotal

          return `- ${p.name}: ${p.quantity} x ${formatPrice(p.costPrice)} đ (giảm ${formatPrice(p.discountValue)} đ, thuế ${p.taxPercent}%)`
        })

        const noteContent = `Nhà cung cấp: ${supplierName}\nSố hóa đơn: ${purchaseInvoiceNumber}\nGhi chú: ${purchaseNote}\n\nSản phẩm nhập kho:\n${detailsLines.join('\n')}`

        // Find or create category
        const catsRes = await getExpenseCategories(businessId)
        const categoryId = await getOrCreateImportCategory(catsRes.data || [])

        await createExpense(businessId, {
          expenseCategoryId: categoryId,
          expenseTitle: `Nhập hàng hóa đơn ${purchaseInvoiceNumber}`,
          amount: totalProductCost,
          expenseDate: new Date(purchaseDate).toISOString(),
          paymentMethod: 'Cash',
          note: noteContent,
          supplierId: purchaseSupplierId
        })
      }

      toast.success('Nhập kho hàng hóa thành công!')
      setShowAddPurchaseModal(false)
      resetPurchaseForm()
      loadData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi nhập kho.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeletePurchase = async (type: 'Product' | 'Material', id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phiếu nhập kho này không?')) return

    try {
      if (type === 'Material') {
        const res = await deleteIngredientPurchase(id)
        if (res.success) {
          toast.success('Xóa phiếu nhập nguyên liệu thành công!')
          loadData()
        }
      } else {
        const res = await deleteExpense(id)
        if (res.success) {
          toast.success('Xóa phiếu nhập sản phẩm thành công!')
          loadData()
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể xóa phiếu chi.')
    }
  }

  // --- HELPERS ---
  const resetLedgerForm = () => {
    setLedgerTitle('')
    setLedgerAmount('')
    setLedgerCategoryId(categories[0]?.expenseCategoryId || '')
    setLedgerDate(new Date().toISOString().slice(0, 10))
    setLedgerMethod('Cash')
    setLedgerNote('')
  }

  const resetSupplierForm = () => {
    setEditingSupplier(null)
    setSupName('')
    setSupContact('')
    setSupPhone('')
    setSupAddress('')
    setSupNote('')
  }

  const resetPurchaseForm = () => {
    setPurchaseType('Product')
    setPurchaseSupplierId('')
    setPurchaseInvoiceNumber('')
    setPurchaseDate(new Date().toISOString().slice(0, 10))
    setPurchaseNote('')
    setPurchaseItems([])
  }

  const addLineItem = (itemId: string) => {
    if (purchaseType === 'Material') {
      const itemObj = dbIngredients.find(x => x.id === itemId)
      if (!itemObj) return
      if (purchaseItems.some(x => x.itemId === itemId)) return
      setPurchaseItems(prev => [
        ...prev,
        {
          itemId: itemObj.id,
          name: itemObj.name,
          quantity: 1,
          costPrice: itemObj.estimatedPrice || 0,
          discountValue: 0,
          taxPercent: 0
        }
      ])
    } else {
      const itemObj = dbProducts.find(x => x.id === itemId)
      if (!itemObj) return
      if (purchaseItems.some(x => x.itemId === itemId)) return
      setPurchaseItems(prev => [
        ...prev,
        {
          itemId: itemObj.id,
          name: itemObj.name,
          quantity: 1,
          costPrice: itemObj.currentPrice || 0,
          discountValue: 0,
          taxPercent: 0
        }
      ])
    }
  }

  const updateLineItem = (index: number, fields: Partial<PurchaseLineItem>) => {
    setPurchaseItems(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, ...fields } : item))
    )
  }

  const removeLineItem = (index: number) => {
    setPurchaseItems(prev => prev.filter((_, idx) => idx !== index))
  }

  const formatPrice = (value: number) => {
    return value.toLocaleString('vi-VN')
  }

  // Combined purchase records to display in history list
  const combinedPurchases = useMemo(() => {
    const list: {
      id: string
      invoiceNumber: string
      date: string
      supplierName: string
      amount: number
      type: 'Product' | 'Material'
      summary: string
    }[] = []

    // 1. Ingredients purchase
    materialPurchases.forEach(m => {
      list.push({
        id: m.id,
        invoiceNumber: m.invoiceNumber || 'N/A',
        date: m.purchaseDate,
        supplierName: m.supplierName || 'Vãng lai',
        amount: m.totalCost,
        type: 'Material',
        summary: `Nguyên liệu: ${m.ingredientName} (${m.quantity} ${m.ingredientUnit || 'đơn vị'})`
      })
    })

    // 2. Product purchase expenses (filter where category is "Chi phí nhập hàng" or title has "Nhập hàng")
    expenses
      .filter(
        e =>
          e.categoryName.toLowerCase().includes('nhập hàng') ||
          e.expenseTitle.toLowerCase().includes('nhập hàng')
      )
      .forEach(e => {
        list.push({
          id: e.expenseId,
          invoiceNumber: e.expenseTitle.replace('Nhập hàng hóa đơn ', '') || 'N/A',
          date: e.expenseDate,
          supplierName: e.supplierName || 'Vãng lai',
          amount: e.amount,
          type: 'Product',
          summary: e.note || e.expenseTitle
        })
      })

    // Sort newest first
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [materialPurchases, expenses])

  return (
    <div className='flex flex-col bg-[#f8f9fa] min-h-[calc(100vh-51px)] w-full'>
      <div className='flex items-center justify-between px-8 py-4 gap-4 bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'>
        <div className='ml-72 flex-1'>
          <h1 className='text-[20px] font-black text-gray-900 flex items-center gap-2'>
            <Coins className='text-[#D32F2F] size-5' />
            Quản lý Chi phí & Nhập kho
          </h1>
          <p className='text-gray-400 text-xs mt-0.5 font-medium'>
            Quản lý dòng tiền chi tiêu vận hành và nhập nguyên vật liệu đầu vào của cửa hàng
          </p>
        </div>

        {/* Action buttons depending on tab */}
        <div className='flex gap-3'>
          {activeTab === 'ledger' && (
            <div className='flex items-center bg-[#D32F2F] text-white rounded-[10px] overflow-hidden shadow-[0px_4px_10px_rgba(211,47,47,0.2)] hover:shadow-[0px_6px_14px_rgba(211,47,47,0.3)] transition-all'>
              <button
                onClick={() => {
                  setLedgerCategoryId(categories[0]?.expenseCategoryId || '')
                  setShowAddLedgerModal(true)
                }}
                className='px-5 py-2.5 text-[14px] font-bold hover:bg-[#B71C1C] active:bg-[#991B1B] transition-colors flex items-center gap-2'
              >
                <Plus size={16} strokeWidth={2.5} /> Thêm khoản chi
              </button>
            </div>
          )}
          {activeTab === 'purchases' && (
            <div className='flex items-center bg-[#D32F2F] text-white rounded-[10px] overflow-hidden shadow-[0px_4px_10px_rgba(211,47,47,0.2)] hover:shadow-[0px_6px_14px_rgba(211,47,47,0.3)] transition-all'>
              <button
                onClick={() => {
                  resetPurchaseForm()
                  setShowAddPurchaseModal(true)
                }}
                className='px-5 py-2.5 text-[14px] font-bold hover:bg-[#B71C1C] active:bg-[#991B1B] transition-colors flex items-center gap-2'
              >
                <Plus size={16} strokeWidth={2.5} /> Nhập kho mới
              </button>
            </div>
          )}
          {activeTab === 'suppliers' && (
            <div className='flex items-center bg-[#D32F2F] text-white rounded-[10px] overflow-hidden shadow-[0px_4px_10px_rgba(211,47,47,0.2)] hover:shadow-[0px_6px_14px_rgba(211,47,47,0.3)] transition-all'>
              <button
                onClick={() => {
                  resetSupplierForm()
                  setShowSupplierModal(true)
                }}
                className='px-5 py-2.5 text-[14px] font-bold hover:bg-[#B71C1C] active:bg-[#991B1B] transition-colors flex items-center gap-2'
              >
                <UserPlus size={16} strokeWidth={2.5} /> Thêm nhà cung cấp
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN BODY */}
      <div className='flex grow w-full'>
        {/* SIDEBAR */}
        <div className='w-72 bg-white border-r border-[#ffe5e5] p-6 flex flex-col gap-4 shrink-0'>
          <span className='text-[13px] font-bold text-gray-500 uppercase tracking-wide'>Danh mục</span>
          <div className='flex flex-col gap-1'>
            {[
              { val: 'ledger', label: 'Sổ quỹ thu chi', icon: Coins },
              { val: 'purchases', label: 'Hóa đơn Nhập kho', icon: Package },
              { val: 'suppliers', label: 'Đối tác Nhà cung cấp', icon: Building2 }
            ].map(t => {
              const Icon = t.icon
              const isActive = activeTab === t.val
              return (
                <button
                  key={t.val}
                  onClick={() => setActiveTab(t.val as any)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[10px] text-[13.5px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#eef2ff] text-[#4c51bf]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={17} className={isActive ? 'text-[#4c51bf]' : 'text-gray-400'} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className='grow p-8 overflow-x-auto'>
          {loading ? (
            <div className='flex justify-center items-center py-20'>
              <Loader2 className='animate-spin text-[#D32F2F] size-10' />
            </div>
          ) : (
            <>
              {/* TAB 1: LEDGER */}
              {activeTab === 'ledger' && (
                <div className='overflow-x-auto w-full'>
                  {expenses.length > 0 ? (
                    <table className='w-full text-left border-collapse'>
                      <thead>
                        <tr className='bg-[#e3effc] text-[#1e3a8a] text-[13px] font-black border-b border-[#cbd5e1]/40 select-none'>
                          <th className='py-3.5 px-5 font-bold'>Nội dung khoản chi</th>
                          <th className='py-3.5 px-5 font-bold'>Danh mục</th>
                          <th className='py-3.5 px-5 font-bold'>Phương thức</th>
                          <th className='py-3.5 px-5 font-bold'>Ngày lập</th>
                          <th className='py-3.5 px-5 font-bold text-right'>Số tiền chi</th>
                          <th className='py-3.5 px-5 font-bold text-center w-24'>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-100 text-xs font-semibold text-gray-600'>
                        {expenses
                          .filter(e => !e.categoryName.toLowerCase().includes('nhập hàng'))
                          .map(e => (
                            <tr key={e.expenseId} className='hover:bg-[#fcfdfe] transition-colors'>
                              <td className='py-4 px-5 text-gray-900 font-bold'>{e.expenseTitle}</td>
                              <td className='py-4 px-5'>
                                <span className='bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100 font-bold text-[10px]'>
                                  {e.categoryName}
                                </span>
                              </td>
                              <td className='py-4 px-5'>{e.paymentMethod === 'Cash' ? 'Tiền mặt' : e.paymentMethod === 'Transfer' ? 'Chuyển khoản' : 'Thẻ'}</td>
                              <td className='py-4 px-5 font-mono'>{new Date(e.expenseDate).toLocaleDateString('vi-VN')}</td>
                              <td className='py-4 px-5 text-right font-black text-orange-600 font-mono'>-{formatPrice(e.amount)} đ</td>
                              <td className='py-4 px-5 text-center'>
                                <button
                                  onClick={async () => {
                                    try {
                                      setActionLoading(true)
                                      const detail = await getExpenseById(e.expenseId)
                                      if (detail.success) {
                                        setSelectedExpenseDetail(detail.data)
                                        setShowPurchaseDetailModal(true)
                                      }
                                    } catch (err) {
                                      toast.error('Không thể xem chi tiết.')
                                    } finally {
                                      setActionLoading(false)
                                    }
                                  }}
                                  className='text-slate-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded-md transition-colors mr-2 cursor-pointer'
                                >
                                  <ClipboardList size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeletePurchase('Product', e.expenseId)}
                                  className='text-slate-400 hover:text-[#b90a0a] p-1 hover:bg-red-50 rounded-md transition-colors cursor-pointer'
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className='text-center py-20 text-slate-400 text-xs font-bold'>
                      Không có khoản chi vận hành nào.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PURCHASES */}
              {activeTab === 'purchases' && (
                <div className='overflow-x-auto w-full'>
                  {combinedPurchases.length > 0 ? (
                    <table className='w-full text-left border-collapse'>
                      <thead>
                        <tr className='bg-[#e3effc] text-[#1e3a8a] text-[13px] font-black border-b border-[#cbd5e1]/40 select-none'>
                          <th className='py-3.5 px-5 font-bold'>Số hóa đơn</th>
                          <th className='py-3.5 px-5 font-bold'>Loại hàng nhập</th>
                          <th className='py-3.5 px-5 font-bold'>Đối tác nhà cung cấp</th>
                          <th className='py-3.5 px-5 font-bold'>Chi tiết nhập hàng</th>
                          <th className='py-3.5 px-5 font-bold'>Ngày nhập</th>
                          <th className='py-3.5 px-5 font-bold text-right'>Tổng tiền</th>
                          <th className='py-3.5 px-5 font-bold text-center w-24'>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-100 text-xs font-semibold text-gray-600'>
                        {combinedPurchases.map(p => (
                          <tr key={p.id} className='hover:bg-[#fcfdfe] transition-colors'>
                            <td className='py-4 px-5 text-gray-900 font-bold font-mono'>{p.invoiceNumber}</td>
                            <td className='py-4 px-5'>
                              <span className={`px-2 py-0.5 rounded-full border font-bold text-[10px] ${
                                p.type === 'Product'
                                  ? 'bg-purple-50 text-purple-600 border-purple-100'
                                  : 'bg-teal-50 text-teal-600 border-teal-100'
                              }`}>
                                {p.type === 'Product' ? 'Sản phẩm' : 'Nguyên liệu'}
                              </span>
                            </td>
                            <td className='py-4 px-5 font-bold text-slate-700'>{p.supplierName}</td>
                            <td className='py-4 px-5 max-w-xs truncate font-medium'>{p.summary}</td>
                            <td className='py-4 px-5 font-mono'>{new Date(p.date).toLocaleDateString('vi-VN')}</td>
                            <td className='py-4 px-5 text-right font-black text-orange-600 font-mono'>-{formatPrice(p.amount)} đ</td>
                            <td className='py-4 px-5 text-center'>
                              <button
                                onClick={async () => {
                                  try {
                                    setActionLoading(true)
                                    if (p.type === 'Product') {
                                      const detail = await getExpenseById(p.id)
                                      if (detail.success) {
                                        setSelectedExpenseDetail(detail.data)
                                        setSelectedMaterialDetail(null)
                                        setShowPurchaseDetailModal(true)
                                      }
                                    } else {
                                      const detail = await getIngredientPurchaseById(p.id)
                                      if (detail.success) {
                                        setSelectedMaterialDetail(detail.data)
                                        setSelectedExpenseDetail(null)
                                        setShowPurchaseDetailModal(true)
                                      }
                                    }
                                  } catch (err) {
                                    toast.error('Không thể xem chi tiết hóa đơn.')
                                  } finally {
                                    setActionLoading(false)
                                  }
                                }}
                                className='text-slate-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded-md transition-colors mr-2 cursor-pointer'
                              >
                                <ClipboardList size={15} />
                              </button>
                              <button
                                onClick={() => handleDeletePurchase(p.type, p.id)}
                                className='text-slate-400 hover:text-[#b90a0a] p-1 hover:bg-red-50 rounded-md transition-colors cursor-pointer'
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className='text-center py-20 text-slate-400 text-xs font-bold'>
                      Chưa có lịch sử hóa đơn nhập kho nào.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SUPPLIERS */}
              {activeTab === 'suppliers' && (
                <div className='overflow-x-auto w-full'>
                  {suppliers.length > 0 ? (
                    <table className='w-full text-left border-collapse'>
                      <thead>
                        <tr className='bg-[#e3effc] text-[#1e3a8a] text-[13px] font-black border-b border-[#cbd5e1]/40 select-none'>
                          <th className='py-3.5 px-5 font-bold'>Tên nhà cung cấp</th>
                          <th className='py-3.5 px-5 font-bold'>Người liên hệ</th>
                          <th className='py-3.5 px-5 font-bold'>Số điện thoại</th>
                          <th className='py-3.5 px-5 font-bold'>Địa chỉ</th>
                          <th className='py-3.5 px-5 font-bold'>Ghi chú</th>
                          <th className='py-3.5 px-5 font-bold text-center w-24'>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-100 text-xs font-semibold text-gray-600'>
                        {suppliers.map(s => (
                          <tr key={s.id} className='hover:bg-[#fcfdfe] transition-colors'>
                            <td className='py-4 px-5 text-gray-900 font-bold'>{s.name}</td>
                            <td className='py-4 px-5'>{s.contactName || '---'}</td>
                            <td className='py-4 px-5 font-mono'>{s.phoneNumber || '---'}</td>
                            <td className='py-4 px-5 max-w-xs truncate'>{s.address || '---'}</td>
                            <td className='py-4 px-5 text-[11px] text-gray-400'>{s.note || '---'}</td>
                            <td className='py-4 px-5 text-center'>
                              <button
                                onClick={() => {
                                  setEditingSupplier(s)
                                  setSupName(s.name)
                                  setSupContact(s.contactName || '')
                                  setSupPhone(s.phoneNumber || '')
                                  setSupAddress(s.address || '')
                                  setSupNote(s.note || '')
                                  setShowSupplierModal(true)
                                }}
                                className='text-slate-400 hover:text-amber-600 p-1 hover:bg-amber-50 rounded-md transition-colors mr-2 cursor-pointer'
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteSupplier(s.id)}
                                className='text-slate-400 hover:text-[#b90a0a] p-1 hover:bg-red-50 rounded-md transition-colors cursor-pointer'
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className='text-center py-20 text-slate-400 text-xs font-bold'>
                      Chưa có nhà cung cấp nào được lưu.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL 1 - THÊM CHI PHÍ VẬN HÀNH */}
      {showAddLedgerModal && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex items-center justify-between px-7 py-4 border-b border-orange-100 bg-orange-50/50'>
              <h3 className='text-[15px] font-bold text-gray-900 flex items-center gap-2'>
                <ArrowUpCircle size={18} className='text-orange-500 font-bold' />
                Ghi nhận khoản chi vận hành
              </h3>
              <button
                onClick={() => {
                  setShowAddLedgerModal(false)
                  resetLedgerForm()
                }}
                className='p-1 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none cursor-pointer'
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLedgerExpense} className='p-6 flex flex-col gap-4'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>
                  Nội dung chi phí <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  required
                  placeholder='Ví dụ: Tiền điện nước tháng 6...'
                  value={ledgerTitle}
                  onChange={e => setLedgerTitle(e.target.value)}
                  className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Danh mục chi</label>
                  <select
                    value={ledgerCategoryId}
                    onChange={e => setLedgerCategoryId(e.target.value)}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[13.5px] outline-hidden focus:border-orange-400 bg-white transition-all font-medium text-gray-800 cursor-pointer'
                  >
                    {categories
                      .filter(x => !x.name.toLowerCase().includes('nhập hàng'))
                      .map(cat => (
                        <option key={cat.expenseCategoryId} value={cat.expenseCategoryId}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>
                    Số tiền (đ) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    required
                    placeholder='0'
                    value={ledgerAmount}
                    onChange={e => {
                      const clean = e.target.value.replace(/\D/g, '')
                      setLedgerAmount(clean === '' ? '' : parseInt(clean).toLocaleString('vi-VN'))
                    }}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800 text-right font-mono'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Phương thức</label>
                  <select
                    value={ledgerMethod}
                    onChange={e => setLedgerMethod(e.target.value)}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[13.5px] outline-hidden focus:border-orange-400 bg-white transition-all font-medium text-gray-800 cursor-pointer'
                  >
                    <option value='Cash'>Tiền mặt</option>
                    <option value='Transfer'>Chuyển khoản</option>
                    <option value='EWallet'>Ví điện tử / Thẻ</option>
                  </select>
                </div>

                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Ngày chi</label>
                  <input
                    type='date'
                    value={ledgerDate}
                    onChange={e => setLedgerDate(e.target.value)}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800 font-mono'
                  />
                </div>
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>Ghi chú / Chi tiết</label>
                <textarea
                  placeholder='Nhập mô tả thêm...'
                  value={ledgerNote}
                  onChange={e => setLedgerNote(e.target.value)}
                  className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800 h-20 resize-none'
                />
              </div>

              <div className='flex items-center justify-end gap-3 mt-1 pt-4 border-t border-gray-100 select-none'>
                <button
                  type='button'
                  onClick={() => {
                    setShowAddLedgerModal(false)
                    resetLedgerForm()
                  }}
                  className='px-6 py-2 border border-gray-200 text-gray-600 text-[13px] font-bold rounded-[8px] hover:bg-gray-50 transition-colors cursor-pointer'
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  className='px-6 py-2 text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs bg-orange-500 hover:bg-orange-600 flex items-center gap-1.5 cursor-pointer'
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 size={13} className='animate-spin' />}
                  Ghi nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2 - NHÀ CUNG CẤP FORM (THÊM / SỬA) */}
      {showSupplierModal && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex items-center justify-between px-7 py-4 border-b border-red-100 bg-red-50/50'>
              <h3 className='text-[15px] font-bold text-gray-900 flex items-center gap-2'>
                <Building2 size={18} className='text-[#D32F2F]' />
                {editingSupplier ? 'Cập nhật đối tác cung cấp' : 'Thêm đối tác cung cấp mới'}
              </h3>
              <button
                onClick={() => {
                  setShowSupplierModal(false)
                  resetSupplierForm()
                }}
                className='p-1 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none cursor-pointer'
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className='p-6 flex flex-col gap-4'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>
                  Tên nhà cung cấp <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  required
                  placeholder='Nhập tên doanh nghiệp/đại lý...'
                  value={supName}
                  onChange={e => setSupName(e.target.value)}
                  className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Người liên hệ đại diện</label>
                  <input
                    type='text'
                    placeholder='Ví dụ: Anh Nguyễn Văn A...'
                    value={supContact}
                    onChange={e => setSupContact(e.target.value)}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Số điện thoại</label>
                  <input
                    type='text'
                    placeholder='Số điện thoại liên hệ...'
                    value={supPhone}
                    onChange={e => setSupPhone(e.target.value.replace(/\s+/g, ''))}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800 font-mono'
                  />
                </div>
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>Địa chỉ kho / văn phòng</label>
                <input
                  type='text'
                  placeholder='Địa chỉ nhà cung cấp...'
                  value={supAddress}
                  onChange={e => setSupAddress(e.target.value)}
                  className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800'
                />
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>Ghi chú đối tác</label>
                <textarea
                  placeholder='Thông tin bổ sung, mặt hàng cung cấp chủ yếu...'
                  value={supNote}
                  onChange={e => setSupNote(e.target.value)}
                  className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800 h-20 resize-none'
                />
              </div>

              <div className='flex items-center justify-end gap-3 mt-1 pt-4 border-t border-gray-100 select-none'>
                <button
                  type='button'
                  onClick={() => {
                    setShowSupplierModal(false)
                    resetSupplierForm()
                  }}
                  className='px-6 py-2 border border-gray-300 text-gray-600 text-[13px] font-bold rounded-[8px] hover:bg-gray-50 transition-colors cursor-pointer'
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  className='px-6 py-2 text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs bg-[#D32F2F] hover:bg-[#B71C1C] flex items-center gap-1.5 cursor-pointer'
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 size={13} className='animate-spin' />}
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3 - LẬP HÓA ĐƠN NHẬP KHO LỚN (BATCH PRODUCTS/INGREDIENTS IMPORT) */}
      {showAddPurchaseModal && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-3xl w-full overflow-hidden animate-in zoom-in-95 duration-200 my-8'>
            <div className='flex items-center justify-between px-8 py-4 border-b border-red-100 bg-red-50/50'>
              <h3 className='text-[15px] font-bold text-gray-900 flex items-center gap-2 select-none'>
                <Package size={18} className='text-[#D32F2F]' />
                Lập phiếu Nhập hàng & Chi phí kho
              </h3>
              <button
                onClick={() => {
                  setShowAddPurchaseModal(false)
                  resetPurchaseForm()
                }}
                className='p-1 text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none cursor-pointer'
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className='p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto'>
              {/* Form Metadata */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-100 pb-5'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[12.5px] font-bold text-gray-600'>Loại hàng hóa nhập <span className='text-red-500'>*</span></label>
                  <select
                    value={purchaseType}
                    onChange={e => {
                      setPurchaseType(e.target.value as any)
                      setPurchaseItems([]) // clear on type change
                    }}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[13.5px] outline-hidden focus:border-[#D32F2F] bg-white font-medium text-gray-800 cursor-pointer'
                  >
                    <option value='Product'>Sản phẩm bán hàng</option>
                    <option value='Material'>Nguyên vật liệu chế biến</option>
                  </select>
                </div>

                <div className='flex flex-col gap-1.5 relative'>
                  <div className='flex justify-between items-center select-none'>
                    <label className='text-[12.5px] font-bold text-gray-600'>Nhà cung cấp <span className='text-red-500'>*</span></label>
                    <button
                      type='button'
                      onClick={() => setShowQuickSupForm(!showQuickSupForm)}
                      className='text-[11px] font-extrabold text-[#D32F2F] hover:underline cursor-pointer'
                    >
                      {showQuickSupForm ? 'Đóng' : '+ Thêm nhanh'}
                    </button>
                  </div>
                  {showQuickSupForm ? (
                    <div className='absolute z-20 left-0 right-0 top-12 bg-white border border-gray-200 rounded-lg p-3 shadow-md flex flex-col gap-2'>
                      <input
                        type='text'
                        placeholder='Tên nhà cung cấp...'
                        value={quickSupName}
                        onChange={e => setQuickSupName(e.target.value)}
                        className='border border-gray-200 rounded-md p-1.5 text-xs outline-hidden focus:border-[#D32F2F]'
                      />
                      <input
                        type='text'
                        placeholder='Số điện thoại...'
                        value={quickSupPhone}
                        onChange={e => setQuickSupPhone(e.target.value.replace(/\s+/g, ''))}
                        className='border border-gray-200 rounded-md p-1.5 text-xs outline-hidden focus:border-[#D32F2F]'
                      />
                      <button
                        type='button'
                        onClick={handleQuickAddSupplier}
                        className='bg-[#D32F2F] text-white py-1 rounded text-xs font-bold cursor-pointer'
                      >
                        Tạo nhanh
                      </button>
                    </div>
                  ) : null}
                  <select
                    value={purchaseSupplierId}
                    onChange={e => setPurchaseSupplierId(e.target.value)}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[13.5px] outline-hidden focus:border-[#D32F2F] bg-white font-medium text-gray-800 cursor-pointer'
                  >
                    <option value=''>-- Chọn nhà cung cấp --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='flex flex-col gap-1.5'>
                  <label className='text-[12.5px] font-bold text-gray-600'>Số hóa đơn nhập hàng <span className='text-red-500'>*</span></label>
                  <input
                    type='text'
                    required
                    placeholder='Ví dụ: HDNK-003...'
                    value={purchaseInvoiceNumber}
                    onChange={e => setPurchaseInvoiceNumber(e.target.value)}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] font-semibold text-gray-800 font-mono'
                  />
                </div>
              </div>

              {/* Add item to invoice */}
              <div className='flex gap-4 items-end bg-slate-50 border border-slate-100 rounded-lg p-4'>
                <div className='flex-1 flex flex-col gap-1.5'>
                  <label className='text-[12.5px] font-bold text-slate-500 select-none'>
                    Chọn {purchaseType === 'Product' ? 'Sản phẩm' : 'Nguyên liệu'} để nhập
                  </label>
                  <select
                    value=''
                    onChange={e => {
                      if (e.target.value) addLineItem(e.target.value)
                    }}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[13.5px] outline-hidden focus:border-[#D32F2F] bg-white font-medium text-gray-800 cursor-pointer'
                  >
                    <option value=''>-- Nhấp để chọn mặt hàng --</option>
                    {purchaseType === 'Product'
                      ? dbProducts
                          .filter(x => !purchaseItems.some(item => item.itemId === x.id))
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatPrice(p.currentPrice || 0)}đ)
                            </option>
                          ))
                      : dbIngredients
                          .filter(x => !purchaseItems.some(item => item.itemId === x.id))
                          .map(i => (
                            <option key={i.id} value={i.id}>
                              {i.name} (mặc định: {formatPrice(i.estimatedPrice || 0)}đ)
                            </option>
                          ))}
                  </select>
                </div>
              </div>

              {/* Items Grid/Table inside Modal */}
              <div className='flex flex-col gap-3 min-h-[150px]'>
                <h4 className='text-[13px] font-black text-gray-500 uppercase tracking-wider select-none'>
                  Danh sách hàng nhập ({purchaseItems.length})
                </h4>

                {purchaseItems.length > 0 ? (
                  <div className='border border-slate-100 rounded-[12px] overflow-hidden'>
                    <table className='w-full text-left border-collapse text-xs font-semibold text-slate-700'>
                      <thead>
                        <tr className='bg-slate-100 text-slate-600 font-bold border-b border-slate-200 select-none'>
                          <th className='p-3'>Tên mặt hàng</th>
                          <th className='p-3 text-center w-20'>Số lượng</th>
                          <th className='p-3 text-right w-28'>Giá mua (đ)</th>
                          <th className='p-3 text-right w-24'>Giảm giá (đ)</th>
                          <th className='p-3 text-center w-20'>VAT (%)</th>
                          <th className='p-3 text-right w-28'>Thành tiền</th>
                          <th className='p-3 text-center w-12'></th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-slate-100 bg-white'>
                        {purchaseItems.map((item, idx) => {
                          let itemSubtotal = item.quantity * item.costPrice
                          itemSubtotal = Math.max(0, itemSubtotal - item.discountValue)
                          const itemTotal = itemSubtotal * (1 + item.taxPercent / 100)

                          return (
                            <tr key={item.itemId} className='hover:bg-slate-50/50 transition-colors'>
                              <td className='p-3 font-bold text-slate-800'>{item.name}</td>
                              <td className='p-3 text-center'>
                                <input
                                  type='number'
                                  min='1'
                                  value={item.quantity}
                                  onChange={e => updateLineItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                                  className='w-14 border border-slate-200 rounded px-1.5 py-1 text-center font-bold text-slate-800'
                                />
                              </td>
                              <td className='p-3 text-right'>
                                <input
                                  type='number'
                                  min='0'
                                  value={item.costPrice}
                                  onChange={e => updateLineItem(idx, { costPrice: parseFloat(e.target.value) || 0 })}
                                  className='w-24 border border-slate-200 rounded px-1.5 py-1 text-right font-bold text-slate-800 font-mono'
                                />
                              </td>
                              <td className='p-3 text-right'>
                                <input
                                  type='number'
                                  min='0'
                                  value={item.discountValue}
                                  onChange={e => updateLineItem(idx, { discountValue: parseFloat(e.target.value) || 0 })}
                                  className='w-20 border border-slate-200 rounded px-1.5 py-1 text-right font-bold text-slate-800 font-mono'
                                />
                              </td>
                              <td className='p-3 text-center'>
                                <select
                                  value={item.taxPercent}
                                  onChange={e => updateLineItem(idx, { taxPercent: parseInt(e.target.value) || 0 })}
                                  className='border border-slate-200 rounded px-1.5 py-1 font-bold text-slate-800 cursor-pointer bg-white'
                                >
                                  <option value={0}>0%</option>
                                  <option value={5}>5%</option>
                                  <option value={8}>8%</option>
                                  <option value={10}>10%</option>
                                </select>
                              </td>
                              <td className='p-3 text-right font-black text-slate-800 font-mono'>
                                {formatPrice(itemTotal)} đ
                              </td>
                              <td className='p-3 text-center'>
                                <button
                                  type='button'
                                  onClick={() => removeLineItem(idx)}
                                  className='text-gray-400 hover:text-[#b90a0a] p-1 rounded-md transition-colors cursor-pointer'
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className='flex-1 border-2 border-dashed border-slate-200 rounded-[12px] flex items-center justify-center py-10 text-slate-400 text-xs font-semibold select-none bg-slate-50/20'>
                    Chưa chọn mặt hàng nào để nhập kho.
                  </div>
                )}
              </div>

              {/* Form Footer inputs */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-5'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[12.5px] font-bold text-gray-600'>Ngày lập phiếu</label>
                  <input
                    type='date'
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] font-mono'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[12.5px] font-bold text-gray-600'>Ghi chú / Diễn giải hóa đơn</label>
                  <input
                    type='text'
                    placeholder='Nhập lý do chi nhập hàng...'
                    value={purchaseNote}
                    onChange={e => setPurchaseNote(e.target.value)}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F]'
                  />
                </div>
              </div>

              {/* Totals Summary */}
              {purchaseItems.length > 0 && (
                <div className='bg-red-50/30 rounded-[12px] border border-red-100/50 p-4 flex justify-between items-center select-none'>
                  <span className='font-extrabold text-slate-600 text-sm'>Tổng thanh toán hóa đơn</span>
                  <span className='font-black text-[#D32F2F] text-lg font-mono'>
                    {formatPrice(
                      purchaseItems.reduce((acc, curr) => {
                        let sub = curr.quantity * curr.costPrice
                        sub = Math.max(0, sub - curr.discountValue)
                        return acc + sub * (1 + curr.taxPercent / 100)
                      }, 0)
                    )} đ
                  </span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className='flex items-center justify-end gap-3 pt-4 border-t border-gray-100 select-none'>
                <button
                  type='button'
                  onClick={() => {
                    setShowAddPurchaseModal(false)
                    resetPurchaseForm()
                  }}
                  className='px-8 py-2 border border-gray-300 text-gray-600 text-[12.5px] font-bold rounded-[8px] hover:bg-gray-50 transition-colors cursor-pointer'
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  className='px-6 py-2 text-white text-[12.5px] font-bold rounded-[8px] transition-colors shadow-xs bg-[#D32F2F] hover:bg-[#B71C1C] flex items-center gap-1.5 cursor-pointer'
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 size={13} className='animate-spin' />}
                  Lưu hóa đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4 - XEM CHI TIẾT PHIẾU NHẬP HÀNG / CHI PHÍ VẬN HÀNH */}
      {showPurchaseDetailModal && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex items-center justify-between px-8 py-4 bg-[#fef2f2] border-b border-red-100'>
              <h3 className='text-[15px] font-bold text-gray-900'>
                {selectedExpenseDetail ? 'Chi tiết khoản chi phí' : 'Chi tiết phiếu nhập kho'}
              </h3>
              <button
                onClick={() => {
                  setShowPurchaseDetailModal(false)
                  setSelectedExpenseDetail(null)
                  setSelectedMaterialDetail(null)
                }}
                className='text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 cursor-pointer'
              >
                <X size={20} />
              </button>
            </div>

            <div className='p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto text-xs font-semibold text-slate-600 leading-normal'>
              {/* Product detail */}
              {selectedExpenseDetail && (
                <>
                  <div className='grid grid-cols-2 gap-4 border-b border-gray-100 pb-4'>
                    <div>
                      <span className='text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5'>Nội dung chi</span>
                      <span className='text-gray-800 text-sm font-bold'>{selectedExpenseDetail.expenseTitle}</span>
                    </div>
                    <div>
                      <span className='text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5'>Ngày chi</span>
                      <span className='text-gray-800 font-bold font-mono'>{new Date(selectedExpenseDetail.expenseDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4 border-b border-gray-100 pb-4'>
                    <div>
                      <span className='text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5'>Danh mục</span>
                      <span className='bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100 font-bold text-[9px] inline-block mt-0.5'>
                        {selectedExpenseDetail.categoryName}
                      </span>
                    </div>
                    {selectedExpenseDetail.supplierName && (
                      <div>
                        <span className='text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5'>Đối tác cung cấp</span>
                        <span className='text-gray-800 font-bold'>{selectedExpenseDetail.supplierName}</span>
                      </div>
                    )}
                  </div>

                  {selectedExpenseDetail.note && (
                    <div className='bg-slate-50 border border-slate-100 rounded-lg p-4'>
                      <span className='text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-2 select-none'>Nội dung diễn giải</span>
                      <pre className='text-slate-800 font-bold text-xs font-sans whitespace-pre-wrap leading-relaxed'>
                        {selectedExpenseDetail.note}
                      </pre>
                    </div>
                  )}

                  <div className='flex justify-between border-t border-gray-100 pt-4 items-center'>
                    <span className='font-black text-gray-800 text-sm'>Tổng tiền chi tiêu:</span>
                    <span className='font-black text-orange-600 text-lg font-mono'>
                      -{formatPrice(selectedExpenseDetail.amount)} đ
                    </span>
                  </div>
                </>
              )}

              {/* Material detail */}
              {selectedMaterialDetail && (
                <>
                  <div className='grid grid-cols-2 gap-4 border-b border-gray-100 pb-4'>
                    <div>
                      <span className='text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5'>Số hóa đơn</span>
                      <span className='text-gray-800 text-sm font-bold font-mono'>{selectedMaterialDetail.invoiceNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className='text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5'>Ngày lập phiếu</span>
                      <span className='text-gray-800 font-bold font-mono'>{new Date(selectedMaterialDetail.purchaseDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4 border-b border-gray-100 pb-4'>
                    <div>
                      <span className='text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5'>Nguyên liệu nhập</span>
                      <span className='text-gray-800 font-bold text-sm'>{selectedMaterialDetail.ingredientName}</span>
                    </div>
                    <div>
                      <span className='text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5'>Nhà cung cấp</span>
                      <span className='text-gray-800 font-bold'>{selectedMaterialDetail.supplierName || 'Vãng lai'}</span>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4 border-b border-gray-100 pb-4'>
                    <div>
                      <span className='text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5'>Số lượng nhập</span>
                      <span className='text-gray-800 font-bold text-sm font-mono'>
                        {selectedMaterialDetail.quantity} {selectedMaterialDetail.ingredientUnit || 'đơn vị'}
                      </span>
                    </div>
                  </div>

                  <div className='flex justify-between border-t border-gray-100 pt-4 items-center'>
                    <span className='font-black text-gray-800 text-sm'>Tổng thanh toán phiếu chi:</span>
                    <span className='font-black text-orange-600 text-lg font-mono'>
                      -{formatPrice(selectedMaterialDetail.totalCost)} đ
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}