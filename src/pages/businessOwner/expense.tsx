import { useState, useMemo } from 'react'
import { ArrowUpCircle, ArrowDownCircle, MoreVertical, RotateCcw, TrendingUp, Plus, ChevronRight } from 'lucide-react'

interface ExpenseRecord {
  id: string
  content: string
  subContent: string
  category: string
  categoryColor: string
  date: string
  amount: number
  type: 'expense' | 'income'
}

const RECORDS: ExpenseRecord[] = [
  // Expenses
  { id: 'EX001', content: 'Chi phí nhập hàng',   subContent: 'Tiền mặt',    category: 'Nhập hàng',  categoryColor: 'orange', date: '08/06/2026', amount: -2000000, type: 'expense' },
  { id: 'EX002', content: 'Chi phí thuê mặt bằng', subContent: 'Chuyển khoản', category: 'Thuê mặt bằng', categoryColor: 'orange', date: '04/06/2026', amount: -6000000, type: 'expense' },
  { id: 'EX003', content: 'Chi phí mua thiết bị', subContent: 'Tiền mặt',    category: 'Thiết bị',  categoryColor: 'orange', date: '01/06/2026', amount: -2000000, type: 'expense' },
  // Income
  { id: 'IN001', content: 'Bán hàng', subContent: 'Tiền mặt',    category: 'Bán hàng', categoryColor: 'green', date: '08/06/2026', amount: 5000000, type: 'income' },
  { id: 'IN002', content: 'Bán hàng', subContent: 'Chuyển khoản', category: 'Bán hàng', categoryColor: 'green', date: '07/06/2026', amount: 6000000, type: 'income' },
  { id: 'IN003', content: 'Bán hàng', subContent: 'Tiền mặt',    category: 'Bán hàng', categoryColor: 'green', date: '06/06/2026', amount: 3000000, type: 'income' },
]

const EXPENSE_CATEGORIES = [
  'Tất cả',
  'Thuê nhà, mặt bằng',
  'Điện, nước, Internet',
  'Thiết bị, dụng cụ',
  'Chi phí nhập hàng',
  'Chi phí bán hàng',
  'Lương nhân viên',
  'Chưa phân loại',
]

const TIME_OPTIONS = ['Hôm nay', '7 ngày qua', 'Tháng này', 'Năm nay', 'Tùy chọn']

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
              className={`size-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                value === opt.val
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
  const [priceFilter, setPriceFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('Tất cả')
  const [timeFilter, setTimeFilter] = useState('Tháng này')

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false)

  const handleResetFilters = () => {
    setPriceFilter('all')
    setCategoryFilter('Tất cả')
    setTimeFilter('Tháng này')
  }

  const isFiltered = priceFilter !== 'all' || categoryFilter !== 'Tất cả' || timeFilter !== 'Tháng này'

  const expenses = useMemo(() => {
    return RECORDS.filter((r) => {
      if (r.type !== 'expense') return false
      if (priceFilter === 'lte1m' && Math.abs(r.amount) > 1_000_000) return false
      if (priceFilter === 'gt1m' && Math.abs(r.amount) <= 1_000_000) return false
      if (categoryFilter !== 'Tất cả') {
        const catMap: Record<string, string[]> = {
          'Thuê nhà, mặt bằng': ['Thuê mặt bằng'],
          'Thiết bị, dụng cụ': ['Thiết bị'],
          'Chi phí nhập hàng': ['Nhập hàng'],
        }
        const allowed = catMap[categoryFilter] ?? []
        if (!allowed.includes(r.category)) return false
      }
      return true
    })
  }, [priceFilter, categoryFilter])

  const incomes = useMemo(() => {
    return RECORDS.filter((r) => {
      if (r.type !== 'income') return false
      if (priceFilter === 'lte1m' && r.amount <= 1_000_000) return false
      if (priceFilter === 'gt1m' && r.amount <= 1_000_000) return false
      return true
    })
  }, [priceFilter])

  const totalExpense = expenses.reduce((s, r) => s + Math.abs(r.amount), 0)
  const totalIncome = incomes.reduce((s, r) => s + r.amount, 0)

  const fmt = (n: number) => n.toLocaleString('vi-VN')

  const expenseSparkPoints = [4, 7, 5, 9, 6, 8, 10, 8, 9, 10]
  const incomeSparkPoints  = [5, 8, 6, 10, 7, 9, 11, 10, 12, 14]

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
            name='categoryFilter'
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={EXPENSE_CATEGORIES.map((c) => ({ val: c, label: c }))}
          />

          <FilterGroup
            title='Thời gian'
            name='timeFilter'
            value={timeFilter}
            onChange={setTimeFilter}
            options={TIME_OPTIONS.map((t) => ({ val: t, label: t }))}
          />

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
                <button className='flex items-center gap-1 text-[13px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors'>
                  Xem tất cả <ChevronRight size={14} />
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
                    {expenses.map((r) => (
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
                          <button className='p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all'>
                            <MoreVertical size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
                <button className='flex items-center gap-1 text-[13px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors'>
                  Xem tất cả <ChevronRight size={14} />
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
                    {incomes.map((r) => (
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
                          <button className='p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all'>
                            <MoreVertical size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
            <form className='p-6 flex flex-col gap-4' onSubmit={(e) => { e.preventDefault(); setIsAddExpenseOpen(false) }}>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>Nội dung <span className='text-red-500'>*</span></label>
                <input type='text' required placeholder='Ví dụ: Mua nguyên liệu...' className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800' />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Loại chi</label>
                  <select className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800 bg-white'>
                    <option>Nhập hàng</option>
                    <option>Thuê mặt bằng</option>
                    <option>Thiết bị</option>
                    <option>Chưa phân loại</option>
                  </select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Số tiền (đ) <span className='text-red-500'>*</span></label>
                  <input type='number' required min='0' placeholder='0' className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800 text-right' />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Phương thức</label>
                  <select className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800 bg-white'>
                    <option>Tiền mặt</option>
                    <option>Chuyển khoản</option>
                    <option>Ví điện tử</option>
                  </select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Ngày</label>
                  <input type='date' className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-orange-400 transition-all font-medium text-gray-800' />
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
            <form className='p-6 flex flex-col gap-4' onSubmit={(e) => { e.preventDefault(); setIsAddIncomeOpen(false) }}>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>Nội dung <span className='text-red-500'>*</span></label>
                <input type='text' required placeholder='Ví dụ: Bán hàng, Thu nợ...' className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-emerald-400 transition-all font-medium text-gray-800' />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Loại thu</label>
                  <select className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-emerald-400 transition-all font-medium text-gray-800 bg-white'>
                    <option>Bán hàng</option>
                    <option>Thu nợ</option>
                    <option>Khác</option>
                  </select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Số tiền (đ) <span className='text-red-500'>*</span></label>
                  <input type='number' required min='0' placeholder='0' className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-emerald-400 transition-all font-medium text-gray-800 text-right' />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Phương thức</label>
                  <select className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-emerald-400 transition-all font-medium text-gray-800 bg-white'>
                    <option>Tiền mặt</option>
                    <option>Chuyển khoản</option>
                    <option>Ví điện tử</option>
                  </select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Ngày</label>
                  <input type='date' className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-emerald-400 transition-all font-medium text-gray-800' />
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
    </div>
  )
}