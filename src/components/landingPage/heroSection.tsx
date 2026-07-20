import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import path from '../../constants/path'
import heroWoman from '../../assets/hero-woman.png'

export default function HeroSection() {
  return (
    <section className='relative pt-8 pb-16 lg:pt-16 lg:pb-24 overflow-hidden bg-white'>
      <div className='absolute top-0 right-0 w-[45%] h-full rounded-bl-[120px] lg:rounded-bl-[200px] z-0 pointer-events-none hidden lg:block' />
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 items-center'>
          <div className='lg:col-span-7 text-left' data-aos='fade-right'>
            <h1 className='text-6xl sm:text-5xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.2] mb-6'>
              Quản lý bán hàng<br className='hidden sm:block' />
              và hỗ trợ nghĩa vụ thuế<br />
              cho
              <span className='text-taxmate-red'> hộ kinh doanh nhỏ</span>
            </h1>

            <p className='text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mb-8'>
              TaxMate giúp hộ kinh doanh ghi nhận giao dịch mỗi ngày, theo dõi doanh thu, chi phí, ước tính lợi nhuận và chuẩn bị dữ liệu sẵn sàng cho các yêu cầu thuế.
            </p>

            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8'>
              <Link 
                to={path.BUSINESS_OWNER_REGISTER} 
                className='flex items-center justify-center gap-2 px-8 py-4 bg-taxmate-red hover:bg-red-700 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/20 hover:shadow-orange-600/30 transform hover:-translate-y-0.5 transition-all duration-200 text-base sm:text-lg'
              >
                <span>Bắt đầu sử dụng ngay</span>
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className='flex flex-col sm:flex-row sm:items-center gap-y-4 gap-x-8 border-t border-slate-100 pt-4 text-sm text-slate-600'>
              <div className='flex items-center gap-2'>
                <div className='w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-taxmate-red'>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </div>
                <span className='font-medium'>Dễ sử dụng</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-taxmate-red'>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
                <span className='font-medium'>Dùng trên mọi thiết bị</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-taxmate-red'>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <span className='font-medium'>Dữ liệu luôn được bảo mật</span>
              </div>
            </div>
          </div>

          <div className='lg:col-span-5 relative flex justify-center items-center' data-aos='fade-left'>
            <div className='absolute w-72 h-72 rounded-full filter blur-xl opacity-75 -z-10 lg:hidden' />
            <div className='relative w-full max-w-md lg:max-w-none'>
              <img 
                src={heroWoman} 
                alt='Sử dụng TaxMate' 
                className='relative z-10 w-full h-auto object-contain drop-shadow-2xl'
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}