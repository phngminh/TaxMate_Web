import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, X, CircleCheckBig } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo1.png'
import email from '../../assets/email.jpeg'
import heroBg from '../../assets/bg.jpg'
import path, { getHomePathForRole } from '../../constants/path'
import { login, loginWithGoogle, resend, forgotPassword, verifyForgotPasswordOtp, resetPassword } from '../../apis/auth.api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { getBusinessProfiles } from '../../apis/profile.api'
import { useBusiness } from '../../contexts/BusinessContext'

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
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [showVerifiedModal, setShowVerifiedModal] = useState(false)
  const { setBusinesses, setCurrentBusiness } = useBusiness()
  const [view, setView] = useState<'login' | 'forgot_password_email' | 'forgot_password_otp' | 'forgot_password_reset'>('login')
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isResending, setIsResending] = useState(false)
  
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!forgotPasswordEmail.trim()) {
      toast.error('Vui lòng nhập email')
      return
    }
    try {
      setIsSubmitting(true)
      await forgotPassword({ email: forgotPasswordEmail.trim() })
      toast.success('Mã OTP đã được gửi đến email của bạn')
      setView('forgot_password_otp')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) {
      toast.error('Vui lòng nhập mã OTP')
      return
    }
    try {
      setIsSubmitting(true)
      await verifyForgotPasswordOtp({ email: forgotPasswordEmail.trim(), otp: otp.trim() })
      toast.success('Xác thực OTP thành công')
      setView('forgot_password_reset')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Mã OTP không hợp lệ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }
    try {
      setIsSubmitting(true)
      await resetPassword({ email: forgotPasswordEmail.trim(), newPassword, confirmPassword })
      toast.success('Đổi mật khẩu thành công')
      setView('login')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  useEffect(() => {
    const verified = searchParams.get('verified')

    if (verified === '1') {
      setShowVerifiedModal(true)
      searchParams.delete('verified')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

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
        setShowVerifyModal(true)
        return
      }

      authLogin(auth)
      if (auth.user.role === 'Owner') {
        const businessRes = await getBusinessProfiles(auth.user.id)
        const businesses = businessRes.data.items

        setBusinesses(businesses)

        if (businesses.length > 0) {
          setCurrentBusiness(businesses[0])
        }
      }

      toast.success('Đăng nhập thành công')

      navigate(getHomePathForRole(auth.user.role), {
        state: { direction: 'right' }
      })
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Sai tài khoản hoặc mật khẩu'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSuccess = async ( credentialResponse: CredentialResponse ) => {
    try {
      if (!credentialResponse.credential) {
        console.log('Không nhận được token từ Google')
        return
      }

      setIsSubmitting(true)

      const auth = await loginWithGoogle(credentialResponse.credential)

      if (auth.requiresEmailVerification) {
        setShowVerifyModal(true)
        return
      }

      authLogin(auth)

      if (auth.user.role === 'Owner') {
        const businessRes = await getBusinessProfiles(auth.user.id)
        const businesses = businessRes.data.items

        setBusinesses(businesses)

        if (businesses.length > 0) {
          setCurrentBusiness(businesses[0])
        }
      }

      toast.success('Đăng nhập thành công')

      navigate(getHomePathForRole(auth.user.role), {
        state: { direction: 'right' }
      })
    } catch (error: any) {
      toast.error( error?.response?.data?.message || 'Đăng nhập Google thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`flex min-h-screen w-full flex-col lg:flex-row ${slideClass}`}>
        {/* Hero panel */}
        <div className='relative flex min-h-55 flex-col overflow-hidden bg-taxmate-red lg:min-h-screen lg:w-[45%]'>
          <img
            src={heroBg}
            alt=''
            aria-hidden='true'
            className='pointer-events-none absolute inset-0 h-full w-full object-top object-cover opacity-100 mix-blend-luminosity'
          />
          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-0 bg-linear-to-br from-taxmate-red/90 via-taxmate-red/95 to-taxmate-red-dark/80'
          />

          <div className='relative z-10 flex flex-1 flex-col p-8 lg:p-10'>
            <img
              src={logo}
              alt='TaxMate'
              className='h-14 w-auto self-start brightness-0 invert lg:h-16'
            />

            <div className='flex flex-1 items-center py-10 lg:py-0 mb-48 ml-8'>
              <div className='max-w-md'>
                <h1 className='text-2xl font-bold leading-snug text-white sm:text-2xl lg:text-[2.5rem] lg:leading-tight'>
                  Quản lý bán hàng và hỗ trợ nghĩa vụ thuế cho hộ kinh doanh nhỏ
                </h1>
                <div className='mt-8 h-px w-25 bg-white' />
              </div>
            </div>
          </div>
        </div>

        {/* Login form */}
        <div className='flex min-h-screen flex-1 items-center justify-center bg-white px-6 py-10 sm:px-10 sm:py-12 lg:px-14'>
          <div className='w-full max-w-100 space-y-8'>
            {view === 'login' && (
              <>
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
                      <Mail className='h-4.5 w-4.5' strokeWidth={1.75} />
                    </span>
                    <input
                      type='text'
                      name='identifier'
                      autoComplete='username'
                      placeholder='Số điện thoại/Email'
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      className='h-12 w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-hidden transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                    />
                  </div>

                  <div className='space-y-2'>
                    <div className='relative'>
                      <span className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>
                        <Lock className='h-4.5 w-4.5' strokeWidth={1.75} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name='password'
                        autoComplete='current-password'
                        placeholder='Mật khẩu'
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className='h-12 w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 outline-hidden transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword((prev) => !prev)}
                        className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600'
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? (
                          <Eye className='h-4.5 w-4.5 cursor-pointer' strokeWidth={1.75} />
                        ) : (
                          <EyeOff className='h-4.5 w-4.5 cursor-pointer' strokeWidth={1.75} />
                        )}
                      </button>
                    </div>

                    <div className='flex justify-end'>
                      <button
                        type='button'
                        onClick={() => setView('forgot_password_email')}
                        className='text-sm font-semibold text-taxmate-red transition-colors hover:text-taxmate-red-hover cursor-pointer'
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                  </div>

                  <button
                    type='submit'
                    disabled={isSubmitting}
                    className='flex h-12 w-full items-center justify-center rounded-lg bg-taxmate-red text-sm font-semibold text-white shadow-taxmate-btn transition-all hover:bg-taxmate-red-hover active:bg-taxmate-red-dark disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer'
                  >
                    {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </button>
                </form>

                <div className='relative my-6'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-gray-300' />
                  </div>
                  <div className='relative flex justify-center'>
                    <span className='bg-white px-4 text-sm text-gray-400'>Hoặc</span>
                  </div>
                </div>

                <div className='w-full flex justify-center'>
                  <GoogleLogin
                    theme='outline'
                    size='large'
                    shape='rectangular'
                    text='continue_with'
                    width='400'
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error('Đăng nhập Google thất bại')}
                  />
                </div>

                <p className='text-center text-sm text-gray-500'>
                  Bạn chưa có tài khoản?{' '}
                  <button
                    type='button'
                    onClick={() =>
                      navigate(path.BUSINESS_OWNER_REGISTER, { state: { direction: 'left' } })
                    }
                    className='font-semibold text-taxmate-red transition-colors hover:text-taxmate-red-hover cursor-pointer'
                  >
                    Đăng ký ngay
                  </button>
                </p>
              </>
            )}

            {view === 'forgot_password_email' && (
              <>
                <header className='space-y-2 text-center'>
                  <h2 className='text-2xl font-bold text-taxmate-red sm:text-[1.75rem]'>
                    Quên mật khẩu
                  </h2>
                  <p className='text-sm text-gray-500'>
                    Nhập email của bạn để nhận mã OTP khôi phục mật khẩu
                  </p>
                </header>
                <form className='space-y-5' onSubmit={handleForgotPassword} noValidate>
                  <div className='relative'>
                    <span className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>
                      <Mail className='h-4.5 w-4.5' strokeWidth={1.75} />
                    </span>
                    <input
                      type='email'
                      placeholder='Email'
                      value={forgotPasswordEmail}
                      onChange={(event) => setForgotPasswordEmail(event.target.value)}
                      className='h-12 w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-hidden transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                    />
                  </div>
                  <button
                    type='submit'
                    disabled={isSubmitting}
                    className='flex h-12 w-full items-center justify-center rounded-lg bg-taxmate-red text-sm font-semibold text-white shadow-taxmate-btn transition-all hover:bg-taxmate-red-hover active:bg-taxmate-red-dark disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer'
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi mã OTP'}
                  </button>
                </form>
                <p className='text-center text-sm text-gray-500'>
                  <button
                    type='button'
                    onClick={() => setView('login')}
                    className='font-semibold text-taxmate-red transition-colors hover:text-taxmate-red-hover cursor-pointer'
                  >
                    Quay lại đăng nhập
                  </button>
                </p>
              </>
            )}

            {view === 'forgot_password_otp' && (
              <>
                <header className='space-y-2 text-center'>
                  <h2 className='text-2xl font-bold text-taxmate-red sm:text-[1.75rem]'>
                    Xác thực OTP
                  </h2>
                  <p className='text-sm text-gray-500'>
                    Nhập mã OTP đã được gửi đến email của bạn
                  </p>
                </header>
                <form className='space-y-5' onSubmit={handleVerifyOtp} noValidate>
                  <div className='relative'>
                    <input
                      type='text'
                      placeholder='Mã OTP'
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                      className='h-12 w-full rounded-lg border border-gray-300 bg-white py-3 px-4 text-sm text-gray-900 outline-hidden transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20 text-center tracking-widest'
                    />
                  </div>
                  <button
                    type='submit'
                    disabled={isSubmitting}
                    className='flex h-12 w-full items-center justify-center rounded-lg bg-taxmate-red text-sm font-semibold text-white shadow-taxmate-btn transition-all hover:bg-taxmate-red-hover active:bg-taxmate-red-dark disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer'
                  >
                    {isSubmitting ? 'Đang xác thực...' : 'Xác nhận OTP'}
                  </button>
                </form>
                <p className='text-center text-sm text-gray-500'>
                  <button
                    type='button'
                    onClick={() => setView('login')}
                    className='font-semibold text-taxmate-red transition-colors hover:text-taxmate-red-hover cursor-pointer'
                  >
                    Hủy bỏ
                  </button>
                </p>
              </>
            )}

            {view === 'forgot_password_reset' && (
              <>
                <header className='space-y-2 text-center'>
                  <h2 className='text-2xl font-bold text-taxmate-red sm:text-[1.75rem]'>
                    Đổi mật khẩu mới
                  </h2>
                  <p className='text-sm text-gray-500'>
                    Nhập mật khẩu mới cho tài khoản của bạn
                  </p>
                </header>
                <form className='space-y-5' onSubmit={handleResetPassword} noValidate>
                  <div className='relative'>
                    <span className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>
                      <Lock className='h-4.5 w-4.5' strokeWidth={1.75} />
                    </span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder='Mật khẩu mới'
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className='h-12 w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 outline-hidden transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                    />
                    <button
                      type='button'
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600'
                      aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showNewPassword ? (
                        <Eye className='h-4.5 w-4.5 cursor-pointer' strokeWidth={1.75} />
                      ) : (
                        <EyeOff className='h-4.5 w-4.5 cursor-pointer' strokeWidth={1.75} />
                      )}
                    </button>
                  </div>

                  <div className='relative'>
                    <span className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>
                      <Lock className='h-4.5 w-4.5' strokeWidth={1.75} />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder='Xác nhận mật khẩu'
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className='h-12 w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 outline-hidden transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                    />
                    <button
                      type='button'
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600'
                      aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showConfirmPassword ? (
                        <Eye className='h-4.5 w-4.5 cursor-pointer' strokeWidth={1.75} />
                      ) : (
                        <EyeOff className='h-4.5 w-4.5 cursor-pointer' strokeWidth={1.75} />
                      )}
                    </button>
                  </div>

                  <button
                    type='submit'
                    disabled={isSubmitting}
                    className='flex h-12 w-full items-center justify-center rounded-lg bg-taxmate-red text-sm font-semibold text-white shadow-taxmate-btn transition-all hover:bg-taxmate-red-hover active:bg-taxmate-red-dark disabled:cursor-not-allowed disabled:opacity-60'
                  >
                    {isSubmitting ? 'Đang đổi...' : 'Đổi mật khẩu'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {showVerifyModal && (
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
                  src={email}
                  alt='Verify Email'
                  className='h-48 w-48 object-contain'
                />
              </div>

              <h2 className='mt-2 text-center text-2xl font-bold text-taxmate-red'>
                Bạn cần xác thực email
              </h2>

              <p className='mt-4 text-center text-gray-600'>
                Chúng tôi đã gửi email xác thực đến hộp thư của bạn.
                Vui lòng kiểm tra email và nhấn vào liên kết xác thực để tiếp tục.
              </p>

              <div className='mt-4 text-center text-sm'>
                <span className='text-gray-500'>Chưa nhận được mail? </span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setIsResending(true)
                      await resend(identifier.trim())
                      toast.success('Đã gửi lại email xác thực')
                    } catch (error: any) {
                      toast.error(error?.response?.data?.message || 'Lỗi gửi lại email')
                    } finally {
                      setIsResending(false)
                    }
                  }}
                  disabled={isResending}
                  className='font-medium text-taxmate-red hover:text-taxmate-red-hover disabled:opacity-50'
                >
                  Ấn vào đây
                </button>
              </div>

              <button
                onClick={() => setShowVerifyModal(false)}
                className='mt-6 h-12 w-full rounded-lg bg-taxmate-red font-semibold text-white hover:bg-taxmate-red-hover'
              >
                Tôi đã hiểu
              </button>
            </div>
          </div>
        )}

        {showVerifiedModal && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60'>
            <div className='relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl'>
              <button
                onClick={() => setShowVerifiedModal(false)}
                className='absolute right-4 top-4 text-gray-400 hover:text-gray-600'
              >
                <X size={20} />
              </button>

              <div className='flex justify-center'>
                <div className='flex h-24 w-24 items-center justify-center rounded-full bg-green-100 animate-in zoom-in duration-300'>
                  <CircleCheckBig
                    className='h-14 w-14 text-green-500 animate-pulse'
                    strokeWidth={2.5}
                  />
                </div>
              </div>

              <h2 className='mt-7 text-center text-2xl font-bold text-green-500'>
                Xác thực email thành công!
              </h2>

              <p className='px-5 mt-2 text-center text-gray-600'>
                Vui lòng đăng nhập để bắt đầu sử dụng TaxMate.
              </p>

              <button
                onClick={() => setShowVerifiedModal(false)}
                className='mt-6 h-12 w-full rounded-lg bg-taxmate-red font-semibold text-white hover:bg-taxmate-red-hover'
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}
    </div>
  )
}