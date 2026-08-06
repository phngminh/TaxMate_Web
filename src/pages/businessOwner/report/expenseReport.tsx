import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Receipt, Clock, Calendar, Loader2, DollarSign, Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { getActiveSalesQuarters, getCashFlowDashboard } from '../../../apis/report.api'
import type { ActiveSalesQuarterResponse, CashFlowDashboardResponse } from '../../../types/report.type'
import { toast } from 'react-toastify'

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#7c3aed', '#ec4899', '#10b981', '#14b8a6']

interface Props {
  businessId: string
}

export default function ExpenseReport({ businessId }: Props) {
  const [activeQuarters, setActiveQuarters] = useState<ActiveSalesQuarterResponse[]>([])
  const [selectedQuarterStr, setSelectedQuarterStr] = useState<string>('')
  const [cashFlowData, setCashFlowData] = useState<CashFlowDashboardResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingQuarters, setLoadingQuarters] = useState<boolean>(true)

  // Fetch active sales quarters
  useEffect(() => {
    const fetchQuarters = async () => {
      try {
        setLoadingQuarters(true)
        const res = await getActiveSalesQuarters(businessId)
        if (res.success && res.data) {
          setActiveQuarters(res.data)
          if (res.data.length > 0) {
            const latest = res.data[0]
            setSelectedQuarterStr(`${latest.year}-${latest.quarter}`)
          } else {
            const now = new Date()
            const currentQuarter = Math.floor(now.getMonth() / 3) + 1
            setSelectedQuarterStr(`${now.getFullYear()}-${currentQuarter}`)
          }
        }
      } catch (err) {
        console.error(err)
        const now = new Date()
        const currentQuarter = Math.floor(now.getMonth() / 3) + 1
        setSelectedQuarterStr(`${now.getFullYear()}-${currentQuarter}`)
      } finally {
        setLoadingQuarters(false)
      }
    }
    fetchQuarters()
  }, [businessId])

  // Fetch cash flow data based on selected quarter
  useEffect(() => {
    if (!selectedQuarterStr) return

    const [year, quarter] = selectedQuarterStr.split('-').map(Number)
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const res = await getCashFlowDashboard(businessId, year, quarter)
        if (res.success && res.data) {
          setCashFlowData(res.data)
        } else {
          setCashFlowData(null)
        }
      } catch (err) {
        console.error(err)
        toast.error('Không thể tải dữ liệu báo cáo chi phí.')
        setCashFlowData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [businessId, selectedQuarterStr])

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' ₫'
  }

  if (loadingQuarters) {
    return (
      <div className='flex flex-col items-center justify-center min-h-75 gap-2'>
        <Loader2 className='animate-spin text-[#7c3aed] size-8' />
        <span className='text-[14px] text-gray-500 font-medium'>Đang tải thời gian báo cáo...</span>
      </div>
    )
  }

  const hasCashFlowData = cashFlowData && (
    cashFlowData.summary.netAmount !== 0 ||
    cashFlowData.summary.totalIncome > 0 ||
    cashFlowData.summary.totalExpense > 0 ||
    cashFlowData.cashFlowTrend.length > 0 ||
    cashFlowData.expenseDistribution.length > 0
  )

  const selectedYear = selectedQuarterStr ? Number(selectedQuarterStr.split('-')[0]) : new Date().getFullYear()
  const selectedQuarter = selectedQuarterStr ? Number(selectedQuarterStr.split('-')[1]) : 1

  return (
    <div className='flex flex-col gap-6 w-full animate-fade-in pb-24'>
      {/* Filter Bar */}
      <div className='flex items-center justify-between bg-white border border-[#eef0f2] rounded-[12px] p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.02)]'>
        <div className='flex flex-col gap-0.5'>
          <h2 className='text-[16px] font-bold text-gray-800'>Báo cáo Chi phí & Dòng tiền</h2>
          <p className='text-[12px] text-gray-500'>Kiểm soát chi phí hoạt động và phân bổ quỹ tiền mặt</p>
        </div>
        <div className='relative inline-block'>
          <Calendar
            size={15}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
          />
          <select
            value={selectedQuarterStr}
            onChange={(e) => setSelectedQuarterStr(e.target.value)}
            className='bg-white border border-[#e5e7eb] rounded-[8px] pl-10 pr-8 py-1.5 text-[#4b5563] text-[13px] font-semibold focus:outline-none focus:ring-1 focus:ring-[#7c3aed] cursor-pointer appearance-none'
          >
            {activeQuarters.length > 0 ? (
              activeQuarters.map((q) => (
                <option
                  key={`${q.year}-${q.quarter}`}
                  value={`${q.year}-${q.quarter}`}
                >
                  Quý {q.quarter}/{q.year}
                </option>
              ))
            ) : (
              <option value={selectedQuarterStr}>
                Quý {selectedQuarter}/{selectedYear} (Hiện tại)
              </option>
            )}
          </select>
        </div>
      </div>

      {loading ? (
        <div className='flex flex-col items-center justify-center min-h-100 gap-2'>
          <Loader2 className='animate-spin text-[#7c3aed] size-10' />
          <span className='text-[14px] text-gray-500 font-medium'>Đang tải dữ liệu báo cáo dòng tiền...</span>
        </div>
      ) : !hasCashFlowData ? (
        <div className='bg-white border border-[#eef0f2] rounded-[12px] p-12 flex flex-col items-center justify-center text-center gap-4 shadow-[0px_1px_1px_rgba(0,0,0,0.02)] min-h-100'>
          <div className='size-16 rounded-full bg-[#f5f3ff] flex items-center justify-center text-[#7c3aed]'>
            <Receipt size={32} />
          </div>
          <div className='flex flex-col gap-1 max-w-md'>
            <h3 className='text-[16px] font-bold text-gray-800'>Chưa có dữ liệu chi phí & dòng tiền</h3>
            <p className='text-[13px] text-gray-500'>
              Hệ thống chưa ghi nhận các phát sinh thu/chi tài chính trong Quý {selectedQuarter}/{selectedYear}.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {/* Card 1: Net Amount */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between min-h-30 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)]'>
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1 min-w-0'>
                  <span className='text-[#6b7280] text-[13px] font-medium block truncate'>
                    Lãi/Lỗ tạm tính
                  </span>
                  <span
                    className={`text-[22px] font-bold leading-tight block truncate ${
                      cashFlowData!.summary.netAmount >= 0
                        ? 'text-[#10b981]'
                        : 'text-[#ef4444]'
                    }`}
                  >
                    {cashFlowData!.summary.netAmount >= 0 ? '+' : ''}
                    {formatCurrency(cashFlowData!.summary.netAmount)}
                  </span>
                </div>
                <div className='size-9 rounded-[8px] flex items-center justify-center shrink-0 bg-[#10b981] text-white'>
                  <Wallet size={18} />
                </div>
              </div>
              <div className='flex items-center gap-1 text-[11px] text-[#9ca3af] mt-2'>
                <Clock size={11} />
                <span>Số thu trừ số chi trong quý</span>
              </div>
            </div>

            {/* Card 2: Income */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between min-h-30 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)]'>
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1 min-w-0'>
                  <span className='text-[#6b7280] text-[13px] font-medium block truncate'>Tổng thu nhập</span>
                  <span className='text-[#1a1a1a] text-[22px] font-bold leading-tight block truncate'>
                    {formatCurrency(cashFlowData!.summary.totalIncome)}
                  </span>
                </div>
                <div className='size-9 rounded-[8px] flex items-center justify-center shrink-0 bg-[#22c55e] text-white'>
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <div className='flex items-center gap-1 text-[11px] text-[#9ca3af] mt-2'>
                <Clock size={11} />
                <span>Tổng nguồn thu nhập vào</span>
              </div>
            </div>

            {/* Card 3: Expenses */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between min-h-30 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)]'>
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1 min-w-0'>
                  <span className='text-[#6b7280] text-[13px] font-medium block truncate'>Tổng chi phí</span>
                  <span className='text-[#1a1a1a] text-[22px] font-bold leading-tight block truncate'>
                    {formatCurrency(cashFlowData!.summary.totalExpense)}
                  </span>
                </div>
                <div className='size-9 rounded-[8px] flex items-center justify-center shrink-0 bg-[#ef4444] text-white'>
                  <ArrowDownRight size={18} />
                </div>
              </div>
              <div className='flex items-center gap-1 text-[11px] text-[#9ca3af] mt-2'>
                <Clock size={11} />
                <span>Tổng chi phí hoạt động đã chi</span>
              </div>
            </div>

            {/* Card 4: Expense / Income Ratio */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between min-h-30 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)]'>
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1 min-w-0'>
                  <span className='text-[#6b7280] text-[13px] font-medium block truncate'>Tỷ lệ chi / thu</span>
                  <span className='text-[#1a1a1a] text-[22px] font-bold leading-tight block truncate'>
                    {cashFlowData!.summary.totalIncome > 0
                      ? ((cashFlowData!.summary.totalExpense / cashFlowData!.summary.totalIncome) * 100).toFixed(1)
                      : '0.0'}%
                  </span>
                </div>
                <div className='size-9 rounded-[8px] flex items-center justify-center shrink-0 bg-[#f59e0b] text-white'>
                  <DollarSign size={18} />
                </div>
              </div>
              <div className='flex items-center gap-1 text-[11px] text-[#9ca3af] mt-2'>
                <Clock size={11} />
                <span>Tỷ lệ phân bổ chi phí</span>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Cash Flow Trend Chart */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.02)] p-6 lg:col-span-2 flex flex-col'>
              <div className='flex items-center justify-between mb-4'>
                <div className='text-[#1f2937] text-[15px] font-bold'>Xu hướng dòng tiền thu - chi</div>
                <div className='flex items-center gap-3 text-[11.5px] text-[#6b7280]'>
                  <div className='flex items-center gap-1.5'>
                    <div className='size-2.5 rounded-lg bg-[#10b981]' />
                    <span>Thu nhập</span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <div className='size-2.5 rounded-lg bg-[#ef4444]' />
                    <span>Chi phí</span>
                  </div>
                </div>
              </div>

              {cashFlowData!.cashFlowTrend && cashFlowData!.cashFlowTrend.length > 0 ? (
                <div style={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={cashFlowData!.cashFlowTrend} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray='4 2' stroke='#F3F4F6' vertical={false} />
                      <XAxis
                        dataKey='label'
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                        width={45}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          formatCurrency(Number(value)),
                          name
                        ]}
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: '1px solid #eef0f2'
                        }}
                      />
                      <Bar dataKey='income' name='Thu nhập' fill='#10b981' radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey='expense' name='Chi phí' fill='#ef4444' radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className='flex-1 flex items-center justify-center text-gray-400 text-[13px] min-h-65'>
                  Không có dữ liệu xu hướng dòng tiền
                </div>
              )}
            </div>

            {/* Expense Distribution */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.02)] p-6 flex flex-col'>
              <div className='text-[#1f2937] text-[15px] font-bold mb-4'>Biểu đồ khoản chi theo loại</div>
              {cashFlowData!.expenseDistribution && cashFlowData!.expenseDistribution.length > 0 ? (
                <>
                  <div className='relative flex-1 flex items-center justify-center' style={{ height: 180 }}>
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={cashFlowData!.expenseDistribution}
                          cx='50%'
                          cy='50%'
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey='amount'
                          nameKey='categoryName'
                          startAngle={90}
                          endAngle={-270}
                        >
                          {cashFlowData!.expenseDistribution.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), '']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                      <span className='text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold'>Tổng chi phí</span>
                      <span className='text-[13px] font-bold text-[#1a1a1a]'>
                        {formatCurrency(cashFlowData!.summary.totalExpense)}
                      </span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className='mt-4 flex flex-col gap-2 overflow-y-auto max-h-27.5 pr-1'>
                    {cashFlowData!.expenseDistribution.map((d, i) => (
                      <div key={d.categoryName} className='flex items-center justify-between text-[11.5px]'>
                        <div className='flex items-center gap-2 min-w-0'>
                          <div className='size-2 rounded-full shrink-0' style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className='text-gray-600 truncate' title={d.categoryName}>{d.categoryName}</span>
                        </div>
                        <div className='flex items-center gap-1.5 shrink-0 font-medium'>
                          <span className='text-gray-400'>({d.percentage.toFixed(1)}%)</span>
                          <span className='text-[#1a1a1a] font-semibold'>{formatCurrency(d.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className='flex-1 flex items-center justify-center text-gray-400 text-[13px] min-h-45'>
                  Không có dữ liệu phân bổ chi phí
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}