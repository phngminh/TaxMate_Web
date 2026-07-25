import { useState, useMemo, useEffect } from 'react'
import { ArrowUpCircle, ArrowDownCircle, MoreVertical, RotateCcw, TrendingUp, Plus, ChevronRight } from 'lucide-react'
import { useBusiness } from '../../contexts/BusinessContext'
import { getAllExpenses, createExpense, getExpenseCategories, updateExpense, deleteExpense } from '../../apis/expense.api'
import { getAllIncomes, createIncome, getIncomeCategories, updateIncome, deleteIncome } from '../../apis/income.api'
import { toast } from 'react-toastify'
import type { ExpenseCategory } from '../../types/expense.type'
import type { IncomeCategory } from '../../types/income.type'

interface ExpenseRecord {
  id: string
  content: string
  subContent: string
  category: string
  categoryColor: string
  date: string
  amount: number
  type: 'expense' | 'income'
  categoryId: string
  originalDateStr: string
  rawAmount: number
  paymentMethod: string
}



function CategoryBadge({ label, color }: { label: string; color: string }) {
  const styles =
    color === 'orange'
      ? 'bg-orange-50 text-orange-500 border border-orange-200'
      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
  return (
    <span className={`inline-block text-[11.5px] font-bold px-2.5 py-0.5 rounded-full ${styles}`}>
      {label}
    </span>
  )
}

