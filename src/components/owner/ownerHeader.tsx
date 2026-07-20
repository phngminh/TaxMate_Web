import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import storeImage from '../../assets/store.png'
import imgLogo from '../../assets/logo3.png'
import path from '../../constants/path'
import { Bell, User, HeadphonesIcon, Heart, Store, Settings, LogOut, Plus, UtensilsCrossed, Handshake } from 'lucide-react'
import { useBusiness } from '../../contexts/BusinessContext'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import { createBusinessProfile } from '../../apis/profile.api'

const categories = [
  {
    businessCategoryId: '60a42842-9fba-406c-8282-fc88ee0ccd24',
    name: 'Ăn uống (F&B)',
    icon: UtensilsCrossed,
    color: 'text-green-500'
  },
  {
    businessCategoryId: 'cafbdef3-e1d5-467c-8e60-355995d8e70a',
    name: 'Dịch vụ',
    icon: Handshake,
    color: 'text-purple-500'
  }
]

function NavItem({ label, isActive }: {
  label: string
  isActive: boolean
}) {
  return (
    <div
      className={`px-5 h-7 flex items-center justify-center rounded-full text-[14px] font-bold relative shrink-0
        transition-all duration-600 ease-out
        ${
        isActive
            ? 'bg-[rgba(253,42,42,0.4)] text-[#910101]'
            : 'text-[#1d1d1d] opacity-90 hover:bg-[#f5f5f5]'
        }`}
    >
      {label}
    </div>
  )
}

const menuItems = [
  { icon: HeadphonesIcon, label: 'Hỗ trợ', path: null },
  { icon: Heart,          label: 'Gói của tôi', path: path.BUSINESS_OWNER_SUBSCRIPTION },
  { icon: Store,          label: 'Tài khoản Nhận tiền', path: path.BUSINESS_OWNER_BANK_CONFIG },
  { icon: Settings,       label: 'Cấu hình HĐĐT', path: path.BUSINESS_OWNER_EINVOICE_CONFIG },
]

