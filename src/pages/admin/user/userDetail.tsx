import { useState } from 'react'
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Building2,
  MapPin,
  FileText,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import path from '../../../constants/path'

const mockUserData: { [key: string]: any } = {
  '1': {
    avatar_url: null,
    full_name: 'Nguyễn Văn An',
    email: 'nguyenvanan@gmail.com',
    phone: '0901234567',
    role: 'user',
    tax_code: '0123456789',
    google_id: 'google_1234567890',
    is_active: true,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2026-05-20T14:25:00Z',
    business_profiles: [
      {
        id: 1,
        business_name: 'Công ty TNHH An Phát',
        province_code: 'HCM',
        ward_code: '01',
        address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
        main_category_id: 'fnb',
        prefer_electronic_invoice: true,
        created_at: '2024-01-20T08:00:00Z',
        updated_at: '2026-04-10T16:30:00Z',
      },
      {
        id: 2,
        business_name: 'Hộ kinh doanh An Nguyễn',
        province_code: 'HCM',
        ward_code: '05',
        address: '456 Nguyễn Trãi, Quận 5, TP.HCM',
        main_category_id: 'services',
        prefer_electronic_invoice: false,
        created_at: '2024-03-15T09:15:00Z',
        updated_at: '2026-05-01T11:20:00Z',
      },
    ],
  },
  '2': {
    avatar_url: null,
    full_name: 'Trần Thị Bình',
    email: 'binhtt@yahoo.com',
    phone: '0912345678',
    role: 'user',
    tax_code: '0234567890',
    google_id: null,
    is_active: true,
    created_at: '2024-02-20T11:00:00Z',
    updated_at: '2026-05-18T09:45:00Z',
    business_profiles: [
      {
        id: 4,
        business_name: 'Salon Tóc Bình Minh',
        province_code: 'HCM',
        ward_code: '03',
        address: '321 Điện Biên Phủ, Quận 3, TP.HCM',
        main_category_id: 'services',
        prefer_electronic_invoice: false,
        created_at: '2024-02-25T10:30:00Z',
        updated_at: '2026-05-15T14:00:00Z',
      },
    ],
  },
}

