import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import imgLogo from '../../assets/logo3.png'
import path from '../../constants/path'
import {
  Bell,
  User,
  HeadphonesIcon,
  Heart,
  Store,
  Settings,
  LogOut,
  Plus
} from 'lucide-react'
import { useBusiness } from '../../contexts/BusinessContext'
import { useAuth } from '../../contexts/AuthContext'

function NavItem({ label, isActive }: {
  label: string
  isActive: boolean
}) {
  return (
    <div
      className={`px-5 h-[28px] flex items-center justify-center rounded-full text-[14px] font-bold relative shrink-0
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
  { icon: Store,          label: 'Cài đặt Cửa hàng' },
  { icon: Settings,       label: 'Cài đặt cá nhân' },
]

export default function OwnerHeader() {
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const { currentBusiness } = useBusiness()
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileOpen])

  const handleLogout = () => {
    logout()
    navigate(path.home)
  }

  return (
    <div className='h-[51px] bg-linear-to-r from-[#d00c0c] to-[#4c51bf] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex items-center justify-between px-4'>
      <div className='flex items-center gap-6'>
        <div className='bg-white h-[33px] rounded-[16px] flex items-center px-3 shrink-0'>
          <div
            className='size-[44px] rounded-full overflow-hidden relative shrink-0'
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

        <div className='bg-white h-[33px] rounded-[16px] flex items-center px-1 gap-1'>
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
        <NavLink to={path.BUSINESS_OWNER_POS} className='bg-white rounded-full px-4 h-[29px] flex items-center text-[#e00000] text-[14px] font-bold whitespace-nowrap'>
          + &nbsp;Bán hàng
        </NavLink>

        <div className='bg-white h-[28px] w-[28px] rounded-[15px] border border-[#ff8e8e] flex items-center justify-center'>
          <Bell size={18} strokeWidth={2.2} color='#e00000' />
        </div>

        <div>
          <button
            onClick={() => setProfileOpen(true)}
            className='bg-white h-[28px] w-[28px] rounded-[15px] border border-[#ff8e8e] flex items-center justify-center cursor-pointer hover:bg-[#fff0f0] transition-colors'
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
            className='relative w-[340px] h-screen bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.1)] flex flex-row'
            style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div className='flex-1 flex flex-col border-r border-gray-100'>
              <div className='bg-[#9b0000] px-5 py-6 text-white h-[140px] flex flex-col justify-center'>
                <h2 className='text-[22px] font-bold leading-tight mb-1'>{currentBusiness?.businessName}</h2>
                <p className='text-[14px] text-white/90 mb-3'>{currentBusiness?.mainCategoryName}</p>
                <div className='bg-white inline-flex items-center px-2.5 py-1 rounded-md self-start shadow-xs'>
                  <span className='text-[#1d1d1d] text-[12px] font-semibold mr-1.5'>Gói Hộ Kinh Doanh</span>
                  <div className='bg-yellow-400 text-white rounded-full w-[16px] h-[16px] flex items-center justify-center text-[10px] leading-none'>★</div>
                </div>
              </div>

              <div className='flex-1 py-2 overflow-y-auto'>
                {menuItems.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
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

            <div className='w-[80px] bg-white flex flex-col items-center py-5 gap-6 shrink-0'>
              <div className='flex w-[50px] flex-col items-stretch gap-1.5 cursor-pointer'>
                <div className='flex justify-center'>
                  <div className='w-[50px] h-[50px] rounded-full bg-[#ffd6d8] flex items-center justify-center shadow-xs'>
                    <Store size={22} color='#9b0000' />
                  </div>
                </div>
                <span
                  className='truncate text-center text-[12px] font-semibold text-[#9b0000]'
                  title={currentBusiness?.businessName}
                >
                  {currentBusiness?.businessName}
                </span>
              </div>

              <div className='flex flex-col items-center gap-1.5 cursor-pointer group'>
                <div className='w-[50px] h-[50px] rounded-full border border-[#9b0000] flex items-center justify-center group-hover:bg-[#ffeaeb] transition-colors'>
                  <Plus size={24} color='#9b0000' />
                </div>
                <span className='text-[12px] font-medium text-[#9b0000]'>Thêm</span>
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