import axios from 'axios'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle2,
  FileText,
  ReceiptText
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { getTaxDeclarationByTaxPeriod } from '../../../apis/taxDeclaration.api'
import { getTaxPeriodById } from '../../../apis/taxPeriod.api'
import { calculateTknTaxPeriod } from '../../../apis/tknTaxPeriod.api'
import path from '../../../constants/path'
import type { TaxPeriodDetail } from '../../../types/taxPeriod.type'
import {
  taxPeriodDeclarationPath,
  tknTaxPeriodPreviewPath
} from '../../../utils/taxPeriodRoute'

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

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (!axios.isAxiosError(error)) return fallback
  const data = error.response?.data as
    | { message?: string }
    | undefined
  return data?.message || fallback
}

function windowLabel(period: TaxPeriodDetail) {
  switch (period.filingWindow) {
    case 'FirstHalf':
      return `Sáu tháng đầu năm ${period.year}`
    case 'SecondHalf':
      return `Sáu tháng cuối năm ${period.year}`
    default:
      return `Năm ${period.year}`
  }
}

function statusLabel(status: TaxPeriodDetail['status']) {
  switch (status) {
    case 'Open':
      return 'Đang chuẩn bị'
    case 'Closed':
      return 'Đã chốt doanh thu'
    case 'Calculated':
      return 'Đã tổng hợp'
    case 'Submitted':
      return 'Đã gửi'
    case 'Paid':
      return 'Đã hoàn thành'
  }
}