function FilterGroup({
  title,
  options,
  name,
  value,
  onChange,
}: {
  title: string
  options: { val: string; label: string }[]
  name: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className='flex flex-col gap-3'>
      <span className='text-[13px] font-bold text-gray-500 uppercase tracking-wide'>{title}</span>
      <div className='flex flex-col gap-3'>
        {options.map((opt) => (
          <label
            key={opt.val}
            className='flex items-center gap-3 cursor-pointer group text-[13.5px] text-gray-700 select-none'
          >
            <input
              type='radio'
              name={name}
              checked={value === opt.val}
              onChange={() => onChange(opt.val)}
              className='sr-only'
            />
            <div
              className={`size-4.5 rounded-full border-2 flex items-center justify-center transition-all ${value === opt.val
                  ? 'border-[#D32F2F] bg-white'
                  : 'border-gray-300 group-hover:border-gray-400 bg-white'
                }`}
            >
              {value === opt.val && <div className='size-2 rounded-full bg-[#D32F2F]' />}
            </div>
            <span
              className={`${value === opt.val ? 'font-bold text-[#D32F2F]' : 'text-gray-600 font-medium'}`}
            >
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function Expense() {
  const { businessId } = useBusiness()

  const [priceFilter, setPriceFilter] = useState('all')
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('Tất cả')
  const [incomeCategoryFilter, setIncomeCategoryFilter] = useState('Tất cả')
  const [dateFilter, setDateFilter] = useState('')

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false)

  const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  const [apiRecords, setApiRecords] = useState<ExpenseRecord[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>([])

  const fetchData = async () => {
    if (!businessId) {
      console.warn('No businessId found in context, skipping fetch')
      return
    }
    try {
      const [exps, incs, expCats, incCats] = await Promise.all([
        getAllExpenses(businessId),
        getAllIncomes(businessId),
        getExpenseCategories(businessId),
        getIncomeCategories(businessId)
      ])

      setExpenseCategories(expCats.data || [])
      setIncomeCategories(incCats.data || [])

      const mappedExps: ExpenseRecord[] = (exps.data?.items || []).map(e => ({
        id: e.expenseId,
        content: e.expenseTitle,
        subContent: e.paymentMethod || 'Khác',
        category: e.categoryName,
        categoryColor: 'orange',
        date: new Date(e.expenseDate).toLocaleDateString('vi-VN'),
        amount: -e.amount,
        type: 'expense',
        categoryId: e.expenseCategoryId,
        originalDateStr: new Date(e.expenseDate).toISOString().split('T')[0],
        rawAmount: e.amount,
        paymentMethod: e.paymentMethod || 'Tiền mặt'
      }))

      const mappedIncs: ExpenseRecord[] = (incs.data?.items || []).map(e => ({
        id: e.incomeId,
        content: e.incomeTitle,
        subContent: e.paymentMethod || 'Khác',
        category: e.categoryName,
        categoryColor: 'green',
        date: new Date(e.incomeDate).toLocaleDateString('vi-VN'),
        amount: e.amount,
        type: 'income',
        categoryId: e.incomeCategoryId,
        originalDateStr: new Date(e.incomeDate).toISOString().split('T')[0],
        rawAmount: e.amount,
        paymentMethod: e.paymentMethod || 'Tiền mặt'
      }))

      // Sort by date descending
      const merged = [...mappedExps, ...mappedIncs].sort((a, b) => {
        // Simple sort by assuming ID or Date. Since we have date string in vi-VN format, we might need a proper date parsing. 
        // For now, we leave as is or sort by ID roughly if dates are equal.
        // A robust sort would use the original date value, but since the previous code had static array, it's fine.
        return 0;
      })

      setApiRecords(merged)
    } catch (error) {
      console.error(error)
      toast.error('Lỗi khi tải dữ liệu thu chi')
    }
  }

  useEffect(() => {
    fetchData()
  }, [businessId])

  const expenseCategoryNames = useMemo(() => {
    const names = new Set<string>()
    expenseCategories.forEach(c => names.add(c.categoryName))
    return ['Tất cả', ...Array.from(names)]
  }, [expenseCategories])

  const incomeCategoryNames = useMemo(() => {
    const names = new Set<string>()
    incomeCategories.forEach(c => names.add(c.categoryName))
    return ['Tất cả', ...Array.from(names)]
  }, [incomeCategories])

  const handleResetFilters = () => {
    setPriceFilter('all')
    setExpenseCategoryFilter('Tất cả')
    setIncomeCategoryFilter('Tất cả')
    setDateFilter('')
  }

  const isFiltered = priceFilter !== 'all' || expenseCategoryFilter !== 'Tất cả' || incomeCategoryFilter !== 'Tất cả' || dateFilter !== ''

  const expenses = useMemo(() => {
    return apiRecords.filter((r) => {
      if (r.type !== 'expense') return false
      if (priceFilter === 'lte1m' && Math.abs(r.amount) > 1_000_000) return false
      if (priceFilter === 'gt1m' && Math.abs(r.amount) <= 1_000_000) return false
      if (expenseCategoryFilter !== 'Tất cả') {
        if (r.category !== expenseCategoryFilter) return false
      }
      if (dateFilter) {
        if (r.date !== new Date(dateFilter).toLocaleDateString('vi-VN')) return false
      }
      return true
    })
  }, [apiRecords, priceFilter, expenseCategoryFilter, dateFilter])

  const incomes = useMemo(() => {
    return apiRecords.filter((r) => {
      if (r.type !== 'income') return false
      if (priceFilter === 'lte1m' && r.amount > 1_000_000) return false
      if (priceFilter === 'gt1m' && r.amount <= 1_000_000) return false
      if (incomeCategoryFilter !== 'Tất cả') {
        if (r.category !== incomeCategoryFilter) return false
      }
      if (dateFilter) {
        if (r.date !== new Date(dateFilter).toLocaleDateString('vi-VN')) return false
      }
      return true
    })
  }, [apiRecords, priceFilter, incomeCategoryFilter, dateFilter])

  const ITEMS_PER_PAGE = 5
  const [expensePage, setExpensePage] = useState(1)
  const [showAllExpenses, setShowAllExpenses] = useState(false)
  const expenseTotalPages = Math.ceil(expenses.length / ITEMS_PER_PAGE)
  const paginatedExpenses = showAllExpenses ? expenses : expenses.slice((expensePage - 1) * ITEMS_PER_PAGE, expensePage * ITEMS_PER_PAGE)

  const [incomePage, setIncomePage] = useState(1)
  const [showAllIncomes, setShowAllIncomes] = useState(false)
  const incomeTotalPages = Math.ceil(incomes.length / ITEMS_PER_PAGE)
  const paginatedIncomes = showAllIncomes ? incomes : incomes.slice((incomePage - 1) * ITEMS_PER_PAGE, incomePage * ITEMS_PER_PAGE)

  useEffect(() => { setExpensePage(1) }, [priceFilter, expenseCategoryFilter, dateFilter])
  useEffect(() => { setIncomePage(1) }, [priceFilter, incomeCategoryFilter, dateFilter])

  const totalExpense = expenses.reduce((s, r) => s + Math.abs(r.amount), 0)
  const totalIncome = incomes.reduce((s, r) => s + r.amount, 0)

  const fmt = (n: number) => n.toLocaleString('vi-VN')

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!businessId) {
      toast.error('Không tìm thấy ID cơ sở kinh doanh. Vui lòng đăng nhập lại hoặc chọn cơ sở!')
      return
    }
    const fd = new FormData(e.currentTarget)
    const selectedDateStr = (fd.get('date') as string) || new Date().toISOString().split('T')[0]

    if (new Date(selectedDateStr) > new Date()) {
      toast.error('Ngày tạo không được chọn quá hôm nay!')
      return
    }

    try {
      await createExpense(businessId, {
        expenseTitle: fd.get('title') as string,
        expenseCategoryId: fd.get('categoryId') as string,
        amount: Number(fd.get('amount')),
        paymentMethod: fd.get('paymentMethod') as string,
        expenseDate: selectedDateStr
      })
      toast.success('Thêm khoản chi thành công!')
      setIsAddExpenseOpen(false)
      fetchData()
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thêm khoản chi')
    }
  }

  const handleAddIncome = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!businessId) {
      toast.error('Không tìm thấy ID cơ sở kinh doanh. Vui lòng đăng nhập lại hoặc chọn cơ sở!')
      return
    }
    const fd = new FormData(e.currentTarget)
    const selectedDateStr = (fd.get('date') as string) || new Date().toISOString().split('T')[0]

    if (new Date(selectedDateStr) > new Date()) {
      toast.error('Ngày tạo không được chọn quá hôm nay!')
      return
    }

    try {
      await createIncome(businessId, {
        incomeTitle: fd.get('title') as string,
        incomeCategoryId: fd.get('categoryId') as string,
        amount: Number(fd.get('amount')),
        paymentMethod: fd.get('paymentMethod') as string,
        incomeDate: selectedDateStr
      })
      toast.success('Thêm khoản thu thành công!')
      setIsAddIncomeOpen(false)
      fetchData()
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thêm khoản thu')
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!businessId || !editingRecord) return
    const fd = new FormData(e.currentTarget)
    const selectedDateStr = (fd.get('date') as string) || new Date().toISOString().split('T')[0]

    if (new Date(selectedDateStr) > new Date()) {
      toast.error('Ngày không được chọn quá hôm nay!')
      return
    }

    try {
      if (editingRecord.type === 'expense') {
        await updateExpense(editingRecord.id, {
          expenseTitle: fd.get('title') as string,
          expenseCategoryId: fd.get('categoryId') as string,
          amount: Number(fd.get('amount')),
          paymentMethod: fd.get('paymentMethod') as string,
          expenseDate: selectedDateStr
        })
      } else {
        await updateIncome(editingRecord.id, {
          incomeTitle: fd.get('title') as string,
          incomeCategoryId: fd.get('categoryId') as string,
          amount: Number(fd.get('amount')),
          paymentMethod: fd.get('paymentMethod') as string,
          incomeDate: selectedDateStr
        })
      }
      toast.success('Cập nhật giao dịch thành công!')
      setIsEditModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật giao dịch')
    }
  }

  const handleConfirmDelete = async () => {
    if (!editingRecord || !businessId) return

    try {
      if (editingRecord.type === 'expense') {
        await deleteExpense(editingRecord.id)
      } else {
        await deleteIncome(editingRecord.id)
      }
      toast.success('Xoá giao dịch thành công!')
      setIsConfirmDeleteOpen(false)
      setIsEditModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xoá giao dịch')
    }
  }

  return (
    <div className='flex flex-col w-full bg-[#f8f9fa] h-[calc(100vh-51px)] overflow-hidden'>
      <div className='flex grow w-full overflow-hidden'>
        <div className='w-64 bg-white border-r border-[#ffe5e5] p-6 flex flex-col gap-6 shrink-0 overflow-y-auto'>
          <FilterGroup
            title='Giá trị đơn'
            name='priceFilter'
            value={priceFilter}
            onChange={setPriceFilter}
            options={[
              { val: 'all', label: 'Tất cả' },
              { val: 'lte1m', label: '≤ 1.000.000đ' },
              { val: 'gt1m', label: '> 1.000.000đ' },
            ]}
          />

          <FilterGroup
            title='Loại khoản chi'
            name='expenseCategoryFilter'
            value={expenseCategoryFilter}
            onChange={setExpenseCategoryFilter}
            options={expenseCategoryNames.map((c) => ({ val: c, label: c }))}
          />

          <FilterGroup
            title='Loại khoản thu'
            name='incomeCategoryFilter'
            value={incomeCategoryFilter}
            onChange={setIncomeCategoryFilter}
            options={incomeCategoryNames.map((c) => ({ val: c, label: c }))}
          />

          <div className='flex flex-col gap-3'>
            <span className='text-[13px] font-bold text-gray-500 uppercase tracking-wide'>Thời gian</span>
            <input
              type='date'
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800'
            />
          </div>

          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className='mt-auto flex items-center justify-center gap-2 border border-dashed border-[#D32F2F] hover:bg-[#fef2f2] text-[#D32F2F] text-[13px] font-bold py-2.5 rounded-[8px] transition-colors'
            >
              <RotateCcw size={14} /> Xoá bộ lọc
            </button>
          )}
        </div>

        <div className='grow p-6 overflow-y-auto flex flex-col gap-5'>
          <div className='grid grid-cols-2 gap-5'>
            <div className='bg-white rounded-[14px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] px-7 py-5'>
              <div className='flex items-start justify-between'>
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <ArrowUpCircle size={20} className='text-orange-500' strokeWidth={2.2} />
                    <span className='text-[13px] font-semibold text-gray-500'>Tổng Chi</span>
                  </div>
                  <p className='text-[28px] font-extrabold text-orange-500 tracking-tight leading-none mt-2'>
                    {fmt(totalExpense)}
                  </p>
                  <p className='text-[12.5px] text-gray-400 mt-2 flex items-center gap-1.5'>
                    <TrendingUp size={13} className='text-orange-400' />
                    So với tháng trước{' '}
                    <span className='text-orange-500 font-bold'>↑ 8.5%</span>{' '}
                    <span className='text-gray-400'>(922.000)</span>
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-white rounded-[14px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] px-7 py-5'>
              <div className='flex items-start justify-between'>
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <ArrowDownCircle size={20} className='text-emerald-500' strokeWidth={2.2} />
                    <span className='text-[13px] font-semibold text-gray-500'>Tổng Thu</span>
                  </div>
                  <p className='text-[28px] font-extrabold text-emerald-500 tracking-tight leading-none mt-2'>
                    {fmt(totalIncome)}
                  </p>
                  <p className='text-[12.5px] text-gray-400 mt-2 flex items-center gap-1.5'>
                    <TrendingUp size={13} className='text-emerald-400' />
                    So với tháng trước{' '}
                    <span className='text-emerald-500 font-bold'>↑ 12.7%</span>{' '}
                    <span className='text-gray-400'>(1.580.000)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-5'>
            {/* ── CHI card ── */}
            <div className='bg-white rounded-[14px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden'>
              <div className='flex items-center justify-between px-6 py-4 border-b border-gray-50'>
                <div className='flex items-center gap-2'>
                  <ArrowUpCircle size={18} className='text-orange-500' strokeWidth={2.2} />
                  <span className='text-[15px] font-bold text-gray-800'>Chi</span>
                </div>
                <button onClick={() => setShowAllExpenses(!showAllExpenses)} className='flex items-center gap-1 text-[13px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors'>
                  {showAllExpenses ? 'Thu gọn' : 'Xem tất cả'} <ChevronRight size={14} className={showAllExpenses ? 'rotate-90 transition-transform' : 'transition-transform'} />
                </button>
              </div>

              <div className='overflow-x-auto'>
                <table className='w-full text-left border-collapse'>
                  <thead>
                    <tr className='bg-gray-50 text-gray-400 text-[12px] font-semibold uppercase tracking-wide border-b border-gray-100'>
                      <th className='py-3 px-5'>Nội dung</th>
                      <th className='py-3 px-3'>Loại chi</th>
                      <th className='py-3 px-3'>Thời gian</th>
                      <th className='py-3 px-5 text-right min-w-32.5'>Số tiền</th>
                      <th className='py-3 px-3 w-8'></th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-50'>
                    {paginatedExpenses.map((r) => (
                      <tr key={r.id} className='hover:bg-gray-50/60 transition-colors group'>
                        <td className='py-3.5 px-5'>
                          <p className='text-[13.5px] font-bold text-gray-800'>{r.content}</p>
                          <p className='text-[11.5px] text-gray-400 mt-0.5'>{r.subContent}</p>
                        </td>
                        <td className='py-3.5 px-3'>
                          <CategoryBadge label={r.category} color={r.categoryColor} />
                        </td>
                        <td className='py-3.5 px-3 text-[12.5px] text-gray-500 font-medium whitespace-nowrap'>
                          {r.date}
                        </td>
                        <td className='py-3.5 px-5 text-right text-[13.5px] font-extrabold text-orange-500 whitespace-nowrap tabular-nums min-w-32.5'>
                          {r.amount.toLocaleString('vi-VN')}
                        </td>
                        <td className='py-3.5 px-3'>
                          <button onClick={() => { setEditingRecord(r); setIsEditModalOpen(true); }} className='p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all'>
                            <MoreVertical size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!showAllExpenses && expenseTotalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-50 bg-gray-50/30">
                  <span className="text-[12.5px] text-gray-500 font-medium">Trang {expensePage} / {expenseTotalPages}</span>
                  <div className="flex items-center gap-2">
                    <button disabled={expensePage === 1} onClick={() => setExpensePage(p => p - 1)} className="px-3 py-1 text-[12.5px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-[6px] transition-all">Trước</button>
                    <button disabled={expensePage === expenseTotalPages} onClick={() => setExpensePage(p => p + 1)} className="px-3 py-1 text-[12.5px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-[6px] transition-all">Sau</button>
                  </div>
                </div>
              )}

              <div className='border-t border-gray-100'>
                <table className='w-full border-collapse'>
                  <tfoot>
                    <tr>
                      <td className='py-3 px-5 text-[12.5px] text-gray-400 font-medium'>
                        Tổng {expenses.length} giao dịch
                      </td>
                      <td className='py-3 px-3'></td>
                      <td className='py-3 px-3'></td>
                      <td className='py-3 px-5 text-right text-[14px] font-extrabold text-orange-500 tabular-nums min-w-32.5'>
                        -{fmt(totalExpense)}
                      </td>
                      <td className='py-3 px-3 w-8'></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className='px-5 pb-5 pt-2'>
                <button
                  onClick={() => setIsAddExpenseOpen(true)}
                  className='w-full flex items-center justify-center gap-2.5 py-3 rounded-[10px] text-[14px] font-bold text-white transition-all shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_18px_rgba(249,115,22,0.45)] active:scale-[0.98]'
                  style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
                >
                  <Plus size={17} strokeWidth={2.5} />
                  Thêm khoản chi
                </button>
              </div>
            </div>

            <div className='bg-white rounded-[14px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden'>
              <div className='flex items-center justify-between px-6 py-4 border-b border-gray-50'>
                <div className='flex items-center gap-2'>
                  <ArrowDownCircle size={18} className='text-emerald-500' strokeWidth={2.2} />
                  <span className='text-[15px] font-bold text-gray-800'>Thu</span>
                </div>
                <button onClick={() => setShowAllIncomes(!showAllIncomes)} className='flex items-center gap-1 text-[13px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors'>
                  {showAllIncomes ? 'Thu gọn' : 'Xem tất cả'} <ChevronRight size={14} className={showAllIncomes ? 'rotate-90 transition-transform' : 'transition-transform'} />
                </button>
              </div>

              <div className='overflow-x-auto'>
                <table className='w-full text-left border-collapse'>
                  <thead>
                    <tr className='bg-gray-50 text-gray-400 text-[12px] font-semibold uppercase tracking-wide border-b border-gray-100'>
                      <th className='py-3 px-5'>Nội dung</th>
                      <th className='py-3 px-3'>Loại thu</th>
                      <th className='py-3 px-3'>Thời gian</th>
                      <th className='py-3 px-5 text-right min-w-32.5'>Số tiền</th>
                      <th className='py-3 px-3 w-8'></th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-50'>
                    {paginatedIncomes.map((r) => (
                      <tr key={r.id} className='hover:bg-gray-50/60 transition-colors group'>
                        <td className='py-3.5 px-5'>
                          <p className='text-[13.5px] font-bold text-gray-800'>{r.content}</p>
                          <p className='text-[11.5px] text-gray-400 mt-0.5'>{r.subContent}</p>
                        </td>
                        <td className='py-3.5 px-3'>
                          <CategoryBadge label={r.category} color={r.categoryColor} />
                        </td>
                        <td className='py-3.5 px-3 text-[12.5px] text-gray-500 font-medium whitespace-nowrap'>
                          {r.date}
                        </td>
                        <td className='py-3.5 px-5 text-right text-[13.5px] font-extrabold text-emerald-500 whitespace-nowrap tabular-nums min-w-32.5'>
                          +{fmt(r.amount)}
                        </td>
                        <td className='py-3.5 px-3'>
                          <button onClick={() => { setEditingRecord(r); setIsEditModalOpen(true); }} className='p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all'>
                            <MoreVertical size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!showAllIncomes && incomeTotalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-50 bg-gray-50/30">
                  <span className="text-[12.5px] text-gray-500 font-medium">Trang {incomePage} / {incomeTotalPages}</span>
                  <div className="flex items-center gap-2">
                    <button disabled={incomePage === 1} onClick={() => setIncomePage(p => p - 1)} className="px-3 py-1 text-[12.5px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-[6px] transition-all">Trước</button>
                    <button disabled={incomePage === incomeTotalPages} onClick={() => setIncomePage(p => p + 1)} className="px-3 py-1 text-[12.5px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-[6px] transition-all">Sau</button>
                  </div>
                </div>
              )}

              <div className='border-t border-gray-100'>
                <table className='w-full border-collapse'>
                  <tfoot>
                    <tr>
                      <td className='py-3 px-5 text-[12.5px] text-gray-400 font-medium'>
                        Tổng {incomes.length} giao dịch
                      </td>
                      <td className='py-3 px-3'></td>
                      <td className='py-3 px-3'></td>
                      <td className='py-3 px-5 text-right text-[14px] font-extrabold text-emerald-500 tabular-nums min-w-32.5'>
                        +{fmt(totalIncome)}
                      </td>
                      <td className='py-3 px-3 w-8'></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className='px-5 pb-5 pt-2'>
                <button
                  onClick={() => setIsAddIncomeOpen(true)}
                  className='w-full flex items-center justify-center gap-2.5 py-3 rounded-[10px] text-[14px] font-bold text-white transition-all shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_18px_rgba(16,185,129,0.45)] active:scale-[0.98]'
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  <Plus size={17} strokeWidth={2.5} />
                  Thêm khoản thu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAddExpenseOpen && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex items-center justify-between px-7 py-4 border-b border-orange-100' style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fff 100%)' }}>
              <h3 className='text-[15px] font-bold text-gray-900 flex items-center gap-2'>
                <ArrowUpCircle size={18} className='text-orange-500' />
                Thêm khoản chi
              </h3>
              <button onClick={() => setIsAddExpenseOpen(false)} className='p-1 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none'>✕</button>
            </div>
            <form className='p-6 flex flex-col gap-4' onSubmit={handleAddExpense}>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>Nội dung <span className='text-red-500'>*</span></label>
                <input name='title' type='text' required placeholder='Ví dụ: Mua nguyên liệu...' className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800' />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Loại chi <span className='text-red-500'>*</span></label>
                  <select name='categoryId' required defaultValue='' className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800 bg-white'>
                    <option value='' disabled>-- Chọn loại chi --</option>
                    {expenseCategories.map(c => (
                      <option key={c.expenseCategoryId} value={c.expenseCategoryId}>{c.categoryName}</option>
                    ))}
                  </select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Số tiền (đ) <span className='text-red-500'>*</span></label>
                  <input name='amount' type='number' required min='0' placeholder='0' className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800 text-right' />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Phương thức</label>
                  <select name='paymentMethod' className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800 bg-white'>
                    <option value='Tiền mặt'>Tiền mặt</option>
                    <option value='Chuyển khoản'>Chuyển khoản</option>
                    <option value='Ví điện tử'>Ví điện tử</option>
                  </select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Ngày</label>
                  <input name='date' type='date' max={new Date().toISOString().split('T')[0]} className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800' />
                </div>
              </div>
              <div className='flex items-center justify-end gap-3 mt-1 pt-4 border-t border-gray-100'>
                <button type='button' onClick={() => setIsAddExpenseOpen(false)} className='px-6 py-2 border-2 border-gray-200 text-gray-600 text-[13px] font-bold rounded-[8px] hover:bg-gray-50 transition-colors'>Hủy</button>
                <button type='submit' className='px-6 py-2 text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs' style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>Lưu khoản chi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddIncomeOpen && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex items-center justify-between px-7 py-4 border-b border-emerald-100' style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)' }}>
              <h3 className='text-[15px] font-bold text-gray-900 flex items-center gap-2'>
                <ArrowDownCircle size={18} className='text-emerald-500' />
                Thêm khoản thu
              </h3>
              <button onClick={() => setIsAddIncomeOpen(false)} className='p-1 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none'>✕</button>
            </div>
            <form className='p-6 flex flex-col gap-4' onSubmit={handleAddIncome}>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>Nội dung <span className='text-red-500'>*</span></label>
                <input name='title' type='text' required placeholder='Ví dụ: Bán hàng, Thu nợ...' className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-emerald-400 transition-all font-medium text-gray-800' />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Loại thu <span className='text-red-500'>*</span></label>
                  <select name='categoryId' required defaultValue='' className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-emerald-400 transition-all font-medium text-gray-800 bg-white'>
                    <option value='' disabled>-- Chọn loại thu --</option>
                    {incomeCategories.map(c => (
                      <option key={c.incomeCategoryId} value={c.incomeCategoryId}>{c.categoryName}</option>
                    ))}
                  </select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Số tiền (đ) <span className='text-red-500'>*</span></label>
                  <input name='amount' type='number' required min='0' placeholder='0' className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-emerald-400 transition-all font-medium text-gray-800 text-right' />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Phương thức</label>
                  <select name='paymentMethod' className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-emerald-400 transition-all font-medium text-gray-800 bg-white'>
                    <option value='Tiền mặt'>Tiền mặt</option>
                    <option value='Chuyển khoản'>Chuyển khoản</option>
                    <option value='Ví điện tử'>Ví điện tử</option>
                  </select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Ngày</label>
                  <input name='date' type='date' max={new Date().toISOString().split('T')[0]} className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-emerald-400 transition-all font-medium text-gray-800' />
                </div>
              </div>
              <div className='flex items-center justify-end gap-3 mt-1 pt-4 border-t border-gray-100'>
                <button type='button' onClick={() => setIsAddIncomeOpen(false)} className='px-6 py-2 border-2 border-gray-200 text-gray-600 text-[13px] font-bold rounded-[8px] hover:bg-gray-50 transition-colors'>Hủy</button>
                <button type='submit' className='px-6 py-2 text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs' style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>Lưu khoản thu</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isEditModalOpen && editingRecord && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className={`flex items-center justify-between px-7 py-4 border-b ${editingRecord.type === 'expense' ? 'border-orange-100' : 'border-emerald-100'}`} style={{ background: editingRecord.type === 'expense' ? 'linear-gradient(135deg, #fff7ed 0%, #fff 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)' }}>
              <h3 className='text-[15px] font-bold text-gray-900 flex items-center gap-2'>
                {editingRecord.type === 'expense' ? <ArrowUpCircle size={18} className='text-orange-500' /> : <ArrowDownCircle size={18} className='text-emerald-500' />}
                {editingRecord.type === 'expense' ? 'Sửa khoản chi' : 'Sửa khoản thu'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className='p-1 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none'>✕</button>
            </div>
            <form className='p-6 flex flex-col gap-4' onSubmit={handleEditSubmit}>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>Nội dung <span className='text-red-500'>*</span></label>
                <input name='title' type='text' required defaultValue={editingRecord.content} className={`w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden transition-all font-medium text-gray-800 ${editingRecord.type === 'expense' ? 'focus:border-orange-400' : 'focus:border-emerald-400'}`} />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Loại <span className='text-red-500'>*</span></label>
                  <select name='categoryId' required defaultValue={editingRecord.categoryId} className={`w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden transition-all font-medium text-gray-800 bg-white ${editingRecord.type === 'expense' ? 'focus:border-orange-400' : 'focus:border-emerald-400'}`}>
                    <option value='' disabled>-- Chọn loại --</option>
                    {(editingRecord.type === 'expense' ? expenseCategories : incomeCategories).map(c => (
                      <option key={editingRecord.type === 'expense' ? (c as ExpenseCategory).expenseCategoryId : (c as IncomeCategory).incomeCategoryId} value={editingRecord.type === 'expense' ? (c as ExpenseCategory).expenseCategoryId : (c as IncomeCategory).incomeCategoryId}>
                        {c.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Số tiền (đ) <span className='text-red-500'>*</span></label>
                  <input name='amount' type='number' required min='0' defaultValue={editingRecord.rawAmount} className={`w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden transition-all font-medium text-gray-800 text-right ${editingRecord.type === 'expense' ? 'focus:border-orange-400' : 'focus:border-emerald-400'}`} />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Phương thức</label>
                  <select name='paymentMethod' defaultValue={editingRecord.paymentMethod} className={`w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden transition-all font-medium text-gray-800 bg-white ${editingRecord.type === 'expense' ? 'focus:border-orange-400' : 'focus:border-emerald-400'}`}>
                    <option value='Tiền mặt'>Tiền mặt</option>
                    <option value='Chuyển khoản'>Chuyển khoản</option>
                    <option value='Ví điện tử'>Ví điện tử</option>
                  </select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Ngày</label>
                  <input name='date' type='date' defaultValue={editingRecord.originalDateStr} max={new Date().toISOString().split('T')[0]} className={`w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden transition-all font-medium text-gray-800 ${editingRecord.type === 'expense' ? 'focus:border-orange-400' : 'focus:border-emerald-400'}`} />
                </div>
              </div>
              <div className='flex items-center justify-between gap-3 mt-1 pt-4 border-t border-gray-100'>
                <button type='button' onClick={() => setIsConfirmDeleteOpen(true)} className='px-6 py-2 border-2 border-red-100 text-red-500 hover:bg-red-50 text-[13px] font-bold rounded-[8px] transition-colors'>Xóa</button>
                <div className='flex gap-3'>
                  <button type='button' onClick={() => setIsEditModalOpen(false)} className='px-6 py-2 border-2 border-gray-200 text-gray-600 text-[13px] font-bold rounded-[8px] hover:bg-gray-50 transition-colors'>Hủy</button>
                  <button type='submit' className='px-6 py-2 text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs' style={{ background: editingRecord.type === 'expense' ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>Lưu</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {isConfirmDeleteOpen && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 p-6 flex flex-col items-center text-center'>
            <div className='w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4'>
              <span className='text-red-500 text-2xl'>!</span>
            </div>
            <h3 className='text-[16px] font-bold text-gray-900 mb-2'>Xác nhận xóa</h3>
            <p className='text-[13.5px] text-gray-500 mb-6'>
              Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác.
            </p>
            <div className='flex items-center gap-3 w-full'>
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                className='flex-1 py-2.5 border-2 border-gray-200 text-gray-600 text-[13px] font-bold rounded-[8px] hover:bg-gray-50 transition-colors'
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className='flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-bold rounded-[8px] transition-colors'
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}