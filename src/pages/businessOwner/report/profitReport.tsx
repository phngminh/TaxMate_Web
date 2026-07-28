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
import { CircleDollarSign, Clock, Calendar, Loader2, ArrowUpRight, Scale, AlertCircle, FileText } from 'lucide-react'
import { getActiveSalesQuarters, getEstimatedProfitDashboard, getTaxDashboard } from '../../../apis/report.api'
import type { ActiveSalesQuarterResponse, EstimatedProfitDashboardResponse, TaxDashboardResponse } from '../../../types/report.type'
import { toast } from 'react-toastify'

interface Props {
  businessId: string
}

export default function ProfitReport({ businessId }: Props) {
  const [activeQuarters, setActiveQuarters] = useState<ActiveSalesQuarterResponse[]>([])
  const [selectedQuarterStr, setSelectedQuarterStr] = useState<string>('')
  const [profitData, setProfitData] = useState<EstimatedProfitDashboardResponse | null>(null)
  const [taxData, setTaxData] = useState<TaxDashboardResponse | null>(null)
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
        const [profitRes, taxRes] = await Promise.all([
          getEstimatedProfitDashboard(businessId, year, quarter),
          getTaxDashboard(businessId, year)
        ])

        if (profitRes.success && profitRes.data) {
          setProfitData(profitRes.data)
        } else {
          setProfitData(null)
        }

        if (taxRes.success && taxRes.data) {
          setTaxData(taxRes.data)
        } else {
          setTaxData(null)
        }
      } catch (err) {
        console.error(err)
        toast.error('Không thể tải dữ liệu báo cáo lợi nhuận.')
        setProfitData(null)
        setTaxData(null)
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
    <div className='flex flex-col gap-6 w-full animate-fade-in'>
      <div className='flex items-center justify-between bg-white border border-[#eef0f2] rounded-[12px] p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.02)]'>
        <div className='flex flex-col gap-0.5'>
          <h2 className='text-[16px] font-bold text-gray-800'>Báo cáo Lợi nhuận & Thuế</h2>
          <p className='text-[12px] text-gray-500'>Theo dõi lợi nhuận tạm tính và tình trạng thực hiện nghĩa vụ thuế</p>
        </div>
        <div className='flex items-center gap-2'>
          <Calendar size={15} className='text-gray-400' />
          <span className='text-[13px] font-semibold text-gray-600'>Chọn Quý báo cáo:</span>
          <select
            value={selectedQuarterStr}
            onChange={(e) => setSelectedQuarterStr(e.target.value)}
            className='bg-white border border-[#e5e7eb] rounded-[8px] px-3 py-1.5 text-[#4b5563] text-[13px] font-semibold focus:outline-none focus:ring-1 focus:ring-[#7c3aed] cursor-pointer'
          >
            {activeQuarters.length > 0 ? (
              activeQuarters.map((q) => (
                <option key={`${q.year}-${q.quarter}`} value={`${q.year}-${q.quarter}`}>
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
                  <span className='text-[#6b7280] text-[13px] font-medium block truncate'>Giá vốn hàng bán (COGS)</span>
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

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Profit Trend Chart */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.02)] p-6 lg:col-span-2 flex flex-col'>
              <div className='text-[#1f2937] text-[15px] font-bold mb-4'>Xu hướng lợi nhuận hàng tháng</div>

              {profitData!.profitTrend && profitData!.profitTrend.length > 0 ? (
                <div style={{ height: 260, width: '100%' }}>
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
                        formatter={(value: any) => [formatCurrency(Number(value)), '']}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #eef0f2' }}
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

            {/* Tax Threshold Info */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.02)] p-6 flex flex-col justify-between'>
              <div>
                <div className='flex items-center justify-between mb-4'>
                  <div className='text-[#1f2937] text-[15px] font-bold'>Ngưỡng chịu thuế năm {selectedYear}</div>
                  <div className='size-6 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0'>
                    <AlertCircle size={14} />
                  </div>
                </div>

                {taxData && taxData.threshold ? (
                  <div className='flex flex-col gap-4'>
                    {/* Accumulated progress */}
                    <div className='flex flex-col gap-1.5'>
                      <div className='flex items-center justify-between text-[12px] font-medium'>
                        <span className='text-gray-500'>Doanh thu tích lũy:</span>
                        <span className='text-gray-800 font-bold'>
                          {formatCurrency(taxData.threshold.accumulatedRevenue)}
                        </span>
                      </div>
                      <div className='bg-gray-100 h-2.5 rounded-full overflow-hidden w-full'>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            taxData.threshold.progressPercentage >= 100 ? 'bg-red-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${Math.min(taxData.threshold.progressPercentage, 100)}%` }}
                        />
                      </div>
                      <div className='flex items-center justify-between text-[10px] text-gray-400 font-medium'>
                        <span>Ngưỡng miễn thuế: {formatCurrency(taxData.threshold.amount)}</span>
                        <span>{taxData.threshold.progressPercentage.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className='flex flex-col gap-2 pt-2 border-t border-gray-100'>
                      <div className='flex items-center justify-between text-[12px]'>
                        <span className='text-gray-500'>Còn lại đến ngưỡng:</span>
                        <span className='font-semibold text-gray-700'>
                          {formatCurrency(taxData.threshold.remainingAmount)}
                        </span>
                      </div>
                      <div className='flex items-center justify-between text-[12px]'>
                        <span className='text-gray-500'>Trạng thái năm:</span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            taxData.threshold.status === 'EXCEEDED'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-green-50 text-green-600'
                          }`}
                        >
                          {taxData.threshold.status === 'EXCEEDED' ? 'ĐÃ VƯỢT NGƯỠNG' : 'CHƯA VƯỢT NGƯỠNG'}
                        </span>
                      </div>
                    </div>

                    {taxData.forecast && (
                      <div className='p-3 bg-[#fef3c7]/30 border border-[#fef3c7] rounded-[8px] flex flex-col gap-1 mt-1'>
                        <span className='text-[10px] text-[#b45309] font-bold uppercase tracking-wider'>Dự báo cả năm</span>
                        <span className='text-[13px] font-bold text-[#92400e]'>
                          {formatCurrency(taxData.forecast.estimatedYearEndRevenue)}
                        </span>
                        <span className='text-[9.5px] text-[#b45309] font-medium leading-relaxed'>
                          Dự kiến dựa trên doanh thu thực tế lũy kế đến hết Quý {taxData.forecast.basedOnThroughQuarter}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='flex-1 flex items-center justify-center text-gray-400 text-[13px] py-12'>
                    Không có dữ liệu hạn mức thuế
                  </div>
                )}
              </div>
              <div className='text-[9.5px] text-gray-400 mt-2 italic leading-relaxed'>
                *Theo quy định, hộ kinh doanh có tổng doanh thu từ hoạt động sản xuất kinh doanh trong năm dương lịch từ 100 triệu đồng trở lên mới thuộc diện nộp thuế GTGT & TNCN.
              </div>
            </div>

            {/* Quarters Tax Details */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.02)] p-6 lg:col-span-3 flex flex-col'>
              <div className='flex items-center gap-2 mb-4'>
                <FileText size={16} className='text-[#7c3aed]' />
                <div className='text-[#1f2937] text-[15px] font-bold'>Doanh thu chi tiết theo từng Quý năm {selectedYear}</div>
              </div>

              {taxData && taxData.quarters && taxData.quarters.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
                  {taxData.quarters.map((q) => (
                    <div key={q.quarter} className='flex flex-col gap-2 p-4 rounded-[8px] border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-all'>
                      <div className='flex items-center justify-between'>
                        <span className='text-[13px] font-bold text-gray-700'>Quý {q.quarter}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                            q.status === 'DECLARED'
                              ? 'bg-blue-50 text-blue-600'
                              : q.status === 'NOT_DECLARED'
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-green-50 text-green-600'
                          }`}
                        >
                          {q.status === 'DECLARED' ? 'Đã kê khai' : q.status === 'NOT_DECLARED' ? 'Chưa kê khai' : q.status}
                        </span>
                      </div>
                      <div className='flex flex-col gap-0.5 mt-1'>
                        <span className='text-[10px] text-gray-400 font-semibold'>DOANH THU QUÝ</span>
                        <span className='text-[15px] font-bold text-gray-800'>{formatCurrency(q.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex items-center justify-center text-gray-400 text-[13px] min-h-25'>
                  Không có dữ liệu doanh thu các quý
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}