export default function TknTaxPeriodDetailPage() {
  const navigate = useNavigate()
  const { taxPeriodId } = useParams<{
    taxPeriodId: string
  }>()
  const [period, setPeriod] =
    useState<TaxPeriodDetail | null>(null)
  const [hasDeclaration, setHasDeclaration] =
    useState(false)
  const [isLoading, setIsLoading] =
    useState(true)
  const [isCalculating, setIsCalculating] =
    useState(false)
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  async function loadPeriod(active = () => true) {
    if (!taxPeriodId) {
      setErrorMessage('Không tìm thấy mã kỳ thông báo doanh thu.')
      setIsLoading(false)
      return
    }

    const result = await getTaxPeriodById(taxPeriodId)
    if (!active()) return
    if (result.periodType !== 'Tkn') {
      setErrorMessage('Kỳ thuế này không phải hồ sơ 01/TKN-CNKD.')
      return
    }

    setPeriod(result)
    if (['Calculated', 'Submitted', 'Paid'].includes(result.status)) {
      const declaration =
        await getTaxDeclarationByTaxPeriod(taxPeriodId)
      if (active()) {
        setHasDeclaration(declaration !== null)
      }
    } else {
      setHasDeclaration(false)
    }
  }

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setErrorMessage(null)

    void loadPeriod(() => active)
      .catch((error) => {
        if (!active) return
        setErrorMessage(
          getErrorMessage(
            error,
            'Không thể tải hồ sơ thông báo doanh thu.'
          )
        )
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [taxPeriodId])

  async function handleCalculate() {
    if (!taxPeriodId || period?.status !== 'Closed') return

    try {
      setIsCalculating(true)
      const result = await calculateTknTaxPeriod(taxPeriodId)
      toast.success(
        `Đã tổng hợp doanh thu cho mẫu ${result.recommendedFormCode}.`
      )
      setIsLoading(true)
      await loadPeriod()
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          'Không thể tổng hợp thông báo doanh thu.'
        )
      )
    } finally {
      setIsCalculating(false)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8]'>
        <p className='font-semibold text-gray-500'>
          Đang tải hồ sơ 01/TKN-CNKD...
        </p>
      </div>
    )
  }

  if (errorMessage || !period) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8] px-6'>
        <div className='max-w-md rounded-2xl bg-white p-8 text-center shadow-sm'>
          <AlertTriangle size={46} className='mx-auto text-red-500' />
          <h1 className='mt-4 text-xl font-black text-gray-900'>
            Không thể mở hồ sơ
          </h1>
          <p className='mt-2 text-sm text-gray-500'>
            {errorMessage}
          </p>
          <button
            type='button'
            onClick={() => navigate(path.BUSINESS_OWNER_TAX)}
            className='mt-6 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white'
          >
            Về tổng quan thuế
          </button>
        </div>
      </div>
    )
  }

  const isCompleted =
    period.status === 'Submitted' ||
    period.status === 'Paid'

  return (
    <div className='min-h-[calc(100vh-56px)] bg-[#f5f6f8] px-6 py-7'>
      <div className='mx-auto max-w-6xl'>
        <button
          type='button'
          onClick={() => navigate(path.BUSINESS_OWNER_TAX)}
          className='mb-5 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600'
        >
          <ArrowLeft size={18} />
          Quay lại tổng quan thuế
        </button>

        <section className='rounded-2xl bg-white p-6 shadow-sm'>
          <div className='flex flex-wrap items-start justify-between gap-5'>
            <div className='flex items-start gap-4'>
              <div className='flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600'>
                <ReceiptText size={28} />
              </div>
              <div>
                <p className='text-xs font-bold uppercase tracking-wide text-gray-400'>
                  Mẫu 01/TKN-CNKD
                </p>
                <h1 className='mt-1 text-2xl font-black text-gray-900'>
                  {windowLabel(period)}
                </h1>
                <p className='mt-2 text-sm text-gray-500'>
                  Thông báo doanh thu dành cho chủ hộ thuộc diện không quá ngưỡng áp dụng.
                </p>
              </div>
            </div>
            <span className='rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700'>
              {statusLabel(period.status)}
            </span>
          </div>
        </section>

        <div className='mt-6 grid gap-4 md:grid-cols-3'>
          <div className='rounded-2xl bg-white p-5 shadow-sm'>
            <p className='text-sm font-semibold text-gray-500'>Kỳ doanh thu</p>
            <p className='mt-2 font-black text-gray-900'>
              {formatDate(period.periodStartDate)} – {formatEndExclusive(period.periodEndDate)}
            </p>
          </div>
          <div className='rounded-2xl bg-white p-5 shadow-sm'>
            <p className='text-sm font-semibold text-gray-500'>Hạn nộp</p>
            <p className='mt-2 font-black text-gray-900'>
              {formatDate(period.dueDate)}
            </p>
          </div>
          <div className='rounded-2xl bg-white p-5 shadow-sm'>
            <p className='text-sm font-semibold text-gray-500'>Doanh thu đã chốt</p>
            <p className='mt-2 text-xl font-black text-gray-900'>
              {formatMoney(period.totalRevenue)}
            </p>
          </div>
        </div>

        <section className='mt-6 rounded-2xl bg-white p-6 shadow-sm'>
          <h2 className='text-lg font-black text-gray-900'>
            Tiến trình hồ sơ
          </h2>
          <div className='mt-5 grid gap-4 md:grid-cols-4'>
            {[
              { number: 1, label: 'Kiểm tra doanh thu', done: true },
              { number: 2, label: 'Chốt kỳ', done: period.status !== 'Open' },
              { number: 3, label: 'Tổng hợp mẫu', done: ['Calculated', 'Submitted', 'Paid'].includes(period.status) },
              { number: 4, label: 'Tạo và gửi hồ sơ', done: isCompleted }
            ].map(({ number, label, done }) => (
              <div
                key={number}
                className={`rounded-xl border p-4 ${
                  done
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className={`flex size-8 items-center justify-center rounded-full text-sm font-black ${
                  done
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {done ? <CheckCircle2 size={17} /> : number}
                </div>
                <p className='mt-3 text-sm font-bold text-gray-800'>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className='mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5'>
          <p className='font-bold text-sky-800'>Không phát sinh số thuế phải nộp</p>
          <p className='mt-1 text-sm leading-6 text-sky-700'>
            Hồ sơ này dùng để thông báo doanh thu. Thuế GTGT và thuế TNCN trên kết quả TKN đều bằng 0.
          </p>
        </section>

        <div className='mt-6 flex flex-wrap justify-end gap-3'>
          {period.status === 'Open' && (
            <button
              type='button'
              onClick={() => navigate(tknTaxPeriodPreviewPath(period.id))}
              className='flex h-12 items-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-bold text-white hover:bg-red-700'
            >
              <ReceiptText size={18} />
              Xem trước và chốt doanh thu
              <ArrowRight size={17} />
            </button>
          )}

          {period.status === 'Closed' && (
            <button
              type='button'
              disabled={isCalculating}
              onClick={() => void handleCalculate()}
              className='flex h-12 items-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-bold text-white hover:bg-red-700 disabled:bg-gray-300'
            >
              <Calculator size={18} />
              {isCalculating ? 'Đang tổng hợp...' : 'Tổng hợp mẫu 01/TKN-CNKD'}
            </button>
          )}

          {['Calculated', 'Submitted', 'Paid'].includes(period.status) && (
            <button
              type='button'
              onClick={() => navigate(taxPeriodDeclarationPath(period.id))}
              className='flex h-12 items-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-bold text-white hover:bg-red-700'
            >
              <FileText size={18} />
              {hasDeclaration ? 'Xem hồ sơ TKN' : 'Tạo hồ sơ TKN'}
              <ArrowRight size={17} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
