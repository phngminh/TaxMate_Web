import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Scan,
  Trash2,
  Edit2,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
} from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../../components/ui/pagination'
import { toast } from 'react-toastify'
import type { ExpenseCategory } from '../../../types/expense.type'
import type { IncomeCategory } from '../../../types/income.type'
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from '../../../apis/expense.api'
import {
  getIncomeCategories,
  createIncomeCategory,
  updateIncomeCategory,
  deleteIncomeCategory,
} from '../../../apis/income.api'
import { useBusiness } from '../../../contexts/BusinessContext'

type Tab = 'expense' | 'income'

type ConfirmAction =
  | { type: 'delete-expense-category'; id: string; name: string }
  | { type: 'delete-income-category'; id: string; name: string }

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  return new Date(typeof iso === 'string' && !iso.endsWith('Z') ? iso + 'Z' : iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ExpenseCategoryPage() {
  const { currentBusiness } = useBusiness()
  const businessId = currentBusiness?.id

  const [activeTab, setActiveTab] = useState<Tab>('expense')
  const [searchQuery, setSearchQuery] = useState('')

  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(false)

  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>([])
  const [loadingIncomes, setLoadingIncomes] = useState(false)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)

  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [isConfirmLoading, setIsConfirmLoading] = useState(false)

  const addNewDropdownRef = useRef<HTMLDivElement>(null)
  const [addNewDropdownOpen, setAddNewDropdownOpen] = useState(false)

  const fetchExpenseCategories = useCallback(async () => {
    if (!businessId) return
    setLoadingExpenses(true)
    try {
      const res = await getExpenseCategories(businessId)
      setExpenseCategories(res.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Không tải được danh mục khoản chi.')
    } finally {
      setLoadingExpenses(false)
    }
  }, [businessId])

  const fetchIncomeCategories = useCallback(async () => {
    if (!businessId) return
    setLoadingIncomes(true)
    try {
      const res = await getIncomeCategories(businessId)
      setIncomeCategories(res.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Không tải được danh mục khoản thu.')
    } finally {
      setLoadingIncomes(false)
    }
  }, [businessId])

  useEffect(() => {
    if (!businessId) return
    if (activeTab === 'expense') {
      fetchExpenseCategories()
    } else {
      fetchIncomeCategories()
    }
    setSearchQuery('')
  }, [activeTab, businessId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addNewDropdownRef.current && !addNewDropdownRef.current.contains(event.target as Node)) {
        setAddNewDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredExpenseCategories = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return expenseCategories.filter(
      (c) => c.categoryName.toLowerCase().includes(q)
    )
  }, [expenseCategories, searchQuery])

  const filteredIncomeCategories = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return incomeCategories.filter(
      (c) => c.categoryName.toLowerCase().includes(q)
    )
  }, [incomeCategories, searchQuery])

  const [expensePage, setExpensePage] = useState(1)
  const [incomePage, setIncomePage] = useState(1)
  const pageSize = 10

  const paginatedExpenseCategories = useMemo(() => {
    const start = (expensePage - 1) * pageSize
    return filteredExpenseCategories.slice(start, start + pageSize)
  }, [filteredExpenseCategories, expensePage])
  const totalExpensePages = Math.ceil(filteredExpenseCategories.length / pageSize)

  const paginatedIncomeCategories = useMemo(() => {
    const start = (incomePage - 1) * pageSize
    return filteredIncomeCategories.slice(start, start + pageSize)
  }, [filteredIncomeCategories, incomePage])
  const totalIncomePages = Math.ceil(filteredIncomeCategories.length / pageSize)

  const closeModal = () => {
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setEditingCategory(null)
    setFormName('')
    setFormDescription('')
  }

  const handleOpenAdd = (type: Tab) => {
    setAddNewDropdownOpen(false)
    setActiveTab(type)
    setFormName('')
    setFormDescription('')
    setIsAddModalOpen(true)
  }

  const handleOpenEdit = (category: any, type: Tab) => {
    setActiveTab(type)
    setEditingCategory(category)
    setFormName(category.categoryName)
    setFormDescription(category.description || '')
    setIsEditModalOpen(true)
  }

  const handleDelete = (category: any, type: Tab) => {
    if (type === 'expense') {
      setConfirmAction({
        type: 'delete-expense-category',
        id: category.expenseCategoryId,
        name: category.categoryName,
      })
    } else {
      setConfirmAction({
        type: 'delete-income-category',
        id: category.incomeCategoryId,
        name: category.categoryName,
      })
    }
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error('Vui lòng nhập tên danh mục.')
      return
    }
    if (!businessId) return

    try {
      if (isAddModalOpen) {
        if (activeTab === 'expense') {
          await createExpenseCategory(businessId, { categoryName: formName.trim(), description: formDescription.trim() })
          toast.success('Thêm danh mục chi thành công.')
          fetchExpenseCategories()
        } else {
          await createIncomeCategory(businessId, { categoryName: formName.trim(), description: formDescription.trim() })
          toast.success('Thêm danh mục thu thành công.')
          fetchIncomeCategories()
        }
      } else if (isEditModalOpen && editingCategory) {
        if (activeTab === 'expense') {
          await updateExpenseCategory(editingCategory.expenseCategoryId, { categoryName: formName.trim(), description: formDescription.trim() })
          toast.success('Cập nhật danh mục chi thành công.')
          fetchExpenseCategories()
        } else {
          await updateIncomeCategory(editingCategory.incomeCategoryId, { categoryName: formName.trim(), description: formDescription.trim() })
          toast.success('Cập nhật danh mục thu thành công.')
          fetchIncomeCategories()
        }
      }
      closeModal()
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại.')
    }
  }

  const executeConfirm = async () => {
    if (!confirmAction) return
    setIsConfirmLoading(true)

    try {
      switch (confirmAction.type) {
        case 'delete-expense-category':
          await deleteExpenseCategory(confirmAction.id)
          toast.success('Đã xoá danh mục chi.')
          await fetchExpenseCategories()
          break
        case 'delete-income-category':
          await deleteIncomeCategory(confirmAction.id)
          toast.success('Đã xoá danh mục thu.')
          await fetchIncomeCategories()
          break
      }
      setConfirmAction(null)
    } catch (err) {
      toast.error('Không thể xoá danh mục này. Có thể danh mục đang được sử dụng.')
    } finally {
      setIsConfirmLoading(false)
    }
  }

  if (!businessId) {
    return (
      <div className='flex items-center justify-center min-h-[calc(100vh-51px)] bg-[#f8f9fa]'>
        <p className='text-gray-500 font-medium'>Vui lòng chọn doanh nghiệp để quản lý danh mục.</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col bg-[#f8f9fa] min-h-[calc(100vh-51px)] w-full'>
      <div className='flex items-center justify-between px-8 py-4 gap-4 bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'>
        <div className='ml-96 flex-1 max-w-4xl flex items-center bg-white border border-gray-300 rounded-lg px-5 py-2.5 shadow-xs focus-within:border-[#f97316] focus-within:ring-1 focus-within:ring-[#f97316]/20 transition-all'>
          <Scan className='text-[#f97316] mr-3 size-5 shrink-0 stroke-2' />
          <input
            type='text'
            placeholder='Tìm kiếm danh mục..'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='grow bg-transparent outline-hidden text-[14px] text-gray-800 placeholder-gray-400 font-medium'
          />
          <Search className='text-gray-400 size-5 shrink-0 hover:text-gray-600 transition-colors cursor-pointer' />
        </div>

        <div className='relative' ref={addNewDropdownRef}>
          <div className='flex items-center bg-[#f97316] text-white rounded-[10px] overflow-hidden shadow-[0px_4px_10px_rgba(249,115,22,0.2)] hover:shadow-[0px_6px_14px_rgba(249,115,22,0.3)] transition-all'>
            <button
              onClick={() => setAddNewDropdownOpen(!addNewDropdownOpen)}
              className='px-5 py-2.5 text-[14px] font-bold hover:bg-[#ea580c] active:bg-[#c2410c] transition-colors flex items-center gap-2'
            >
              <Plus size={16} strokeWidth={2.5} /> Thêm mới
            </button>
          </div>

          {addNewDropdownOpen && (
            <div className='absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-[10px] shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150'>
              <button
                onClick={() => handleOpenAdd('expense')}
                className='w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-[#fff7ed] hover:text-[#f97316] transition-colors flex items-center gap-2 font-medium'
              >
                <Plus size={14} /> Thêm loại khoản chi
              </button>
              <button
                onClick={() => handleOpenAdd('income')}
                className='w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-[#ecfdf5] hover:text-[#10b981] transition-colors flex items-center gap-2 font-medium'
              >
                <Plus size={14} /> Thêm loại khoản thu
              </button>
            </div>
          )}
        </div>
      </div>

      <div className='flex grow w-full'>
        <div className='w-72 bg-white border-r border-[#ffe5e5] p-6 flex flex-col gap-4 shrink-0'>
          <span className='text-[13px] font-bold text-gray-500 uppercase tracking-wide'>Danh mục</span>
          <div className='flex flex-col gap-1'>
            <button
              onClick={() => setActiveTab('expense')}
              className={`flex items-center gap-3 px-4 py-3 rounded-[10px] text-[13.5px] font-semibold transition-all ${
                activeTab === 'expense'
                  ? 'bg-[#fff7ed] text-[#ea580c]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ArrowUpCircle size={17} className={activeTab === 'expense' ? 'text-[#ea580c]' : 'text-gray-400'} />
              Loại khoản chi
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`flex items-center gap-3 px-4 py-3 rounded-[10px] text-[13.5px] font-semibold transition-all ${
                activeTab === 'income'
                  ? 'bg-[#ecfdf5] text-[#059669]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ArrowDownCircle size={17} className={activeTab === 'income' ? 'text-[#059669]' : 'text-gray-400'} />
              Loại khoản thu
            </button>
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className='mt-auto flex items-center justify-center gap-2 border border-dashed border-[#f97316] hover:bg-[#fff7ed] text-[#ea580c] text-[13px] font-bold py-2.5 rounded-[8px] transition-colors'
            >
              <RotateCcw size={14} /> Xoá tìm kiếm
            </button>
          )}
        </div>

        <div className='grow p-8 overflow-x-auto'>
          {activeTab === 'expense' && (
            loadingExpenses ? (
              <div className='flex justify-center py-10'><div className='animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500'></div></div>
            ) : (
              <div className='bg-white rounded-[12px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden min-w-175'>
                <table className='w-full text-left border-collapse'>
                  <thead>
                    <tr className='bg-[#fff7ed] text-[#ea580c] text-[13.5px] font-bold border-b border-orange-100/50'>
                      <th className='py-4 px-6 font-semibold tracking-wide'>Tên loại khoản chi</th>
                      <th className='py-4 px-6 font-semibold tracking-wide text-center'>Ngày tạo</th>
                      <th className='py-4 px-6 font-semibold tracking-wide text-center w-28'>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {paginatedExpenseCategories.length > 0 ? (
                      paginatedExpenseCategories.map((item) => (
                        <tr key={item.expenseCategoryId} className='hover:bg-[#fcfdfe] transition-colors group'>
                          <td className='py-4 px-6 text-[14px] text-gray-900 font-bold'>{item.categoryName}</td>
                          <td className='py-4 px-6 text-[13px] text-gray-500 text-center'>{formatDate(item.createdAt)}</td>
                          <td className='py-4 px-6 text-center'>
                            <div className='flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity'>
                              <button
                                onClick={() => handleOpenEdit(item, 'expense')}
                                className='p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors'
                                title='Sửa'
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(item, 'expense')}
                                className='p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors'
                                title='Xoá'
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className='py-16 text-center text-gray-500 text-[14px]'>
                          Không tìm thấy loại khoản chi nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === 'income' && (
            loadingIncomes ? (
              <div className='flex justify-center py-10'><div className='animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500'></div></div>
            ) : (
              <div className='bg-white rounded-[12px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden min-w-175'>
                <table className='w-full text-left border-collapse'>
                  <thead>
                    <tr className='bg-[#ecfdf5] text-[#059669] text-[13.5px] font-bold border-b border-emerald-100/50'>
                      <th className='py-4 px-6 font-semibold tracking-wide'>Tên loại khoản thu</th>
                      <th className='py-4 px-6 font-semibold tracking-wide text-center'>Ngày tạo</th>
                      <th className='py-4 px-6 font-semibold tracking-wide text-center w-28'>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {paginatedIncomeCategories.length > 0 ? (
                      paginatedIncomeCategories.map((item) => (
                        <tr key={item.incomeCategoryId} className='hover:bg-[#fcfdfe] transition-colors group'>
                          <td className='py-4 px-6 text-[14px] text-gray-900 font-bold'>
                            {item.categoryName}
                            {item.isDefault && <span className='ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded'>Mặc định</span>}
                          </td>
                          <td className='py-4 px-6 text-[13px] text-gray-500 text-center'>{formatDate(item.createdAt)}</td>
                          <td className='py-4 px-6 text-center'>
                            {!item.isDefault && (
                              <div className='flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity'>
                                <button
                                  onClick={() => handleOpenEdit(item, 'income')}
                                  className='p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors'
                                  title='Sửa'
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => handleDelete(item, 'income')}
                                  className='p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors'
                                  title='Xoá'
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className='py-16 text-center text-gray-500 text-[14px]'>
                          Không tìm thấy loại khoản thu nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === 'expense' && totalExpensePages > 1 && (
            <div className='mt-4 mb-12'>
              <Pagination className='mt-6'>
                <PaginationContent className='gap-2'>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setExpensePage(Math.max(1, expensePage - 1))}
                      className={`h-10 px-4 rounded-lg border transition-all ${
                        expensePage === 1
                          ? 'pointer-events-none opacity-40'
                          : 'cursor-pointer hover:bg-orange-50 hover:border-orange-300 hover:text-[#ea580c]'
                      }`}
                    />
                  </PaginationItem>

                  {[...Array(totalExpensePages)].map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        onClick={() => setExpensePage(i + 1)}
                        isActive={expensePage === i + 1}
                        className={`size-10 rounded-lg border transition-all cursor-pointer ${
                          expensePage === i + 1
                            ? 'bg-[#ea580c] text-white border-[#ea580c] hover:bg-[#c2410c]'
                            : 'hover:bg-orange-50 hover:border-orange-300 hover:text-[#ea580c]'
                        }`}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setExpensePage(Math.min(totalExpensePages, expensePage + 1))}
                      className={`h-10 px-4 rounded-lg border transition-all ${
                        expensePage === totalExpensePages
                          ? 'pointer-events-none opacity-40'
                          : 'cursor-pointer hover:bg-orange-50 hover:border-orange-300 hover:text-[#ea580c]'
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {activeTab === 'income' && totalIncomePages > 1 && (
            <div className='mt-4 mb-12'>
              <Pagination className='mt-6'>
                <PaginationContent className='gap-2'>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setIncomePage(Math.max(1, incomePage - 1))}
                      className={`h-10 px-4 rounded-lg border transition-all ${
                        incomePage === 1
                          ? 'pointer-events-none opacity-40'
                          : 'cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 hover:text-[#059669]'
                      }`}
                    />
                  </PaginationItem>

                  {[...Array(totalIncomePages)].map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        onClick={() => setIncomePage(i + 1)}
                        isActive={incomePage === i + 1}
                        className={`size-10 rounded-lg border transition-all cursor-pointer ${
                          incomePage === i + 1
                            ? 'bg-[#059669] text-white border-[#059669] hover:bg-[#047857]'
                            : 'hover:bg-emerald-50 hover:border-emerald-300 hover:text-[#059669]'
                        }`}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setIncomePage(Math.min(totalIncomePages, incomePage + 1))}
                      className={`h-10 px-4 rounded-lg border transition-all ${
                        incomePage === totalIncomePages
                          ? 'pointer-events-none opacity-40'
                          : 'cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 hover:text-[#059669]'
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className={`flex items-center justify-between px-7 py-4 border-b ${activeTab === 'expense' ? 'border-orange-100 bg-orange-50/50' : 'border-emerald-100 bg-emerald-50/50'}`}>
              <h3 className='text-[15px] font-bold text-gray-900 flex items-center gap-2'>
                {activeTab === 'expense' ? <ArrowUpCircle size={18} className='text-orange-500' /> : <ArrowDownCircle size={18} className='text-emerald-500' />}
                {isAddModalOpen ? 'Thêm mới' : 'Cập nhật'} danh mục
              </h3>
              <button onClick={closeModal} className='p-1 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none'>✕</button>
            </div>
            <form className='p-6 flex flex-col gap-4' onSubmit={handleSaveCategory}>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>Tên danh mục <span className='text-red-500'>*</span></label>
                <input
                  name='categoryName'
                  type='text'
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder={activeTab === 'expense' ? 'Ví dụ: Chi phí điện nước' : 'Ví dụ: Bán hàng'}
                  className={`w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden transition-all font-medium text-gray-800 ${activeTab === 'expense' ? 'focus:border-orange-400' : 'focus:border-emerald-400'}`}
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>Mô tả (tuỳ chọn)</label>
                <textarea
                  name='description'
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder='Ghi chú thêm về danh mục này'
                  rows={3}
                  className={`w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden transition-all font-medium text-gray-800 ${activeTab === 'expense' ? 'focus:border-orange-400' : 'focus:border-emerald-400'}`}
                />
              </div>
              <div className='flex items-center justify-end gap-3 mt-2 pt-4 border-t border-gray-100'>
                <button type='button' onClick={closeModal} className='px-6 py-2 border-2 border-gray-200 text-gray-600 text-[13px] font-bold rounded-[8px] hover:bg-gray-50 transition-colors'>Hủy</button>
                <button type='submit' className='px-6 py-2 text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs' style={{ background: activeTab === 'expense' ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmAction && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-sm w-full overflow-hidden p-6 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center'>
            <div className='size-12 rounded-full bg-red-100 flex items-center justify-center mb-4'>
              <Trash2 size={24} className='text-red-600' />
            </div>
            <h3 className='text-lg font-bold text-gray-900 mb-2'>Xoá danh mục</h3>
            <p className='text-[13.5px] text-gray-600 mb-6'>
              Bạn có chắc muốn xoá danh mục <strong>"{confirmAction.name}"</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className='flex items-center gap-3 w-full'>
              <button
                onClick={() => setConfirmAction(null)}
                className='flex-1 py-2.5 bg-gray-100 text-gray-700 text-[13.5px] font-bold rounded-[8px] hover:bg-gray-200 transition-colors'
                disabled={isConfirmLoading}
              >
                Hủy
              </button>
              <button
                onClick={executeConfirm}
                className='flex-1 py-2.5 bg-red-600 text-white text-[13.5px] font-bold rounded-[8px] hover:bg-red-700 transition-colors flex items-center justify-center'
                disabled={isConfirmLoading}
              >
                {isConfirmLoading ? (
                  <div className='size-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                ) : (
                  'Xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
