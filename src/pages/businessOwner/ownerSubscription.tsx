import { useState, useEffect } from 'react'
import { Check, X, ShieldAlert, Sparkles, Loader2, Calendar, CreditCard, ArrowRight } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { getPlans, getCurrentSubscription, subscribe, cancelAutoRenew } from '../../apis/subscription.api'
import type { SubscriptionPlan, UserSubscription } from '../../types/subscription.type'

export default function OwnerSubscription() {
  const { user } = useAuth()
  const userId = user?.id

  // Data states
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSub, setCurrentSub] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null) // planId being subscribed

  // Toggle billing cycle
  const [isAnnual, setIsAnnual] = useState(false)

  const loadSubscriptionData = async () => {
    if (!userId) return
    try {
      setLoading(true)
      const [plansRes, currentRes] = await Promise.all([
        getPlans(),
        getCurrentSubscription(userId)
      ])

      if (plansRes.success) {
        // Sort plans by sortOrder
        const sorted = (plansRes.data || []).sort((a, b) => a.sortOrder - b.sortOrder)
        setPlans(sorted)
      }
      if (currentRes.success) {
        setCurrentSub(currentRes.data)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Không thể tải thông tin gói dịch vụ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubscriptionData()
  }, [userId])

  const handleSubscribe = async (planId: string) => {
    if (!userId) return
    try {
      setSubmitting(planId)
      const res = await subscribe(userId, {
        subscriptionPlanId: planId,
        billingCycle: isAnnual ? 'Annual' : 'Monthly',
        autoRenew: true
      })

      if (res.success && res.data.checkoutUrl) {
        toast.success('Đang chuyển hướng sang cổng thanh toán...')
        window.location.href = res.data.checkoutUrl
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Khởi tạo đăng ký gói cước thất bại.')
    } finally {
      setSubmitting(null)
    }
  }

  const handleCancelAutoRenew = async () => {
    if (!userId) return
    if (!confirm('Bạn có chắc chắn muốn hủy tự động gia hạn gói cước này không? Bạn vẫn có thể sử dụng gói cho đến hết chu kỳ.')) return

    try {
      setLoading(true)
      const res = await cancelAutoRenew(userId)
      if (res.success) {
        toast.success('Đã hủy tự động gia hạn thành công.')
        loadSubscriptionData()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể hủy gia hạn.')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (value: number) => {
    return value.toLocaleString('vi-VN')
  }

  return (
    <div className='bg-[#f8f9fa] pt-6 pb-16 min-h-[calc(100vh-51px)] px-6 overflow-y-auto'>
      <div className='max-w-6xl mx-auto'>
        {/* HEADER SECTION */}
        <div className='text-center mb-10'>
          <h1 className='text-[24px] font-black text-gray-900 flex items-center justify-center gap-2'>
            <Sparkles className='text-[#D32F2F] size-6' />
            Nâng cấp Tài khoản Premium
          </h1>
          <p className='text-gray-500 text-xs mt-2 max-w-lg mx-auto font-medium'>
            Mở khóa đầy đủ các tính năng quản lý POS chuyên nghiệp, tạo mã VietQR động không giới hạn và xuất hóa đơn điện tử tự động.
          </p>
        </div>

        {loading ? (
          <div className='flex justify-center items-center py-20'>
            <Loader2 className='animate-spin text-[#D32F2F] size-10' />
          </div>
        ) : (
          <div className='flex flex-col gap-10'>
            {/* THẺ HIỂN THỊ GÓI HIỆN TẠI */}
            <div className='bg-white rounded-[20px] border border-red-100 p-6 shadow-xs relative overflow-hidden'>
              <div className='absolute right-0 top-0 bg-[#ffd6d8] text-[#9b0000] font-black text-[10px] uppercase tracking-wider py-1.5 px-6 rounded-bl-[16px] select-none'>
                Gói của bạn
              </div>

              <h3 className='font-bold text-[14px] text-gray-500 uppercase tracking-wider mb-4 select-none'>
                Gói dịch vụ đang kích hoạt
              </h3>

              {currentSub && currentSub.status === 'Active' ? (
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-center'>
                  <div className='flex items-center gap-4'>
                    <div className='bg-red-50 text-[#D32F2F] size-14 rounded-full flex items-center justify-center shadow-xs'>
                      <Sparkles size={28} className='animate-pulse' />
                    </div>
                    <div>
                      <h4 className='text-xl font-extrabold text-gray-900'>{currentSub.subscriptionPlanName}</h4>
                      <p className='text-gray-400 text-xs font-semibold mt-0.5'>
                        Chu kỳ: {currentSub.billingCycle === 'Monthly' ? 'Thanh toán hàng tháng' : 'Thanh toán hàng năm'}
                      </p>
                    </div>
                  </div>

                  <div className='flex flex-col gap-1.5 font-semibold text-slate-600 text-xs'>
                    <div className='flex items-center gap-2'>
                      <Calendar size={15} className='text-gray-400' />
                      <span>Ngày bắt đầu: <span className='text-slate-800 font-bold font-mono'>{new Date(currentSub.startDate).toLocaleDateString('vi-VN')}</span></span>
                    </div>
                    {currentSub.endDate && (
                      <div className='flex items-center gap-2'>
                        <Calendar size={15} className='text-gray-400' />
                        <span>Ngày hết hạn: <span className='text-slate-800 font-bold font-mono'>{new Date(currentSub.endDate).toLocaleDateString('vi-VN')}</span></span>
                      </div>
                    )}
                  </div>

                  <div className='flex flex-col md:items-end gap-3'>
                    <div className='flex items-center gap-2'>
                      <CreditCard size={15} className='text-gray-400' />
                      <span className='text-xs font-semibold text-gray-500'>
                        Gia hạn tự động: {currentSub.autoRenew ? (
                          <span className='text-emerald-600 font-bold'>Đang bật</span>
                        ) : (
                          <span className='text-amber-600 font-bold'>Đã tắt</span>
                        )}
                      </span>
                    </div>
                    {currentSub.autoRenew && (
                      <button
                        onClick={handleCancelAutoRenew}
                        className='bg-white border border-gray-300 hover:border-red-200 text-gray-600 hover:text-[#D32F2F] px-5 py-1.5 rounded-[8px] text-[12px] font-bold transition-all shadow-xs cursor-pointer'
                      >
                        Hủy tự động gia hạn
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <div className='bg-slate-100 text-slate-400 size-14 rounded-full flex items-center justify-center'>
                      <ShieldAlert size={28} />
                    </div>
                    <div>
                      <h4 className='text-lg font-black text-gray-900'>Gói miễn phí (Free)</h4>
                      <p className='text-gray-400 text-xs font-semibold mt-0.5'>
                        Bị giới hạn số lượng sản phẩm và mã hóa đơn xuất ra mỗi tháng.
                      </p>
                    </div>
                  </div>
                  <span className='bg-slate-100 text-slate-500 text-[11px] font-bold px-3 py-1 rounded-full border border-slate-200 select-none'>
                    Bản Free
                  </span>
                </div>
              )}
            </div>

            {/* SWITCH CHU KỲ THANH TOÁN */}
            <div className='flex flex-col items-center select-none'>
              <div className='flex items-center bg-white border border-gray-200 p-1.5 rounded-full shadow-xs gap-1.5'>
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    !isAnnual ? 'bg-[#D32F2F] text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Thanh toán Hàng tháng
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isAnnual ? 'bg-[#D32F2F] text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Thanh toán Hàng năm
                  <span className='bg-[#ffd6d8] text-[#9b0000] text-[9px] font-black px-2 py-0.5 rounded-full'>
                    -20%
                  </span>
                </button>
              </div>
            </div>

            {/* PRICING CARDS LIST */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch'>
              {plans.map((plan) => {
                const isCurrentPlan = currentSub?.status === 'Active' && currentSub.subscriptionPlanId === plan.id
                const price = isAnnual ? plan.AnnualPrice : plan.MonthlyPrice
                const priceFormatted = price === 0 ? 'Miễn phí' : `${formatPrice(price)} đ`
                const cycleText = price === 0 ? '' : (isAnnual ? '/năm' : '/tháng')

                return (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-[24px] border p-8 flex flex-col justify-between transition-all duration-300 relative ${
                      plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('kinh doanh')
                        ? 'border-[#D32F2F] shadow-md ring-1 ring-[#D32F2F]/20 scale-102 z-10'
                        : 'border-gray-200 hover:border-gray-300 shadow-sm'
                    }`}
                  >
                    {/* BÁN CHẠY BADGE */}
                    {(plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('kinh doanh')) && (
                      <div className='absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#D32F2F] text-white font-black text-[10px] uppercase tracking-wider py-1 px-4 rounded-full shadow-xs select-none flex items-center gap-1'>
                        <Sparkles size={11} /> Khuyên dùng
                      </div>
                    )}

                    <div>
                      {/* Tên gói */}
                      <h4 className='text-lg font-black text-gray-900 mb-2'>{plan.name}</h4>
                      <p className='text-gray-400 text-xs font-semibold leading-relaxed mb-6 min-h-8'>
                        {plan.description || 'Giải pháp tuyệt vời để tự động hóa đối soát thanh toán.'}
                      </p>

                      {/* Giá */}
                      <div className='flex items-baseline gap-1.5 mb-8 border-b border-gray-100 pb-6'>
                        <span className='text-3xl font-black text-gray-900 font-mono'>{priceFormatted}</span>
                        {cycleText && (
                          <span className='text-xs font-bold text-gray-400'>{cycleText}</span>
                        )}
                      </div>

                      {/* Tính năng checklist */}
                      <div className='flex flex-col gap-4 mb-8'>
                        <span className='text-[11px] font-bold text-gray-400 uppercase tracking-wider select-none'>Tính năng bao gồm:</span>
                        <div className='flex flex-col gap-3'>
                          {plan.features.map((feature) => (
                            <div key={feature.id} className='flex items-start gap-2.5 text-[13px] text-gray-700 font-medium'>
                              {feature.isEnabled ? (
                                <Check size={16} className='text-emerald-500 shrink-0 mt-0.5 stroke-3' />
                              ) : (
                                <X size={16} className='text-gray-300 shrink-0 mt-0.5 stroke-3' />
                              )}
                              <span className={feature.isEnabled ? 'text-gray-800 font-semibold' : 'text-gray-400 font-medium line-through'}>
                                {feature.featureName}
                              </span>
                            </div>
                          ))}

                          {plan.maxProducts && (
                            <div className='flex items-center gap-2.5 text-[13px] text-gray-700 font-semibold'>
                              <Check size={16} className='text-emerald-500 shrink-0 stroke-3' />
                              <span>Tối đa: <span className='font-bold text-[#D32F2F]'>{plan.maxProducts} sản phẩm</span></span>
                            </div>
                          )}
                          {plan.maxTransactionsPerMonth && (
                            <div className='flex items-center gap-2.5 text-[13px] text-gray-700 font-semibold'>
                              <Check size={16} className='text-emerald-500 shrink-0 stroke-3' />
                              <span>Tối đa: <span className='font-bold text-[#D32F2F]'>{plan.maxTransactionsPerMonth} đơn/tháng</span></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Nút nâng cấp */}
                    <div className='pt-6 border-t border-gray-50 select-none'>
                      {isCurrentPlan ? (
                        <div className='w-full text-center bg-emerald-50 border border-emerald-200 text-emerald-600 font-black py-2.5 rounded-[12px] text-xs flex items-center justify-center gap-1.5'>
                          Gói đang sử dụng
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={submitting !== null || plan.name.toLowerCase().includes('free')}
                          className={`w-full py-2.5 rounded-[12px] text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                            plan.name.toLowerCase().includes('free')
                              ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-[#D32F2F] hover:bg-[#B71C1C] text-white'
                          }`}
                        >
                          {submitting === plan.id ? (
                            <Loader2 size={15} className='animate-spin' />
                          ) : (
                            <>
                              Đăng ký ngay
                              <ArrowRight size={14} className='stroke-3' />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
