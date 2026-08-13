import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { TrendingUp, Clock, Calendar, Loader2, ShoppingBag, DollarSign } from 'lucide-react'
import { getActiveSalesMonths, getSalesDashboard } from '../../../apis/report.api'
import type { ActiveSalesMonthResponse, SalesDashboardResponse } from '../../../types/report.type'
import { toast } from 'react-toastify'

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899', '#8b5cf6']

interface Props {
  businessId: string
}

export default function SalesReport({ businessId }: Props) {
  const [activeMonths, setActiveMonths] = useState<ActiveSalesMonthResponse[]>([])
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>('')
  const [dashboardData, setDashboardData] = useState<SalesDashboardResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingMonths, setLoadingMonths] = useState<boolean>(true)

  // Fetch active sales months
  useEffect(() => {
    const fetchMonths = async () => {
      try {
        setLoadingMonths(true)
        const res = await getActiveSalesMonths(businessId)
        if (res.success && res.data) {
          setActiveMonths(res.data)
          if (res.data.length > 0) {
            const latest = res.data[0]
            setSelectedMonthStr(`${latest.year}-${latest.month}`)
          } else {
            const now = new Date()
            setSelectedMonthStr(`${now.getFullYear()}-${now.getMonth() + 1}`)
          }
        }
      } catch (err) {
        console.error(err)
        const now = new Date()
        setSelectedMonthStr(`${now.getFullYear()}-${now.getMonth() + 1}`)
      } finally {
        setLoadingMonths(false)
      }
    }
    fetchMonths()
  }, [businessId])

  // Fetch dashboard data based on selected month
  useEffect(() => {
    if (!selectedMonthStr) return

    const [year, month] = selectedMonthStr.split('-').map(Number)
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const res = await getSalesDashboard(businessId, year, month)
        if (res.success && res.data) {
          setDashboardData(res.data)
        } else {
          setDashboardData(null)
        }
      } catch (err) {
        console.error(err)
        toast.error('Không thể tải dữ liệu báo cáo bán hàng.')
        setDashboardData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [businessId, selectedMonthStr])

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' ₫'
  }

  if (loadingMonths) {
    return (
      <div className='flex flex-col items-center justify-center min-h-75 gap-2'>
        <Loader2 className='animate-spin text-[#7c3aed] size-8' />
        <span className='text-[14px] text-gray-500 font-medium'>Đang tải thời gian báo cáo...</span>
      </div>
    )
  }

  const hasData = dashboardData && (
    dashboardData.summary.totalRevenue > 0 ||
    dashboardData.summary.totalOrders > 0 ||
    dashboardData.summary.totalProductsSold > 0 ||
    dashboardData.salesTrend.length > 0 ||
    dashboardData.revenueDistribution.length > 0 ||
    dashboardData.topSellingProducts.length > 0
  )

  return (
    <div className='flex flex-col gap-6 w-full animate-fade-in pb-24'>
      {/* Top Filter Bar */}
      <div className='flex items-center justify-between bg-white border border-[#eef0f2] rounded-[12px] p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.02)]'>
        <div className='flex flex-col gap-0.5'>
          <h2 className='text-[16px] font-bold text-gray-800'>Báo cáo Bán hàng</h2>
          <p className='text-[12px] text-gray-500'>Xem chi tiết hiệu quả kinh doanh và sản phẩm bán chạy</p>
        </div>
        <div className='relative inline-block'>
          <Calendar
            size={15}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
          />
          <select
            value={selectedMonthStr}
            onChange={(e) => setSelectedMonthStr(e.target.value)}
            className='bg-white border border-[#e5e7eb] rounded-[8px] pl-10 pr-8 py-1.5 text-[#4b5563] text-[13px] font-semibold focus:outline-none focus:ring-1 focus:ring-[#7c3aed] cursor-pointer appearance-none'
          >
            {activeMonths.length > 0 ? (
              activeMonths.map((m) => (
                <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                  Tháng {m.month}/{m.year}
                </option>
              ))
            ) : (
              <option value={selectedMonthStr}>
                Tháng {selectedMonthStr.split('-')[1]}/{selectedMonthStr.split('-')[0]} (Hiện tại)
              </option>
            )}
          </select>
        </div>
      </div>

      {loading ? (
        <div className='flex flex-col items-center justify-center min-h-100 gap-2'>
          <Loader2 className='animate-spin text-[#7c3aed] size-10' />
          <span className='text-[14px] text-gray-500 font-medium'>Đang tải dữ liệu báo cáo bán hàng...</span>
        </div>
      ) : !hasData ? (
        <div className='bg-white border border-[#eef0f2] rounded-[12px] p-12 flex flex-col items-center justify-center text-center gap-4 shadow-[0px_1px_1px_rgba(0,0,0,0.02)] min-h-100'>
          <div className='size-16 rounded-full bg-[#f5f3ff] flex items-center justify-center text-[#7c3aed]'>
            <ShoppingBag size={32} />
          </div>
          <div className='flex flex-col gap-1 max-w-md'>
            <h3 className='text-[16px] font-bold text-gray-800'>Chưa có dữ liệu bán hàng</h3>
            <p className='text-[13px] text-gray-500'>
              Hệ thống chưa ghi nhận đơn hàng hoặc doanh thu phát sinh trong kỳ báo cáo Tháng {selectedMonthStr.split('-')[1]}/{selectedMonthStr.split('-')[0]}.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {/* Card 1: Revenue */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between min-h-30 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)]'>
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1 min-w-0'>
                  <span className='text-[#6b7280] text-[13px] font-medium block truncate'>Doanh thu trong kỳ</span>
                  <span className='text-[#1a1a1a] text-[22px] font-bold leading-tight block truncate'>
                    {formatCurrency(dashboardData.summary.totalRevenue)}
                  </span>
                </div>
                <div className='size-9 rounded-[8px] flex items-center justify-center shrink-0 bg-[#7c3aed] text-white'>
                  <DollarSign size={18} />
                </div>
              </div>
              <div className='flex items-center gap-1 text-[11px] text-[#9ca3af] mt-2'>
                <Clock size={11} />
                <span>Tháng {selectedMonthStr.split('-')[1]}/{selectedMonthStr.split('-')[0]}</span>
              </div>
            </div>

            {/* Card 2: Orders */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between min-h-30 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)]'>
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1 min-w-0'>
                  <span className='text-[#6b7280] text-[13px] font-medium block truncate'>Số lượng đơn hàng</span>
                  <span className='text-[#1a1a1a] text-[22px] font-bold leading-tight block truncate'>
                    {dashboardData.summary.totalOrders.toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className='size-9 rounded-[8px] flex items-center justify-center shrink-0 bg-[#22c55e] text-white'>
                  <ShoppingBag size={18} />
                </div>
              </div>
              <div className='flex items-center gap-1 text-[11px] text-[#9ca3af] mt-2'>
                <Clock size={11} />
                <span>Tổng đơn hoàn thành</span>
              </div>
            </div>

            {/* Card 3: Products Sold */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between min-h-30 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)]'>
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1 min-w-0'>
                  <span className='text-[#6b7280] text-[13px] font-medium block truncate'>Sản phẩm đã bán</span>
                  <span className='text-[#1a1a1a] text-[22px] font-bold leading-tight block truncate'>
                    {dashboardData.summary.totalProductsSold.toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className='size-9 rounded-[8px] flex items-center justify-center shrink-0 bg-[#f59e0b] text-white'>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className='flex items-center gap-1 text-[11px] text-[#9ca3af] mt-2'>
                <Clock size={11} />
                <span>Số lượng món hàng bán ra</span>
              </div>
            </div>

            {/* Card 4: Average Order Value */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between min-h-30 transition-all hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)]'>
              <div className='flex items-start justify-between'>
                <div className='flex flex-col gap-1 min-w-0'>
                  <span className='text-[#6b7280] text-[13px] font-medium block truncate'>Đơn giá trung bình</span>
                  <span className='text-[#1a1a1a] text-[22px] font-bold leading-tight block truncate'>
                    {formatCurrency(
                      dashboardData.summary.totalOrders > 0
                        ? Math.round(dashboardData.summary.totalRevenue / dashboardData.summary.totalOrders)
                        : 0
                    )}
                  </span>
                </div>
                <div className='size-9 rounded-[8px] flex items-center justify-center shrink-0 bg-[#3b82f6] text-white'>
                  <DollarSign size={18} />
                </div>
              </div>
              <div className='flex items-center gap-1 text-[11px] text-[#9ca3af] mt-2'>
                <Clock size={11} />
                <span>Trung bình trên một đơn</span>
              </div>
            </div>
          </div>

          <div className='flex flex-col lg:flex-row gap-4'>
            {/* Revenue Trend Chart */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.02)] p-6 flex-[550_550_0] min-w-0 flex flex-col'>
              <div className='flex items-center justify-between mb-4'>
                <div className='text-[#1f2937] text-[15px] font-bold'>Xu hướng doanh thu</div>
                <div className='flex items-center gap-3 text-[11px] text-[#6b7280]'>
                  <div className='flex items-center gap-1.5'>
                    <div className='size-2.5 rounded-full bg-[#7c3aed]' />
                    <span>Doanh thu kỳ này</span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <div className='w-4 h-0.5 bg-[#94a3b8] opacity-60 border-t border-dashed border-[#94a3b8]' />
                    <span>Kỳ trước</span>
                  </div>
                </div>
              </div>

              {dashboardData.salesTrend && dashboardData.salesTrend.length > 0 ? (
                <div style={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={dashboardData.salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
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
                        dataKey='currentQuarterRevenue'
                        name='Doanh thu kỳ này'
                        stroke='#7c3aed'
                        strokeWidth={2.5}
                        dot={{ fill: '#7c3aed', r: 3, stroke: 'white', strokeWidth: 1.5 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type='monotone'
                        dataKey='previousQuarterRevenue'
                        name='Doanh thu kỳ trước'
                        stroke='#94a3b8'
                        strokeWidth={1.5}
                        strokeDasharray='5 5'
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className='flex-1 flex items-center justify-center text-gray-400 text-[13px] min-h-65'>
                  Không có dữ liệu xu hướng doanh thu
                </div>
              )}
            </div>

            {/* Revenue Structure (Pie Chart) */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.02)] p-6 flex-[330_330_0] min-w-0 flex flex-col'>
              <div className='text-[#1f2937] text-[15px] font-bold mb-4'>Biểu đồ doanh thu theo sản phẩm</div>
              {dashboardData.revenueDistribution && dashboardData.revenueDistribution.length > 0 ? (
                <>
                  <div className='relative flex-1 flex items-center justify-center' style={{ height: 180 }}>
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={dashboardData.revenueDistribution}
                          cx='50%'
                          cy='50%'
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey='revenue'
                          nameKey='productName'
                          startAngle={90}
                          endAngle={-270}
                        >
                          {dashboardData.revenueDistribution.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), '']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                      <span className='text-[10px] text-[#9ca3af] uppercase tracking-wider font-semibold'>Tổng doanh thu</span>
                      <span className='text-[13px] font-bold text-[#1a1a1a]'>
                        {formatCurrency(dashboardData.summary.totalRevenue)}
                      </span>
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className='mt-4 flex flex-col gap-2 overflow-y-auto max-h-27.5 pr-1'>
                    {dashboardData.revenueDistribution.map((d, i) => (
                      <div key={d.productName} className='flex items-center justify-between text-[11.5px]'>
                        <div className='flex items-center gap-2 min-w-0'>
                          <div className='size-2 rounded-full shrink-0' style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className='text-gray-600 truncate' title={d.productName}>{d.productName}</span>
                        </div>
                        <div className='flex items-center gap-1.5 shrink-0 font-medium'>
                          <span className='text-gray-400'>({d.percentage.toFixed(1)}%)</span>
                          <span className='text-[#1a1a1a] font-semibold'>{formatCurrency(d.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className='flex-1 flex items-center justify-center text-gray-400 text-[13px] min-h-45'>
                  Không có dữ liệu cơ cấu doanh thu
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.02)] p-6 flex-[330_330_0] min-w-0 flex flex-col'>
              <div className='flex flex-col mb-4'>
                <div className='text-[#1f2937] text-[15px] font-bold'>
                  Top sản phẩm nổi bật
                </div>
                <div className='text-[11px] text-[#6b7280] font-medium'>
                  Xếp hạng sản phẩm bán chạy
                </div>
              </div>

              {dashboardData.topSellingProducts && dashboardData.topSellingProducts.length > 0 ? (
                <div className='flex flex-col gap-4 flex-1'>
                  {dashboardData.topSellingProducts.map((p, idx) => {
                    const maxRevenue = dashboardData.topSellingProducts[0]?.revenue || 1
                    const pct = Math.round((p.revenue / maxRevenue) * 100)

                    return (
                      <div key={p.productName} className='flex flex-col gap-1.5 p-3 rounded-[8px] bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all'>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='flex items-center gap-2 min-w-0'>
                            <span className='size-5 rounded-full bg-[#eef2ff] text-[#4c51bf] font-bold text-[11px] flex items-center justify-center shrink-0'>
                              {idx + 1}
                            </span>
                            <span className='text-[12.5px] font-semibold text-gray-700 truncate' title={p.productName}>
                              {p.productName}
                            </span>
                          </div>
                          <div className='flex flex-col items-end shrink-0'>
                            <span className='text-[12.5px] font-bold text-gray-800'>{formatCurrency(p.revenue)}</span>
                            <span className='text-[10px] text-gray-400 font-medium'>Đã bán: {p.quantitySold}</span>
                          </div>
                        </div>
                        <div className='bg-gray-200 h-1.5 rounded-full overflow-hidden w-full mt-1'>
                          <div
                            className='h-full bg-[#7c3aed] rounded-full transition-all duration-500'
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className='flex items-center justify-center text-gray-400 text-[13px] min-h-30 mt-18'>
                  Không có dữ liệu sản phẩm bán chạy
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}