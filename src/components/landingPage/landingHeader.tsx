import { Link } from 'react-router-dom'
import path from '../../constants/path'
import logo from '../../assets/logo3.png'

export default function LandingHeader() {
  return (
    <header className='sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between'>
        <Link to='/' className='flex items-center gap-0.5 group'>
          <img
            src={logo}
            alt='TaxMate'
            className='h-12 w-auto self-start lg:h-12'
          />
          <span className='text-2xl font-black text-slate-700 tracking-tight'>
            TaxMate
          </span>
        </Link>

        <nav className='hidden md:flex items-center gap-8 ml-20'>
          <Link to={path.home} className='text-slate-600 hover:text-slate-900 font-medium transition-colors duration-200'>
            Giới thiệu
          </Link>
          <Link to={path.subscription} className='text-slate-600 hover:text-slate-900 font-medium transition-colors duration-200'>
            Gói dịch vụ
          </Link>
          <a href='#' className='text-slate-600 hover:text-slate-900 font-medium transition-colors duration-200'>
            Về chúng tôi
          </a>
        </nav>

        <div className='hidden md:flex items-center gap-4'>
          <Link 
            to={path.BUSINESS_OWNER_LOGIN} 
            className='px-5 py-2.5 text-taxmate-red hover:text-taxmate-red-hover font-semibold border-2 border-taxmate-red rounded-xl transition-colors duration-200'
          >
            Đăng nhập
          </Link>
          <Link 
            to={path.BUSINESS_OWNER_REGISTER} 
            className='px-6 py-3 bg-taxmate-red hover:bg-taxmate-red-hover text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-600/30 transform hover:-translate-y-0.5 transition-all duration-200'
          >
            Đăng ký
          </Link>
        </div>
      </div>
    </header>
  )
}