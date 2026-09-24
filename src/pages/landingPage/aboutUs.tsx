import LandingHeader from '../../components/landingPage/landingHeader'
import LandingFooter from '../../components/landingPage/landingFooter'
import { Users, Target, Shield, Heart } from 'lucide-react'

export default function AboutUsPage() {
  return (
    <div className='min-h-screen bg-slate-50/50 text-slate-800 font-sans antialiased overflow-x-hidden selection:bg-orange-500 selection:text-white'>
      <LandingHeader />

      {/* <section className='pt-32 pb-16 sm:pt-40 sm:pb-24 overflow-hidden relative'>
        <div className='absolute inset-0 z-0 bg-gradient-to-b from-[#FFF5F0] to-transparent pointer-events-none' />
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center'>
          <h1 className='text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-6' data-aos='fade-up'>
            Về chúng tôi
          </h1>
          <p className='text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed' data-aos='fade-up' data-aos-delay='100'>
            TaxMate ra đời với sứ mệnh đơn giản hóa việc quản lý tài chính và thuế cho các hộ kinh doanh, giúp bạn tập trung vào điều quan trọng nhất: phát triển doanh nghiệp của mình.
          </p>
        </div>
      </section> */}

      <section className='py-16 sm:py-24 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16' data-aos='fade-up'>
            <span className='text-[#FF4E11] text-sm font-bold uppercase tracking-widest block mb-2'>
              Giá trị cốt lõi
            </span>
            <h2 className='text-3xl font-extrabold text-slate-900'>
              Những gì chúng tôi tin tưởng
            </h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12'>
            <div className='text-center' data-aos='fade-up' data-aos-delay='100'>
              <div className='w-16 h-16 rounded-full bg-orange-100 text-[#FF4E11] flex items-center justify-center mx-auto mb-6'>
                <Users size={32} />
              </div>
              <h3 className='text-xl font-bold text-slate-900 mb-3'>Khách hàng là trung tâm</h3>
              <p className='text-slate-600'>Mọi tính năng của TaxMate đều được xây dựng dựa trên nhu cầu thực tế của người dùng.</p>
            </div>

            <div className='text-center' data-aos='fade-up' data-aos-delay='200'>
              <div className='w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-6'>
                <Target size={32} />
              </div>
              <h3 className='text-xl font-bold text-slate-900 mb-3'>Đơn giản & Hiệu quả</h3>
              <p className='text-slate-600'>Chúng tôi loại bỏ sự phức tạp, mang đến trải nghiệm trực quan và dễ sử dụng nhất.</p>
            </div>

            <div className='text-center' data-aos='fade-up' data-aos-delay='300'>
              <div className='w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6'>
                <Shield size={32} />
              </div>
              <h3 className='text-xl font-bold text-slate-900 mb-3'>Bảo mật dữ liệu</h3>
              <p className='text-slate-600'>An toàn thông tin của bạn là ưu tiên hàng đầu, với các tiêu chuẩn bảo mật khắt khe.</p>
            </div>

            <div className='text-center' data-aos='fade-up' data-aos-delay='400'>
              <div className='w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-6'>
                <Heart size={32} />
              </div>
              <h3 className='text-xl font-bold text-slate-900 mb-3'>Đồng hành bền vững</h3>
              <p className='text-slate-600'>Luôn lắng nghe, hỗ trợ và cập nhật không ngừng để cùng bạn vươn xa.</p>
            </div>
          </div>
        </div>
      </section>

      <section className='py-16 sm:py-24 bg-[#FCF7F3] border-t border-slate-100'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center' data-aos='zoom-in'>
          <h2 className='text-3xl font-extrabold text-slate-900 mb-6'>
            Trở thành một phần của cộng đồng TaxMate
          </h2>
          <p className='text-lg text-slate-600 mb-8'>
            Chúng tôi luôn sẵn sàng hỗ trợ bạn quản lý công việc kinh doanh dễ dàng hơn mỗi ngày.
          </p>
          <a href='/register' className='inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-[#FF4E11] rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30'>
            Bắt đầu dùng thử miễn phí
          </a>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
