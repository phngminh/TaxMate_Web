import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, User as UserIcon, Building2, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import path from '../../../constants/path'

const mockUsers = [
  {
    id: 1,
    full_name: 'Nguyễn Văn An',
    email: 'nguyenvanan@gmail.com',
    phone: '0901234567',
    tax_code: '0123456789',
    role: 'Business Owner',
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
    role: 'Business Owner',
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
    role: 'Business Owner',
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
    role: 'Business Owner',
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
    role: 'Business Owner',
    is_active: true,
    total_business_profiles: 1,
    created_at: '2024-05-01',
  },
]

export default function UserList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
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

    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage,
  )

  return (
    <div className='min-h-screen bg-[#f8f9fb] p-5'>
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

        {/* Filters */}
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
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className='px-3 py-2 bg-card border border-border rounded-md text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all'
            >
              <option value='all'>Tất cả vai trò</option>
              <option value='owner'>Người dùng</option>
              <option value='admin'>Admin</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className='px-3 py-2 bg-card border border-border rounded-md text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all'
            >
              <option value='all'>Tất cả trạng thái</option>
              <option value='active'>Đang hoạt động</option>
              <option value='inactive'>Ngừng hoạt động</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className='bg-card border border-border rounded-xl overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-border'>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Người dùng
                    </span>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Liên hệ
                    </span>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Mã số thuế
                    </span>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Role
                    </span>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Doanh nghiệp
                    </span>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Status
                    </span>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Ngày tạo
                    </span>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/50'>
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className='hover:bg-background/50 transition-colors'
                  >
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <div className='w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0'>
                          <UserIcon className='w-4 h-4 text-muted-foreground' />
                        </div>
                        <div className='min-w-0'>
                          <p className='text-sm font-medium text-foreground truncate'>
                            {user.full_name}
                          </p>
                          <p className='text-xs text-muted-foreground truncate'>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                        <Phone className='w-3 h-3' />
                        <span>{user.phone}</span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='text-sm font-mono text-foreground'>
                        {user.tax_code}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-1.5'>
                        <Building2 className='w-3.5 h-3.5 text-muted-foreground' />
                        <span
                          className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded text-xs font-medium border ${
                            user.total_business_profiles > 0
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {user.total_business_profiles}
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='text-xs text-muted-foreground'>
                        {user.created_at}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-left'>
                      <Link
                        to={`${path.BASE_ADMIN}/users/${user.id}`}
                        className='inline-flex items-center px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary/80 hover:bg-primary/5 rounded-md transition-all'
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className='px-4 py-3 border-t border-border flex items-center justify-between bg-background/30'>
            <p className='text-xs text-muted-foreground'>
              Showing {startIndex + 1}-
              {Math.min(
                startIndex + itemsPerPage,
                filteredUsers.length,
              )}{' '}
              of {filteredUsers.length} users
            </p>
            <div className='flex gap-1'>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                }
                disabled={currentPage === 1}
                className='p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all'
              >
                <ChevronLeft className='w-4 h-4' />
              </button>
              {Array.from(
                { length: totalPages },
                (_, i) => i + 1,
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[32px] px-2 py-1.5 rounded-md border text-xs font-medium transition-all ${
                    currentPage === page
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:bg-background'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, totalPages),
                  )
                }
                disabled={currentPage === totalPages}
                className='p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all'
              >
                <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}