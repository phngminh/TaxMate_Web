import axios from 'axios'
import { useState } from 'react'
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
  onReload: () => Promise<void>
}

const bracketLabels: Record<RevenueBracket, string> = {
  AtOrBelow1B: 'Không quá 1 tỷ',
  Over1BTo3B: 'Trên 1 đến 3 tỷ',
  Over3BTo50B: 'Trên 3 đến 50 tỷ'
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
  onChanged,
  onReload
}: Props) {
  const [bracket, setBracket] = useState<RevenueBracket>('AtOrBelow1B')
  const [method, setMethod] = useState<TaxMethod>('RevenueBased')
  const [commencement, setCommencement] = useState('BeforeTaxYear')
  const [commencementYear, setCommencementYear] = useState(
    new Date().getFullYear()
  )
  const [reviewMethods, setReviewMethods] = useState<Record<string, TaxMethod>>(
    {}
  )
  const [busy, setBusy] = useState(false)

  async function saveInitialProfile() {
    try {
      setBusy(true)
      const result = await updateOwnerTaxProfile(businessId, {
        declaredRevenueBracket: bracket,
        personalIncomeTaxMethod:
          bracket === 'AtOrBelow1B' ? undefined : method,
        commencementPeriod:
          bracket === 'AtOrBelow1B' ? commencement : undefined,
        commencementTaxYear:
          bracket === 'AtOrBelow1B' ? commencementYear : undefined,
        confirmed: true
      })
      onChanged(result)
      toast.success('Đã xác nhận hồ sơ thuế.')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function confirmReview(alertId: string) {
    try {
      setBusy(true)
      await confirmThresholdReview(
        businessId,
        alertId,
        reviewMethods[alertId]
      )
      await onReload()
      toast.success('Đã xác nhận chuyển diện doanh thu.')
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
      await onReload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  if (!profile.isConfigured) {
    return (
      <section className='mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-6'>
        <h2 className='text-xl font-extrabold text-sky-950'>Thiết lập hồ sơ thuế</h2>
        <p className='mt-1 text-sm text-sky-800'>Chọn tình trạng hiện tại của cả chủ hộ. Bạn vẫn có thể bán hàng trước khi hoàn tất bước này.</p>
        <div className='mt-5 grid gap-4 md:grid-cols-2'>
          <label className='text-sm font-bold text-gray-700'>Nhóm doanh thu
            <select className='mt-2 w-full rounded-xl border bg-white p-3' value={bracket} onChange={(event) => setBracket(event.target.value as RevenueBracket)}>
              {Object.entries(bracketLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {bracket !== 'AtOrBelow1B' && (
            <label className='text-sm font-bold text-gray-700'>Phương pháp TNCN
              <select className='mt-2 w-full rounded-xl border bg-white p-3' value={bracket === 'Over3BTo50B' ? 'IncomeBased' : method} disabled={bracket === 'Over3BTo50B'} onChange={(event) => setMethod(event.target.value as TaxMethod)}>
                <option value='RevenueBased'>Theo doanh thu</option>
                <option value='IncomeBased'>Theo thu nhập tính thuế</option>
              </select>
            </label>
          )}
          {bracket === 'AtOrBelow1B' && (
            <>
              <label className='text-sm font-bold text-gray-700'>Thời điểm bắt đầu
                <select className='mt-2 w-full rounded-xl border bg-white p-3' value={commencement} onChange={(event) => setCommencement(event.target.value)}>
                  <option value='BeforeTaxYear'>Trước năm khai</option>
                  <option value='FirstHalfOfTaxYear'>Sáu tháng đầu năm</option>
                  <option value='SecondHalfOfTaxYear'>Sáu tháng cuối năm</option>
                </select>
              </label>
              <label className='text-sm font-bold text-gray-700'>Năm bắt đầu
                <input className='mt-2 w-full rounded-xl border bg-white p-3' type='number' value={commencementYear} onChange={(event) => setCommencementYear(Number(event.target.value))} />
              </label>
            </>
          )}
        </div>
        <button className='mt-5 rounded-xl bg-sky-700 px-5 py-3 text-sm font-bold text-white disabled:bg-gray-300' disabled={busy} onClick={() => void saveInitialProfile()}>{busy ? 'Đang lưu...' : 'Xác nhận hồ sơ'}</button>
      </section>
    )
  }

  return (
    <section className='mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <p className='text-xs font-bold uppercase tracking-wide text-gray-400'>Hồ sơ thuế hiện tại</p>
          <h2 className='mt-1 text-xl font-extrabold text-gray-900'>{profile.declaredRevenueBracket ? bracketLabels[profile.declaredRevenueBracket] : 'Chưa xác định'}</h2>
          <p className='mt-1 text-sm text-gray-600'>Phương pháp: {profile.personalIncomeTaxMethod === 'IncomeBased' ? 'Thu nhập tính thuế' : profile.personalIncomeTaxMethod === 'RevenueBased' ? 'Doanh thu' : 'Không áp dụng'}</p>
        </div>
        {profile.isMethodLocked && <span className='rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800'>Giữ phương pháp đến hết {profile.lockedThroughYear}</span>}
      </div>

      {profile.thresholdReviews.map((review) => {
        const choices = review.allowedTaxMethods
        return (
          <div key={review.alertId} className={`mt-4 rounded-xl border p-4 ${review.isOutsideSupportedScope ? 'border-red-300 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
            <p className='text-sm font-bold text-gray-900'>Vượt mốc {review.thresholdAmount.toLocaleString('vi-VN')}đ trong quý {review.quarter}/{review.year}</p>
            <p className='mt-1 text-sm text-gray-700'>{review.message}</p>
            {review.canConfirm && choices.length > 1 && (
              <select className='mt-3 rounded-lg border bg-white px-3 py-2 text-sm' value={reviewMethods[review.alertId] ?? choices[0]} onChange={(event) => setReviewMethods((current) => ({ ...current, [review.alertId]: event.target.value as TaxMethod }))}>
                {choices.map((choice) => <option key={choice} value={choice}>{choice === 'IncomeBased' ? 'Thu nhập tính thuế' : 'Doanh thu'}</option>)}
              </select>
            )}
            <div className='mt-3 flex gap-2'>
              {review.canConfirm && <button disabled={busy} className='rounded-lg bg-amber-700 px-4 py-2 text-sm font-bold text-white disabled:bg-gray-300' onClick={() => void confirmReview(review.alertId)}>Xác nhận</button>}
              {review.canDismiss && <button disabled={busy} className='rounded-lg border bg-white px-4 py-2 text-sm font-bold text-gray-700' onClick={() => void dismissReview(review.alertId)}>Đóng cảnh báo</button>}
            </div>
          </div>
        )
      })}
    </section>
  )
}
