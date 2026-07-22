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

function Feature({ icon, title, description, color }: FeatureProps) {
  const s = styles[color]

  return (
    <div className="group flex items-start gap-5">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${s.bg} ${s.text}
        transition-all duration-300 group-hover:scale-110`}
      >
        {icon}
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
        className='overflow-hidden border-y border-slate-100 bg-[#FCF7F3] py-16 sm:py-24'
      >
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div
            className='mx-auto mb-16 max-w-3xl text-center'
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
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center max-w-3xl mx-auto mb-16' data-aos='fade-up'>
            <span className='text-slate-500 text-sm sm:text-xl font-semibold block mb-2'>
              TaxMate giúp bạn
            </span>
            <h2 className='text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight'>
              Quản lý đơn giản – Hiệu quả mỗi ngày
            </h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto items-stretch'>
            <div className='flex flex-col bg-[#F3FDF7] rounded-3xl border border-[#D5F5E3] overflow-hidden group shadow-xs hover:shadow-md transition-all duration-300' data-aos='fade-up' data-aos-delay='100'>
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

            <div className='flex flex-col bg-[#F3F7FD] rounded-3xl border border-[#D5E5F5] overflow-hidden group shadow-xs hover:shadow-md transition-all duration-300' data-aos='fade-up' data-aos-delay='200'>
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

            <div className='flex flex-col bg-[#fff9f4] rounded-3xl border border-[#FADCD0] overflow-hidden group shadow-xs hover:shadow-md transition-all duration-300' data-aos='fade-up' data-aos-delay='300'>
              <div className='p-6 grow'>
                <div className='flex items-center gap-3.5 mb-4'>
                  <div className='w-10 h-10 rounded-full bg-[#F97316] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0'>
                    <TrendingUp size={18} />
                  </div>
                  <h3 className='text-base font-extrabold text-slate-900 leading-snug'>Ước tính lợi nhuận tự động</h3>
                </div>
                <p className='text-slate-500 text-xs leading-relaxed'>
                  Tự động tính lợi nhuận từ doanh thu và chi phí.
                </p>
              </div>

              <div className='px-4 pb-4 mt-auto'>
                <div className='bg-white rounded-2xl border border-slate-100 shadow-xs p-3 h-60 flex flex-col justify-between'>
                  <div>
                    <span className='text-[8px] text-slate-400 block font-bold'>Lợi nhuận ước tính</span>
                    <span className='text-base font-black text-slate-900 block mt-0.5'>50.290.000đ</span>
                    <span className='inline-flex items-center gap-0.5 text-[8px] font-bold text-[#22C55E] bg-green-50 px-1.5 py-0.5 rounded-full mt-1 border border-green-100'>
                      ↑ 15% <span className='text-slate-400 font-normal'>so với tháng trước</span>
                    </span>
                  </div>

                  <div className='mt-3 flex items-end justify-around gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 grow max-h-30'>
                    <div className='flex flex-col items-center gap-1.5 w-full'>
                      <div className='w-2.5 h-16 bg-[#22C55E] rounded-full shadow-xs' />
                      <span className='text-[6px] font-bold text-slate-400 text-center scale-95'>Doanh thu</span>
                    </div>

                    <div className='flex flex-col items-center gap-1.5 w-full'>
                      <div className='w-2.5 h-10 bg-[#FF4E11] rounded-full shadow-xs' />
                      <span className='text-[6px] font-bold text-slate-400 text-center scale-95'>Chi phí</span>
                    </div>

                    <div className='flex flex-col items-center gap-1.5 w-full'>
                      <div className='w-2.5 h-12 bg-[#F59E0B] rounded-full shadow-xs' />
                      <span className='text-[6px] font-bold text-slate-400 text-center scale-95'>Lợi nhuận</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex flex-col bg-[#FAF6FB] rounded-3xl border border-[#EADCEF] overflow-hidden group shadow-xs hover:shadow-md transition-all duration-300' data-aos='fade-up' data-aos-delay='400'>
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
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}