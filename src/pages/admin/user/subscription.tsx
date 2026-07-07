import { useState } from 'react'
import {
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Users,
  DollarSign,
  CalendarDays,
  LayoutGrid,
} from 'lucide-react'
import type { Plan } from '../../../types/subscription.type'

const initialPlans: Plan[] = [
  {
    id: 'plan-1',
    name: 'Gói Dùng thử',
    price: 0,
    period: 'month',
    description: 'Dành cho trải nghiệm nền tảng',
    activeUsers: 12,
    isActive: true,
    features: [
      { id: 'f1', name: '10 tài liệu/tháng', included: true },
      { id: 'f2', name: 'Hỗ trợ cơ bản', included: true },
      {
        id: 'f3',
        name: 'Chỉ hỗ trợ qua email',
        included: true,
      },
      {
        id: 'f4',
        name: 'Lưu trữ giới hạn (1GB)',
        included: true,
      },
      {
        id: 'f5',
        name: 'Truy cập 1 người dùng',
        included: true,
      },
      {
        id: 'f6',
        name: 'Tốc độ xử lý tiêu chuẩn',
        included: true,
      },
    ],
  },
  {
    id: 'plan-2',
    name: 'Gói Starter',
    price: 99000,
    period: 'month',
    description: 'Lý tưởng cho nhóm nhỏ và startup',
    activeUsers: 847,
    isActive: true,
    features: [
      {
        id: 'f1',
        name: 'Tải tài liệu không giới hạn',
        included: true,
      },
      { id: 'f2', name: 'Xử lý OCR nâng cao', included: true },
      {
        id: 'f3',
        name: 'Phân tích tài liệu bằng AI',
        included: true,
      },
      {
        id: 'f4',
        name: 'Hỗ trợ email & chat ưu tiên',
        included: true,
      },
      {
        id: 'f5',
        name: 'Tối đa 10 thành viên',
        included: true,
      },
      {
        id: 'f6',
        name: 'Lưu trữ đám mây 50GB',
        included: true,
      },
      {
        id: 'f7',
        name: 'Bảng phân tích nâng cao',
        included: true,
      },
      { id: 'f8', name: 'Quy trình tùy chỉnh', included: true },
      { id: 'f9', name: 'Truy cập API', included: false },
      {
        id: 'f10',
        name: 'Giải pháp White-Label',
        included: false,
      },
    ],
  },
  {
    id: 'plan-3',
    name: 'Gói Enterprise',
    price: 499000,
    period: 'month',
    description: 'Cho tổ chức lớn với nhu cầu nâng cao',
    activeUsers: 234,
    isActive: true,
    features: [
      {
        id: 'f1',
        name: 'Tất cả tính năng gói Starter',
        included: true,
      },
      {
        id: 'f2',
        name: 'Thành viên không giới hạn',
        included: true,
      },
      {
        id: 'f3',
        name: 'Lưu trữ đám mây 500GB',
        included: true,
      },
      {
        id: 'f4',
        name: 'Quản lý tài khoản riêng',
        included: true,
      },
      { id: 'f5', name: 'Hỗ trợ ưu tiên 24/7', included: true },
      { id: 'f6', name: 'Tích hợp tùy chỉnh', included: true },
      {
        id: 'f7',
        name: 'Bảo mật nâng cao (SSO)',
        included: true,
      },
      {
        id: 'f8',
        name: 'Truy cập API & tài liệu',
        included: true,
      },
      {
        id: 'f9',
        name: 'Giải pháp White-Label',
        included: true,
      },
      {
        id: 'f10',
        name: 'Đào tạo theo yêu cầu',
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
      <CalendarDays className='w-4 h-4 text-[#9ca3af]' />
      <select
        value={month}
        onChange={(e) => onMonthChange(Number(e.target.value))}
        className='text-sm border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-[#374151] bg-white focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30 cursor-pointer'
      >
        {MONTHS.map((label, idx) => (
          <option key={idx} value={idx + 1}>
            {label}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className='text-sm border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-[#374151] bg-white focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30 cursor-pointer'
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
  const [plans] = useState<Plan[]>(initialPlans)
  const now = new Date()
  const [statsMonth, setStatsMonth] = useState(now.getMonth() + 1)
  const [statsYear, setStatsYear] = useState(now.getFullYear())
  const [tableMonth, setTableMonth] = useState(now.getMonth() + 1)
  const [tableYear, setTableYear] = useState(now.getFullYear())

  const totalActiveUsers = plans.reduce((sum, p) => sum + p.activeUsers, 0)
  const totalRevenue = plans.reduce((sum, p) => sum + p.price * p.activeUsers, 0)

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
          <button className='flex items-center gap-2 px-4 py-2 bg-[#5d2ec0] text-white rounded-lg text-sm font-medium hover:bg-[#4c25a0] transition-colors shadow-sm'>
            <Plus className='w-4 h-4' />
            Tạo gói mới
          </button>
        </div>

        <div>
          <div className='grid grid-cols-3 gap-6'>
            {plans.map((plan) => (
              <div
                key={plan.id}
                className='bg-card border border-border rounded-xl p-6 shadow-sm'
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
                    <button className='p-1.5 hover:bg-[#f9fafb] rounded transition-colors'>
                      <Edit3 className='w-4 h-4 text-[#6b7280]' />
                    </button>
                    <button className='p-1.5 hover:bg-[#fef2f2] rounded transition-colors'>
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
                  {plan.features.slice(0, 6).map((feature) => (
                    <div
                      key={feature.id}
                      className='flex items-start gap-2'
                    >
                      {feature.included ? (
                        <div className='w-4 h-4 rounded-full bg-[#ecfdf5] flex items-center justify-center flex-shrink-0 mt-0.5'>
                          <Check className='w-3 h-3 text-[#10b981]' />
                        </div>
                      ) : (
                        <div className='w-4 h-4 rounded-full bg-[#fef2f2] flex items-center justify-center flex-shrink-0 mt-0.5'>
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

        {/* Tổng quan thống kê */}
        <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-border flex items-center justify-between'>
            <h3 className='text-base font-bold text-[#0a0a0a]'>
              Tổng quan thống kê
            </h3>

            <TimeFilter
              month={statsMonth}
              year={statsYear}
              onMonthChange={setStatsMonth}
              onYearChange={setStatsYear}
            />
          </div>
          <div className='grid grid-cols-3 gap-6'>
            <div className='bg-card border border-border rounded-xl p-6 shadow-sm'>
              <div className='flex items-center justify-between mb-4'>
                <div className='w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center'>
                  <LayoutGrid className='w-5 h-5 text-[#3b82f6]' />
                </div>
              </div>
              <h3 className='text-sm font-medium text-[#6b7280] mb-1'>
                Gói đang hoạt động
              </h3>
              <p className='text-2xl font-bold text-[#0a0a0a]'>
                {plans.filter((p) => p.isActive).length}
              </p>
              <p className='text-sm text-[#9ca3af] mt-1'>
                {MONTHS[statsMonth - 1]} / Năm {statsYear}
              </p>
            </div>

            <div className='bg-card border border-border rounded-xl p-6 shadow-sm'>
              <div className='flex items-center justify-between mb-4'>
                <div className='w-10 h-10 rounded-lg bg-[#ecfdf5] flex items-center justify-center'>
                  <Users className='w-5 h-5 text-[#10b981]' />
                </div>
              </div>
              <h3 className='text-sm font-medium text-[#6b7280] mb-1'>
                Tổng người đăng ký
              </h3>
              <p className='text-2xl font-bold text-[#0a0a0a]'>
                {totalActiveUsers.toLocaleString()}
              </p>
              <p className='text-sm text-[#9ca3af] mt-1'>
                Trên tất cả gói
              </p>
            </div>

            <div className='bg-card border border-border rounded-xl p-6 shadow-sm'>
              <div className='flex items-center justify-between mb-4'>
                <div className='w-10 h-10 rounded-lg bg-[#faf5ff] flex items-center justify-center'>
                  <DollarSign className='w-5 h-5 text-[#5d2ec0]' />
                </div>
              </div>
              <h3 className='text-sm font-medium text-[#6b7280] mb-1'>
                Doanh thu tháng
              </h3>
              <p className='text-2xl font-bold text-[#0a0a0a]'>
                ₫{totalRevenue.toLocaleString()}
              </p>
              <p className='text-sm text-[#9ca3af] mt-1'>
                Từ đăng ký dịch vụ
              </p>
            </div>
          </div>
        </div>

        {/* Bảng chi tiết gói */}
        <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
          <div className='px-6 py-4 border-b border-border flex items-center justify-between'>
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
                  <th className='px-6 py-3.5 text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide'>
                    Tên gói
                  </th>
                  <th className='px-4 py-3.5 text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide'>
                    Giá
                  </th>
                  <th className='px-4 py-3.5 text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide'>
                    Người đăng ký
                  </th>
                  <th className='px-4 py-3.5 text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide'>
                    Doanh thu ({MONTHS[tableMonth - 1]}{' '}
                    {tableYear})
                  </th>
                  <th className='px-4 py-3.5 text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide'>
                    Trạng thái
                  </th>
                  <th className='px-4 py-3.5 text-right text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide'>
                    Thao tác
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
                          : `₫${plan.price.toLocaleString()}/${plan.period === 'month' ? 'tháng' : 'năm'}`}
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
                        ₫
                        {(
                          plan.price * plan.activeUsers
                        ).toLocaleString()}
                      </span>
                    </td>
                    <td className='px-4 py-4'>
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
                    </td>
                    <td className='px-4 py-4'>
                      <div className='flex items-center justify-end gap-2'>
                        <button className='p-1.5 hover:bg-[#f3f4f6] rounded transition-colors'>
                          <Edit3 className='w-4 h-4 text-[#6b7280]' />
                        </button>
                        <button className='p-1.5 hover:bg-[#fef2f2] rounded transition-colors'>
                          <Trash2 className='w-4 h-4 text-[#ef4444]' />
                        </button>
                      </div>
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