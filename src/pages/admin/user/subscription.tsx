import { useState } from 'react'
import {
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Users,
  CalendarDays
} from 'lucide-react'
import { Button } from '../../../components/ui/button'

export interface PlanFeatureItem {
  id: string
  name: string
  included: boolean
}

export interface AdminPlan {
  id: string
  name: string
  price: number
  period: string
  description: string
  activeUsers: number
  isActive: boolean
  features: PlanFeatureItem[]
}

const initialPlans: AdminPlan[] = [
  {
    id: 'plan-1',
    name: 'Gói Dùng thử',
    price: 0,
    period: 'month',
    description: 'Dành cho cá nhân và trải nghiệm nền tảng',
    activeUsers: 12,
    isActive: true,
    features: [
      {
        id: 'f1',
        name: 'Ghi nhận doanh thu',
        included: true,
      },
      {
        id: 'f2',
        name: 'Thống kê doanh thu theo tháng & năm',
        included: true,
      },
      {
        id: 'f3',
        name: 'Báo cáo doanh thu hằng ngày',
        included: true,
      },
      {
        id: 'f4',
        name: 'Theo dõi lịch sử đơn hàng',
        included: true,
      },
      {
        id: 'f5',
        name: 'Thống kê danh mục bán chạy',
        included: true,
      },
      {
        id: 'f6',
        name: 'Quản lý sản phẩm',
        included: true,
      },
    ],
  },

  {
    id: 'plan-2',
    name: 'Gói Doanh nghiệp',
    price: 99000,
    period: 'month',
    description: 'Dành cho hộ kinh doanh và doanh nghiệp nhỏ',
    activeUsers: 847,
    isActive: true,
    features: [
      {
        id: 'f1',
        name: 'Bao gồm toàn bộ tính năng Gói Dùng thử',
        included: true,
      },
      {
        id: 'f2',
        name: 'Ghi nhận và theo dõi chi phí',
        included: true,
      },
      {
        id: 'f3',
        name: 'Dashboard ước tính lợi nhuận',
        included: true,
      },
      {
        id: 'f4',
        name: 'AI tư vấn thuế',
        included: true,
      },
      {
        id: 'f5',
        name: 'Tra cứu văn bản pháp luật bằng AI (RAG)',
        included: true,
      },
      {
        id: 'f6',
        name: 'Báo cáo phân tích hoạt động kinh doanh',
        included: true,
      },
      {
        id: 'f7',
        name: 'Tích hợp hóa đơn điện tử',
        included: false,
      },
      {
        id: 'f8',
        name: 'Phân tích kinh doanh nâng cao',
        included: false,
      },
      {
        id: 'f9',
        name: 'Theo dõi mức độ sẵn sàng tăng trưởng',
        included: false,
      },
    ],
  },

  {
    id: 'plan-3',
    name: 'Gói Premium Doanh nghiệp',
    price: 499000,
    period: 'month',
    description: 'Dành cho doanh nghiệp cần phân tích và tự động hóa nâng cao',
    activeUsers: 234,
    isActive: true,
    features: [
      {
        id: 'f1',
        name: 'Bao gồm toàn bộ tính năng Gói Doanh nghiệp',
        included: true,
      },
      {
        id: 'f2',
        name: 'Tích hợp hóa đơn điện tử',
        included: true,
      },
      {
        id: 'f3',
        name: 'Phân tích kinh doanh nâng cao',
        included: true,
      },
      {
        id: 'f4',
        name: 'Theo dõi mức độ sẵn sàng tăng trưởng',
        included: true,
      },
      {
        id: 'f5',
        name: 'Dashboard phân tích chuyên sâu',
        included: true,
      },
      {
        id: 'f6',
        name: 'Báo cáo AI nâng cao',
        included: true,
      },
      {
        id: 'f7',
        name: 'Ưu tiên xử lý và hỗ trợ',
        included: true,
      },
      {
        id: 'f8',
        name: 'API tích hợp hệ thống',
        included: true,
      },
    ],
  },
]

const MONTHS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
]
const YEARS = [2024, 2025, 2026]

