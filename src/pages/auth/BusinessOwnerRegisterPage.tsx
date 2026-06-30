import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo1.png'
import heroBg from '../../assets/bg.jpg'
import emailImg from '../../assets/email.jpeg'
import path from '../../constants/path'
import { toast } from 'react-toastify'
import { register } from '../../apis/auth.api'
import { Eye, EyeOff, X } from 'lucide-react'

export default function BusinessOwnerRegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const slideClass =
    location.state?.direction === 'left'
      ? 'auth-page-enter-left'
      : location.state?.direction === 'right'
        ? 'auth-page-enter-right'
        : ''

  const [fullName, setFullName] = useState('')
  const [taxCode, setTaxCode] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreedToPolicy, setAgreedToPolicy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!fullName.trim()) {
      toast.error('Vui lòng nhập họ tên')
      return
    }

    if (!taxCode.trim()) {
      toast.error('Vui lòng nhập mã số thuế')
      return
    }

    if (!email.trim()) {
      toast.error('Vui lòng nhập email')
      return
    }

    if (!password.trim()) {
      toast.error('Vui lòng nhập mật khẩu')
      return
    }

    if (!agreedToPolicy) {
      toast.error('Vui lòng nhấn đồng ý với chính sách của TaxMate')
      return
    }

    try {
      setIsSubmitting(true)
      const auth = await register({ fullName, taxCode, phone, email, password })

      if (auth.requiresEmailVerification) {
        setShowVerifyModal(true)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldClassName =
    'h-14 w-full rounded-lg border border-gray-300 bg-white px-4 pb-2 pt-6 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'

  const labelClassName =
    'pointer-events-none absolute left-4 top-2 text-[10px] font-medium uppercase tracking-wide text-gray-400'

  return (
    <div className={`flex min-h-screen w-full flex-col lg:flex-row ${slideClass}`}>
      {/* Register form */}
      <div className='flex min-h-screen flex-1 items-center justify-center bg-white px-6 py-10 sm:px-10 sm:py-12 lg:px-14'>
        <div className='w-full max-w-[400px] space-y-8'>
          <header className='space-y-2 text-center'>
            <h2 className='text-2xl font-bold text-taxmate-red sm:text-[1.75rem]'>
              Đăng ký tài khoản
            </h2>
            <p className='text-sm text-gray-500'>
              Đăng ký để bắt đầu sử dụng TaxMate
            </p>
          </header>

          <form className='space-y-4' onSubmit={handleSubmit} noValidate>
            <div className='relative'>
              <label htmlFor='fullName' className={labelClassName}>
                Họ và tên <span className='text-taxmate-red'>*</span>
              </label>
              <input
                id='fullName'
                type='text'
                name='fullName'
                autoComplete='name'
                placeholder='Nhập họ và tên'
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={fieldClassName}
                required
              />
            </div>

            <div className='relative'>
              <label htmlFor='taxCode' className={labelClassName}>
                Mã số thuế <span className='text-taxmate-red'>*</span>
              </label>
              <input
                id='taxCode'
                type='text'
                name='taxCode'
                placeholder='Nhập mã số thuế'
                value={taxCode}
                onChange={(event) => setTaxCode(event.target.value)}
                className={fieldClassName}
                required
              />
            </div>

            <div className='relative'>
              <label htmlFor='phone' className={labelClassName}>
                Số điện thoại
              </label>
              <input
                id='phone'
                type='tel'
                name='phone'
                autoComplete='tel'
                placeholder='Nhập số điện thoại'
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={fieldClassName}
              />
            </div>

            <div className='relative'>
              <label htmlFor='email' className={labelClassName}>
                Email <span className='text-taxmate-red'>*</span>
              </label>
              <input
                id='email'
                type='email'
                name='email'
                autoComplete='email'
                placeholder='Nhập địa chỉ email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClassName}
                required
              />
            </div>

            <div className='relative'>
              <label htmlFor='password' className={labelClassName}>
                Mật khẩu <span className='text-taxmate-red'>*</span>
              </label>

              <input
                id='password'
                type={showPassword ? 'text' : 'password'}
                name='password'
                autoComplete='new-password'
                placeholder='Nhập mật khẩu'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${fieldClassName} pr-12`}
                required
              />

              <button
                type='button'
                onClick={() => setShowPassword((prev) => !prev)}
                className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600'
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <Eye size={18} />
                ) : (
                  <EyeOff size={18} />
                )}
              </button>
            </div>

            <label className='flex cursor-pointer items-center justify-center gap-2 pt-1'>
              <input
                type='checkbox'
                checked={agreedToPolicy}
                onChange={(event) => setAgreedToPolicy(event.target.checked)}
                className='mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-taxmate-red focus:ring-taxmate-red/20'
                required
              />
              <span className='text-sm text-gray-600'>
                Đồng ý với{' '}
                <Link
                  to='/privacy-policy'
                  className='font-semibold text-taxmate-red transition-colors hover:text-taxmate-red-hover'
                >
                  Chính sách quyền riêng tư
                </Link>
              </span>
            </label>

            <button
              type='submit'
              disabled={isSubmitting}
              className='flex h-12 w-full items-center justify-center rounded-lg bg-taxmate-red text-sm font-semibold text-white shadow-taxmate-btn transition-all hover:bg-taxmate-red-hover active:bg-taxmate-red-dark disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <p className='text-center text-sm text-gray-500'>
            Bạn đã có tài khoản?{' '}
            <button
              type='button'
              onClick={() =>
                navigate(path.BUSINESS_OWNER_LOGIN, { state: { direction: 'right' } })
              }
              className='font-semibold text-taxmate-red transition-colors hover:text-taxmate-red-hover'
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>

      {/* Hero panel */}
      <div className='relative flex min-h-[220px] flex-col overflow-hidden bg-taxmate-red lg:min-h-screen lg:w-[45%]'>
        <img
          src={heroBg}
          alt=''
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 h-full w-full object-cover opacity-100 mix-blend-luminosity'
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

          <div className='flex flex-1 items-center py-8 lg:py-0 mb-48 ml-10'>
            <div className='max-w-md'>
              <h1 className='text-2xl font-bold leading-snug text-white sm:text-3xl lg:text-[2.5rem] lg:leading-tight'>
                Quản lý bán hàng và hỗ trợ nghĩa vụ thuế cho hộ kinh doanh nhỏ
              </h1>
              <div className='mt-8 h-px w-[100px] bg-white' />
            </div>
          </div>
        </div>
      </div>

      { showVerifyModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60'>
          <div className='relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl'>

            <button
              onClick={() => setShowVerifyModal(false)}
              className='absolute right-4 top-4 text-gray-400 hover:text-gray-600'
            >
              <X size={20} />
            </button>

            <div className='flex justify-center'>
              <img
                src={emailImg}
                alt='Verify Email'
                className='h-48 w-48 object-contain'
              />
            </div>

            <h2 className='mt-2 text-center text-2xl font-bold text-taxmate-red'>
              Bạn cần xác thực email
            </h2>

            <p className='mt-4 text-center text-gray-600'>
              Đăng ký thành công! Vui lòng kiểm tra email bạn đã cung cấp để xác thực tài khoản và bắt đầu sử dụng TaxMate.
            </p>

            <button
              onClick={() => setShowVerifyModal(false)}
              className='mt-6 h-12 w-full rounded-lg bg-taxmate-red font-semibold text-white hover:bg-taxmate-red-hover'
            >
              Tôi đã hiểu
            </button>

          </div>
        </div>
      )}
    </div>
  )
}