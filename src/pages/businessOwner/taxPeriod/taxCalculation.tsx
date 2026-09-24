import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  Clock,
  ReceiptText,
  Sparkles
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  useNavigate,
  useParams,
  useSearchParams
} from 'react-router-dom'
import { toast } from 'react-toastify'

import {
  calculateTaxPeriod,
  getTaxPeriodById,
  getTaxPeriodCalculationPreview
} from '../../../apis/taxPeriod.api'

import type {
  CalculateTaxPeriodResponse,
  TaxPeriodDetail
} from '../../../types/taxPeriod.type'

import {
  taxPeriodDeclarationPath,
  taxPeriodDetailPath,
  taxPeriodPreviewPath
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
  danger,
  warning,
  success,
  isPending
}: {
  label: string
  value: string
  highlight?: boolean
  danger?: boolean
  warning?: boolean
  success?: boolean
  isPending?: boolean
}) {
  return (
    <div className='flex items-center justify-between gap-6 border-b border-gray-100 py-4 last:border-b-0'>
      <span className='text-sm text-gray-500'>
        {label}
      </span>

      {isPending ? (
        <span className='inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500'>
          {value}
        </span>
      ) : (
        <span
          className={`text-right text-sm font-black ${
            danger
              ? 'text-red-600'
              : warning
                ? 'text-amber-600'
                : success
                  ? 'text-green-600'
                  : highlight
                    ? 'text-blue-700'
                    : 'text-gray-800'
          }`}
        >
          {value}
        </span>
      )}
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
  const [searchParams] = useSearchParams()
  const isPreviewMode = searchParams.get('mode') === 'preview'

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
    calcPreview,
    setCalcPreview
  ] = useState<CalculateTaxPeriodResponse | null>(null)

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
        if (isPreviewMode) {
          const [periodResult, previewCalc] = await Promise.all([
            getTaxPeriodById(taxPeriodId),
            getTaxPeriodCalculationPreview(taxPeriodId).catch(() => null)
          ])

          if (!active) return

          setTaxPeriod(periodResult)
          setCalcPreview(previewCalc)
        } else {
          const result =
            await getTaxPeriodById(
              taxPeriodId
            )

          if (!active) return

          setTaxPeriod(result)
        }
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
  }, [taxPeriodId, isPreviewMode])

  const isCalculated = isPreviewMode
    ? Boolean(calcPreview)
    : ['Calculated', 'Submitted', 'Paid'].includes(taxPeriod?.status ?? '')

  const effectiveTaxableRevenue = isPreviewMode && calcPreview
    ? calcPreview.totalTaxableRevenue || (taxPeriod?.taxableRevenue ?? 0)
    : (taxPeriod?.taxableRevenue ?? 0)

  const effectiveVatTax = isPreviewMode && calcPreview
    ? calcPreview.totalVatTaxAmount
    : (taxPeriod?.vatTaxAmount ?? 0)

  const effectivePitTax = isPreviewMode && calcPreview
    ? calcPreview.totalPersonalIncomeTaxAmount
    : (taxPeriod?.personalIncomeTaxAmount ?? 0)

  const effectiveTotalTax = isPreviewMode && calcPreview
    ? calcPreview.totalTaxPayableAmount
    : (effectiveVatTax + effectivePitTax)

  const effectiveDebt = isPreviewMode && calcPreview
    ? calcPreview.totalTaxPayableAmount
    : (taxPeriod?.taxAmountDebt ?? 0)

  const appliedTaxRate =
    useMemo(() => {
      if (
        effectiveTaxableRevenue <= 0 ||
        effectiveTotalTax <= 0
      ) {
        return 0
      }

      return Number(
        (
          (effectiveTotalTax /
            effectiveTaxableRevenue) *
          100
        ).toFixed(2)
      )
    }, [effectiveTaxableRevenue, effectiveTotalTax])

  function handleCalculate() {
    if (
      !taxPeriod ||
      !taxPeriodId
    ) {
      return
    }

    if (isPreviewMode) {
      navigate(
        `${taxPeriodDeclarationPath(
          taxPeriodId
        )}?mode=preview`
      )
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

  return (
    <div className='min-h-[calc(100vh-56px)] bg-[#f5f6f8] px-6 py-7'>
      <div className='mx-auto max-w-6xl'>
        <button
          type='button'
          onClick={() =>
            isPreviewMode
              ? navigate(taxPeriodPreviewPath(taxPeriodId!))
              : navigate(-1)
          }
          className='mb-5 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600'
        >
          <ArrowLeft size={18} />
          {isPreviewMode ? 'Quay lại xem doanh thu' : 'Quay lại'}
        </button>

        <div className='rounded-2xl bg-white p-6 shadow-sm'>
          <div className='flex items-center gap-4'>
            <div className={`flex size-14 items-center justify-center rounded-2xl ${isPreviewMode ? 'bg-violet-50 text-violet-600' : 'bg-red-50 text-red-600'}`}>
              <Calculator size={28} />
            </div>

            <div>
              <div className='flex items-center gap-2.5'>
                <h1 className='text-2xl font-black'>
                  {isPreviewMode ? 'Bảng tính thuế dự kiến' : 'Tính thuế'}
                </h1>
                {isPreviewMode && (
                  <span className='rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800'>
                    Bản xem trước
                  </span>
                )}
              </div>

              <p className='mt-1 text-sm text-gray-500'>
                {isPreviewMode
                  ? 'Số liệu thuế GTGT và TNCN tạm tính dựa trên giao dịch thực tế hiện tại.'
                  : 'Kiểm tra số thuế GTGT và TNCN trước khi tạo tờ khai.'}
              </p>
            </div>
          </div>
        </div>

        {isPreviewMode && (
          <div className='mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-violet-400 bg-gradient-to-r from-violet-100/90 via-purple-50 to-indigo-50 p-4.5 shadow-sm'>
            <div className='flex items-start gap-3.5'>
              <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm mt-0.5'>
                <Sparkles className='size-5' />
              </div>
              <div>
                <div className='flex items-center gap-2'>
                  <span className='rounded-md bg-violet-700 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white'>
                    Chế độ xem thử nghiệm
                  </span>
                  <span className='text-xs font-bold text-violet-900'>Mô phỏng quy trình</span>
                </div>
                <p className='mt-1 text-xs sm:text-sm font-medium text-violet-800 leading-relaxed'>
                  Bảng tính hiển thị số thuế ước tính theo các giao dịch đến thời điểm hiện tại. Kỳ thuế vẫn đang mở, mọi hoạt động bán hàng và thu chi vẫn tiếp tục bình thường.
                </p>
              </div>
            </div>
            <div className='shrink-0'>
              <span className='inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-violet-200 px-3 py-1 text-xs font-bold text-violet-800 shadow-2xs'>
                <span className='size-2 rounded-full bg-violet-500 animate-pulse' />
                Môi trường an toàn
              </span>
            </div>
          </div>
        )}

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
                effectiveTaxableRevenue
              )}
              highlight
            />

            <InfoRow
              label='Tỷ lệ thuế tạm tính'
              value={isCalculated ? `${appliedTaxRate}%` : 'Chờ tính toán'}
              isPending={!isCalculated}
            />
          </div>

          <div className='rounded-2xl bg-white p-6 shadow-sm'>
            <h2 className='mb-4 text-lg font-black'>
              Kết quả tính thuế
            </h2>

            <InfoRow
              label='Thuế GTGT'
              value={isCalculated ? formatMoney(effectiveVatTax) : 'Chưa tính'}
              isPending={!isCalculated}
            />

            <InfoRow
              label='Thuế TNCN'
              value={isCalculated ? formatMoney(effectivePitTax) : 'Chưa tính'}
              isPending={!isCalculated}
            />

            <InfoRow
              label='Số thuế chưa nộp'
              value={isCalculated ? formatMoney(effectiveDebt) : 'Chưa tính'}
              isPending={!isCalculated}
              danger={
                isCalculated &&
                effectiveDebt > 0 &&
                Boolean(
                  taxPeriod.dueDate &&
                    new Date() > new Date(taxPeriod.dueDate)
                )
              }
              warning={
                isCalculated &&
                effectiveDebt > 0 &&
                (!taxPeriod.dueDate ||
                  new Date() <= new Date(taxPeriod.dueDate))
              }
              success={
                isCalculated && effectiveDebt === 0
              }
            />

            {isCalculated ? (
              <div className={`mt-5 rounded-2xl p-5 ${isPreviewMode ? 'bg-violet-50' : 'bg-red-50'}`}>
                <p className={`text-sm font-bold ${isPreviewMode ? 'text-violet-700' : 'text-red-700'}`}>
                  {isPreviewMode ? 'Tổng thuế tạm tính phải nộp' : 'Tổng thuế phải nộp'}
                </p>

                <p className={`mt-2 text-3xl font-black ${isPreviewMode ? 'text-violet-900' : 'text-red-700'}`}>
                  {formatMoney(effectiveTotalTax)}
                </p>
              </div>
            ) : (
              <div className='mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-5'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-bold text-gray-500'>
                    Tổng thuế dự kiến
                  </p>
                  <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500'>
                    <Clock size={11} /> Chờ tính
                  </span>
                </div>

                <div className='mt-3 flex items-baseline'>
                  <span className='inline-flex items-center rounded-xl bg-slate-100 px-3.5 py-1.5 text-sm font-bold text-slate-600 shadow-2xs'>
                    Chưa tính toán
                  </span>
                </div>

                <p className='mt-2.5 text-xs text-gray-400'>
                  Nhấn nút &ldquo;Tính thuế&rdquo; bên dưới để hệ thống tính toán số thuế chính thức.
                </p>
              </div>
            )}
          </div>
        </div>

        {isPreviewMode && calcPreview && calcPreview.lines.length > 0 && (
          <div className='mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm'>
            <div className='bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between'>
              <div>
                <h3 className='text-sm font-black text-slate-900'>Chi tiết thuế theo ngành nghề kinh doanh</h3>
                <p className='text-xs text-slate-500'>Áp dụng thuế suất theo phụ lục I Thông tư 40/2021/TT-BTC</p>
              </div>
              <span className='rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800'>
                {calcPreview.lines.length} hoạt động
              </span>
            </div>
            <div className='divide-y divide-slate-100'>
              {calcPreview.lines.map((line) => (
                <div key={line.id} className='flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm'>
                  <div>
                    <p className='font-bold text-slate-900'>{line.businessActivityName}</p>
                    <p className='text-xs text-slate-400'>Mã: {line.businessActivityCode} · Doanh thu tính thuế: {formatMoney(line.totalRevenue)}</p>
                  </div>
                  <div className='text-right'>
                    <p className='font-bold text-slate-900'>Tổng thuế: {formatMoney(line.vatTaxAmount + line.personalIncomeTaxAmount)}</p>
                    <p className='text-xs text-slate-500'>GTGT ({line.vatTaxRate}%): {formatMoney(line.vatTaxAmount)} · TNCN ({line.personalIncomeTaxRate}%): {formatMoney(line.personalIncomeTaxAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className='mt-6 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4'>
          <ReceiptText
            size={21}
            className='shrink-0 text-blue-600'
          />

          <p className='text-sm leading-6 text-blue-800'>
            {isPreviewMode
              ? 'Đây là số liệu tạm tính ước tính. Bạn có thể bấm tiếp tục để xem trước biểu mẫu tờ khai Mẫu 01/CNKD hoàn chỉnh.'
              : 'Số thuế chính thức sẽ được hệ thống tính từ dữ liệu doanh thu và quy tắc thuế áp dụng cho kỳ này.'}
          </p>
        </div>

        <div className='mt-6 flex justify-end gap-3'>
          <button
            type='button'
            onClick={() =>
              isPreviewMode
                ? navigate(taxPeriodPreviewPath(taxPeriodId!))
                : navigate(-1)
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
            className={`h-12 min-w-44 rounded-xl px-6 text-sm font-bold text-white transition disabled:bg-gray-300 ${
              isPreviewMode
                ? 'bg-violet-600 hover:bg-violet-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isCalculating
              ? 'Đang tính...'
              : isPreviewMode
                ? 'Xem tiếp tờ khai 01/CNKD →'
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