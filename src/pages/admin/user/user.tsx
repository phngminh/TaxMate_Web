import { useCallback, useEffect, useState } from 'react'
import { Search, User as UserIcon, Building2, Phone, Lock, Unlock, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import path from '../../../constants/path'
import { getUsers, toggleUserStatus } from '../../../apis/user.api'
import type { AdminUserListItem } from '../../../types/adminUser.type'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/table'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '../../../components/ui/pagination'
import {
  Card,
  CardContent,
  CardFooter,
} from '../../../components/ui/card'

export default function UserList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterRole, setFilterRole] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const itemsPerPage = 10

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getUsers({
        pageNumber: currentPage,
        pageSize: itemsPerPage,
        search: debouncedSearch || undefined,
        role: filterRole === 'All' ? undefined : filterRole,
        accountStatus: filterStatus === 'All' ? undefined : filterStatus,
      })
      setUsers(res.data.items)
      setTotalCount(res.data.totalCount)
      setTotalPages(res.data.totalPages)
    } catch (err) {
      console.error(err)
      setUsers([])
      setTotalCount(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, filterRole, filterStatus])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleFilterRoleChange = (val: string | null) => {
    setFilterRole(val ?? 'All')
    setCurrentPage(1)
  }

  const handleFilterStatusChange = (val: string | null) => {
    setFilterStatus(val ?? 'All')
    setCurrentPage(1)
  }

  const handleToggleStatus = async (user: AdminUserListItem) => {
    if (user.accountStatus === 'Pending' || togglingId) {
      return
    }

    setTogglingId(user.id)
    try {
      await toggleUserStatus(user.id)
      await fetchUsers()
    } catch (err) {
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  const formatCreatedDate = (dateString: string) => {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      return dateString
    }
    return date.toISOString().slice(0, 10)
  }

  const getStatusBadge = (status: AdminUserListItem['accountStatus']) => {
    if (status === 'Active') {
      return {
        label: 'Đang hoạt động',
        className:
          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      }
    }
    if (status === 'Inactive') {
      return {
        label: 'Ngừng hoạt động',
        className: 'bg-red-500/10 text-red-400 border border-red-500/20',
      }
    }
    return {
      label: 'Chờ xác minh',
      className: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    }
  }

  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage
  const endIndex =
    totalCount === 0 ? 0 : Math.min(startIndex + users.length, totalCount)

  return (
    <div className='bg-[#f8f9fb] p-5'>
      <div className='space-y-6'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-[#0a0a0a]'>
              Quản lý người dùng
            </h1>
            <p className='text-sm text-[#6b7280] mt-1'>
              Quản lý tài khoản người dùng và hồ sơ kinh doanh của họ.
            </p>
          </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='flex-1 max-w-5xl flex items-center bg-white border border-gray-300 rounded-lg px-5 py-2.5 shadow-xs focus-within:border-sidebar-primary focus-within:ring-1 focus-within:ring-[#D32F2F]/20 transition-all'>
            <Search
              className={`mr-3 size-5 shrink-0 stroke-2 transition-colors ${
                searchTerm ? 'text-sidebar-primary' : 'text-gray-400'
              }`}
            />
            <input
              type='text'
              placeholder='Tìm kiếm theo tên, email, số điện thoại hoặc mã số thuế...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='grow bg-transparent outline-hidden text-[14px] text-gray-800 placeholder-gray-400 font-medium'
            />
          </div>

          <div className='flex gap-2'>
            <Select value={filterRole} onValueChange={handleFilterRoleChange}>
              <SelectTrigger className='py-5 bg-white!'>
                <SelectValue>
                  {filterRole === 'All'
                    ? 'Role'
                    : filterRole === 'Owner'
                      ? 'Người dùng'
                      : 'Admin'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='All'>Role</SelectItem>
                <SelectItem value='Owner'>Người dùng</SelectItem>
                <SelectItem value='Admin'>Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={handleFilterStatusChange}>
              <SelectTrigger className='py-5 bg-white!'>
                <SelectValue>
                  {filterStatus === 'All'
                    ? 'Trạng thái'
                    : filterStatus === 'Active'
                      ? 'Đang hoạt động'
                      : 'Ngừng hoạt động'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='All'>Trạng thái</SelectItem>
                <SelectItem value='Active'>Đang hoạt động</SelectItem>
                <SelectItem value='Inactive'>Ngừng hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className='overflow-hidden'>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-center pb-3'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Người dùng
                    </span>
                  </TableHead>
                  <TableHead className='text-center pb-3'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Liên hệ
                    </span>
                  </TableHead>
                  <TableHead className='text-center pb-3'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Mã số thuế
                    </span>
                  </TableHead>
                  <TableHead className='text-center pb-3'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Role
                    </span>
                  </TableHead>
                  <TableHead className='text-center pb-3'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Số hộ kinh doanh
                    </span>
                  </TableHead>
                  <TableHead className='text-center pb-3'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Trạng thái
                    </span>
                  </TableHead>
                  <TableHead className='text-center pb-3'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Ngày tạo
                    </span>
                  </TableHead>
                  <TableHead className='text-center pb-3'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Thao tác
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='py-10 text-center text-sm text-muted-foreground'>
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='py-10 text-center text-sm text-muted-foreground'>
                      Không tìm thấy người dùng
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const statusBadge = getStatusBadge(user.accountStatus)
                    const isActive = user.accountStatus === 'Active'
                    const canToggle =
                      user.accountStatus === 'Active' ||
                      user.accountStatus === 'Inactive'

                    return (
                      <TableRow key={user.id}>
                        <TableCell className='py-3'>
                          <div className='flex items-center gap-3'>
                            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10'>
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.fullName}
                                  className='h-full w-full rounded-full object-cover'
                                />
                              ) : (
                                <UserIcon className='h-4 w-4 text-muted-foreground' />
                              )}
                            </div>
                            <div className='min-w-0 text-left'>
                              <p className='truncate text-sm font-medium text-foreground'>
                                {user.fullName}
                              </p>
                              <p className='truncate text-xs text-muted-foreground'>
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className='flex items-center justify-center gap-1.5 text-xs text-muted-foreground'>
                            <Phone className='h-3 w-3' />
                            <span>{user.phone || '—'}</span>
                          </div>
                        </TableCell>

                        <TableCell className='text-center'>
                          <span className='text-sm font-mono text-foreground'>
                            {user.taxCode || '—'}
                          </span>
                        </TableCell>

                        <TableCell className='text-center'>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              user.role === 'Admin'
                                ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            }`}
                          >
                            {user.role === 'Admin' ? 'Admin' : 'Business Owner'}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className='flex items-center justify-center gap-1.5'>
                            <Building2 className='w-3.5 h-3.5 text-muted-foreground' />
                            <span className='inline-flex items-center justify-center min-w-2 h-5 rounded text-xs font-medium text-slate-600'>
                              {user.businessProfileCount}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className='text-center'>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                        </TableCell>

                        <TableCell className='text-center'>
                          <span className='text-xs text-muted-foreground'>
                            {formatCreatedDate(user.createdAt)}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className='flex items-center justify-end gap-2 opacity-60 transition-opacity group-hover:opacity-100'>
                            {user.role === 'Owner' && (
                              <Link
                                to={`${path.BASE_ADMIN}/users/${user.id}`}
                                className='rounded-md p-1.5 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600'
                                title='Xem chi tiết'
                              >
                                <Eye size={16} />
                              </Link>
                            )}

                            {canToggle && (
                              <button
                                type='button'
                                disabled={togglingId === user.id}
                                onClick={() => handleToggleStatus(user)}
                                className={`rounded-md p-1.5 transition-colors disabled:opacity-40 ${
                                  isActive
                                    ? 'text-red-500 hover:bg-red-100 hover:text-red-600'
                                    : 'text-emerald-500 hover:bg-emerald-100 hover:text-emerald-600'
                                }`}
                                title={isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                              >
                                {isActive ? <Lock size={16} /> : <Unlock size={16} />}
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>

          <CardFooter className='px-6 py-4 border-t border-[#f3f4f6] flex items-center justify-between'>
            <Pagination className='justify-start mx-0 w-auto'>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    text=''
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    aria-disabled={currentPage === 1}
                    className={
                      currentPage === 1
                        ? 'pointer-events-none opacity-40'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>

                {totalPages > 0 &&
                  Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                        className='cursor-pointer'
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                <PaginationItem>
                  <PaginationNext
                    text=''
                    onClick={() =>
                      setCurrentPage((prev) =>
                        totalPages === 0 ? prev : Math.min(prev + 1, totalPages),
                      )
                    }
                    aria-disabled={totalPages === 0 || currentPage === totalPages}
                    className={
                      totalPages === 0 || currentPage === totalPages
                        ? 'pointer-events-none opacity-40'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            <span className='text-sm text-[#9ca3af]'>
              Hiển thị {startIndex === 0 && totalCount === 0 ? 0 : startIndex + 1} đến{' '}
              {endIndex} trong tổng số {totalCount} người dùng
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
