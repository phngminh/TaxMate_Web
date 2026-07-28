import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import imgLogo from '../../assets/logo3.png'
import path from '../../constants/path'
import { Bell, User, HeadphonesIcon, Heart, Store, Settings, LogOut, Plus, UtensilsCrossed, Handshake, FileDown } from 'lucide-react'
import { useBusiness } from '../../contexts/BusinessContext'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import { createBusinessProfile, getBusinessProfiles } from '../../apis/profile.api'
import BusinessModal from './addBusinessModal'
import { getCurrentSubscription } from '../../apis/subscription.api'
import type { UserSubscriptionResponse } from '../../types/subscription.type'
import http from '../../utils/http'

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
  { icon: HeadphonesIcon, label: 'Hỗ trợ' },
  { icon: Heart,          label: 'Gói của tôi' },
  { icon: FileDown,       label: 'Xuất S2A-HKD' },
  { icon: Store,          label: 'Cài đặt Cửa hàng' },
  { icon: Settings,       label: 'Cài đặt cá nhân' },
]

export default function OwnerHeader() {
  const [profileOpen, setProfileOpen] = useState(false)
  const [showBusinessModal, setShowBusinessModal] = useState(false)
  const [showAddBusinessModal, setShowAddBusinessModal] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const { businesses, currentBusiness, setCurrentBusiness, clearBusiness, setBusinesses } = useBusiness()
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null)
  const emptyBusinessForm = {
    businessName: '',
    address: '',
    provinceCode: '',
    wardCode: '',
    categoryId: ''
  }

  const [form, setForm] = useState(emptyBusinessForm)
  const [loading, setLoading] = useState(false)
  const [showExportS2aModal, setShowExportS2aModal] = useState(false)
  const [exportBusinessId, setExportBusinessId] = useState('')
  const [exportYear, setExportYear] = useState(new Date().getFullYear().toString())
  const [exportQuarter, setExportQuarter] = useState<'1' | '2' | '3' | '4'>('1')
  const [isExportingS2a, setIsExportingS2a] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const checkBusinessProfile = async () => {
    if (!user) return

    try {
      const res = await getBusinessProfiles(user.id)
      console.log('Business profiles:', res.data.items)
      if (res.data.items.length === 0) {
        setShowBusinessModal(true)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    checkBusinessProfile()
  }, [])

  useEffect(() => {
    const fetchCurrentSubscription = async () => {
      if (!user) return

      try {
        const res = await getCurrentSubscription(user.id)
        setSubscription(res.data)
      } catch (error) {
        console.error(error)
        setSubscription(null)
      }
    }

    fetchCurrentSubscription()
  }, [user])

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
    if (!form.businessName.trim()) {
      toast.error('Vui lòng nhập tên cửa hàng')
      return
    }

    if (!form.categoryId) {
      toast.error('Vui lòng chọn danh mục cửa hàng')
      return
    }

    try {
      setLoading(true)
      const res = await createBusinessProfile({
        ownerId: user!.id,
        businessName: form.businessName.trim(),
        provinceCode: form.provinceCode.trim() || undefined,
        wardCode: form.wardCode.trim() || undefined,
        address: form.address.trim() || undefined,
        mainCategoryId: form.categoryId,
        preferElectronicInvoice: false
      })

      const newBusiness = res.data
      setBusinesses([...businesses, newBusiness])
      setCurrentBusiness(newBusiness)

      setForm(emptyBusinessForm)
      toast.success('Tạo hồ sơ cửa hàng thành công')
      
      handleCloseBusinessModal()
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

  const handleCloseBusinessModal = () => {
    setShowBusinessModal(false)
    setShowAddBusinessModal(false)
    setForm(emptyBusinessForm)
  }

  const openExportS2aModal = () => {
    setExportBusinessId(currentBusiness?.id ?? businesses[0]?.id ?? '')
    setExportYear(new Date().getFullYear().toString())
    setExportQuarter('1')
    setShowExportS2aModal(true)
  }

  const handleExportS2a = async () => {
    if (!exportBusinessId) {
      toast.error('Vui lòng chọn hồ sơ kinh doanh')
      return
    }

    const year = Number(exportYear)
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      toast.error('Năm phải nằm trong khoảng 2000 - 2100')
      return
    }

    try {
      setIsExportingS2a(true)
      const res = await http.get(`/businesses/reports/${exportBusinessId}/s2a-hkd`, {
        params: {
          year,
          quarter: Number(exportQuarter)
        },
        responseType: 'blob'
      })

      const selectedBusiness = businesses.find((x) => x.id === exportBusinessId)
      const filename = `S2a-HKD_${selectedBusiness?.businessName ?? exportBusinessId}_Q${exportQuarter}_${year}.docx`
        .replace(/[\\/:*?"<>|]/g, '_')

      const blobUrl = window.URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(blobUrl)

      toast.success('Xuất file S2A-HKD thành công')
      setShowExportS2aModal(false)
    } catch (error: any) {
      let message = 'Không thể xuất file S2A-HKD'
      const responseData = error?.response?.data
      if (responseData instanceof Blob) {
        try {
          const text = await responseData.text()
          const parsed = JSON.parse(text)
          message = parsed?.message || parsed?.error || message
        } catch {
          // keep default message
        }
      } else if (typeof responseData?.message === 'string') {
        message = responseData.message
      }
      toast.error(message)
    } finally {
      setIsExportingS2a(false)
    }
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
                <h2 className='text-[22px] font-bold leading-tight mb-1'>{currentBusiness?.businessName ?? 'Chưa có cửa hàng'}</h2>
                <p className='text-[14px] text-white/90 mb-3'>{currentBusiness?.mainCategoryName ?? 'Hãy tạo hồ sơ cửa hàng'}</p>
                <div className='bg-white inline-flex items-center px-2.5 py-1 rounded-md self-start shadow-xs'>
                  <span className='text-[#1d1d1d] text-[12px] font-semibold mr-1.5'>
                    {subscription?.subscriptionPlanName ?? 'Gói Miễn Phí'}
                  </span>
                  <div className='bg-yellow-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none'>★</div>
                </div>
              </div>

              <div className='flex-1 py-2 overflow-y-auto'>
                {menuItems.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    className='w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[#fef2f2] group transition-colors cursor-pointer border-b border-transparent hover:border-gray-50'
                    onClick={() => {
                      if (label === 'Xuất S2A-HKD') {
                        openExportS2aModal()
                      }
                    }}
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
                  setForm(emptyBusinessForm)
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

      <BusinessModal
        open={showBusinessModal}
        mode="initial"
        loading={loading}
        form={form}
        setForm={setForm}
        onClose={handleCloseBusinessModal}
        onSubmit={handleCreateBusiness}
      />

      <BusinessModal
        open={showAddBusinessModal}
        mode="add"
        loading={loading}
        form={form}
        setForm={setForm}
        onClose={handleCloseBusinessModal}
        onSubmit={handleCreateBusiness}
      />

      {showExportS2aModal && (
        <div className='fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4' onClick={() => setShowExportS2aModal(false)}>
          <div
            className='w-full max-w-120 rounded-2xl bg-white p-6 shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className='text-xl font-bold text-gray-900 mb-4'>Xuất sổ S2A-HKD</h3>

            <div className='space-y-4'>
              <div>
                <label className='mb-2 block text-sm font-semibold text-gray-600'>
                  Hồ sơ kinh doanh <span className='text-taxmate-red'>*</span>
                </label>
                <select
                  value={exportBusinessId}
                  onChange={(e) => setExportBusinessId(e.target.value)}
                  className='h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-hidden focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                >
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.businessName}
                    </option>
                  ))}
                </select>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='mb-2 block text-sm font-semibold text-gray-600'>
                    Năm <span className='text-taxmate-red'>*</span>
                  </label>
                  <input
                    type='number'
                    min={2000}
                    max={2100}
                    value={exportYear}
                    onChange={(e) => setExportYear(e.target.value)}
                    className='h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-hidden focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                  />
                </div>

                <div>
                  <label className='mb-2 block text-sm font-semibold text-gray-600'>
                    Quý <span className='text-taxmate-red'>*</span>
                  </label>
                  <select
                    value={exportQuarter}
                    onChange={(e) => setExportQuarter(e.target.value as '1' | '2' | '3' | '4')}
                    className='h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-hidden focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                  >
                    <option value='1'>Quý 1</option>
                    <option value='2'>Quý 2</option>
                    <option value='3'>Quý 3</option>
                    <option value='4'>Quý 4</option>
                  </select>
                </div>
              </div>
            </div>

            <div className='mt-6 flex justify-end gap-3'>
              <button
                type='button'
                onClick={() => setShowExportS2aModal(false)}
                className='px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50'
                disabled={isExportingS2a}
              >
                Hủy
              </button>
              <button
                type='button'
                onClick={handleExportS2a}
                disabled={isExportingS2a}
                className='px-5 py-2.5 rounded-xl bg-taxmate-red text-white font-semibold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
              >
                {isExportingS2a ? 'Đang xuất...' : 'Xuất file'}
              </button>
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