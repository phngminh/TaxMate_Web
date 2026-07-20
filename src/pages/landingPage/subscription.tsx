import { useEffect, useState } from 'react'
import { Check, X, Sparkles } from 'lucide-react'
import LandingHeader from '../../components/landingPage/landingHeader'
import HeroSection from '../../components/landingPage/heroSection'
import LandingFooter from '../../components/landingPage/landingFooter'
import { getSubscriptionPlans } from '../../apis/subscription.api'
import type { SubscriptionPlanResponse } from '../../types/subscription.type'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import path from '../../constants/path'

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlanResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAnnual, setIsAnnual] = useState(false)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await getSubscriptionPlans()
        console.log(response)
        if (response.data) {
          const sortedPlans = response.data
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .slice(0, 3)
          setPlans(sortedPlans)
        }
      } catch (error) {
        toast.error('Không thể tải thông tin gói cước. Vui lòng thử lại sau.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlans()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  return (
    <div className='min-h-screen bg-slate-50/50 text-slate-800 font-sans antialiased overflow-x-hidden selection:bg-orange-500 selection:text-white'>
      <LandingHeader />
      <HeroSection />

      <section id='pricing' className='py-16 sm:py-24 relative overflow-hidden'>
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-250 h-125 rounded-full blur-[120px] pointer-events-none' />

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
          <div className='text-center max-w-3xl mx-auto mb-16' data-aos='fade-up'>
            <span className='text-[#FF4E11] text-sm sm:text-base font-bold uppercase tracking-widest block mb-2'>
              Bảng giá linh hoạt
            </span>
            <h2 className='text-3xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-2'>
              Chọn gói phù hợp với doanh nghiệp của bạn
            </h2>
            <p className='text-slate-600 text-base sm:text-lg'>
              Đơn giản, minh bạch và không có phí ẩn. Khởi đầu với gói cơ bản và nâng cấp khi bạn phát triển.
            </p>
          </div>

          {isLoading ? (
            <div className='flex justify-center items-center h-64'>
              <div className='animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-taxmate-red'></div>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto'>
              {plans.map((plan, index) => {
                const isPopular = index === 1
                const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
                
                return (
                  <div 
                    key={plan.id}
                    data-aos='fade-up'
                    data-aos-delay={index * 100}
                    className={`relative flex flex-col p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 ${
                      isPopular 
                        ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20 border border-slate-800 transform md:-translate-y-4 md:hover:-translate-y-6 scale-105' 
                        : 'bg-white text-slate-900 shadow-xl shadow-slate-200/50 border border-slate-300 hover:shadow-2xl hover:shadow-slate-200/60'
                    }`}
                  >
                    <div className='mb-8'>
                      <h3 className={`text-2xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-sm ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                        {plan.description || 'Giải pháp tuyệt vời cho hộ kinh doanh mới bắt đầu.'}
                      </p>
                    </div>

                    <div className='mb-8'>
                      <div className='flex items-baseline gap-2'>
                        <span className={`text-5xl font-black tracking-tight ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                          {formatPrice(price)}
                        </span>
                        <span className={`text-sm font-medium ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                          / {isAnnual ? 'năm' : 'tháng'}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={path.BUSINESS_OWNER_REGISTER}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-center transition-all duration-200 mb-8 ${
                        isPopular
                          ? 'bg-taxmate-red text-white hover:bg-red-600 shadow-lg shadow-red-500/25'
                          : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      Bắt đầu ngay
                    </Link>

                    <div className='space-y-4 grow'>
                      <p className={`text-sm font-bold uppercase tracking-wider mb-4 ${isPopular ? 'text-slate-300' : 'text-slate-900'}`}>
                        Gói bao gồm:
                      </p>
                      
                      <div className='flex items-start gap-3'>
                        <Check
                          size={18}
                          className={`shrink-0 mt-0.5 ${isPopular ? 'text-orange-400' : 'text-taxmate-red'}`}
                        />
                        <span className={`text-sm ${isPopular ? 'text-slate-300' : 'text-slate-600'}`}>
                          {plan.maxProducts === null ? (
                            <>
                              <strong>Không giới hạn</strong> sản phẩm
                            </>
                          ) : (
                            <>
                              Tối đa <strong>{plan.maxProducts}</strong> sản phẩm
                            </>
                          )}
                        </span>
                      </div>
                      
                      <div className='flex items-start gap-3'>
                        <Check size={18} className={`shrink-0 mt-0.5 ${isPopular ? 'text-orange-400' : 'text-taxmate-red'}`} />
                        <span className={`text-sm ${isPopular ? 'text-slate-300' : 'text-slate-600'}`}>
                          <strong>{plan.maxTransactionsPerMonth === null ? 'Không giới hạn' : plan.maxTransactionsPerMonth}</strong> giao dịch / tháng
                        </span>
                      </div>

                      {plan.features.map((feature) => (
                        <div key={feature.id} className='flex items-start gap-3'>
                          {feature.isEnabled ? (
                            <Check size={18} className={`shrink-0 mt-0.5 ${isPopular ? 'text-orange-400' : 'text-taxmate-red'}`} />
                          ) : (
                            <X size={18} className={`shrink-0 mt-0.5 ${isPopular ? 'text-slate-600' : 'text-slate-300'}`} />
                          )}
                          <span className={`text-sm ${
                            feature.isEnabled 
                              ? (isPopular ? 'text-slate-300' : 'text-slate-600')
                              : (isPopular ? 'text-slate-600' : 'text-slate-400 line-through')
                          }`}>
                            {feature.featureName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className='mt-10 flex items-center justify-center gap-4'>
            <span className={`text-sm font-semibold transition-colors ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Thanh toán hàng tháng</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className='relative w-16 h-8 rounded-full bg-slate-200 p-1 transition-colors hover:bg-slate-300'
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300 ease-spring ${
                  isAnnual ? 'translate-x-8 bg-taxmate-red' : 'translate-x-0'
                }`}
              />
            </button>
            <div className='flex items-center gap-2'>
              <span className={`text-sm font-semibold transition-colors ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Thanh toán hàng năm</span>
              <span className='inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide'>Tiết kiệm 20%</span>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}