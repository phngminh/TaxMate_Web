import {
  PieChart, 
  Clock,
  TrendingUp,
  Receipt,
  Wallet,
  LayoutDashboard,
  FileX,
  ShieldQuestion
} from 'lucide-react'
import stressedWoman from '../../assets/stressed-woman.png'
import LandingHeader from '../../components/landingPage/landingHeader'
import HeroSection from '../../components/landingPage/heroSection'
import LandingFooter from '../../components/landingPage/landingFooter'

type FeatureProps = {
  icon: React.ReactNode
  title: string
  description: string
  color: 'orange' | 'rose' | 'amber' | 'emerald'
}

const styles = {
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
  },
  rose: {
    bg: 'bg-rose-100',
    text: 'text-rose-600',
  },
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-600',
  },
  emerald: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-600',
  },
}

function Feature({ title, description }: FeatureProps) {
  return (
    <div className="group flex items-start gap-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#C81E1E]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-[#C81E1E]"
        >
          <path d="M6 6L18 18" />
          <path d="M18 6L6 18" />
        </svg>
      </div>

      <div>
        <h3 className="mb-2 text-xl font-bold text-slate-900">
          {title}
        </h3>
        <p className="leading-7 text-slate-600">
          {description}
        </p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-slate-50/50 text-slate-800 font-sans antialiased overflow-x-hidden selection:bg-orange-500 selection:text-white'>
      <LandingHeader />
      <HeroSection />

      {/* PROBLEMS SECTION */}
      <section
        id='problems'
        className='overflow-hidden border-y border-slate-100 bg-[#FCF7F3] py-12 sm:py-12'
      >
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div
            className='mx-auto mb-8 max-w-3xl text-center'
            data-aos='fade-up'
          >
            <span className='mb-2 block text-sm font-bold uppercase tracking-widest text-[#FF4E11] sm:text-base'>
              Bạn có đang gặp những vấn đề này?
            </span>
            <h2 className='text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl'>
              Quản lý thủ công khiến bạn mất thời gian và khó kiểm soát
            </h2>
          </div>

          <div className='grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16'>
            <div
              className='flex justify-center lg:col-span-5'
              data-aos='fade-right'
            >
              <div className='relative w-full max-w-lg'>
                <img
                  src={stressedWoman}
                  alt='Quản lý thủ công'
                  className='w-full object-contain'
                />
              </div>
            </div>

            <div
              className='grid gap-x-12 gap-y-10 md:grid-cols-2 lg:col-span-7'
              data-aos='fade-left'
            >
              <Feature
                icon={<FileX size={22} />}
                title='Ghi chép rời rạc'
                description='Ghi sổ tay, Excel, tin nhắn... dễ thất lạc và khó tổng hợp dữ liệu.'
                color='orange'
              />

              <Feature
                icon={<PieChart size={22} />}
                title='Không biết lời hay lỗ'
                description='Không theo dõi được chi phí và lợi nhuận theo thời gian thực.'
                color='rose'
              />

              <Feature
                icon={<Clock size={22} />}
                title='Tốn thời gian tổng hợp'
                description='Cuối tháng mới tổng hợp số liệu, mất nhiều giờ xử lý thủ công.'
                color='amber'
              />

              <Feature
                icon={<ShieldQuestion size={22} />}
                title='Khó đáp ứng yêu cầu'
                description='Thiếu dữ liệu rõ ràng và khó chuẩn bị hồ sơ khi cần đối chiếu.'
                color='emerald'
              />
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTIONS SECTION */}
      <section id='features' className='py-16 sm:py-24 bg-white overflow-hidden'>
        <div className='max-w-360 mx-auto px-6 lg:px-8'>
          <div className='text-center max-w-3xl mx-auto mb-16' data-aos='fade-up'>
            <span className='mb-2 block text-sm font-bold uppercase tracking-widest text-[#FF4E11] sm:text-base'>
              TaxMate giúp bạn
            </span>
            <h2 className='text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight'>
              Quản lý đơn giản – Hiệu quả mỗi ngày
            </h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8 max-w-9xl mx-auto items-stretch'>
            <div className='flex flex-col bg-[#F3FDF7] rounded-3xl border border-[#D5F5E3] overflow-hidden group shadow-xs hover:shadow-md transition-all duration-300' data-aos='fade-up' data-aos-delay='200'>
              <div className='p-6 grow'>
                <div className='flex items-center gap-3.5 mb-4'>
                  <div className='w-10 h-10 rounded-full bg-[#22C55E] text-white flex items-center justify-center shadow-md shadow-green-500/20 shrink-0'>
                    <Receipt size={20} />
                  </div>
                  <h3 className='text-base font-extrabold text-slate-900 leading-snug'>Ghi nhận giao dịch nhanh chóng</h3>
                </div>
                <p className='text-slate-500 text-xs leading-relaxed'>
                  Ghi doanh thu mỗi ngày chỉ vài thao tác đơn giản.
                </p>
              </div>

              <div className='px-4 pb-4 mt-auto'>
                <div className='bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden h-60 flex flex-col'>
                  <div className='bg-[#F3FDF7] py-2.5 px-3 border-b border-slate-100 flex items-center gap-1'>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className='text-[#22C55E]'>
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    <span className='text-[10px] font-bold text-slate-800'>Giao dịch mới</span>
                  </div>
                  
                  <div className='p-3 space-y-2 grow overflow-y-auto'>
                    <div className='flex justify-between items-center bg-slate-50 p-2 rounded-xl text-[10px]'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm'>☕</span>
                        <div>
                          <div className='font-bold text-slate-800'>Cà phê sữa đá</div>
                          <div className='text-slate-400 text-[8px]'>30.000đ x 2</div>
                        </div>
                      </div>
                      <span className='font-bold text-slate-800'>60.000đ</span>
                    </div>

                    <div className='flex justify-between items-center bg-slate-50 p-2 rounded-xl text-[10px]'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm'>🥤</span>
                        <div>
                          <div className='font-bold text-slate-800'>Bạc xỉu</div>
                          <div className='text-slate-400 text-[8px]'>25.000đ x 1</div>
                        </div>
                      </div>
                      <span className='font-bold text-slate-800'>25.000đ</span>
                    </div>

                    <div className='flex justify-between items-center bg-slate-50 p-2 rounded-xl text-[10px]'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm'>🍹</span>
                        <div>
                          <div className='font-bold text-slate-800'>Trà đào</div>
                          <div className='text-slate-400 text-[8px]'>25.000đ x 1</div>
                        </div>
                      </div>
                      <span className='font-bold text-slate-800'>25.000đ</span>
                    </div>
                  </div>

                  <div className='p-3 border-t border-slate-50 bg-slate-50/50 mt-auto'>
                    <div className='flex justify-between items-center text-[10px] mb-2'>
                      <span className='text-slate-500'>Tổng tiền</span>
                      <span className='font-extrabold text-slate-900 text-xs'>80.000đ</span>
                    </div>
                    <button className='w-full py-1.5 bg-[#22C55E] text-white rounded-lg text-[9px] font-extrabold shadow-xs shadow-green-500/10'>
                      Lưu giao dịch
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex flex-col bg-[#F3F7FD] rounded-3xl border border-[#D5E5F5] overflow-hidden group shadow-xs hover:shadow-md transition-all duration-300' data-aos='fade-up' data-aos-delay='400'>
              <div className='p-6 grow'>
                <div className='flex items-center gap-3.5 mb-4'>
                  <div className='w-10 h-10 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0'>
                    <Wallet size={18} />
                  </div>
                  <h3 className='text-base font-extrabold text-slate-900 leading-snug'>Theo dõi chi phí dễ dàng</h3>
                </div>
                <p className='text-slate-500 text-xs leading-relaxed'>
                  Quản lý chi phí vận hành, kiểm soát dòng tiền.
                </p>
              </div>

              <div className='px-4 pb-4 mt-auto'>
                <div className='bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden h-60 flex flex-col'>
                  <div className='bg-[#F3F7FD] py-2.5 px-3 border-b border-slate-100 flex items-center gap-1'>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className='text-[#3B82F6]'>
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    <span className='text-[10px] font-bold text-slate-800'>Chi phí mới</span>
                  </div>
                  
                  <div className='p-3 space-y-2.5 grow overflow-y-auto'>
                    <div>
                      <label className='text-[8px] text-slate-400 block mb-1 font-bold'>Nguyên vật liệu</label>
                      <div className='w-full px-2 py-1.5 bg-slate-50 rounded-lg text-[9px] font-extrabold text-slate-800 border border-slate-100 flex justify-between'>
                        <span>Cafe hạt, sữa, trà...</span>
                        <span className='text-[#3B82F6]'>450.000đ</span>
                      </div>
                    </div>

                    <div>
                      <label className='text-[8px] text-slate-400 block mb-1 font-bold'>Tiền điện</label>
                      <div className='w-full px-2 py-1.5 bg-slate-50 rounded-lg text-[9px] font-extrabold text-slate-800 border border-slate-100 flex justify-between'>
                        <span>Điện tháng 5</span>
                        <span className='text-[#3B82F6]'>320.000đ</span>
                      </div>
                    </div>

                    <div>
                      <label className='text-[8px] text-slate-400 block mb-1 font-bold'>Tiền thuê mặt bằng</label>
                      <div className='w-full px-2 py-1.5 bg-slate-50 rounded-lg text-[9px] font-extrabold text-slate-800 border border-slate-100 flex justify-between'>
                        <span>Mặt bằng tháng 6</span>
                        <span className='text-[#3B82F6]'>2.000.000đ</span>
                      </div>
                    </div>
                  </div>

                  <div className='p-3 border-t border-slate-50 bg-slate-50/50 mt-auto flex items-center justify-between gap-2'>
                    <button className='w-full py-1.5 bg-[#3B82F6] text-white rounded-lg text-[9px] font-extrabold shadow-xs shadow-blue-500/10'>
                      Lưu chi phí
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex flex-col bg-[#fff9f4] rounded-3xl border border-[#FADCD0] overflow-hidden group shadow-xs hover:shadow-md transition-all duration-300' data-aos='fade-up' data-aos-delay='600'>
              <div className='p-6 grow'>
                <div className='flex items-center gap-3.5 mb-4'>
                  <div className='w-10 h-10 rounded-full bg-[#F97316] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0'>
                    <TrendingUp size={18} />
                  </div>
                  <h3 className='text-base font-extrabold text-slate-900 leading-snug'>Quản lý thuế</h3>
                </div>
                <p className='text-slate-500 text-xs leading-relaxed'>
                  Theo dõi nghĩa vụ thuế, ước tính số phải nộp và nhận cảnh báo khi gần ngưỡng chịu thuế.
                </p>
              </div>

              <div className='px-4 pb-4 mt-auto'>
                <div className='bg-white rounded-2xl border border-slate-100 shadow-xs p-3 h-60 flex flex-col'>
                  <div>
                    <span className='text-[8px] text-slate-400 block font-bold'>Thuế phải nộp (Ước tính)</span>
                    <span className='text-base font-black text-[#FF4E11] block mt-0.5'>12.480.000đ</span>
                  </div>
                  
                  <div className='mt-4 flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100'>
                     <div className='flex justify-between items-center mb-1'>
                       <span className='text-[8px] font-bold text-slate-700'>Ngưỡng chịu thuế</span>
                       <span className='text-[8px] font-bold text-[#FF4E11]'>65%</span>
                     </div>
                     <div className='w-full bg-slate-200 rounded-full h-1.5'>
                       <div className='bg-[#FF4E11] h-1.5 rounded-full' style={{ width: '65%' }}></div>
                     </div>
                     <span className='text-[6px] text-slate-400 mt-1'>Doanh thu: 812 triệu / ngưỡng 1 tỉ</span>
                  </div>
                  
                  <div className='mt-2 flex flex-col gap-1.5'>
                    <div className='flex justify-between items-center text-[7px] bg-red-50 text-red-600 px-2 py-1.5 rounded-lg border border-red-100 font-bold'>
                      <span>⚠️ Sắp vượt ngưỡng</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex flex-col bg-[#FAF6FB] rounded-3xl border border-[#EADCEF] overflow-hidden group shadow-xs hover:shadow-md transition-all duration-300' data-aos='fade-up' data-aos-delay='800'>
              <div className='p-6 grow'>
                <div className='flex items-center gap-3.5 mb-4'>
                  <div className='w-10 h-10 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0'>
                    <LayoutDashboard size={18} />
                  </div>
                  <h3 className='text-base font-extrabold text-slate-900 leading-snug'>Báo cáo trực quan, dễ hiểu</h3>
                </div>
                <p className='text-slate-500 text-xs leading-relaxed'>
                  Báo cáo chi tiết, biểu đồ trực quan giúp bạn nắm rõ tình hình.
                </p>
              </div>

              <div className='px-4 pb-4 mt-auto'>
                <div className='bg-white rounded-2xl border border-slate-100 shadow-xs p-3 h-60 flex flex-col justify-between'>
                  <span className='text-[8px] text-slate-800 font-extrabold block border-b border-slate-50 pb-1.5'>Báo cáo tháng 5/2024</span>
                  
                  <div className='space-y-1.5 mt-2'>
                    <div className='flex justify-between items-center text-[7px] font-bold'>
                      <div className='flex items-center gap-1'>
                        <span className='w-1 h-1 rounded-full bg-blue-500' />
                        <span className='text-slate-400'>Doanh thu</span>
                      </div>
                      <span className='text-slate-800'>68.540.000đ</span>
                    </div>
                    
                    <div className='flex justify-between items-center text-[7px] font-bold'>
                      <div className='flex items-center gap-1'>
                        <span className='w-1 h-1 rounded-full bg-[#FF4E11]' />
                        <span className='text-slate-400'>Chi phí</span>
                      </div>
                      <span className='text-slate-800'>18.250.000đ</span>
                    </div>

                    <div className='flex justify-between items-center text-[7px] font-bold'>
                      <div className='flex items-center gap-1'>
                        <span className='w-1 h-1 rounded-full bg-green-500' />
                        <span className='text-slate-400'>Lợi nhuận</span>
                      </div>
                      <span className='text-slate-800'>50.290.000đ</span>
                    </div>
                  </div>

                  <div className='flex justify-center items-center py-2 relative grow'>
                    <svg width="100" height="100" viewBox="0 0 36 36" className="transform -rotate-90">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3B82F6" strokeWidth="3.5" strokeDasharray="73 27" strokeDashoffset="0" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#FF4E11" strokeWidth="3.5" strokeDasharray="27 73" strokeDashoffset="-73" />
                    </svg>
                    <div className='absolute text-[6px] font-black text-slate-800'>83%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex flex-col bg-[#FDF4F6] rounded-3xl border border-[#ffdede] overflow-hidden group shadow-xs hover:shadow-md transition-all duration-300' data-aos='fade-up' data-aos-delay='1000'>
              <div className='p-5 grow'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-10 h-10 rounded-full bg-[#E11D48] text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0'>
                    <ShieldQuestion size={18} />
                  </div>

                  <h3 className='text-base font-extrabold text-slate-900 leading-snug'>
                    Trợ lý AI về thuế
                  </h3>
                </div>

                <p className='text-slate-500 text-xs leading-relaxed'>
                  Hỏi đáp về thuế và pháp luật bằng tiếng Việt dễ hiểu, kèm nguồn tham chiếu.
                </p>
              </div>

              <div className='px-3 pb-3 mt-auto'>
                <div className='bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden h-60 flex flex-col'>
                  <div className='bg-[#FDF4F6] py-2.5 px-3 border-b border-slate-100 flex items-center gap-2'>
                    <div className='w-5 h-5 rounded-full bg-[#E11D48] flex items-center justify-center shrink-0'>
                      <span className='text-[8px] text-white font-bold'>AI</span>
                    </div>
                    <span className='text-[10px] font-bold text-slate-800'>
                      Trợ lý Thuế
                    </span>
                  </div>

                  <div className='p-3 space-y-3 grow overflow-hidden'>
                    <div className='flex justify-end'>
                      <div className='bg-[#E11D48] text-white text-[9px] leading-relaxed px-2.5 py-2 rounded-xl rounded-tr-sm max-w-[90%]'>
                        Doanh thu 1 tỷ/năm có phải nộp thuế không?
                      </div>
                    </div>
                    <div className='flex items-start gap-1.5'>
                      <div className='w-5 h-5 rounded-full bg-[#E11D48] flex items-center justify-center shrink-0'>
                        <span className='text-[8px] text-white font-bold'>AI</span>
                      </div>
                      <div className='bg-slate-50 border border-slate-100 text-slate-600 text-[9px] leading-relaxed p-2.5 rounded-xl rounded-tl-sm'>
                        <span className='font-bold block mb-1 text-slate-900'>
                          Có, bạn có nghĩa vụ nộp thuế.
                        </span>
                        TaxMate giúp bạn hiểu cách tính và nghĩa vụ thuế phù hợp với hoạt động kinh doanh.
                        <div className='mt-2'>
                          <span className='text-[7px] bg-rose-50 text-rose-600 px-1.5 py-1 rounded-md border border-rose-100 font-medium'>
                            Nguồn tham chiếu
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='p-2.5 border-t border-slate-50 bg-slate-50/50'>
                    <div className='flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5'>
                      <span className='text-[8px] text-slate-400'>
                        Hỏi về thuế...
                      </span>
                      <div className='w-5 h-5 rounded-md bg-[#E11D48] text-white flex items-center justify-center'>
                        <span className='text-[9px]'>↑</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* DASHBOARD SECTION */}
      <section className='py-16 sm:py-24 bg-[#FCF7F3] border-y border-slate-100'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
            <div data-aos='fade-right'>
              <span className='mb-2 block text-sm font-bold uppercase tracking-widest text-[#FF4E11] sm:text-base'>
                Dashboard
              </span>
              <h2 className='text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-6'>
                Mọi con số quan trọng, gọn trong một màn hình
              </h2>
              <p className='text-lg text-slate-600 mb-8 leading-relaxed'>
                Mở app là thấy ngay doanh thu hôm nay, đơn hàng, chi phí và thuế ước tính - không cần cộng sổ, không cần chờ cuối tháng.
              </p>
              <ul className='space-y-4'>
                {[
                  'Doanh thu, đơn hàng, chi phí cập nhật theo thời gian thực',
                  'Báo cáo lợi nhuận theo ngày / tháng / năm',
                  'Thanh tiến độ ngưỡng chịu thuế với cảnh báo sớm',
                  'Sổ giao dịch chi tiết, tra cứu nhanh mọi khoản thu chi'
                ].map((item, i) => (
                  <li key={i} className='flex items-start gap-3 text-slate-700'>
                    <div className='mt-1 shrink-0 w-5 h-5 rounded-full border-2 border-emerald-500 text-emerald-500 flex items-center justify-center'>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className='leading-relaxed'>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div data-aos='fade-left' className='relative'>
               <div className='bg-white rounded-2xl shadow-xl border border-slate-100 p-4 sm:p-6 overflow-hidden'>
                 <div className='flex gap-4'>
                    <div className='w-1/3 hidden sm:block border-r border-slate-100 pr-4 space-y-4'>
                      <div className='h-8 bg-slate-100 rounded-md w-full'></div>
                      <div className='h-8 bg-slate-50 rounded-md w-full'></div>
                      <div className='h-8 bg-slate-50 rounded-md w-full'></div>
                      <div className='h-8 bg-slate-50 rounded-md w-full'></div>
                    </div>
                    <div className='w-full space-y-4'>
                      <div className='grid grid-cols-2 gap-4'>
                        <div className='border border-slate-100 rounded-xl p-4'>
                           <div className='text-xs text-slate-500 mb-1'>Doanh thu</div>
                           <div className='font-bold text-lg'>4.250.000đ</div>
                           <div className='text-xs text-emerald-500'>↗ +12%</div>
                        </div>
                        <div className='border border-slate-100 rounded-xl p-4'>
                           <div className='text-xs text-slate-500 mb-1'>Chi phí</div>
                           <div className='font-bold text-lg'>1.860.000đ</div>
                           <div className='text-xs text-rose-500'>↘ -3%</div>
                        </div>
                      </div>
                      <div className='border border-slate-100 rounded-xl p-4'>
                         <div className='text-xs font-bold text-slate-800 mb-4'>Doanh thu 12 tháng</div>
                         <div className='flex items-end gap-2 h-24'>
                           {[3, 4, 3, 5, 4, 6, 5, 4, 6, 7, 8, 9].map((h, i) => (
                             <div key={i} className='w-full bg-rose-200 rounded-t-sm' style={{ height: `${h * 10}%` }}></div>
                           ))}
                         </div>
                      </div>
                      <div className='border border-slate-100 rounded-xl p-4'>
                         <div className='flex justify-between text-xs font-bold mb-2'>
                           <span className='text-slate-800'>🔔 Ngưỡng chịu thuế</span>
                           <span className='text-rose-600'>65%</span>
                         </div>
                         <div className='w-full h-2 bg-slate-100 rounded-full mb-1'>
                           <div className='h-2 bg-rose-600 rounded-full' style={{width: '65%'}}></div>
                         </div>
                         <div className='text-[10px] text-slate-500'>Doanh thu: 812 triệu / ngưỡng 1 tỷ</div>
                      </div>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI ASSISTANT SECTION */}
      <section className='py-16 sm:py-24 bg-white overflow-hidden'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
            <div data-aos='fade-right' className='order-2 lg:order-1 relative'>
               <div className='bg-white rounded-3xl shadow-xl border border-slate-100 p-6 flex flex-col gap-4 max-w-lg mx-auto lg:mx-0'>
                 <div className='flex items-center gap-3 border-b border-slate-100 pb-4'>
                   <div className='w-10 h-10 bg-[#C81E1E] rounded-full flex items-center justify-center'>
                     <ShieldQuestion size={20} className='text-white' />
                   </div>
                   <div>
                     <div className='font-bold text-slate-900'>Trợ lý AI Thuế & Pháp luật</div>
                     <div className='text-xs text-emerald-600 flex items-center gap-1'>
                       <span className='w-1.5 h-1.5 bg-emerald-500 rounded-full'></span> Trả lời dựa trên văn bản pháp luật
                     </div>
                   </div>
                 </div>
                 
                 <div className='flex flex-col gap-4 pt-2'>
                  <div className='flex justify-end'>
                    <div className='bg-[#C81E1E] text-white p-3.5 rounded-2xl rounded-tr-sm max-w-[85%] text-sm shadow-sm'>
                    Khi nào hộ kinh doanh phải đổi phương pháp tính thuế?
                    </div>
                  </div>

                  <div className='flex gap-3'>
                    <div className='w-8 h-8 rounded-full bg-rose-100 shrink-0 flex items-center justify-center mt-1'>
                      <ShieldQuestion size={16} className='text-rose-600' />
                    </div>
                    <div className='bg-white border border-slate-100 text-slate-700 p-4 rounded-2xl rounded-tl-sm max-w-[90%] shadow-sm text-sm leading-relaxed'>
                      <span className='font-bold block mb-2 text-slate-900'>
                        Việc áp dụng phương pháp tính thuế phụ thuộc vào doanh thu và quy định hiện hành.
                      </span>
                      Khi doanh thu thay đổi và thuộc trường hợp phải chuyển phương pháp, hộ kinh doanh cần thực hiện chuyển đổi theo quy định và cập nhật sổ sách, nghĩa vụ thuế tương ứng.
                      <div className='flex flex-wrap gap-2 mt-4'>
                        <span className='inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-600 px-2 py-1 rounded-md border border-rose-100 font-medium'>
                          <FileX size={12}/> Quy định thuế hộ kinh doanh
                        </span>
                        <span className='inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-600 px-2 py-1 rounded-md border border-rose-100 font-medium'>
                          <FileX size={12}/> Văn bản hướng dẫn thuế
                        </span>
                      </div>
                    </div>
                  </div>
                 </div>
                 
                <div className='mt-2 border border-slate-200 rounded-full px-4 py-3 flex items-center justify-between text-slate-400 bg-slate-50'>
                  <span className='text-sm'>Hỏi bất kỳ điều gì về thuế, hóa đơn, sổ sách...</span>
                  <div className='w-8 h-8 bg-[#C81E1E] rounded-full flex items-center justify-center'>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  </div>
                 </div>
               </div>
            </div>
            
            <div data-aos='fade-left' className='order-1 lg:order-2'>
              <span className='inline-flex items-center gap-2 mb-2 text-sm font-bold uppercase tracking-widest text-[#FF4E11] sm:text-base'>
                <ShieldQuestion size={16} /> AI Tax & Legal Assistant
              </span>
              <h2 className='text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-6 mt-4'>
                Hỏi về thuế, trả lời ngay
              </h2>
              <p className='text-lg text-slate-600 mb-8 leading-relaxed'>
                Trợ lý AI của TaxMate được huấn luyện trên kho văn bản pháp luật về thuế và hộ kinh doanh, giải thích mọi quy định bằng ngôn ngữ dễ hiểu - không cần đọc thông tư dài hàng chục trang.
              </p>
              <ul className='space-y-4'>
                {[
                  'Trả lời câu hỏi về nghĩa vụ thuế của chính hộ kinh doanh bạn',
                  'Giải thích quy định, thủ tục bằng tiếng Việt đơn giản',
                  'Trả lời dựa trên văn bản pháp luật được lưu trong hệ thống',
                  'Kèm nguồn tham chiếu để bạn tự kiểm chứng'
                ].map((item, i) => (
                  <li key={i} className='flex items-start gap-3 text-slate-700'>
                    <div className='mt-1 shrink-0 w-5 h-5 rounded-full border-2 border-emerald-500 text-emerald-500 flex items-center justify-center'>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className='leading-relaxed'>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CÁCH HOẠT ĐỘNG */}
      <section className='py-16 sm:py-24 bg-[#FCF7F3] border-y border-slate-100'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center max-w-3xl mx-auto mb-16' data-aos='fade-up'>
            <span className='mb-2 block text-sm font-bold uppercase tracking-widest text-[#FF4E11] sm:text-base'>
              CÁCH HOẠT ĐỘNG
            </span>
            <h2 className='text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight'>
              Ba bước đơn giản, mỗi ngày
            </h2>
          </div>
          
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 relative'>
            <div className='hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 border-t-2 border-dashed border-rose-200'></div>
            <div className='bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100 relative z-10' data-aos='fade-up' data-aos-delay='100'>
              <div className='w-16 h-16 bg-[#C81E1E] text-white rounded-full flex items-center justify-center text-xl font-black mx-auto mb-6 shadow-md'>
                01
              </div>
              <h3 className='text-lg font-extrabold text-slate-900 mb-3'>Ghi nhận giao dịch</h3>
              <p className='text-slate-500 text-sm leading-relaxed'>
                Nhập bán hàng, quét QR thanh toán và ghi chi phí mua vào chỉ trong vài giây.
              </p>
            </div>
            
            <div className='bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100 relative z-10' data-aos='fade-up' data-aos-delay='200'>
              <div className='w-16 h-16 bg-[#C81E1E] text-white rounded-full flex items-center justify-center text-xl font-black mx-auto mb-6 shadow-md'>
                02
              </div>
              <h3 className='text-lg font-extrabold text-slate-900 mb-3'>Theo dõi doanh thu & chi phí</h3>
              <p className='text-slate-500 text-sm leading-relaxed'>
                TaxMate tự động tổng hợp thành báo cáo doanh thu, chi phí và lợi nhuận trực quan.
              </p>
            </div>
            
            <div className='bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100 relative z-10' data-aos='fade-up' data-aos-delay='300'>
              <div className='w-16 h-16 bg-[#C81E1E] text-white rounded-full flex items-center justify-center text-xl font-black mx-auto mb-6 shadow-md'>
                03
              </div>
              <h3 className='text-lg font-extrabold text-slate-900 mb-3'>Chủ động chuẩn bị nghĩa vụ thuế</h3>
              <p className='text-slate-500 text-sm leading-relaxed'>
                Theo dõi thuế ước tính, nhận cảnh báo ngưỡng và xuất sổ sách khi cần kê khai.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DÀNH CHO AI */}
      <section className='py-16 sm:py-24 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center max-w-3xl mx-auto mb-16' data-aos='fade-up'>
            <span className='mb-2 block text-sm font-bold uppercase tracking-widest text-[#FF4E11] sm:text-base'>
              DÀNH CHO AI
            </span>
            <h2 className='text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight'>
              Xây dựng cho mô hình hộ kinh doanh thực tế
            </h2>
          </div>
          
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto'>
            <div className='bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow' data-aos='fade-up' data-aos-delay='200'>
              <div className='w-12 h-12 bg-[#C81E1E] text-white rounded-full flex items-center justify-center mb-6'>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>
              </div>
              <h3 className='text-xl font-extrabold text-slate-900 mb-3'>F&B</h3>
              <p className='text-slate-500 text-sm leading-relaxed'>
                Quán ăn, quán cà phê, trà sữa, nhà hàng nhỏ — quản lý menu, nguyên liệu và đơn hàng qua QR.
              </p>
            </div>
            
            <div className='bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow' data-aos='fade-up' data-aos-delay='300'>
              <div className='w-12 h-12 bg-[#C81E1E] text-white rounded-full flex items-center justify-center mb-6'>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>
              </div>
              <h3 className='text-xl font-extrabold text-slate-900 mb-3'>Dịch vụ</h3>
              <p className='text-slate-500 text-sm leading-relaxed'>
                Salon tóc, spa, sửa chữa, gia công — theo dõi lịch hẹn, thu chi và doanh thu theo dịch vụ.
              </p>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}