export default function OwnerHeader() {
  const [profileOpen, setProfileOpen] = useState(false)
  const [showAddBusinessModal, setShowAddBusinessModal] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const { businesses, currentBusiness, setCurrentBusiness, clearBusiness, setBusinesses } = useBusiness()
  const [businessName, setBusinessName] = useState('')
  const [address, setAddress] = useState('')
  const [provinceCode, setProvinceCode] = useState('')
  const [wardCode, setWardCode] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileOpen])

  const handleCreateBusiness = async () => {
    if (!businessName.trim()) {
      toast.error('Vui lòng nhập tên cửa hàng')
      return
    }

    if (!categoryId) {
      toast.error('Vui lòng chọn danh mục cửa hàng')
      return
    }

    try {
      setLoading(true)
      const res = await createBusinessProfile({
        ownerId: user!.id,
        businessName: businessName.trim(),
        provinceCode: provinceCode.trim() || undefined,
        wardCode: wardCode.trim() || undefined,
        address: address.trim() || undefined,
        mainCategoryId: categoryId,
        preferElectronicInvoice: false
      })

      const newBusiness = res.data
      setBusinesses([...businesses, newBusiness])
      setCurrentBusiness(newBusiness)

      toast.success('Tạo hồ sơ cửa hàng thành công')
      setShowAddBusinessModal(false)
    } catch (error) {
      toast.error('Failed to create business profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearBusiness()
    logout()
    navigate(path.home)
  }

  const handleCloseAddBusinessModal = () => {
    setShowAddBusinessModal(false)

    setBusinessName('')
    setAddress('')
    setProvinceCode('')
    setWardCode('')
    setCategoryId('')
  }

  return (
    <div className='h-12.75 bg-linear-to-r from-[#d00c0c] to-[#4c51bf] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex items-center justify-between px-4'>
      <div className='flex items-center gap-6'>
        <div className='bg-white h-8.25 rounded-[16px] flex items-center px-3 shrink-0'>
          <div
            className='size-11 rounded-full overflow-hidden relative shrink-0'
            style={{ width: 44, height: 25 }}
          >
            <img
              src={imgLogo}
              alt='TaxMate'
              className='absolute max-w-none'
              style={{
                height: '145%',
                top: '-8.5%',
                left: '-7.3%',
                width: '120%'
              }}
            />
          </div>

          <span className='text-[#14005e] text-[20px] font-bold whitespace-nowrap pt-1'>
            TaxMate
          </span>
        </div>

        <div className='bg-white h-8.25 rounded-[16px] flex items-center px-1 gap-1'>
          <NavLink to={path.BUSINESS_OWNER_HOME}>
            {({ isActive }) => (
              <NavItem label='Tổng quan' isActive={isActive} />
            )}
          </NavLink>

          <NavLink to={path.BUSINESS_OWNER_PRODUCTS}>
            {({ isActive }) => (
              <NavItem label='Sản phẩm' isActive={isActive} />
            )}
          </NavLink>

          <NavLink to={path.BUSINESS_OWNER_INGREDIENTS}>
            {({ isActive }) => (
              <NavItem label='Nguyên liệu' isActive={isActive} />
            )}
          </NavLink>

          <NavLink to={path.BUSINESS_OWNER_ORDERS}>
            {({ isActive }) => (
              <NavItem label='Đơn hàng' isActive={isActive} />
            )}
          </NavLink>

          <NavLink to={path.BUSINESS_OWNER_EXPENSES}>
            {({ isActive }) => (
              <NavItem label='Thu chi' isActive={isActive} />
            )}
          </NavLink>

          <NavLink to={path.BUSINESS_OWNER_REPORTS}>
            {({ isActive }) => (
              <NavItem label='Báo cáo' isActive={isActive} />
            )}
          </NavLink>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <NavLink to={path.BUSINESS_OWNER_POS} className='bg-white rounded-full px-4 h-7.25 flex items-center text-[#e00000] text-[14px] font-bold whitespace-nowrap'>
          + &nbsp;Bán hàng
        </NavLink>

        <div className='bg-white h-7 w-7 rounded-[15px] border border-[#ff8e8e] flex items-center justify-center'>
          <Bell size={18} strokeWidth={2.2} color='#e00000' />
        </div>

        <div>
          <button
            onClick={() => setProfileOpen(true)}
            className='bg-white h-7 w-7 rounded-[15px] border border-[#ff8e8e] flex items-center justify-center cursor-pointer hover:bg-[#fff0f0] transition-colors'
          >
            <User size={20} strokeWidth={2.2} color='#e00000' />
          </button>
        </div>
      </div>

      {profileOpen && (
        <div className='fixed inset-0 z-50 flex justify-end'>
          <div
            className='absolute inset-0 bg-black/40 transition-opacity'
            onClick={() => setProfileOpen(false)}
          />

          <div
            className='relative w-85 h-screen bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.1)] flex flex-row'
            style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div className='flex-1 flex flex-col border-r border-gray-100'>
              <div className='bg-[#9b0000] px-5 py-6 text-white h-35 flex flex-col justify-center'>
                <h2 className='text-[22px] font-bold leading-tight mb-1'>{currentBusiness?.businessName}</h2>
                <p className='text-[14px] text-white/90 mb-3'>{currentBusiness?.mainCategoryName}</p>
                <div className='bg-white inline-flex items-center px-2.5 py-1 rounded-md self-start shadow-xs'>
                  <span className='text-[#1d1d1d] text-[12px] font-semibold mr-1.5'>Gói Hộ Kinh Doanh</span>
                  <div className='bg-yellow-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none'>★</div>
                </div>
              </div>

              <div className='flex-1 py-2 overflow-y-auto'>
                {menuItems.map(({ icon: Icon, label, path: itemPath }) => (
                  <button
                    key={label}
                    onClick={() => {
                      if (itemPath) {
                        navigate(itemPath)
                        setProfileOpen(false)
                      }
                    }}
                    className='w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[#fef2f2] group transition-colors cursor-pointer border-b border-transparent hover:border-gray-50'
                  >
                    <Icon size={20} strokeWidth={2} className='text-[#c0392b] shrink-0' />
                    <span className='flex-1 text-left text-[15px] text-[#1d1d1d] font-medium group-hover:text-[#9b0000]'>{label}</span>
                  </button>
                ))}

                <div className='mx-5 my-2 h-px bg-gray-100' />

                <button 
                  className='w-full flex items-center gap-4 px-5 py-4 hover:bg-[#fef2f2] group transition-colors cursor-pointer'
                  onClick={handleLogout}
                >
                  <LogOut size={20} strokeWidth={2} className='text-gray-500 group-hover:text-[#c0392b] shrink-0' />
                  <span className='flex-1 text-left text-[15px] text-[#1d1d1d] font-medium group-hover:text-[#9b0000]'>Đăng xuất</span>
                </button>
              </div>
            </div>

            <div className='w-20 bg-white flex flex-col items-center py-5 gap-6 shrink-0'>
              {businesses.map((business) => (
                <div
                  key={business.id}
                  onClick={() => setCurrentBusiness(business)}
                  className='flex w-12.5 flex-col items-stretch gap-1.5 cursor-pointer'
                >
                  <div
                    className={`w-12.5 h-12.5 rounded-full flex items-center justify-center
                    ${
                      currentBusiness?.id === business.id
                        ? 'bg-[#ffd6d8]'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Store
                      size={22}
                      color={
                        currentBusiness?.id === business.id
                          ? '#9b0000'
                          : '#666'
                      }
                    />
                  </div>

                  <span
                    className={`truncate text-center text-[12px] font-semibold ${
                      currentBusiness?.id === business.id
                        ? 'text-[#9b0000]'
                        : 'text-gray-500'
                    }`}
                  >
                    {business.businessName}
                  </span>
                </div>
              ))}

              <button 
                className='flex flex-col items-center gap-1.5 cursor-pointer group'
                onClick={() => {
                  setShowAddBusinessModal(true)
                }}
              >
                <div className='w-12.5 h-12.5 rounded-full border border-[#9b0000] flex items-center justify-center'>
                  <Plus size={24} color='#9b0000' />
                </div>

                <div className='text-[12px] font-medium text-[#9b0000]'>
                  Thêm
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddBusinessModal && (
        <div className='fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4' onClick={handleCloseAddBusinessModal}>
          <div
            className='relative w-full max-w-160 overflow-hidden rounded-2xl bg-white shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='max-h-[90vh] overflow-y-auto'>
              <div className='mx-auto w-full max-w-130 px-8 py-6'>
                <div className='flex justify-center'>
                  <img
                    src={storeImage}
                    alt='Store'
                    className='w-44'
                  />
                </div>

                <div className='mt-2 text-center'>
                  <p className='text-2xl font-bold text-blue-500'>
                    Tạo hồ sơ cửa hàng mới
                  </p>
                </div>

                <div className='mt-8 space-y-5'>
                  <div>
                    <label className='mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-500'>
                      Tên cửa hàng <span className='text-taxmate-red'>*</span>
                    </label>

                    <input
                      type='text'
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder='Nhập tên cửa hàng'
                      className='h-12 w-full rounded-xl border border-gray-300 bg-white py-3 pl-5 pr-5 text-sm text-gray-900 outline-hidden transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                    />
                  </div>

                  <div>
                    <label className='mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-500'>
                      Địa chỉ cửa hàng
                    </label>

                    <input
                      type='text'
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder='Nhập địa chỉ cửa hàng'
                      className='h-12 w-full rounded-xl border border-gray-300 bg-white py-3 pl-5 pr-5 text-sm text-gray-900 outline-hidden transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                    />
                  </div>

                  <div>
                    <label className='mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-500'>
                      Mã tỉnh/thành phố
                    </label>

                    <input
                      type='text'
                      value={provinceCode}
                      onChange={(e) => setProvinceCode(e.target.value)}
                      placeholder='Ví dụ: 79'
                      className='h-12 w-full rounded-xl border border-gray-300 bg-white py-3 pl-5 pr-5 text-sm text-gray-900 outline-hidden transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                    />
                  </div>

                  <div>
                    <label className='mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-500'>
                      Mã quận/huyện
                    </label>

                    <input
                      type='text'
                      value={wardCode}
                      onChange={(e) => setWardCode(e.target.value)}
                      placeholder='Ví dụ: 26734'
                      className='h-12 w-full rounded-xl border border-gray-300 bg-white py-3 pl-5 pr-5 text-sm text-gray-900 outline-hidden transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                    />
                  </div>

                  <div>
                    <label className='mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-500'>
                      Loại cửa hàng <span className='text-taxmate-red'>*</span>
                    </label>

                    <div className='space-y-3 mb-2'>
                      {categories.map((category) => {
                        const selected = categoryId === category.businessCategoryId
                        const Icon = category.icon
                        return (
                          <button
                            key={category.businessCategoryId}
                            type='button'
                            onClick={() => setCategoryId(category.businessCategoryId)}
                            className={`flex h-12 w-full items-center justify-between rounded-xl border px-5 py-6 transition-all ${
                              selected
                                ? 'border-taxmate-red bg-taxmate-red/10'
                                : 'border-gray-300 hover:border-taxmate-red'
                            }`}
                          >
                            <div className='flex items-center gap-4'>
                              <Icon className={`h-6 w-6 ${category.color}`} />

                              <span>{category.name}</span>
                            </div>

                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                                selected
                                  ? 'border-taxmate-red'
                                  : 'border-gray-400'
                              }`}
                            >
                              {selected && (
                                <div className='h-3 w-3 rounded-full bg-taxmate-red' />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <button
                    type='button'
                    disabled={loading}
                    onClick={handleCreateBusiness}
                    className='h-14 w-full rounded-xl bg-red-600 py-3 text-lg font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60'
                  >
                    {loading ? 'Đang tạo...' : 'Tạo mới'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}