function TimeFilter({
  month,
  year,
  onMonthChange,
  onYearChange,
}: {
  month: number,
  year: number,
  onMonthChange: (m: number) => void,
  onYearChange: (y: number) => void
}) {
  return (
    <div className='flex items-center gap-2'>
      <div className='relative'>
        <CalendarDays className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none' />

        <select
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          className='pl-10 pr-8 py-2 text-sm border border-[#e5e7eb] rounded-lg bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30 cursor-pointer appearance-none'
        >
          {MONTHS.map((label, idx) => (
            <option key={idx} value={idx + 1}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <select
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className='px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30 cursor-pointer'
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>
            Năm {y}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function SubscriptionManagement() {
  const [plans] = useState<AdminPlan[]>(initialPlans)
  const now = new Date()
  const [tableMonth, setTableMonth] = useState(now.getMonth() + 1)
  const [tableYear, setTableYear] = useState(now.getFullYear())

  return (
    <div className='min-h-screen bg-[#f8f9fb] p-5'>
      <div className='space-y-6'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-[#0a0a0a]'>
              Quản lý gói đăng ký
            </h1>
            <p className='text-sm text-[#6b7280] mt-1'>
              Tạo và quản lý các gói đăng ký cho khách hàng
            </p>
          </div>
          <Button className='flex items-center gap-2 px-4 py-5 bg-[#5d2ec0] text-white rounded-lg text-sm font-medium hover:bg-[#4c25a0] transition-colors shadow-xs'>
            <Plus className='w-4 h-4' />
            Tạo gói mới
          </Button>
        </div>

        <div>
          <div className='grid grid-cols-3 gap-6'>
            {plans.map((plan) => (
              <div
                key={plan.id}
                className='bg-card border border-border rounded-xl p-6 shadow-xs'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-[#0a0a0a] mb-1'>
                      {plan.name}
                    </h3>
                    <p className='text-sm text-[#6b7280]'>
                      {plan.description}
                    </p>
                  </div>
                  <div className='flex items-center gap-1'>
                    <button className='p-1.5 hover:bg-[#f9fafb] rounded-sm transition-colors'>
                      <Edit3 className='w-4 h-4 text-[#6b7280]' />
                    </button>
                    <button className='p-1.5 hover:bg-[#fef2f2] rounded-sm transition-colors'>
                      <Trash2 className='w-4 h-4 text-[#ef4444]' />
                    </button>
                  </div>
                </div>

                <div className='mb-6'>
                  <div className='flex items-baseline gap-1'>
                    <span className='text-3xl font-bold text-[#0a0a0a]'>
                      {plan.price === 0
                        ? 'Miễn phí'
                        : `${plan.price.toLocaleString()}₫`}
                    </span>
                    {plan.price > 0 && (
                      <span className='text-sm text-[#9ca3af]'>
                        /
                        {plan.period === 'month'
                          ? 'tháng'
                          : 'năm'}
                      </span>
                    )}
                  </div>
                </div>

                <div className='space-y-3'>
                  <p className='text-xs font-semibold text-[#9ca3af] uppercase tracking-wide'>
                    Tính năng:
                  </p>
                  {plan.features.slice(0, 6).map((feature: PlanFeatureItem) => (
                    <div
                      key={feature.id}
                      className='flex items-start gap-2'
                    >
                      {feature.included ? (
                        <div className='w-4 h-4 rounded-full bg-[#ecfdf5] flex items-center justify-center shrink-0 mt-0.5'>
                          <Check className='w-3 h-3 text-[#10b981]' />
                        </div>
                      ) : (
                        <div className='w-4 h-4 rounded-full bg-[#fef2f2] flex items-center justify-center shrink-0 mt-0.5'>
                          <X className='w-3 h-3 text-[#ef4444]' />
                        </div>
                      )}
                      <span className='text-sm text-[#374151]'>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div className='mt-6 pt-4 border-t border-border'>
                  {plan.isActive ? (
                    <span className='inline-flex items-center gap-1.5 text-xs font-medium text-[#10b981] bg-[#ecfdf5] px-2 py-1 rounded-full'>
                      <span className='w-1.5 h-1.5 rounded-full bg-[#10b981]' />
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className='inline-flex items-center gap-1.5 text-xs font-medium text-[#9ca3af] bg-[#f3f4f6] px-2 py-1 rounded-full'>
                      <span className='w-1.5 h-1.5 rounded-full bg-[#9ca3af]' />
                      Ngừng hoạt động
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='bg-card border border-border rounded-xl shadow-xs overflow-hidden'>
          <div className='px-6 py-4 flex items-center justify-between'>
            <h3 className='text-base font-bold text-[#0a0a0a]'>
              Chi tiết tất cả gói đăng ký
            </h3>
            <TimeFilter
              month={tableMonth}
              year={tableYear}
              onMonthChange={setTableMonth}
              onYearChange={setTableYear}
            />
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-[#f9fafb]'>
                  <th className='px-6 py-3.5 text-left text-[13px] font-bold text-[#9ca3af] uppercase tracking-wide'>
                    Tên gói
                  </th>
                  <th className='px-4 py-3.5 text-left text-[13px] font-bold text-[#9ca3af] uppercase tracking-wide'>
                    Giá
                  </th>
                  <th className='px-4 py-3.5 text-left text-[13px] font-bold text-[#9ca3af] uppercase tracking-wide'>
                    Số người đăng ký
                  </th>
                  <th className='px-4 py-3.5 text-left text-[13px] font-bold text-[#9ca3af] uppercase tracking-wide'>
                    Doanh thu ({MONTHS[tableMonth - 1]}{' '}
                    {tableYear})
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr
                    key={plan.id}
                    className='border-t border-[#f9fafb] hover:bg-[#f9fafb] transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div>
                        <p className='text-sm font-semibold text-[#0a0a0a]'>
                          {plan.name}
                        </p>
                        <p className='text-xs text-[#9ca3af] mt-0.5'>
                          {plan.description}
                        </p>
                      </div>
                    </td>
                    <td className='px-4 py-4'>
                      <span className='text-sm font-medium text-[#0a0a0a]'>
                        {plan.price === 0
                          ? 'Miễn phí'
                          : `${plan.price.toLocaleString()}₫/${plan.period === 'month' ? 'tháng' : 'năm'}`}
                      </span>
                    </td>
                    <td className='px-4 py-4'>
                      <div className='flex items-center gap-2'>
                        <Users className='w-4 h-4 text-[#9ca3af]' />
                        <span className='text-sm text-[#374151]'>
                          {plan.activeUsers}
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-4'>
                      <span className='text-sm font-medium text-[#0a0a0a]'>
                        {(
                          plan.price * plan.activeUsers
                        ).toLocaleString()}₫
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}