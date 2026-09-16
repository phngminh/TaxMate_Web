import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Info,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import {
  confirmThresholdReview,
  dismissThresholdReview,
  updateOwnerTaxProfile
} from '../../../apis/taxProfile.api'
import type {
  OwnerTaxProfile,
  RevenueBracket,
  TaxMethod
} from '../../../types/taxProfile.type'

interface Props {
  businessId: string
  profile: OwnerTaxProfile
  onChanged: (profile: OwnerTaxProfile) => void
}

const bracketLabels: Record<RevenueBracket, string> = {
  AtOrBelow1B: 'Không quá 1 tỷ / năm',
  Over1BTo3B: 'Từ 1 đến 3 tỷ / năm',
  Over3BTo50B: 'Trên 3 tỷ đến 50 tỷ / năm'
}

function errorMessage(error: unknown) {
  return axios.isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ??
        'Không thể cập nhật hồ sơ thuế.')
    : 'Không thể cập nhật hồ sơ thuế.'
}

export default function TaxProfileCard({
  businessId,
  profile,
  onChanged
}: Props) {
  const currentYear = new Date().getFullYear()

  const [bracket, setBracket] = useState<RevenueBracket>(
    profile.declaredRevenueBracket ?? 'AtOrBelow1B'
  )
  const [method, setMethod] = useState<TaxMethod>(
    profile.personalIncomeTaxMethod ?? 'RevenueBased'
  )
  const [commencement, setCommencement] = useState<string>(
    profile.commencementPeriod ?? 'BeforeTaxYear'
  )
  const [reviewMethods, setReviewMethods] = useState<Record<string, TaxMethod>>(
    {}
  )
  const [busy, setBusy] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (window.location.hash === '#threshold-review') {
      const timer = setTimeout(() => {
        const el = document.getElementById('threshold-review')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [profile.thresholdReviews])

  async function saveInitialProfile() {
    try {
      setBusy(true)
      const result = await updateOwnerTaxProfile(businessId, {
        declaredRevenueBracket: bracket,
        personalIncomeTaxMethod:
          bracket === 'AtOrBelow1B'
            ? undefined
            : bracket === 'Over3BTo50B'
              ? 'IncomeBased'
              : method,
        commencementPeriod:
          bracket === 'AtOrBelow1B' ? commencement : undefined,
        commencementTaxYear:
          bracket === 'AtOrBelow1B' ? currentYear : undefined,
        confirmed: true
      })
      onChanged(result)
      toast.success('Đã xác nhận và kích hoạt hồ sơ thuế.')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function confirmReview(alertId: string, selectedMethod?: TaxMethod) {
    try {
      setBusy(true)
      await confirmThresholdReview(businessId, alertId, selectedMethod)
      toast.success('Đã ghi nhận chuyển diện doanh thu.')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function dismissReview(alertId: string) {
    try {
      setBusy(true)
      await dismissThresholdReview(businessId, alertId)
      toast.info('Đã đóng cảnh báo.')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  // =========================================================================
  // 1. TRẠNG THÁI CHƯA CẤU HÌNH (UNCONFIGURED ONBOARDING STATE)
  // =========================================================================
  if (!profile.isConfigured) {
    // A. Khi người dùng bấm "Để sau" -> Thu nhỏ thành thanh Apple-style Pill tinh tế
    if (isDismissed) {
      return (
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className='mt-6 overflow-hidden rounded-2xl border border-sky-200/80 bg-linear-to-r from-sky-50 via-white to-sky-50/60 p-4 shadow-xs backdrop-blur-md'
        >
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs'>
                <ShieldCheck className='h-5 w-5' />
              </div>
              <div>
                <p className='text-sm font-semibold text-slate-900'>
                  Chưa kích hoạt Chế độ Thuế & Kế toán
                </p>
                <p className='text-xs text-slate-600'>
                  Hệ thống đang tạm hoãn để bạn tập trung bán hàng. Thiết lập bất cứ lúc nào trước khi mở sổ hoặc lập tờ khai.
                </p>
              </div>
            </div>
            <button
              type='button'
              onClick={() => setIsDismissed(false)}
              className='inline-flex items-center gap-1.5 rounded-xl bg-sky-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-sky-800 hover:shadow-md active:scale-98'
            >
              Thiết lập ngay
              <ArrowRight className='h-3.5 w-3.5' />
            </button>
          </div>
        </motion.section>
      )
    }

    // B. Trạng thái Form đầy đủ - Chuẩn Apple Bento & Progressive Disclosure
    return (
      <section
        id='threshold-review'
        className='mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all md:p-8'
      >
        {/* Header Bar */}
        <div className='flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6'>
          <div className='space-y-1.5'>
            <div className='inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800 uppercase tracking-wider'>
              <ShieldCheck className='h-3.5 w-3.5 text-sky-600' />
              Thiết lập Hồ sơ Thuế Chủ hộ
            </div>
            <h2 className='text-2xl font-bold tracking-tight text-slate-900 md:text-[1.65rem]'>
              Chế độ Thuế & Hạn mức Miễn trừ
            </h2>
            <p className='text-sm text-slate-500 max-w-2xl leading-relaxed'>
              TaxMate căn cứ quy mô kinh doanh để tự động kích hoạt mức miễn thuế, chọn mẫu tờ khai và cấu hình sổ sách kế toán chuẩn theo{' '}
              <span className='font-semibold text-slate-700'>Nghị định 141/2026/NĐ-CP</span>.
            </p>
          </div>

          <button
            type='button'
            onClick={() => setIsDismissed(true)}
            className='inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors'
            title='Tạm hoãn thiết lập để bán hàng'
          >
            <span>Để sau</span>
            <X className='h-3.5 w-3.5' />
          </button>
        </div>

        {/* STEP 1: Chọn quy mô doanh thu (3 Bento Cards) */}
        <div className='mt-6'>
          <div className='flex items-baseline justify-between'>
            <label className='text-xs font-bold uppercase tracking-wider text-slate-400'>
              Bước 1 · Tổng doanh thu kinh doanh dự kiến trong năm
            </label>
            <span className='text-xs text-slate-500 hidden sm:inline'>
              Tính chung tất cả cơ sở và doanh thu của cùng chủ hộ
            </span>
          </div>

          <div className='mt-3 grid grid-cols-1 gap-3.5 md:grid-cols-3'>
            {/* TIER 1: Dưới 1 tỷ */}
            <div
              onClick={() => setBracket('AtOrBelow1B')}
              className={`group relative cursor-pointer rounded-2xl border p-5 transition-all select-none ${
                bracket === 'AtOrBelow1B'
                  ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-500/20'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className='flex items-center justify-between gap-2'>
                <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800'>
                  <Sparkles className='h-3 w-3' />
                  Miễn 100% Thuế
                </span>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                    bracket === 'AtOrBelow1B'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {bracket === 'AtOrBelow1B' && <Check className='h-3 w-3 stroke-[3]' />}
                </div>
              </div>

              <div className='mt-3'>
                <p className='text-lg font-bold tracking-tight text-slate-900'>
                  Không quá 1 tỷ
                  <span className='text-xs font-normal text-slate-500'> / năm</span>
                </p>
                <p className='mt-1 text-xs leading-relaxed text-slate-600'>
                  Không phải nộp thuế GTGT & TNCN. Chỉ cần nộp thông báo doanh thu{' '}
                  <span className='font-semibold text-slate-800'>01/TKN-CNKD</span> định kỳ.
                </p>
              </div>

              <div className='mt-4 pt-3 border-t border-slate-100/80 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700'>
                <Coins className='h-3.5 w-3.5 shrink-0' />
                <span>Phù hợp với quán nhỏ, mới mở</span>
              </div>
            </div>

            {/* TIER 2: 1 - 3 tỷ */}
            <div
              onClick={() => setBracket('Over1BTo3B')}
              className={`group relative cursor-pointer rounded-2xl border p-5 transition-all select-none ${
                bracket === 'Over1BTo3B'
                  ? 'border-sky-500 bg-sky-50/40 shadow-sm ring-2 ring-sky-500/20'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className='flex items-center justify-between gap-2'>
                <span className='inline-flex items-center gap-1 rounded-full bg-sky-100/90 px-2.5 py-0.5 text-[11px] font-bold text-sky-800'>
                  <Scale className='h-3 w-3' />
                  Chọn cách tính
                </span>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                    bracket === 'Over1BTo3B'
                      ? 'border-sky-600 bg-sky-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {bracket === 'Over1BTo3B' && <Check className='h-3 w-3 stroke-[3]' />}
                </div>
              </div>

              <div className='mt-3'>
                <p className='text-lg font-bold tracking-tight text-slate-900'>
                  Từ 1 đến 3 tỷ
                  <span className='text-xs font-normal text-slate-500'> / năm</span>
                </p>
                <p className='mt-1 text-xs leading-relaxed text-slate-600'>
                  Được trừ 1 tỷ doanh thu miễn thuế. Được linh hoạt lựa chọn tính theo{' '}
                  <span className='font-semibold text-slate-800'>Doanh thu</span> hoặc{' '}
                  <span className='font-semibold text-slate-800'>Lợi nhuận sổ sách</span>.
                </p>
              </div>

              <div className='mt-4 pt-3 border-t border-slate-100/80 flex items-center gap-1.5 text-[11px] font-medium text-sky-700'>
                <TrendingUp className='h-3.5 w-3.5 shrink-0' />
                <span>Tối ưu hóa số thuế phải nộp</span>
              </div>
            </div>

            {/* TIER 3: Trên 3 tỷ */}
            <div
              onClick={() => setBracket('Over3BTo50B')}
              className={`group relative cursor-pointer rounded-2xl border p-5 transition-all select-none ${
                bracket === 'Over3BTo50B'
                  ? 'border-violet-500 bg-violet-50/40 shadow-sm ring-2 ring-violet-500/20'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className='flex items-center justify-between gap-2'>
                <span className='inline-flex items-center gap-1 rounded-full bg-violet-100/90 px-2.5 py-0.5 text-[11px] font-bold text-violet-800'>
                  <FileText className='h-3 w-3' />
                  Sổ sách bắt buộc
                </span>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                    bracket === 'Over3BTo50B'
                      ? 'border-violet-600 bg-violet-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {bracket === 'Over3BTo50B' && <Check className='h-3 w-3 stroke-[3]' />}
                </div>
              </div>

              <div className='mt-3'>
                <p className='text-lg font-bold tracking-tight text-slate-900'>
                  Trên 3 đến 50 tỷ
                  <span className='text-xs font-normal text-slate-500'> / năm</span>
                </p>
                <p className='mt-1 text-xs leading-relaxed text-slate-600'>
                  Bắt buộc nộp thuế TNCN theo{' '}
                  <span className='font-semibold text-slate-800'>Thu nhập tính thuế</span> (17% trên lãi ròng). Tự động mở hệ thống sổ S2b–S2e.
                </p>
              </div>

              <div className='mt-4 pt-3 border-t border-slate-100/80 flex items-center gap-1.5 text-[11px] font-medium text-violet-700'>
                <Lock className='h-3.5 w-3.5 shrink-0' />
                <span>Kê khai sổ kế toán theo TT 152</span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: Progressive Disclosure theo lựa chọn ở Step 1 */}
        <AnimatePresence mode='wait'>
          {/* TRƯỜNG HỢP 1: Dưới 1 tỷ -> Chọn mốc thời gian hoạt động bằng từ ngữ thực tế */}
          {bracket === 'AtOrBelow1B' && (
            <motion.div
              key='below1b-options'
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className='mt-6 overflow-hidden rounded-2xl border border-emerald-200/70 bg-emerald-50/30 p-5'
            >
              <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900'>
                <Clock className='h-4 w-4 text-emerald-600' />
                Bước 2 · Cơ sở của bạn bắt đầu kinh doanh từ khi nào?
              </div>
              <p className='mt-1 text-xs text-slate-600'>
                Thông tin này giúp TaxMate lên lịch nhắc nộp Thông báo doanh thu đúng hạn cho bạn, không cần khai lại giao dịch cũ.
              </p>

              <div className='mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3'>
                {/* Lựa chọn 1: Trước năm nay */}
                <button
                  type='button'
                  onClick={() => setCommencement('BeforeTaxYear')}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                    commencement === 'BeforeTaxYear'
                      ? 'border-emerald-600 bg-white text-emerald-950 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className='flex w-full items-center justify-between'>
                    <span className='text-xs font-bold'>Đã bán từ các năm trước</span>
                    {commencement === 'BeforeTaxYear' && (
                      <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                    )}
                  </div>
                  <span className='mt-1 text-[11px] text-slate-500'>
                    Áp dụng kỳ thông báo năm thông thường (hạn 31/01 năm sau)
                  </span>
                </button>

                {/* Lựa chọn 2: 6 tháng đầu năm */}
                <button
                  type='button'
                  onClick={() => setCommencement('FirstHalfOfTaxYear')}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                    commencement === 'FirstHalfOfTaxYear'
                      ? 'border-emerald-600 bg-white text-emerald-950 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className='flex w-full items-center justify-between'>
                    <span className='text-xs font-bold'>Mới mở trong 6 tháng đầu năm</span>
                    {commencement === 'FirstHalfOfTaxYear' && (
                      <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                    )}
                  </div>
                  <span className='mt-1 text-[11px] text-slate-500'>
                    Từ 01/01 đến 30/06 (hạn thông báo đợt 1 là 31/07 năm nay)
                  </span>
                </button>

                {/* Lựa chọn 3: 6 tháng cuối năm */}
                <button
                  type='button'
                  onClick={() => setCommencement('SecondHalfOfTaxYear')}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                    commencement === 'SecondHalfOfTaxYear'
                      ? 'border-emerald-600 bg-white text-emerald-950 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className='flex w-full items-center justify-between'>
                    <span className='text-xs font-bold'>Mới mở trong 6 tháng cuối năm</span>
                    {commencement === 'SecondHalfOfTaxYear' && (
                      <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                    )}
                  </div>
                  <span className='mt-1 text-[11px] text-slate-500'>
                    Từ 01/07 đến 31/12 (dồn thông báo nộp vào 31/01 năm sau)
                  </span>
                </button>
              </div>

              <div className='mt-3 flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-100/60 rounded-lg px-3 py-2'>
                <Info className='h-3.5 w-3.5 shrink-0 text-emerald-700' />
                <span>
                  Năm áp dụng tự động ghi nhận là <strong>{currentYear}</strong>. Cơ sở của bạn được miễn toàn bộ thuế GTGT & TNCN trong ngưỡng này.
                </span>
              </div>
            </motion.div>
          )}

          {/* TRƯỜNG HỢP 2: Từ 1 đến 3 tỷ -> So sánh 2 phương pháp trực quan */}
          {bracket === 'Over1BTo3B' && (
            <motion.div
              key='over1b-options'
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className='mt-6 overflow-hidden rounded-2xl border border-sky-200/70 bg-sky-50/30 p-5'
            >
              <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-900'>
                <Scale className='h-4 w-4 text-sky-600' />
                Bước 2 · Lựa chọn phương pháp tính thuế Thu nhập cá nhân (TNCN)
              </div>
              <p className='mt-1 text-xs text-slate-600'>
                Hãy cân nhắc cơ cấu chi phí của quán để chọn phương pháp có số tiền thuế phải nộp thấp nhất:
              </p>

              <div className='mt-3.5 grid grid-cols-1 gap-3 md:grid-cols-2'>
                {/* Method 1: Theo Doanh thu */}
                <div
                  onClick={() => setMethod('RevenueBased')}
                  className={`flex cursor-pointer flex-col rounded-xl border p-4 transition-all ${
                    method === 'RevenueBased'
                      ? 'border-sky-600 bg-white shadow-xs ring-1 ring-sky-600'
                      : 'border-slate-200 bg-white/70 hover:bg-white'
                  }`}
                >
                  <div className='flex items-center justify-between'>
                    <span className='inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800'>
                      Đơn giản & Không lo hóa đơn
                    </span>
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        method === 'RevenueBased'
                          ? 'border-sky-600 bg-sky-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {method === 'RevenueBased' && <Check className='h-2.5 w-2.5 stroke-[3]' />}
                    </div>
                  </div>

                  <p className='mt-2.5 text-sm font-bold text-slate-900'>
                    Theo Tỷ lệ Doanh thu (Khoán % theo ngành)
                  </p>
                  <ul className='mt-2 space-y-1.5 text-xs text-slate-600'>
                    <li className='flex items-start gap-1.5'>
                      <Check className='h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5' />
                      <span>Chỉ nộp % thuế trên phần doanh thu vượt 1 tỷ đồng.</span>
                    </li>
                    <li className='flex items-start gap-1.5'>
                      <Check className='h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5' />
                      <span>Không cần giải trình hóa đơn chứng từ chi phí mua vào.</span>
                    </li>
                    <li className='flex items-start gap-1.5 text-slate-500'>
                      <span>• Thích hợp cho quán ăn uống/bán lẻ mua nguyên liệu chợ truyền thống.</span>
                    </li>
                  </ul>
                </div>

                {/* Method 2: Theo Thu nhập tính thuế */}
                <div
                  onClick={() => setMethod('IncomeBased')}
                  className={`flex cursor-pointer flex-col rounded-xl border p-4 transition-all ${
                    method === 'IncomeBased'
                      ? 'border-sky-600 bg-white shadow-xs ring-1 ring-sky-600'
                      : 'border-slate-200 bg-white/70 hover:bg-white'
                  }`}
                >
                  <div className='flex items-center justify-between'>
                    <span className='inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900'>
                      Tối ưu khi chi phí cao
                    </span>
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        method === 'IncomeBased'
                          ? 'border-sky-600 bg-sky-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {method === 'IncomeBased' && <Check className='h-2.5 w-2.5 stroke-[3]' />}
                    </div>
                  </div>

                  <p className='mt-2.5 text-sm font-bold text-slate-900'>
                    Theo Thu nhập tính thuế (Doanh thu − Chi phí)
                  </p>
                  <ul className='mt-2 space-y-1.5 text-xs text-slate-600'>
                    <li className='flex items-start gap-1.5'>
                      <Check className='h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5' />
                      <span>Thuế suất 15% tính trên chênh lệch thực tế (Lãi ròng).</span>
                    </li>
                    <li className='flex items-start gap-1.5'>
                      <Check className='h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5' />
                      <span>Cần lưu trữ hóa đơn đầu vào đầy đủ trên sổ S2c.</span>
                    </li>
                    <li className='flex items-start gap-1.5 text-amber-700 font-medium'>
                      <Lock className='h-3 w-3 shrink-0 mt-0.5' />
                      <span>Cam kết giữ phương pháp 2 năm liên tục ({currentYear}–{currentYear + 1}).</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* TRƯỜNG HỢP 3: Trên 3 tỷ -> Khóa cứng IncomeBased có giải thích căn cứ */}
          {bracket === 'Over3BTo50B' && (
            <motion.div
              key='over3b-options'
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className='mt-6 overflow-hidden rounded-2xl border border-violet-200/70 bg-violet-50/40 p-4.5 text-xs text-violet-950 flex items-start gap-3'
            >
              <Lock className='h-5 w-5 shrink-0 text-violet-700 mt-0.5' />
              <div>
                <p className='font-bold text-violet-900'>
                  Chế độ kế toán & Quyết toán theo Thu nhập thực tế (Luật định)
                </p>
                <p className='mt-1 text-slate-600 leading-relaxed'>
                  Theo Văn bản hợp nhất 25/2026/VBHN-NĐ-BTC, hộ kinh doanh có doanh thu trên 3 tỷ bắt buộc nộp thuế TNCN theo phương pháp{' '}
                  <strong>Thu nhập tính thuế (thuế suất 17%)</strong>. TaxMate sẽ kích hoạt toàn bộ sổ kế toán S2b, S2c, S2d, S2e và hỗ trợ kết xuất hồ sơ quyết toán năm{' '}
                  <strong>02/CNKD-TNCN-QTT</strong>.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions & Live Summary */}
        <div className='mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4'>
          {/* Summary Badge */}
          <div className='flex items-center gap-2 text-xs text-slate-500'>
            <span className='inline-block h-2 w-2 rounded-full bg-emerald-500' />
            <span>Đang chọn:</span>
            <span className='font-semibold text-slate-800'>
              {bracketLabels[bracket]}
            </span>
            <span>·</span>
            <span className='text-slate-600'>
              {bracket === 'AtOrBelow1B'
                ? 'Miễn thuế & Lập thông báo TKN'
                : bracket === 'Over1BTo3B'
                  ? method === 'RevenueBased'
                    ? 'Thuế tính theo Doanh thu'
                    : 'Thuế tính theo Lợi nhuận (Khóa 2 năm)'
                  : 'Quyết toán thuế TNCN 17%'}
            </span>
          </div>

          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => setIsDismissed(true)}
              className='rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors'
            >
              Để sau
            </button>
            <button
              type='button'
              disabled={busy}
              onClick={() => void saveInitialProfile()}
              className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg active:scale-98 disabled:bg-slate-300'
            >
              {busy ? (
                <>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                  <span>Đang áp dụng...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận & Áp dụng hồ sơ</span>
                  <ArrowRight className='h-4 w-4' />
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    )
  }

  // =========================================================================
  // 2. TRẠNG THÁI ĐÃ CẤU HÌNH (CONFIGURED STATE & THRESHOLD REVIEWS)
  // =========================================================================
  return (
    <section
      id='threshold-review'
      className='mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs scroll-mt-20 md:p-8'
    >
      <div className='flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5'>
        <div>
          <div className='flex items-center gap-2'>
            <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-xs font-bold text-emerald-800'>
              <span className='h-1.5 w-1.5 rounded-full bg-emerald-600' />
              Hồ sơ thuế đang áp dụng
            </span>
            {profile.isMethodLocked && (
              <span className='inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900'>
                <Lock className='h-3 w-3 text-amber-700' />
                Ổn định phương pháp đến hết {profile.lockedThroughYear}
              </span>
            )}
          </div>
          <h2 className='mt-2 text-2xl font-bold tracking-tight text-slate-900'>
            {profile.declaredRevenueBracket
              ? bracketLabels[profile.declaredRevenueBracket]
              : 'Chưa xác định'}
          </h2>
          <p className='mt-1 text-sm text-slate-500'>
            Phương pháp TNCN:{' '}
            <span className='font-semibold text-slate-800'>
              {profile.personalIncomeTaxMethod === 'IncomeBased'
                ? 'Theo thu nhập tính thuế (Lợi nhuận sổ sách)'
                : profile.personalIncomeTaxMethod === 'RevenueBased'
                  ? 'Theo tỷ lệ doanh thu khoán'
                  : 'Không phát sinh (Thuộc diện không chịu thuế)'}
            </span>
          </p>
        </div>

        <button
          type='button'
          onClick={() => {
            if (profile.declaredRevenueBracket) {
              setBracket(profile.declaredRevenueBracket)
            }
            if (profile.personalIncomeTaxMethod) {
              setMethod(profile.personalIncomeTaxMethod)
            }
            if (profile.commencementPeriod) {
              setCommencement(profile.commencementPeriod)
            }
            // Mở lại chế độ chỉnh sửa
            setIsDismissed(false)
          }}
          className='rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors'
        >
          Xem lại cấu hình
        </button>
      </div>

      {/* Threshold Reviews / Cảnh báo chuyển mốc doanh thu */}
      {profile.thresholdReviews.length > 0 && (
        <div className='mt-5 space-y-3'>
          <p className='text-xs font-bold uppercase tracking-wider text-amber-900'>
            Cần rà soát mốc doanh thu theo luật
          </p>
          {profile.thresholdReviews.map((review) => {
            const choices = review.allowedTaxMethods
            const selectedMethod = reviewMethods[review.alertId] ?? choices[0]
            return (
              <div
                key={review.alertId}
                className={`rounded-2xl border p-4.5 transition-all ${
                  review.isOutsideSupportedScope
                    ? 'border-red-200 bg-red-50/70'
                    : 'border-amber-200/90 bg-amber-50/60'
                }`}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex items-center gap-2'>
                    <AlertTriangle className='h-4 w-4 text-amber-700 shrink-0' />
                    <p className='text-sm font-bold text-slate-900'>
                      Doanh thu chạm mốc {review.thresholdAmount.toLocaleString('vi-VN')}đ (Quý {review.quarter}/{review.year})
                    </p>
                  </div>
                  <span className='text-xs font-semibold text-slate-500'>
                    Áp dụng từ năm {review.appliesFromYear}
                  </span>
                </div>

                <p className='mt-1.5 text-xs text-slate-700 leading-relaxed pl-6'>
                  {review.message}
                </p>

                {review.canConfirm && choices.length > 1 && (
                  <div className='mt-3 pl-6 flex flex-wrap items-center gap-2'>
                    <span className='text-xs font-medium text-slate-700'>
                      Chọn phương pháp TNCN mới:
                    </span>
                    <div className='inline-flex rounded-lg border border-amber-300 bg-white p-0.5 shadow-xs'>
                      {choices.map((choice) => (
                        <button
                          key={choice}
                          type='button'
                          onClick={() =>
                            setReviewMethods((current) => ({
                              ...current,
                              [review.alertId]: choice
                            }))
                          }
                          className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                            selectedMethod === choice
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {choice === 'IncomeBased' ? 'Thu nhập tính thuế' : 'Theo doanh thu'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className='mt-3.5 pl-6 flex items-center gap-2.5'>
                  {review.canConfirm && (
                    <button
                      disabled={busy}
                      type='button'
                      onClick={() => void confirmReview(review.alertId, selectedMethod)}
                      className='rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-amber-800 disabled:bg-slate-300'
                    >
                      {busy ? 'Đang ghi nhận...' : 'Xác nhận chuyển diện'}
                    </button>
                  )}
                  {review.canDismiss && (
                    <button
                      disabled={busy}
                      type='button'
                      onClick={() => void dismissReview(review.alertId)}
                      className='rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors'
                    >
                      Đóng cảnh báo
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
