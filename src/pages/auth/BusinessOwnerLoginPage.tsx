import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo1.png'
import heroBg from '../../assets/bg.jpg'
import path from '../../constants/path'
import { login } from '../../apis/auth.api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'

export default function BusinessOwnerLoginPage() {
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const slideClass =
    location.state?.direction === 'left'
      ? 'auth-page-enter-left'
      : location.state?.direction === 'right'
        ? 'auth-page-enter-right'
        : ''
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!identifier.trim()) {
      toast.error('Vui lòng nhập email hoặc số điện thoại')
      return
    }

    if (!password.trim()) {
      toast.error('Vui lòng nhập mật khẩu')
      return
    }

    try {
      setIsSubmitting(true)

      const auth = await login({
        login: identifier.trim(),
        password
      })

      if (auth.requiresEmailVerification) {
        toast.warning('Vui lòng xác thực email')
        setIsSubmitting(false)
        return
      }

      authLogin(auth)
      toast.success('Đăng nhập thành công')
      navigate(path.BUSINESS_OWNER_DASHBOARD, { state: { direction: 'right' } })
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Sai tài khoản hoặc mật khẩu'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`flex min-h-screen w-full flex-col lg:flex-row ${slideClass}`}>
        {/* Hero panel */}
        <div className='relative flex min-h-[220px] flex-col overflow-hidden bg-taxmate-red lg:min-h-screen lg:w-[45%]'>
          <img
            src={heroBg}
            alt=''
            aria-hidden='true'
            className='pointer-events-none absolute inset-0 h-full w-full object-top object-cover opacity-100 mix-blend-luminosity'
          />
          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-0 bg-gradient-to-br from-taxmate-red/90 via-taxmate-red/95 to-taxmate-red-dark/80'
          />

          <div className='relative z-10 flex flex-1 flex-col p-8 lg:p-10'>
            <img
              src={logo}
              alt='TaxMate'
              className='h-14 w-auto self-start brightness-0 invert lg:h-16'
            />

            <div className='flex flex-1 items-center py-8 lg:py-0 mb-48'>
              <div className='max-w-md'>
                <h1 className='text-2xl font-bold leading-snug text-white sm:text-2xl lg:text-[2.5rem] lg:leading-tight'>
                  Quản lý bán hàng và hỗ trợ nghĩa vụ thuế cho hộ kinh doanh nhỏ
                </h1>
                <div className='mt-8 h-px w-[100px] bg-white' />
              </div>
            </div>
          </div>
        </div>

        {/* Login form */}
        <div className='flex min-h-screen flex-1 items-center justify-center bg-white px-6 py-10 sm:px-10 sm:py-12 lg:px-14'>
          <div className='w-full max-w-[400px] space-y-8'>
            <header className='space-y-2 text-center'>
              <h2 className='text-2xl font-bold text-taxmate-red sm:text-[1.75rem]'>
                Chào mừng quay trở lại
              </h2>
              <p className='text-sm text-gray-500'>
                Đăng nhập để tiếp tục sử dụng TaxMate
              </p>
            </header>

            <form className='space-y-5' onSubmit={handleSubmit} noValidate>
              <div className='relative'>
                <span className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>
                  <Mail className='h-[18px] w-[18px]' strokeWidth={1.75} />
                </span>
                <input
                  type='text'
                  name='identifier'
                  autoComplete='username'
                  placeholder='Số điện thoại/Email'
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className='h-12 w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                />
              </div>

              <div className='space-y-2'>
                <div className='relative'>
                  <span className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>
                    <Lock className='h-[18px] w-[18px]' strokeWidth={1.75} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name='password'
                    autoComplete='current-password'
                    placeholder='Mật khẩu'
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className='h-12 w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword((prev) => !prev)}
                    className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600'
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? (
                      <EyeOff className='h-[18px] w-[18px]' strokeWidth={1.75} />
                    ) : (
                      <Eye className='h-[18px] w-[18px]' strokeWidth={1.75} />
                    )}
                  </button>
                </div>

                <div className='flex justify-end'>
                  <Link
                    to='/business-owner/forgot-password'
                    className='text-sm font-medium text-taxmate-red transition-colors hover:text-taxmate-red-hover'
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              <button
                type='submit'
                disabled={isSubmitting}
                className='flex h-12 w-full items-center justify-center rounded-lg bg-taxmate-red text-sm font-semibold text-white shadow-taxmate-btn transition-all hover:bg-taxmate-red-hover active:bg-taxmate-red-dark disabled:cursor-not-allowed disabled:opacity-60'
              >
                {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            <div className='relative my-6'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-200' />
              </div>
              <div className='relative flex justify-center'>
                <span className='bg-white px-4 text-sm text-gray-400'>Hoặc</span>
              </div>
            </div>

            <button
              type='button'
              className='flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50'
            >
              <svg className='h-5 w-5 shrink-0' viewBox='0 0 24 24' aria-hidden='true'>
                <path
                  fill='#4285F4'
                  d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                />
                <path
                  fill='#34A853'
                  d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                />
                <path
                  fill='#FBBC05'
                  d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                />
                <path
                  fill='#EA4335'
                  d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                />
              </svg>
              Tiếp tục với Google
            </button>

            <p className='text-center text-sm text-gray-500'>
              Bạn chưa có tài khoản?{' '}
              <button
                type='button'
                onClick={() =>
                  navigate(path.BUSINESS_OWNER_REGISTER, { state: { direction: 'left' } })
                }
                className='font-semibold text-taxmate-red transition-colors hover:text-taxmate-red-hover'
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </div>
    </div>
  )
}
