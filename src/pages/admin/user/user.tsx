import { useState } from 'react'
import { Search, User as UserIcon, Building2, Phone, Lock, Unlock, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import path from '../../../constants/path'
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
import type { User } from '../../../types/auth.type'

const mockUsers = [
  {
    id: 1,
    full_name: 'Nguyễn Văn An',
    email: 'nguyenvanan@gmail.com',
    phone: '0901234567',
    tax_code: '0123456789',
    role: 'Owner',
    is_active: true,
    total_business_profiles: 3,
    created_at: '2024-01-15',
  },
  {
    id: 2,
    full_name: 'Trần Thị Bình',
    email: 'binhtt@yahoo.com',
    phone: '0912345678',
    tax_code: '0234567890',
    role: 'Owner',
    is_active: true,
    total_business_profiles: 1,
    created_at: '2024-02-20',
  },
  {
    id: 3,
    full_name: 'Lê Văn Cường',
    email: 'cuonglv@outlook.com',
    phone: '0923456789',
    tax_code: '0345678901',
    role: 'Owner',
    is_active: false,
    total_business_profiles: 0,
    created_at: '2024-03-10',
  },
  {
    id: 4,
    full_name: 'Phạm Thị Dung',
    email: 'dungpt@gmail.com',
    phone: '0934567890',
    tax_code: '0456789012',
    role: 'Admin',
    is_active: true,
    total_business_profiles: 5,
    created_at: '2023-12-05',
  },
  {
    id: 5,
    full_name: 'Hoàng Văn Em',
    email: 'emhv@email.com',
    phone: '0945678901',
    tax_code: '0567890123',
    role: 'Owner',
    is_active: true,
    total_business_profiles: 2,
    created_at: '2024-04-18',
  },
  {
    id: 6,
    full_name: 'Võ Thị Hoa',
    email: 'hoavt@gmail.com',
    phone: '0956789012',
    tax_code: '0678901234',
    role: 'Owner',
    is_active: true,
    total_business_profiles: 1,
    created_at: '2024-05-01',
  },
]

export default function UserList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.tax_code.includes(searchTerm)

    const matchesRole = filterRole === 'All' || user.role === filterRole
    const matchesStatus =
      filterStatus === 'All' ||
      (filterStatus === 'Active' && user.is_active) ||
      (filterStatus === 'Inactive' && !user.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage,
  )

  const handleToggleStatus = (user: User) => {
    if (user.accountStatus) {
      // Disable user
    } else {
      // Enable user
    }
  }

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
            <Select value={filterRole} onValueChange={(val) => setFilterRole(val ?? 'All')}>
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

            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val ?? 'All')}>
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
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className='py-3'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10'>
                          <UserIcon className='h-4 w-4 text-muted-foreground' />
                        </div>
                        <div className='min-w-0 text-left'>
                          <p className='truncate text-sm font-medium text-foreground'>
                            {user.full_name}
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
                        <span>{user.phone}</span>
                      </div>
                    </TableCell>

                    <TableCell className='text-center'>
                      <span className='text-sm font-mono text-foreground'>
                        {user.tax_code}
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
                        <span
                          className='inline-flex items-center justify-center min-w-2 h-5 rounded text-xs font-medium text-slate-600'
                        >
                          {user.total_business_profiles}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className='text-center'>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {user.is_active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </TableCell>

                    <TableCell className='text-center'>
                      <span className='text-xs text-muted-foreground'>
                        {user.created_at}
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

                        <button
                          onClick={() =>
                            handleToggleStatus({
                              id: user.id,
                              fullName: user.full_name,
                              email: user.email,
                              phone: user.phone,
                              tax_code: user.tax_code,
                              role: user.role,
                              accountStatus: user.is_active ? 'Active' : 'Inactive',
                              hasProfileInfo: user.total_business_profiles > 0,
                              is_active: user.is_active,
                              total_business_profiles: user.total_business_profiles,
                              created_at: user.created_at,
                            } as any)
                          }
                          className={`rounded-md p-1.5 transition-colors ${
                            user.is_active
                              ? 'text-red-500 hover:bg-red-100 hover:text-red-600'
                              : 'text-emerald-500 hover:bg-emerald-100 hover:text-emerald-600'
                          }`}
                          title={user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        >
                          {user.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                        Math.min(prev + 1, totalPages),
                      )
                    }
                    aria-disabled={currentPage === totalPages}
                    className={
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-40'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            <span className='text-sm text-[#9ca3af]'>
              Hiển thị{' '}
              {filteredUsers.length === 0 ? 0 : startIndex + 1} đến{' '}
              {Math.min(startIndex + itemsPerPage, filteredUsers.length)} trong tổng số{' '}
              {filteredUsers.length} người dùng
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}