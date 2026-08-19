import axios from 'axios'
import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'

import {
  getHomeDashboard
} from '../../apis/homeDashboard.api'

import {
  useBusiness
} from '../../contexts/BusinessContext'

import type {
  HomeDashboardGroupBy,
  HomeDashboardResponse
} from '../../types/homeDashboard.type'

const RANGE_DAYS = 30

const DONUT_COLORS = [
  '#7c3aed',
  '#22c55e',
  '#f59e0b',
  '#3b82f6',
  '#ef4444',
  '#14b8a6',
  '#8b5cf6',
  '#e5e7eb'
]

function formatVnd(
  value: number
) {
  return `${new Intl.NumberFormat(
    'vi-VN',
    {
      maximumFractionDigits: 0
    }
  ).format(value)}đ`
}

function formatPercent(
  value: number
) {
  return new Intl.NumberFormat(
    'vi-VN',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  ).format(
    Math.abs(value)
  )
}

function formatMonthYear(
  month: number,
  year: number
) {
  return `tháng ${String(
    month
  ).padStart(2, '0')}/${year}`
}

function formatChartDate(
  value: string,
  groupBy: HomeDashboardGroupBy
) {
  const date =
    new Date(`${value}T00:00:00`)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value
  }

  if (groupBy === 'Month') {
    return `${String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    )}/${date.getFullYear()}`
  }

  return `${String(
    date.getDate()
  ).padStart(
    2,
    '0'
  )}/${String(
    date.getMonth() + 1
  ).padStart(
    2,
    '0'
  )}`
}

function formatChartMoney(
  value: number
) {
  if (
    Math.abs(value) >=
    1_000_000_000
  ) {
    return `${Number(
      (
        value /
        1_000_000_000
      ).toFixed(1)
    )}tỷ`
  }

  if (
    Math.abs(value) >=
    1_000_000
  ) {
    return `${Number(
      (
        value /
        1_000_000
      ).toFixed(1)
    )}tr`
  }

  if (
    Math.abs(value) >=
    1_000
  ) {
    return `${Number(
      (
        value /
        1_000
      ).toFixed(0)
    )}k`
  }

  return `${value}`
}

function TrendIcon({
  value
}: {
  value: number
}) {
  if (value === 0) {
    return (
      <svg
        width='13'
        height='13'
        viewBox='0 0 13 13'
        fill='none'
      >
        <path
          d='M1.5 6.5H11.5'
          stroke='#9CA3AF'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
      </svg>
    )
  }

  const isUp = value > 0

  return (
    <svg
      width='13'
      height='13'
      viewBox='0 0 13 13'
      fill='none'
    >
      {isUp ? (
        <path
          d='M1 9.5L4.5 6L7 8.5L12 3M12 3H8M12 3V7'
          stroke='#10B981'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      ) : (
        <path
          d='M1 3.5L4.5 7L7 4.5L12 10M12 10H8M12 10V6'
          stroke='#EF4444'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      )}
    </svg>
  )
}

