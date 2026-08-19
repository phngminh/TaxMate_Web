import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  ReceiptText
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  useNavigate,
  useParams
} from 'react-router-dom'
import { toast } from 'react-toastify'

import {
  calculateTaxPeriod,
  getTaxPeriodById
} from '../../../apis/taxPeriod.api'

import type {
  TaxPeriodDetail
} from '../../../types/taxPeriod.type'

import {
  taxPeriodDeclarationPath,
  taxPeriodDetailPath
} from '../../../utils/taxPeriodRoute'

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`
}

function formatDate(
  value?: string | null
) {
  if (!value) return 'Chưa có'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Không xác định'
  }

  return date.toLocaleDateString('vi-VN')
}

function InfoRow({
  label,
  value,
  highlight,
  danger
}: {
  label: string
  value: string
  highlight?: boolean
  danger?: boolean
}) {
  return (
    <div className='flex items-center justify-between gap-6 border-b border-gray-100 py-4 last:border-b-0'>
      <span className='text-sm text-gray-500'>
        {label}
      </span>

      <span
        className={`text-right text-sm font-black ${
          danger
            ? 'text-red-600'
            : highlight
              ? 'text-blue-700'
              : 'text-gray-800'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isProcessing,
  onConfirm,
  onCancel
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  isProcessing?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'
      role='presentation'
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='confirm-dialog-title'
        aria-describedby='confirm-dialog-description'
        className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'
      >
        <div className='flex items-start gap-4'>
          <div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600'>
            <AlertTriangle size={22} />
          </div>

          <div className='min-w-0'>
            <h2
              id='confirm-dialog-title'
              className='text-lg font-black text-gray-900'
            >
              {title}
            </h2>

            <p
              id='confirm-dialog-description'
              className='mt-2 text-sm leading-6 text-gray-500'
            >
              {description}
            </p>
          </div>
        </div>

        <div className='mt-6 flex justify-end gap-3'>
          <button
            type='button'
            disabled={isProcessing}
            onClick={onCancel}
            className='h-11 rounded-xl border border-gray-300 bg-white px-5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60'
          >
            Hủy
          </button>

          <button
            type='button'
            disabled={isProcessing}
            onClick={onConfirm}
            className='h-11 min-w-32 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300'
          >
            {isProcessing ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TaxCalculationPage() {
  const navigate = useNavigate()

  const { taxPeriodId } = useParams<{
    taxPeriodId: string
  }>()

  const [
    taxPeriod,
    setTaxPeriod
  ] =
    useState<TaxPeriodDetail | null>(
      null
    )

  const [
    isLoading,
    setIsLoading
  ] = useState(true)

  const [
    isCalculating,
    setIsCalculating
  ] = useState(false)

  const [
    isCalculateConfirmOpen,
    setIsCalculateConfirmOpen
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage
  ] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadData() {
      if (!taxPeriodId) {
        setErrorMessage(
          'Không tìm thấy mã kỳ thuế.'
        )
        setIsLoading(false)
        return
      }

      try {
        const result =
          await getTaxPeriodById(
            taxPeriodId
          )

        if (!active) return

        setTaxPeriod(result)
      } catch (error) {
        console.error(
          '[TaxCalculation] Load failed:',
          error
        )

        if (!active) return

        setErrorMessage(
          'Không thể tải kỳ thuế.'
        )
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [taxPeriodId])

  const appliedTaxRate =
    useMemo(() => {
      if (
        !taxPeriod ||
        taxPeriod.taxableRevenue <= 0 ||
        taxPeriod.estimatedTax <= 0
      ) {
        return 0
      }

      return Number(
        (
          (taxPeriod.estimatedTax /
            taxPeriod.taxableRevenue) *
          100
        ).toFixed(2)
      )
    }, [taxPeriod])

  function handleCalculate() {
    if (
      !taxPeriod ||
      !taxPeriodId
    ) {
      return
    }

    if (
      taxPeriod.status ===
      'Calculated'
    ) {
      navigate(
        taxPeriodDeclarationPath(
          taxPeriodId
        )
      )
      return
    }

    if (
      taxPeriod.status !==
      'Closed'
    ) {
      toast.warning(
        'Chỉ kỳ thuế đã chốt mới có thể tính thuế.'
      )
      return
    }

    setIsCalculateConfirmOpen(true)
  }

  async function confirmCalculate() {
    if (!taxPeriodId) {
      return
    }

    try {
      setIsCalculating(true)

      const result =
        await calculateTaxPeriod(
          taxPeriodId
        )

      setIsCalculateConfirmOpen(false)

      toast.success(
        `Đã tính thuế. Tổng thuế phải nộp: ${formatMoney(
          result.totalTaxPayableAmount
        )}`
      )

      navigate(
        taxPeriodDetailPath(
          taxPeriodId
        ),
        {
          replace: true
        }
      )
    } catch (error) {
      console.error(
        '[TaxCalculation] Calculate failed:',
        error
      )

      toast.error(
        'Không thể tính thuế cho kỳ này.'
      )
    } finally {
      setIsCalculating(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8]'>
        <p className='font-semibold text-gray-500'>
          Đang tải dữ liệu tính thuế...
        </p>
      </div>
    )
  }

  if (
    errorMessage ||
    !taxPeriod
  ) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8]'>
        <div className='text-center'>
          <AlertTriangle
            size={48}
            className='mx-auto text-red-500'
          />

          <p className='mt-4 font-bold'>
            {errorMessage}
          </p>
        </div>
      </div>
    )
  }

  const totalTax =
    taxPeriod.vatTaxAmount +
    taxPeriod.personalIncomeTaxAmount

  return (
    <div className='min-h-[calc(100vh-56px)] bg-[#f5f6f8] px-6 py-7'>
      <div className='mx-auto max-w-6xl'>
        <button
          type='button'
          onClick={() =>
            navigate(-1)
          }
          className='mb-5 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600'
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <div className='rounded-2xl bg-white p-6 shadow-sm'>
          <div className='flex items-center gap-4'>
            <div className='flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600'>
              <Calculator size={28} />
            </div>

            <div>
              <h1 className='text-2xl font-black'>
                Tính thuế
              </h1>

              <p className='mt-1 text-sm text-gray-500'>
                Kiểm tra số thuế GTGT
                và TNCN trước khi tạo
                tờ khai.
              </p>
            </div>
          </div>
        </div>

        <div className='mt-6 grid gap-6 lg:grid-cols-2'>
          <div className='rounded-2xl bg-white p-6 shadow-sm'>
            <h2 className='mb-4 text-lg font-black'>
              Căn cứ tính thuế
            </h2>

            <InfoRow
              label='Kỳ bắt đầu'
              value={formatDate(
                taxPeriod.periodStartDate
              )}
            />

            <InfoRow
              label='Kỳ kết thúc'
              value={formatDate(
                taxPeriod.periodEndDate
              )}
            />

            <InfoRow
              label='Tổng doanh thu'
              value={formatMoney(
                taxPeriod.totalRevenue
              )}
            />

            <InfoRow
              label='Doanh thu chịu thuế'
              value={formatMoney(
                taxPeriod.taxableRevenue
              )}
              highlight
            />

            <InfoRow
              label='Tỷ lệ thuế tạm tính'
              value={`${appliedTaxRate}%`}
            />
          </div>

          <div className='rounded-2xl bg-white p-6 shadow-sm'>
            <h2 className='mb-4 text-lg font-black'>
              Kết quả tính thuế
            </h2>

            <InfoRow
              label='Thuế GTGT'
              value={formatMoney(
                taxPeriod.vatTaxAmount
              )}
            />

            <InfoRow
              label='Thuế TNCN'
              value={formatMoney(
                taxPeriod.personalIncomeTaxAmount
              )}
            />

            <InfoRow
              label='Nợ thuế hiện tại'
              value={formatMoney(
                taxPeriod.taxAmountDebt
              )}
              danger={
                taxPeriod.taxAmountDebt >
                0
              }
            />

            <div className='mt-5 rounded-2xl bg-red-50 p-5'>
              <p className='text-sm font-bold text-red-700'>
                Tổng thuế phải nộp
              </p>

              <p className='mt-2 text-3xl font-black text-red-700'>
                {formatMoney(totalTax)}
              </p>
            </div>
          </div>
        </div>

        <div className='mt-6 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4'>
          <ReceiptText
            size={21}
            className='shrink-0 text-blue-600'
          />

          <p className='text-sm leading-6 text-blue-800'>
            Số thuế chính thức sẽ
            được backend tính từ dữ
            liệu doanh thu và quy tắc
            thuế áp dụng cho kỳ này.
          </p>
        </div>

        <div className='mt-6 flex justify-end gap-3'>
          <button
            type='button'
            onClick={() =>
              navigate(-1)
            }
            className='h-12 rounded-xl border border-gray-300 bg-white px-6 font-bold'
          >
            Quay lại
          </button>

          <button
            type='button'
            disabled={
              isCalculating
            }
            onClick={
              handleCalculate
            }
            className='h-12 min-w-44 rounded-xl bg-red-600 px-6 text-sm font-bold text-white hover:bg-red-700 disabled:bg-gray-300'
          >
            {isCalculating
              ? 'Đang tính...'
              : taxPeriod.status ===
                  'Calculated'
                ? 'Xem tờ khai'
                : 'Tính thuế'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={isCalculateConfirmOpen}
        title='Xác nhận tính thuế'
        description='Hệ thống sẽ tính số thuế GTGT và TNCN từ dữ liệu của kỳ này. Bạn muốn tiếp tục?'
        confirmLabel='Tính thuế'
        isProcessing={isCalculating}
        onCancel={() =>
          setIsCalculateConfirmOpen(false)
        }
        onConfirm={() => {
          void confirmCalculate()
        }}
      />
    </div>
  )
}