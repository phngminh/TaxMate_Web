import { useEffect, useState } from 'react'
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
import { getUserById } from '../../../apis/user.api'
import type { AdminUserDetail } from '../../../types/adminUser.type'

export default function UserDetail() {
  const { id } = useParams()
  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('Không tìm thấy người dùng.')
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getUserById(id)
        if (!cancelled) {
          setUser(res.data)
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setUser(null)
          setError('Không thể tải thông tin người dùng.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchUser()
    return () => {
      cancelled = true
    }
  }, [id])

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      return dateString
    }
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: AdminUserDetail['accountStatus']) => {
    if (status === 'Active') {
      return {
        label: 'Tài khoản đang hoạt động',
        className:
          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      }
    }
    if (status === 'Inactive') {
      return {
        label: 'Tài khoản ngừng hoạt động',
        className: 'bg-red-500/10 text-red-400 border border-red-500/20',
      }
    }
    return {
      label: 'Tài khoản chờ xác minh',
      className: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    }
  }

  if (loading) {
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
          </div>
          <div />
        </div>
        <div className='bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground'>
          Đang tải...
        </div>
      </div>
    )
  }

  if (error || !user) {
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
          </div>
          <div />
        </div>
        <div className='bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground'>
          {error || 'Không tìm thấy người dùng.'}
        </div>
      </div>
    )
  }

  const statusBadge = getStatusBadge(user.accountStatus)

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
              <div className='w-24 h-24 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden'>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className='w-full h-full rounded-full object-cover'
                  />
                ) : (
                  <UserIcon className='w-10 h-10 text-gray-500' />
                )}
              </div>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          </div>

          <div className='lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5'>
            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5'>
                Họ và tên
              </label>
              <p className='text-sm text-foreground font-medium'>
                {user.fullName}
              </p>
            </div>

            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5'>
                Email
              </label>
              <div className='flex items-center gap-2'>
                <Mail className='w-3.5 h-3.5 text-muted-foreground' />
                <p className='text-sm text-foreground'>{user.email}</p>
              </div>
            </div>

            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5'>
                Số điện thoại
              </label>
              <div className='flex items-center gap-2'>
                <Phone className='w-3.5 h-3.5 text-muted-foreground' />
                <p className='text-sm text-foreground'>{user.phone || '—'}</p>
              </div>
            </div>

            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5'>
                Role
              </label>
              <div className='flex items-center gap-2'>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    user.role === 'Admin'
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}
                >
                  {user.role === 'Admin' ? 'Admin' : 'Business Owner'}
                </span>
              </div>
            </div>

            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5'>
                Mã số thuế
              </label>
              <p className='text-sm text-foreground font-mono'>
                {user.taxCode || '—'}
              </p>
            </div>

            <div>
              <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5'>
                Ngày tạo
              </label>
              <div className='flex items-center gap-2'>
                <Calendar className='w-3.5 h-3.5 text-muted-foreground' />
                <p className='text-sm text-foreground'>
                  {formatDateTime(user.createdAt)}
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
                  {formatDateTime(user.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-card border border-border rounded-xl p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-2'>
            <Building2 className='w-5 h-5 text-blue' />
            <h2 className='text-lg font-semibold text-foreground'>
              Hồ sơ doanh nghiệp
            </h2>
            <span className='inline-flex items-center justify-center min-w-6 h-6 px-2 bg-primary/10 text-primary rounded-md text-xs font-medium border border-primary/20'>
              {user.businessProfiles.length}
            </span>
          </div>
        </div>

        {user.businessProfiles.length === 0 ? (
          <div className='text-center py-12 bg-background/30 rounded-xl border border-border/30'>
            <Building2 className='w-12 h-12 text-muted-foreground/50 mx-auto mb-3' />
            <p className='text-sm text-muted-foreground'>
              Không có hồ sơ doanh nghiệp gắn với người dùng này
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {user.businessProfiles.map((business) => (
              <div
                key={business.id}
                className='bg-background/50 border border-border rounded-xl p-5 hover:border-border transition-all'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex items-start gap-3 flex-1'>
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-base font-semibold text-foreground mb-1'>
                        {business.businessName}
                      </h3>
                      <div className='flex items-center gap-2 flex-wrap'>
                        {business.mainCategoryName && (
                          <span className='inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-400 border border-blue-200'>
                            {business.mainCategoryName}
                          </span>
                        )}
                        {business.preferElectronicInvoice && (
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
                        {business.address || '—'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className='text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1'>
                      Tỉnh/Thành phố - Quận/Huyện
                    </label>
                    <p className='text-xs text-foreground'>
                      {business.provinceCode || '—'}
                      {business.wardCode ? ` - Ward ${business.wardCode}` : ''}
                    </p>
                  </div>

                  <div>
                    <label className='text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1'>
                      Ngày tạo
                    </label>
                    <p className='text-xs text-foreground'>
                      {formatDateTime(business.createdAt)}
                    </p>
                  </div>

                  <div>
                    <label className='text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1'>
                      Cập nhật lần cuối
                    </label>
                    <p className='text-xs text-foreground'>
                      {formatDateTime(business.updatedAt)}
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
