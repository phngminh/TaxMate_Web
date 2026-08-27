import axios from 'axios'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ReceiptText
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { getTaxPeriodById } from '../../../apis/taxPeriod.api'
import {
  closeTknTaxPeriod,
  getTknTaxPeriodPreview
} from '../../../apis/tknTaxPeriod.api'
import type { TaxPeriodDetail } from '../../../types/taxPeriod.type'
import type { TknTaxPeriodPreview } from '../../../types/tknTaxPeriod.type'
import { tknTaxPeriodDetailPath } from '../../../utils/taxPeriodRoute'

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`
}

function formatDate(value?: string | null) {
  if (!value) return 'Chưa xác định'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('vi-VN')
}

function formatEndExclusive(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  date.setDate(date.getDate() - 1)
  return date.toLocaleDateString('vi-VN')
}

function errorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback
  const data = error.response?.data as { message?: string } | undefined
  return data?.message || fallback
}

export default function TknTaxPeriodPreviewPage() {
  const navigate = useNavigate()
  const { taxPeriodId } = useParams<{ taxPeriodId: string }>()
  const [period, setPeriod] = useState<TaxPeriodDetail | null>(null)
  const [preview, setPreview] = useState<TknTaxPeriodPreview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      if (!taxPeriodId) {
        setLoadError('Không tìm thấy mã kỳ thông báo doanh thu.')
        return
      }
      try {
        const [periodResult, previewResult] = await Promise.all([
          getTaxPeriodById(taxPeriodId),
          getTknTaxPeriodPreview(taxPeriodId)
        ])
        if (!active) return
        if (periodResult.periodType !== 'Tkn') {
          setLoadError('Kỳ thuế này không phải hồ sơ 01/TKN-CNKD.')
          return
        }
        setPeriod(periodResult)
        setPreview(previewResult)
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Không thể tải dữ liệu xem trước TKN.'))
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [taxPeriodId])

  async function confirmClose() {
    if (!taxPeriodId || !preview) return
    try {
      setIsClosing(true)
      await closeTknTaxPeriod(taxPeriodId, {
        confirmWarnings: preview.warnings.length > 0
      })
      toast.success('Đã chốt doanh thu kỳ thông báo.')
      navigate(tknTaxPeriodDetailPath(taxPeriodId), { replace: true })
    } catch (error) {
      toast.error(errorMessage(error, 'Không thể chốt kỳ thông báo doanh thu.'))
    } finally {
      setIsClosing(false)
    }
  }

  if (isLoading) {
    return <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8] font-semibold text-gray-500'>Đang kiểm tra doanh thu...</div>
  }

  if (loadError || !period || !preview) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8] px-6'>
        <div className='rounded-2xl bg-white p-8 text-center shadow-sm'>
          <AlertTriangle size={46} className='mx-auto text-red-500' />
          <p className='mt-4 font-bold text-gray-800'>{loadError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-[calc(100vh-56px)] bg-[#f5f6f8] px-6 py-7'>
      <div className='mx-auto max-w-5xl'>
        <button
          type='button'
          onClick={() => navigate(tknTaxPeriodDetailPath(period.id))}
          className='mb-5 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600'
        >
          <ArrowLeft size={18} /> Quay lại chi tiết TKN
        </button>

        <section className='rounded-2xl bg-white p-6 shadow-sm'>
          <div className='flex items-center gap-4'>
            <div className='flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600'>
              <ReceiptText size={28} />
            </div>
            <div>
              <h1 className='text-2xl font-black text-gray-900'>
                Xem trước thông báo doanh thu
              </h1>
              <p className='mt-1 text-sm text-gray-500'>
                Kiểm tra nguồn doanh thu trước khi khóa kỳ 01/TKN-CNKD.
              </p>
            </div>
          </div>
        </section>

        <div className='mt-6 grid gap-4 md:grid-cols-3'>
          <div className='rounded-2xl bg-white p-5 shadow-sm'>
            <p className='text-sm font-semibold text-gray-500'>Tổng doanh thu</p>
            <p className='mt-2 text-2xl font-black text-gray-900'>{formatMoney(preview.totalRevenue)}</p>
          </div>
          <div className='rounded-2xl bg-white p-5 shadow-sm'>
            <p className='text-sm font-semibold text-gray-500'>Nhóm hoạt động</p>
            <p className='mt-2 text-2xl font-black text-gray-900'>{preview.revenueGroupCount}</p>
          </div>
          <div className='rounded-2xl bg-white p-5 shadow-sm'>
            <p className='text-sm font-semibold text-gray-500'>Hạn nộp</p>
            <p className='mt-2 text-lg font-black text-gray-900'>{formatDate(preview.dueDate)}</p>
          </div>
        </div>

        <section className='mt-6 rounded-2xl bg-white p-6 shadow-sm'>
          <h2 className='text-lg font-black text-gray-900'>Phạm vi doanh thu</h2>
          <div className='mt-4 grid gap-4 md:grid-cols-2'>
            <div className='rounded-xl bg-gray-50 p-4'>
              <p className='text-xs font-bold uppercase text-gray-400'>Từ ngày</p>
              <p className='mt-1 font-bold text-gray-800'>{formatDate(preview.windowStart)}</p>
            </div>
            <div className='rounded-xl bg-gray-50 p-4'>
              <p className='text-xs font-bold uppercase text-gray-400'>Đến hết kỳ</p>
              <p className='mt-1 font-bold text-gray-800'>{formatEndExclusive(preview.windowEnd)}</p>
            </div>
          </div>
        </section>

        {preview.warnings.length > 0 ? (
          <section className='mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5'>
            <div className='flex gap-3'>
              <AlertTriangle size={21} className='mt-0.5 shrink-0 text-amber-600' />
              <div>
                <h2 className='font-black text-amber-800'>Thông tin cần xác nhận</h2>
                <ul className='mt-2 space-y-2 text-sm leading-6 text-amber-700'>
                  {preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              </div>
            </div>
          </section>
        ) : (
          <section className='mt-6 flex gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800'>
            <CheckCircle2 size={21} className='shrink-0' />
            <p className='text-sm font-semibold'>Dữ liệu doanh thu đã sẵn sàng để chốt.</p>
          </section>
        )}

        <div className='mt-6 flex justify-end'>
          <button
            type='button'
            disabled={!preview.canClose || period.status !== 'Open'}
            onClick={() => setShowConfirm(true)}
            className='h-12 rounded-xl bg-red-600 px-7 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300'
          >
            Chốt doanh thu kỳ TKN
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
          <div role='dialog' aria-modal='true' className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'>
            <h2 className='text-lg font-black text-gray-900'>Xác nhận chốt doanh thu</h2>
            <p className='mt-2 text-sm leading-6 text-gray-500'>
              Sau khi chốt, dữ liệu kỳ này sẽ được dùng để tổng hợp mẫu 01/TKN-CNKD. TaxMate chưa hỗ trợ khai bổ sung cho kỳ đã khóa.
            </p>
            <div className='mt-6 flex justify-end gap-3'>
              <button type='button' disabled={isClosing} onClick={() => setShowConfirm(false)} className='h-11 rounded-xl border border-gray-300 px-5 text-sm font-bold text-gray-700'>Hủy</button>
              <button type='button' disabled={isClosing} onClick={() => void confirmClose()} className='h-11 rounded-xl bg-red-600 px-5 text-sm font-bold text-white disabled:bg-gray-300'>{isClosing ? 'Đang chốt...' : 'Xác nhận chốt'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
