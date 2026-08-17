import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { CircleDollarSign, Clock, Calendar, Loader2, ArrowUpRight, Scale } from 'lucide-react'
import { getActiveSalesQuarters, getEstimatedProfitDashboard } from '../../../apis/report.api'
import type { ActiveSalesQuarterResponse, EstimatedProfitDashboardResponse } from '../../../types/report.type'
import { toast } from 'react-toastify'

interface Props {
  businessId: string
}

export default function ProfitReport({ businessId }: Props) {
  const [activeQuarters, setActiveQuarters] = useState<ActiveSalesQuarterResponse[]>([])
  const [selectedQuarterStr, setSelectedQuarterStr] = useState<string>('')
  const [profitData, setProfitData] = useState<EstimatedProfitDashboardResponse | null>(null)
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

  // Fetch dashboard data based on selected quarter
  useEffect(() => {
    if (!selectedQuarterStr) return

    const [year, quarter] = selectedQuarterStr.split('-').map(Number)
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const profitRes = await getEstimatedProfitDashboard(businessId, year, quarter)

        if (profitRes.success && profitRes.data) {
          setProfitData(profitRes.data)
        } else {
          setProfitData(null)
        }
      } catch (err) {
        console.error(err)
        toast.error('Không thể tải dữ liệu báo cáo lợi nhuận.')
        setProfitData(null)
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

  const hasProfitData = profitData && (
    profitData.summary.profit !== 0 ||
    profitData.summary.revenue > 0 ||
    profitData.summary.costOfGoodsSold > 0 ||
    profitData.profitTrend.length > 0
  )

  const selectedYear = selectedQuarterStr ? Number(selectedQuarterStr.split('-')[0]) : new Date().getFullYear()
  const selectedQuarter = selectedQuarterStr ? Number(selectedQuarterStr.split('-')[1]) : 1

  return (
    <div className='flex flex-col gap-6 w-full animate-fade-in pb-24'>
      <div className='flex items-center justify-between bg-white border border-[#eef0f2] rounded-[12px] p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.02)]'>
        <div className='flex flex-col gap-0.5'>
          <h2 className='text-[16px] font-bold text-gray-800'>Báo cáo Lợi nhuận</h2>
          <p className='text-[12px] text-gray-500'>Theo dõi lợi nhuận tạm tính từ hoạt động kinh doanh</p>
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
          <span className='text-[14px] text-gray-500 font-medium'>Đang tải dữ liệu báo cáo lợi nhuận...</span>
        </div>
      ) : !hasProfitData ? (
        <div className='bg-white border border-[#eef0f2] rounded-[12px] p-12 flex flex-col items-center justify-center text-center gap-4 shadow-[0px_1px_1px_rgba(0,0,0,0.02)] min-h-100'>
          <div className='size-16 rounded-full bg-[#f5f3ff] flex items-center justify-center text-[#7c3aed]'>
            <CircleDollarSign size={32} />
          </div>
          <div className='flex flex-col gap-1 max-w-md'>
            <h3 className='text-[16px] font-bold text-gray-800'>Chưa có dữ liệu lợi nhuận</h3>
            <p className='text-[13px] text-gray-500'>
              Chưa phát sinh doanh thu hoặc chi phí để tính toán lợi nhuận trong Quý {selectedQuarter}/{selectedYear}.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {/* Card 1: Profit */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between min-h-30 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)]'>
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1 min-w-0'>
                  <span className='text-[#6b7280] text-[13px] font-medium block truncate'>Lợi nhuận tạm tính</span>
                  <span className={`text-[22px] font-bold leading-tight block truncate ${profitData!.summary.profit >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {formatCurrency(profitData!.summary.profit)}
                  </span>
                </div>
                <div className='size-9 rounded-[8px] flex items-center justify-center shrink-0 bg-[#10b981] text-white'>
                  <CircleDollarSign size={18} />
                </div>
              </div>
              <div className='flex items-center gap-1 text-[11px] text-[#9ca3af] mt-2'>
                <Clock size={11} />
                <span>Doanh thu trừ giá vốn</span>
              </div>
            </div>

            {/* Card 2: Revenue */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between min-h-30 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)]'>
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1 min-w-0'>
                  <span className='text-[#6b7280] text-[13px] font-medium block truncate'>Tổng doanh thu</span>
                  <span className='text-[#1a1a1a] text-[22px] font-bold leading-tight block truncate'>
                    {formatCurrency(profitData!.summary.revenue)}
                  </span>
                </div>
                <div className='size-9 rounded-[8px] flex items-center justify-center shrink-0 bg-[#7c3aed] text-white'>
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <div className='flex items-center gap-1 text-[11px] text-[#9ca3af] mt-2'>
                <Clock size={11} />
                <span>Tổng giá trị hóa đơn bán ra</span>
              </div>
            </div>

            {/* Card 3: Cost of Goods Sold */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between min-h-30 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)]'>
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1 min-w-0'>
                  <span className='text-[#6b7280] text-[13px] font-medium block truncate'>Giá vốn hàng bán</span>
                  <span className='text-[#1a1a1a] text-[22px] font-bold leading-tight block truncate'>
                    {formatCurrency(profitData!.summary.costOfGoodsSold)}
                  </span>
                </div>
                <div className='size-9 rounded-[8px] flex items-center justify-center shrink-0 bg-[#ef4444] text-white'>
                  <Scale size={18} />
                </div>
              </div>
              <div className='flex items-center gap-1 text-[11px] text-[#9ca3af] mt-2'>
                <Clock size={11} />
                <span>Giá nhập kho/nguyên vật liệu</span>
              </div>
            </div>

            {/* Card 4: Profit Margin */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between min-h-30 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)]'>
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1 min-w-0'>
                  <span className='text-[#6b7280] text-[13px] font-medium block truncate'>Biên lợi nhuận ròng</span>
                  <span className='text-[#1a1a1a] text-[22px] font-bold leading-tight block truncate'>
                    {profitData!.summary.revenue > 0
                      ? ((profitData!.summary.profit / profitData!.summary.revenue) * 100).toFixed(1)
                      : '0.0'}%
                  </span>
                </div>
                <div className='size-9 rounded-[8px] flex items-center justify-center shrink-0 bg-[#3b82f6] text-white'>
                  <Scale size={18} />
                </div>
              </div>
              <div className='flex items-center gap-1 text-[11px] text-[#9ca3af] mt-2'>
                <Clock size={11} />
                <span>Tỷ lệ lợi nhuận / doanh thu</span>
              </div>
            </div>
          </div>

          {/* Profit Trend Chart */}
          <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.02)] p-6 flex flex-col w-full'>
            <div className='text-[#1f2937] text-[15px] font-bold mb-4'>Xu hướng lợi nhuận hàng tuần của quý</div>
            {profitData!.profitTrend && profitData!.profitTrend.length > 0 ? (
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={profitData!.profitTrend} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
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
                    <Line
                      type='monotone'
                      dataKey='profit'
                      name='Lợi nhuận'
                      stroke='#10b981'
                      strokeWidth={2.5}
                      dot={{ fill: '#10b981', r: 3, stroke: 'white', strokeWidth: 1.5 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className='flex-1 flex items-center justify-center text-gray-400 text-[13px] min-h-65'>
                Không có dữ liệu xu hướng lợi nhuận
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}