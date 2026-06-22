import { NavLink } from 'react-router-dom'
import imgLogo from '../../assets/logo3.png'
import path from '../../constants/path'
import { Bell, CircleUserRound, PersonStandingIcon, User } from 'lucide-react'

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

      {isActive && (
        <div className='absolute bottom-[-0.5px] left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-[#910101] rounded-full' />
      )}
    </div>
  )
}

export default function OwnerHeader() {
  return (
    <div className='h-[51px] bg-gradient-to-r from-[#d00c0c] to-[#4c51bf] shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex items-center justify-between px-4'>
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

          <NavLink to={path.BUSINESS_OWNER_MATERIALS}>
            {({ isActive }) => (
              <NavItem label='Nguyên liệu' isActive={isActive} />
            )}
          </NavLink>

          <NavLink to={path.BUSINESS_OWNER_ORDERS}>
            {({ isActive }) => (
              <NavItem label='Đơn hàng' isActive={isActive} />
            )}
          </NavLink>

          <NavLink to={path.BUSINESS_OWNER_CUSTOMERS}>
            {({ isActive }) => (
              <NavItem label='Khách hàng' isActive={isActive} />
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
        <div className='bg-white rounded-full px-4 h-[29px] flex items-center text-[#e00000] text-[14px] font-bold whitespace-nowrap'>
          + &nbsp;Bán hàng
        </div>

        <div className='bg-white h-[28px] w-[28px] rounded-[15px] border border-[#ff8e8e] flex items-center justify-center'>
          <Bell size={18} strokeWidth={2.2} color='#e00000' />
        </div>

        <div className='bg-white h-[28px] w-[28px] rounded-[15px] border border-[#ff8e8e] flex items-center justify-center'>
          <User size={20} strokeWidth={2.2} color='#e00000' />
        </div>
      </div>
    </div>
  )
}