export default function UserDetail() {
  const { id } = useParams()
  const user = mockUserData[id || '1'] || mockUserData['1']

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryLabel = (categoryId: string) => {
    const categories: { [key: string]: string } = {
      services: 'Dịch vụ',
      fnb: 'Ăn uống',
    }
    return categories[categoryId] || categoryId
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-3 items-center'>
        <div>
          <Link
            to={path.ADMIN_USERS_LIST}
            className='inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 hover:bg-background transition-colors'
          >
            <ArrowLeft className='h-4 w-4 text-foreground' />
            <span className='text-sm font-medium text-foreground'>
              Quay lại
            </span>
          </Link>
        </div>
        <div className='text-center'>
          <h1 className='text-2xl font-semibold text-foreground'>
            Chi tiết người dùng
          </h1>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Thông tin tài khoản và hồ sơ doanh nghiệp
          </p>
        </div>
        <div />
      </div>

      {/* User Details */}
      <div className='bg-card border border-border rounded-xl p-6'>
        <div className='flex items-center gap-2 mb-6'>
          <UserIcon className='w-5 h-5 text-blue' />
          <h2 className='text-lg font-semibold text-foreground'>
            Thông tin người dùng
          </h2>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          <div className='flex flex-col items-center gap-4'>
            <div className='p-1 rounded-full border-2 border-gray-300'>
              <div className='w-24 h-24 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center'>
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className='w-full h-full rounded-full object-cover'
                  />
                ) : (
                  <UserIcon className='w-10 h-10 text-gray-500' />
                )}
              </div>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                user.is_active
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}
            >
              {user.is_active
                ? 'Tài khoản đang hoạt động'
                : 'Tài khoản ngừng hoạt động'}
            </span>
          </div>

          <div className='lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5'>
            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5'>
                Họ và tên
              </label>
              <p className='text-sm text-foreground font-medium'>
                {user.full_name}
              </p>
            </div>

            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5'>
                Email
              </label>
              <div className='flex items-center gap-2'>
                <Mail className='w-3.5 h-3.5 text-muted-foreground' />
                <p className='text-sm text-foreground'>
                  {user.email}
                </p>
              </div>
            </div>

            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5'>
                Số điện thoại
              </label>
              <div className='flex items-center gap-2'>
                <Phone className='w-3.5 h-3.5 text-muted-foreground' />
                <p className='text-sm text-foreground'>
                  {user.phone}
                </p>
              </div>
            </div>

            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5'>
                Role
              </label>
              <div className='flex items-center gap-2'>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    user.role === 'admin'
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}
                >
                  {user.role === 'admin' ? 'Admin' : 'Business Owner'}
                </span>
              </div>
            </div>

            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5'>
                Mã số thuế
              </label>
              <p className='text-sm text-foreground font-mono'>
                {user.tax_code}
              </p>
            </div>

            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5'>
                Ngày tạo
              </label>
              <div className='flex items-center gap-2'>
                <Calendar className='w-3.5 h-3.5 text-muted-foreground' />
                <p className='text-sm text-foreground'>
                  {formatDateTime(user.created_at)}
                </p>
              </div>
            </div>

            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5'>
                Cập nhật lần cuối
              </label>
              <div className='flex items-center gap-2'>
                <Calendar className='w-3.5 h-3.5 text-muted-foreground' />
                <p className='text-sm text-foreground'>
                  {formatDateTime(user.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BUSINESS PROFILES */}
      <div className='bg-card border border-border rounded-xl p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-2'>
            <Building2 className='w-5 h-5 text-blue' />
            <h2 className='text-lg font-semibold text-foreground'>
              Hồ sơ doanh nghiệp
            </h2>
            <span className='inline-flex items-center justify-center min-w-6 h-6 px-2 bg-primary/10 text-primary rounded-md text-xs font-medium border border-primary/20'>
              {user.business_profiles.length}
            </span>
          </div>
        </div>

        {user.business_profiles.length === 0 ? (
          <div className='text-center py-12 bg-background/30 rounded-xl border border-border/30'>
            <Building2 className='w-12 h-12 text-muted-foreground/50 mx-auto mb-3' />
            <p className='text-sm text-muted-foreground'>
              No business profiles associated with this user
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {user.business_profiles.map((business: any) => (
              <div
                key={business.id}
                className='bg-background/50 border border-border rounded-xl p-5 hover:border-border transition-all'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex items-start gap-3 flex-1'>
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-base font-semibold text-foreground mb-1'>
                        {business.business_name}
                      </h3>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-400 border border-blue-200'>
                          {getCategoryLabel(business.main_category_id)}
                        </span>
                        {business.prefer_electronic_invoice && (
                          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
                            <FileText className='w-3 h-3' />
                            Có sử dụng E-Invoice
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-4 gap-x-6 pt-4 border-t border-border/30'>
                  <div>
                    <label className='text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1'>
                      Địa chỉ
                    </label>
                    <div className='flex items-start gap-1.5'>
                      <MapPin className='w-3 h-3 text-muted-foreground mt-0.5 shrink-0' />
                      <p className='text-xs text-foreground leading-snug'>
                        {business.address}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className='text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1'>
                      Tỉnh/Thành phố - Quận/Huyện
                    </label>
                    <p className='text-xs text-foreground'>
                      {business.province_code} - Ward{' '}
                      {business.ward_code}
                    </p>
                  </div>

                  <div>
                    <label className='text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1'>
                      Ngày tạo
                    </label>
                    <p className='text-xs text-foreground'>
                      {formatDateTime(business.created_at)}
                    </p>
                  </div>

                  <div>
                    <label className='text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1'>
                      Cập nhật lần cuối
                    </label>
                    <p className='text-xs text-foreground'>
                      {formatDateTime(business.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}