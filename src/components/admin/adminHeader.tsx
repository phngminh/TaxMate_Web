import {
  Bell,
  User,
  Settings,
  LogOut,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import path from '../../constants/path'

export default function TopNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handler)

    return () => {
      document.removeEventListener('mousedown', handler)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate(path.home)
  }

  const displayName = user?.fullName ?? 'Quản trị viên'
  const displayEmail = user?.email ?? 'admin@taxmate.vn'

  return (
    <div className='sticky top-0 z-50 w-full bg-[#00789C] border-b border-[#086781] shrink-0'>
      <div className='flex h-16 items-center px-6'>
        <div className='ml-auto flex items-center gap-4'>
          <button className='relative p-2 rounded-lg hover:bg-white/10 transition-colors'>
            <Bell className='w-5 h-5 text-white' />
            <span className='absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500' />
          </button>

          <div className='relative' ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className='flex items-center gap-3 pl-4'
            >
              <div className='text-right'>
                <p className='text-sm font-medium text-white'>{displayName}</p>
                <p className='text-xs text-white/70'>{displayEmail}</p>
              </div>

              <div className='w-10 h-10 rounded-full overflow-hidden bg-white/15'>
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <User className='w-5 h-5 text-white' />
                  </div>
                )}
              </div>
            </button>

            {showDropdown && (
              <div className='absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50'>
                <button
                  className='w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100'
                >
                  <User className='w-4 h-4' />
                  Hồ sơ cá nhân
                </button>

                <button
                  className='w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100'
                >
                  <Settings className='w-4 h-4' />
                  Cài đặt
                </button>

                <div className='border-t border-gray-200' />

                <button
                  onClick={handleLogout}
                  className='w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-gray-100'
                >
                  <LogOut className='w-4 h-4' />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}