function ClockIcon({
  size = 14
}: {
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 14 14'
      fill='none'
    >
      <circle
        cx='7'
        cy='7'
        r='6'
        stroke='#9CA3AF'
        strokeWidth='1.2'
      />

      <path
        d='M7 4V7L9 9'
        stroke='#9CA3AF'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function CalIcon({
  size = 12
}: {
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 12 12'
      fill='none'
    >
      <rect
        x='1'
        y='2'
        width='10'
        height='9'
        rx='1.5'
        stroke='#4B5563'
        strokeWidth='1.2'
      />

      <path
        d='M1 5h10'
        stroke='#4B5563'
        strokeWidth='1.2'
      />

      <path
        d='M4 1v2M8 1v2'
        stroke='#4B5563'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg
      width='12'
      height='12'
      viewBox='0 0 12 12'
      fill='none'
    >
      <path
        d='M2 6h8M7 3l3 3-3 3'
        stroke='#4F46E5'
        strokeWidth='1.3'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function ChangeRow({
  value,
  comparisonText
}: {
  value: number
  comparisonText: string
}) {
  const textColor =
    value > 0
      ? 'text-[#10b981]'
      : value < 0
        ? 'text-[#ef4444]'
        : 'text-[#9ca3af]'

  return (
    <div className='flex items-center gap-1.5 text-[13px]'>
      <TrendIcon
        value={value}
      />

      <span className='text-[#9ca3af]'>
        {comparisonText}
      </span>

      <span
        className={`${textColor} font-medium`}
      >
        {value > 0
          ? '+'
          : ''}
        {formatPercent(value)}%
      </span>
    </div>
  )
}

export default function App() {
  const {
    currentBusiness,
    businessId
  } = useBusiness()

  const [
    dashboard,
    setDashboard
  ] =
    useState<HomeDashboardResponse | null>(
      null
    )

  const [
    groupBy,
    setGroupBy
  ] =
    useState<HomeDashboardGroupBy>(
      'Day'
    )

  const [
    isLoading,
    setIsLoading
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage
  ] =
    useState<string | null>(
      null
    )

  const [
    reloadKey,
    setReloadKey
  ] = useState(0)

  useEffect(() => {
    if (
      typeof businessId !== 'string' ||
      businessId.trim() === ''
    ) {
      setDashboard(null)
      setIsLoading(false)
      return
    }

    let active = true

    async function loadDashboard(
      currentBusinessId: string
    ) {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const data =
          await getHomeDashboard({
            businessId:
              currentBusinessId,

            rangeDays:
              RANGE_DAYS,

            groupBy
          })

        if (!active) {
          return
        }

        setDashboard(data)
      } catch (error) {
        if (!active) {
          return
        }

        if (
          axios.isAxiosError(
            error
          )
        ) {
          console.error(
            '[Home Dashboard] API error',
            {
              status:
                error.response
                  ?.status,

              data:
                error.response
                  ?.data,

              url:
                error.config
                  ?.url,

              params:
                error.config
                  ?.params
            }
          )
        } else {
          console.error(
            '[Home Dashboard] Error',
            error
          )
        }

        setErrorMessage(
          'Không thể tải dữ liệu tổng quan.'
        )
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    /*
    * Tại đây TypeScript đã narrow
    * businessId thành string.
    */
    void loadDashboard(
      businessId
    )

    return () => {
      active = false
    }
  }, [
    businessId,
    groupBy,
    reloadKey
  ])

  const donutData =
    useMemo(() => {
      return (
        dashboard
          ?.revenueStructure
          .items.map(
            (
              item,
              index
            ) => ({
              ...item,

              name:
                item.categoryName,

              value:
                item.revenue,

              color:
                DONUT_COLORS[
                  index %
                    DONUT_COLORS.length
                ]
            })
          ) ?? []
      )
    }, [dashboard])

  const topProducts =
    useMemo(() => {
      const items =
        dashboard?.topProducts
          .items ?? []

      const maxRevenue =
        Math.max(
          ...items.map(
            item =>
              item.revenue
          ),
          0
        )

      return items.map(
        item => ({
          ...item,

          pct:
            maxRevenue <= 0
              ? 0
              : (
                    item.revenue /
                    maxRevenue
                  ) *
                100
        })
      )
    }, [dashboard])

  if (!businessId) {
    return (
      <div className='bg-[#f8f9fa] min-h-[calc(100vh-51px)] flex items-center justify-center'>
        <div className='bg-white border border-[#eef0f2] rounded-xl px-8 py-10 text-center shadow-sm'>
          <p className='text-[15px] font-semibold text-[#374151]'>
            Vui lòng chọn hồ sơ kinh
            doanh để xem tổng quan.
          </p>
        </div>
      </div>
    )
  }

  if (
    isLoading &&
    !dashboard
  ) {
    return (
      <div className='bg-[#f8f9fa] min-h-[calc(100vh-51px)] flex items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto size-10 rounded-full border-4 border-[#e5e7eb] border-t-[#7c3aed] animate-spin' />

          <p className='mt-4 text-sm font-semibold text-[#6b7280]'>
            Đang tải dữ liệu tổng
            quan...
          </p>
        </div>
      </div>
    )
  }

  if (
    errorMessage &&
    !dashboard
  ) {
    return (
      <div className='bg-[#f8f9fa] min-h-[calc(100vh-51px)] flex items-center justify-center'>
        <div className='bg-white border border-[#eef0f2] rounded-xl px-8 py-8 text-center shadow-sm'>
          <p className='text-sm font-semibold text-red-600'>
            {errorMessage}
          </p>

          <button
            type='button'
            onClick={() =>
              setReloadKey(
                value =>
                  value + 1
              )
            }
            className='mt-4 rounded-lg bg-[#7c3aed] px-5 py-2 text-sm font-bold text-white'
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className='bg-[#f8f9fa] min-h-[calc(100vh-51px)] flex items-center justify-center'>
        <p className='text-sm font-semibold text-[#6b7280]'>
          Chưa có dữ liệu tổng quan.
        </p>
      </div>
    )
  }

  const {
    summary,
    revenueTrend,
    revenueStructure
  } = dashboard

  const {
    todayRevenue,
    todayOrders,
    estimatedTax,
    estimatedProfit
  } = summary

  return (
    <div className='bg-[#f8f9fa] pt-4 pb-6 min-h-[calc(100vh-51px)]'>
      <div className='px-6'>
        {currentBusiness && (
          <div className='mb-3 text-xs text-[#9ca3af]'>
            {currentBusiness.businessName}
          </div>
        )}

        {/* Summary cards */}
        <div className='flex gap-4 mb-6'>
          {/* Revenue */}
          <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-3 flex-1 min-w-0'>
            <div className='flex items-center gap-3'>
              <div className='size-10 rounded-[8px] flex items-center justify-center shrink-0 bg-[#7c3aed]'>
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                >
                  <path
                    d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z'
                    fill='white'
                  />
                </svg>
              </div>

              <div className='flex flex-col gap-0.5 min-w-0 flex-1'>
                <div className='flex items-center gap-1 text-[#6b7280] text-[13px] font-medium'>
                  <ClockIcon />
                  <span>
                    Doanh thu hôm nay
                  </span>
                </div>

                <div className='text-[#1a1a1a] text-[22px] font-bold leading-tight'>
                  {formatVnd(
                    todayRevenue.amount
                  )}
                </div>
              </div>
            </div>

            <ChangeRow
              value={
                todayRevenue.changePercent
              }
              comparisonText='so với hôm qua'
            />
          </div>

          {/* Orders */}
          <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-3 flex-1 min-w-0'>
            <div className='flex items-center gap-3'>
              <div className='size-10 rounded-[8px] flex items-center justify-center shrink-0 bg-[#22c55e]'>
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                >
                  <path
                    d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z'
                    fill='white'
                  />
                </svg>
              </div>

              <div className='flex flex-col gap-0.5 min-w-0 flex-1'>
                <div className='flex items-center gap-1 text-[#6b7280] text-[13px] font-medium'>
                  <ClockIcon />

                  <span>
                    Đơn hàng hôm nay
                  </span>
                </div>

                <div className='flex items-baseline gap-1'>
                  <span className='text-[#1a1a1a] text-[22px] font-bold leading-tight'>
                    {todayOrders.count}
                  </span>

                  <span className='text-[#9ca3af] text-[13px]'>
                    đơn
                  </span>
                </div>
              </div>
            </div>

            <ChangeRow
              value={
                todayOrders.changePercent
              }
              comparisonText='so với hôm qua'
            />

            <div className='text-[11px] text-[#9ca3af]'>
              Giá trị đơn trung bình:{' '}
              {formatVnd(
                todayOrders.averageOrderValue
              )}
            </div>
          </div>

          {/* Estimated tax */}
          <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-3 flex-1 min-w-0'>
            <div className='flex items-center gap-3'>
              <div className='size-10 rounded-[8px] flex items-center justify-center shrink-0 bg-[#f59e0b]'>
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                >
                  <path
                    d='M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM9 13h2v5H9zm4-3h2v8h-2zm-8 5h2v3H5z'
                    fill='white'
                  />
                </svg>
              </div>

              <div className='flex flex-col gap-0.5 min-w-0'>
                <div className='flex items-center gap-1 text-[#6b7280] text-[13px] font-medium'>
                  <ClockIcon />

                  <span className='whitespace-nowrap'>
                    Thuế tạm tính{' '}
                    {estimatedTax.periodLabel}
                  </span>
                </div>

                <div className='text-[#1a1a1a] text-[22px] font-bold leading-tight'>
                  {formatVnd(
                    estimatedTax.totalAmount
                  )}
                </div>
              </div>
            </div>

            <div className='flex flex-col gap-1 border-t border-[#f9fafb] pt-2'>
              <div className='flex items-center justify-between text-[12px]'>
                <span className='text-[#9ca3af]'>
                  GTGT (
                  {formatPercent(
                    estimatedTax.vat.rate
                  )}
                  %):
                </span>

                <span className='font-medium text-[#1a1a1a]'>
                  {formatVnd(
                    estimatedTax.vat.amount
                  )}
                </span>
              </div>

              <div className='flex items-center justify-between text-[12px]'>
                <span className='text-[#9ca3af]'>
                  TNCN (
                  {formatPercent(
                    estimatedTax.personalIncomeTax.rate
                  )}
                  %):
                </span>

                <span className='font-medium text-[#1a1a1a]'>
                  {formatVnd(
                    estimatedTax.personalIncomeTax.amount
                  )}
                </span>
              </div>

              <div className='text-[11px] text-[#9ca3af] text-center'>
                {estimatedTax.isTaxable
                  ? 'Dự kiến phải nộp'
                  : 'Chưa phát sinh nghĩa vụ thuế'}
              </div>
            </div>
          </div>

          {/* Estimated profit */}
          <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-3 flex-1 min-w-0'>
            <div className='flex items-center gap-3'>
              <div className='size-10 rounded-[8px] flex items-center justify-center shrink-0 bg-[#3b82f6]'>
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                >
                  <path
                    d='M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z'
                    fill='white'
                  />
                </svg>
              </div>

              <div className='flex flex-col gap-0.5 min-w-0'>
                <div className='flex items-center gap-1 text-[#6b7280] text-[13px] font-medium'>
                  <ClockIcon />

                  <span className='whitespace-nowrap'>
                    Lợi nhuận tạm tính{' '}
                    {formatMonthYear(
                      estimatedProfit.month,
                      estimatedProfit.year
                    )}
                  </span>
                </div>

                <div className='text-[#1a1a1a] text-[22px] font-bold leading-tight'>
                  {formatVnd(
                    estimatedProfit.amount
                  )}
                </div>
              </div>
            </div>

            <ChangeRow
              value={
                estimatedProfit.changePercent
              }
              comparisonText='so với tháng trước'
            />

            <div className='flex items-center gap-1 text-[13px] text-[#4f46e5]'>
              <span className='font-medium'>
                Biên lợi nhuận:
              </span>

              <span className='font-bold'>
                {formatPercent(
                  estimatedProfit.marginPercent
                )}
                %
              </span>
            </div>
          </div>
        </div>

        <div className='flex gap-4'>
          {/* Revenue chart */}
          <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-6 flex-[684_684_0] min-w-0 flex flex-col'>
            <div className='flex items-center justify-between mb-3'>
              <div className='text-[#1f2937] text-[16px] font-bold'>
                Doanh thu
              </div>

              <div className='bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] flex items-center gap-1.5 px-3 py-1.5 text-[#4b5563] text-[12px]'>
                <CalIcon />

                <span>
                  {RANGE_DAYS} ngày qua
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className='flex items-center gap-6 mb-3 border-b border-[#f3f4f6]'>
              {(
                [
                  {
                    value:
                      'Day',
                    label:
                      'Theo ngày'
                  },
                  {
                    value:
                      'Week',
                    label:
                      'Theo tuần'
                  },
                  {
                    value:
                      'Month',
                    label:
                      'Theo tháng'
                  }
                ] as {
                  value: HomeDashboardGroupBy
                  label: string
                }[]
              ).map(
                tab => {
                  const active =
                    groupBy ===
                    tab.value

                  return (
                    <button
                      key={
                        tab.value
                      }
                      type='button'
                      onClick={() =>
                        setGroupBy(
                          tab.value
                        )
                      }
                      className={`text-[14px] pb-1.5 ${
                        active
                          ? 'font-bold text-[#ef4444] border-b-2 border-[#ef4444]'
                          : 'text-[#9ca3af]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                }
              )}
            </div>

            <div className='flex items-center gap-4 mb-4'>
              <div className='flex items-center gap-1.5'>
                <div className='size-2 rounded-full bg-[#7c3aed]' />

                <span className='text-[11px] text-[#6b7280]'>
                  Doanh thu
                </span>
              </div>

              <div className='flex items-center gap-1.5'>
                <div
                  className='w-3 h-0.5'
                  style={{
                    borderTop:
                      '2px dashed #94A3B8'
                  }}
                />

                <span className='text-[11px] text-[#6b7280]'>
                  Xu hướng
                </span>
              </div>
            </div>

            <div
              style={{
                height: 240
              }}
            >
              {revenueTrend.points
                .length > 0 ? (
                <ResponsiveContainer
                  width='100%'
                  height='100%'
                >
                  <LineChart
                    data={
                      revenueTrend.points
                    }
                    margin={{
                      top: 5,
                      right: 10,
                      left: 5,
                      bottom: 5
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray='4 2'
                      stroke='#F3F4F6'
                      vertical={
                        false
                      }
                    />

                    <XAxis
                      dataKey='date'
                      tickFormatter={value =>
                        formatChartDate(
                          value,
                          groupBy
                        )
                      }
                      tick={{
                        fontSize: 10,
                        fill:
                          '#9ca3af'
                      }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />

                    <YAxis
                      tick={{
                        fontSize: 10,
                        fill:
                          '#9ca3af'
                      }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={
                        formatChartMoney
                      }
                      width={48}
                    />

                    <Line
                      type='monotone'
                      dataKey='revenue'
                      stroke='#7C3AED'
                      strokeWidth={2}
                      dot={{
                        fill:
                          '#7C3AED',
                        r: 3,
                        stroke:
                          'white',
                        strokeWidth: 2
                      }}
                      activeDot={{
                        r: 5
                      }}
                    />

                    <Line
                      type='monotone'
                      dataKey='trend'
                      stroke='#94A3B8'
                      strokeWidth={
                        1.5
                      }
                      strokeDasharray='6 3'
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className='h-full flex items-center justify-center text-sm text-[#9ca3af]'>
                  Chưa có dữ liệu doanh
                  thu.
                </div>
              )}
            </div>
          </div>

          {/* Revenue structure */}
          <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-6 flex-[330_330_0] min-w-0 flex flex-col'>
            <div className='text-[#1f2937] text-[16px] font-bold mb-4'>
              Cơ cấu doanh thu
            </div>

            <div
              className='relative flex-1 flex items-center justify-center'
              style={{
                height: 220
              }}
            >
              {donutData.length >
              0 ? (
                <>
                  <ResponsiveContainer
                    width='100%'
                    height={220}
                  >
                    <PieChart>
                      <Pie
                        data={
                          donutData
                        }
                        cx='50%'
                        cy='50%'
                        innerRadius={
                          70
                        }
                        outerRadius={
                          105
                        }
                        paddingAngle={
                          2
                        }
                        dataKey='value'
                        startAngle={
                          90
                        }
                        endAngle={
                          -270
                        }
                      >
                        {donutData.map(
                          item => (
                            <Cell
                              key={
                                item.categoryId ??
                                item.name
                              }
                              fill={
                                item.color
                              }
                            />
                          )
                        )}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                    <span className='text-[10px] text-[#9ca3af]'>
                      Tổng doanh thu
                    </span>

                    <span className='text-[13px] font-bold text-[#1a1a1a]'>
                      {formatVnd(
                        revenueStructure.totalRevenue
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <div className='text-sm text-[#9ca3af]'>
                  Chưa có dữ liệu
                </div>
              )}
            </div>

            <div className='mt-2 flex flex-col gap-2'>
              {donutData.map(
                item => (
                  <div
                    key={
                      item.categoryId ??
                      item.name
                    }
                    className='flex items-center justify-between'
                  >
                    <div className='flex items-center gap-2 min-w-0'>
                      <div
                        className='size-2 rounded-full shrink-0'
                        style={{
                          backgroundColor:
                            item.color
                        }}
                      />

                      <span className='text-[12px] text-[#4b5563] truncate'>
                        {item.name}
                      </span>
                    </div>

                    <span className='text-[12px] font-bold text-[#1a1a1a]'>
                      {formatPercent(
                        item.percentage
                      )}
                      %
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Top products */}
          <div className='bg-white border border-[#eef0f2] rounded-[12px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] p-6 flex-[330_330_0] min-w-0 flex flex-col'>
            <div className='flex items-center justify-between mb-4'>
              <div className='text-[#1f2937] text-[16px] font-bold'>
                Top sản phẩm/dịch vụ
              </div>

              <div className='bg-[#f9fafb] border border-[#e5e7eb] rounded-lg flex items-center gap-1 px-2 py-1 text-[#4b5563] text-[10px]'>
                <CalIcon
                  size={10}
                />

                <span>
                  {RANGE_DAYS} ngày qua
                </span>
              </div>
            </div>

            {topProducts.length >
            0 ? (
              <div className='flex flex-col gap-5 flex-1'>
                {topProducts.map(
                  product => (
                    <div
                      key={
                        product.productId ??
                        product.name
                      }
                      className='flex flex-col gap-1.5'
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <span className='text-[12px] text-[#374151] truncate'>
                          {
                            product.name
                          }
                        </span>

                        <span className='text-[12px] font-bold text-[#1a1a1a] whitespace-nowrap'>
                          {formatVnd(
                            product.revenue
                          )}
                        </span>
                      </div>

                      <div className='bg-[#f3f4f6] h-1.5 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-[#7c3aed] rounded-full'
                          style={{
                            width: `${Math.min(
                              Math.max(
                                product.pct,
                                0
                              ),
                              100
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className='flex-1 flex items-center justify-center text-sm text-[#9ca3af]'>
                Chưa có dữ liệu sản
                phẩm/dịch vụ.
              </div>
            )}

            <div className='mt-4 pt-4 border-t border-[#f9fafb] flex items-center justify-between'>
              <ArrowRightIcon />

              <span className='text-[12px] font-medium text-[#4f46e5]'>
                Xem tất cả
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}