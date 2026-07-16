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

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-slate-50/50 text-slate-800 font-sans antialiased overflow-x-hidden selection:bg-orange-500 selection:text-white'>
      <LandingHeader />
      <HeroSection />

      {/* PROBLEMS SECTION */}
      <section id='problems' className='py-16 sm:py-24 bg-[#FCF7F3] border-y border-slate-100 overflow-hidden'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center max-w-3xl mx-auto mb-16' data-aos='fade-up'>
            <span className='text-[#FF4E11] text-sm sm:text-base font-bold uppercase tracking-widest block mb-2'>
              Bạn có đang gặp những vấn đề này?
            </span>
            <h2 className='text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight'>
              Quản lý thủ công khiến bạn mất thời gian và khó kiểm soát
            </h2>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start'>
            <div className='lg:col-span-5 flex justify-center' data-aos='fade-right'>
              <div className='relative w-full max-w-lg'>
                <div className='absolute inset-0 rounded-full blur-3xl opacity-80 scale-90' />
                <img
                  src={stressedWoman}
                  alt='Quản lý thủ công tốn thời gian'
                  className='relative z-10 w-full h-auto object-contain'
                />
              </div>
            </div>

            <div className='lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6' data-aos='fade-left'>
              <div className='group rounded-3xl border border-orange-100 bg-white p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg'>
                <div className='mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600'>
                  <FileX size={20} strokeWidth={2.2} />
                </div>
                <h3 className='mb-2 text-lg font-bold text-slate-900'>
                  Ghi chép rời rạc
                </h3>
                <p className='text-sm leading-relaxed text-slate-600'>
                  Ghi sổ tay, Excel, tin nhắn... dễ thất lạc và khó tổng hợp dữ liệu.
                </p>
              </div>

              <div className='group rounded-3xl border border-rose-100 bg-white p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-rose-200 hover:shadow-lg'>
                <div className='mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600'>
                  <PieChart size={20} strokeWidth={2.2} />
                </div>
                <h3 className='mb-2 text-lg font-bold text-slate-900'>
                  Không biết lời hay lỗ
                </h3>
                <p className='text-sm leading-relaxed text-slate-600'>
                  Không theo dõi được chi phí và lợi nhuận theo thời gian thực.
                </p>
              </div>

              <div className='group rounded-3xl border border-amber-100 bg-white p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg'>
                <div className='mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600'>
                  <Clock size={20} strokeWidth={2.2} />
                </div>
                <h3 className='mb-2 text-lg font-bold text-slate-900'>
                  Tốn thời gian tổng hợp
                </h3>
                <p className='text-sm leading-relaxed text-slate-600'>
                  Cuối tháng mới tổng hợp số liệu, mất nhiều giờ xử lý thủ công.
                </p>
              </div>

              <div className='group rounded-3xl border border-emerald-100 bg-white p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg'>
                <div className='mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600'>
                  <ShieldQuestion size={20} strokeWidth={2.2} />
                </div>
                <h3 className='mb-2 text-lg font-bold text-slate-900'>
                  Khó đáp ứng yêu cầu
                </h3>
                <p className='text-sm leading-relaxed text-slate-600'>
                  Thiếu dữ liệu rõ ràng và khó chuẩn bị hồ sơ khi cần đối chiếu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTIONS SECTION */}
      <section id='features' className='py-16 sm:py-24 bg-white overflow-hidden'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center max-w-3xl mx-auto mb-16' data-aos='fade-up'>
            <span className='text-slate-500 text-sm sm:text-base font-semibold block mb-2'>
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
                    <div className='w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 border border-blue-100 shrink-0'>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                        <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
                        <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6z" />
                      </svg>
                    </div>
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